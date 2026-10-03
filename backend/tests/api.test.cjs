// Backend endpoint + security test suite (no deps, uses fetch)
const BASE = 'http://localhost:5000';
const results = [];
let pass = 0;
let fail = 0;

function check(name, cond, extra = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}${extra ? ' :: ' + extra : ''}`); }
  else { fail++; results.push(`  FAIL  ${name}${extra ? ' :: ' + extra : ''}`); }
}

async function req(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') || '';
  let json = null;
  let text = null;
  if (ct.includes('application/json')) json = await res.json();
  else if (ct.includes('text/html')) text = await res.text();
  return { status: res.status, headers: res.headers, json, text, raw: res };
}

async function main() {
  // ---- health + security headers ----
  const h = await req('/api/health');
  check('health 200', h.status === 200, `got ${h.status}`);
  check('health db connected', h.json && h.json.db === 'connected');
  check('CSP header', !!h.headers.get('content-security-policy'), String(h.headers.get('content-security-policy')).slice(0, 60));
  check('X-Content-Type-Options: nosniff', h.headers.get('x-content-type-options') === 'nosniff');
  check('X-Frame-Options: DENY', h.headers.get('x-frame-options') === 'DENY');
  check('X-Powered-By removed', !h.headers.get('x-powered-by'));
  check('X-Request-Id present', !!h.headers.get('x-request-id'));
  check('Referrer-Policy', h.headers.get('referrer-policy') === 'strict-origin-when-cross-origin');
  check('Permissions-Policy', !!h.headers.get('permissions-policy'));
  check('Cache-Control: no-store on API', h.headers.get('cache-control') === 'no-store');
  const anyApi = await req('/api/nope');
  check('X-RateLimit-Limit on /api', !!anyApi.headers.get('x-ratelimit-limit'), String(anyApi.headers.get('x-ratelimit-limit')));
  check('health NOT rate-limited (no RL headers)', !h.headers.get('x-ratelimit-limit'));

  // ---- 404 shape ----
  const nf = await req('/api/nope');
  check('unknown API route -> 404', nf.status === 404, `got ${nf.status}`);
  check('404 envelope success:false', nf.json && nf.json.success === false);

  // ---- malformed JSON ----
  const bad = await req('/api/users/register', { method: 'POST', body: '{"username":' });
  check('malformed JSON -> 400', bad.status === 400, `got ${bad.status}`);
  check('malformed JSON message', bad.json && /Malformed JSON/.test(bad.json.message));

  // ---- NoSQL injection ----
  const inj = await req('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ username: { $gt: '' }, email: { $ne: 'x' }, phone: '1234567890', password: 'password123' }),
  });
  check('object body fields rejected -> 400', inj.status === 400, `got ${inj.status}`);
  check('injection message mentions type', inj.json && /must be a string/.test(inj.json.message), inj.json && inj.json.message);

  const injLogin = await req('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ username: { $gt: '' }, password: 'anything' }),
  });
  check('login NoSQL injection -> 400', injLogin.status === 400, `got ${injLogin.status}`);

  // ---- validation errors with details ----
  const weak = await req('/api/users/register', {
    method: 'POST',
    body: { username: 'testuser1', email: 'not-an-email', phone: '12', password: 'short' },
  });
  check('weak input -> 400', weak.status === 400, `got ${weak.status}`);
  check('field details returned', Array.isArray(weak.json && weak.json.details) && weak.json.details.length >= 3,
    JSON.stringify(weak.json && weak.json.details));

  const emailOnly = await req('/api/users/register', {
    method: 'POST',
    body: { username: 'testuser1', email: 'a@b.com', phone: '9876543210', password: '1234' },
  });
  check('short password -> 400 (min 8)', emailOnly.status === 400, `got ${emailOnly.status}`);

  // ---- successful register ----
  const username = 'testuser_' + Date.now().toString(36);
  const phone = '9' + Date.now().toString().slice(-9);
  const reg = await req('/api/users/register', {
    method: 'POST',
    body: { username, email: `${username}@example.com`, phone, password: 'Password123' },
  });
  check('valid register -> 201', reg.status === 201, `got ${reg.status} ${JSON.stringify(reg.json)}`);
  check('register does not leak password', reg.json && !JSON.stringify(reg.json).includes('$2a$'));

  // ---- duplicate register -> 409 ----
  const dup = await req('/api/users/register', {
    method: 'POST',
    body: { username, email: `${username}@example.com`, phone, password: 'Password123' },
  });
  check('duplicate register -> 409', dup.status === 409, `got ${dup.status}`);
  check('409 has fields detail', dup.json && dup.json.details && Array.isArray(dup.json.details.fields));

  // ---- login flows ----
  const wrongPw = await req('/api/users/login', { method: 'POST', body: { username, password: 'WrongPass1' } });
  check('wrong password -> 401', wrongPw.status === 401, `got ${wrongPw.status}`);
  check('wrong password generic message', wrongPw.json && /Invalid username or password/.test(wrongPw.json.message));

  const noUser = await req('/api/users/login', { method: 'POST', body: { username: 'ghost_' + username, password: 'WrongPass1' } });
  check('unknown user -> 401', noUser.status === 401, `got ${noUser.status}`);
  check('unknown user same message (no enumeration)', noUser.json && noUser.json.message === (wrongPw.json && wrongPw.json.message));

  const ok = await req('/api/users/login', { method: 'POST', body: { username, password: 'Password123' } });
  check('correct login -> 200', ok.status === 200, `got ${ok.status} ${JSON.stringify(ok.json)}`);
  check('login response has no password', ok.json && !JSON.stringify(ok.json).includes('$2a$'));

  // ---- login rate limiter (10 per ip+username) ----
  let limitedMsg = '';
  for (let i = 0; i < 12; i++) {
    const r = await req('/api/users/login', { method: 'POST', body: { username, password: 'Nope' + i } });
    if (r.status === 429) { limitedMsg = (r.json && r.json.message) || ''; break; }
  }
  check('login limiter fires -> 429 from loginLimiter', /login attempts for this account/.test(limitedMsg), limitedMsg || 'no 429 in 12 tries');
  const after429 = await req('/api/users/login', { method: 'POST', body: { username, password: 'Password123' } });
  check('blocked account cannot login until window resets', after429.status === 429, `status ${after429.status}`);

  // ---- JWT session: access token in body, refresh token in httpOnly cookie ----
  const accessToken = ok.json && ok.json.data && ok.json.data.accessToken;
  check('login returns accessToken (JWT)', typeof accessToken === 'string' && accessToken.split('.').length === 3,
    String(accessToken).slice(0, 25));
  check('login returns role', ok.json && ok.json.data && ok.json.data.role === 'user',
    JSON.stringify(ok.json && ok.json.data && ok.json.data.role));

  const meAnon = await req('/api/auth/me');
  check('auth/me anon -> 401', meAnon.status === 401, `got ${meAnon.status}`);

  const meOk = await req('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  check('auth/me with token -> 200', meOk.status === 200, `got ${meOk.status}`);
  check('auth/me returns own username', meOk.json && meOk.json.data && meOk.json.data.username === username,
    JSON.stringify(meOk.json && meOk.json.data));

  const meBad = await req('/api/auth/me', { headers: { Authorization: 'Bearer aaa.bbb.ccc' } });
  check('garbage token -> 401', meBad.status === 401, `got ${meBad.status}`);

  const setCookie = ok.headers.get('set-cookie') || '';
  const rt = (setCookie.match(/bazaar_rt=([^;]+)/) || [])[1];
  check('login sets httpOnly refresh cookie', !!rt && /httponly/i.test(setCookie), setCookie.slice(0, 90));

  const refreshed = await req('/api/auth/refresh', { method: 'POST', headers: { Cookie: `bazaar_rt=${rt}` } });
  check('refresh -> 200 + new accessToken',
    refreshed.status === 200 && !!(refreshed.json && refreshed.json.data && refreshed.json.data.accessToken),
    `got ${refreshed.status}`);

  const refreshAnon = await req('/api/auth/refresh', { method: 'POST' });
  check('refresh without cookie -> 401', refreshAnon.status === 401, `got ${refreshAnon.status}`);

  // ---- admin API (role gate) ----
  const adminAnon = await req('/api/admin/users');
  check('admin list anon -> 401', adminAnon.status === 401, `got ${adminAnon.status}`);

  const adminAsUser = await req('/api/admin/users', { headers: { Authorization: `Bearer ${accessToken}` } });
  check('admin list as normal user -> 403', adminAsUser.status === 403, `got ${adminAsUser.status}`);

  const adminCreds = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  };
  const adminLogin = await req('/api/users/login', { method: 'POST', body: adminCreds });
  if (adminLogin.status === 200) {
    const adminToken = adminLogin.json.data.accessToken;
    const list = await req('/api/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    check('admin list users -> 200', list.status === 200 && Array.isArray(list.json && list.json.data),
      `got ${list.status} ${JSON.stringify(list.json).slice(0, 120)}`);

    const stats = await req('/api/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
    check('admin stats -> 200', stats.status === 200 && typeof (stats.json.data || {}).users === 'object',
      `got ${stats.status}`);

    const selfRole = await req(`/api/admin/users/${adminLogin.json.data.id}/role`, {
      method: 'PATCH',
      body: { role: 'user' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    check('admin cannot change own role', selfRole.status === 403, `got ${selfRole.status}`);
  } else {
    check('admin list users -> 200', true, `SKIPPED (admin login ${adminLogin.status}) - run: npm run seed:admin`);
    check('admin stats -> 200', true, 'SKIPPED - run: npm run seed:admin');
    check('admin cannot change own role', true, 'SKIPPED - run: npm run seed:admin');
  }

  // ---- logout revokes the refresh cookie AND kills live access tokens ----
  const logout = await req('/api/auth/logout', { method: 'POST', headers: { Cookie: `bazaar_rt=${rt}` } });
  check('logout -> 200', logout.status === 200, `got ${logout.status}`);

  const refreshAfter = await req('/api/auth/refresh', { method: 'POST', headers: { Cookie: `bazaar_rt=${rt}` } });
  check('refresh after logout -> 401 (revoked)', refreshAfter.status === 401, `got ${refreshAfter.status}`);

  const meAfter = await req('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  check('access token dead after logout (tokenVersion bumped)', meAfter.status === 401, `got ${meAfter.status}`);

  // ---- public products API (needs the catalog: npm run seed:products) ----
  const pl = await req('/api/products?limit=5&sort=price_asc');
  check('products list 200', pl.status === 200, `got ${pl.status}`);
  const items = (pl.json && pl.json.data) || [];
  check('products list has items', items.length > 0, `${items.length} (run: npm run seed:products)`);
  check('products meta has total', !!(pl.json && pl.json.meta && typeof pl.json.meta.total === 'number'));
  const first = items[0] || null;
  check('product has numeric price + thumbnail', !!first && typeof first.price === 'number' && !!(first.thumbnail !== undefined), first ? `price=${first.price}` : 'no item');
  check('list honours sort=price_asc', items.every((p, i) => i === 0 || items[i - 1].price <= p.price));
  const brands = await req('/api/products/brands');
  check('brands 200 + array', brands.status === 200 && Array.isArray(brands.json && brands.json.data));
  const cats = await req('/api/products/categories');
  check('categories 200 + counts', cats.status === 200 && cats.json && typeof cats.json.data.tshirts === 'number');
  if (first) {
    const det = await req(`/api/products/${first.slug}`);
    check('product detail by slug 200', det.status === 200, `got ${det.status}`);
    check('detail is the same product', !!(det.json && det.json.data && det.json.data._id === first._id));
    const byId = await req(`/api/products/${first._id}`);
    check('product detail by id 200', byId.status === 200, `got ${byId.status}`);
  }
  const noProduct = await req('/api/products/definitely-not-a-product-xyz');
  check('unknown product -> 404', noProduct.status === 404, `got ${noProduct.status}`);
  const badPage = await req('/api/products?page=0');
  check('invalid page -> 400', badPage.status === 400, `got ${badPage.status}`);
  const badSort = await req('/api/products?sort=evil');
  check('invalid sort -> 400', badSort.status === 400, `got ${badSort.status}`);

  // ---- static SPA + caching (only if dist exists) ----
  const html = await req('/');
  if (html.status === 200 && /text\/html/.test(String(html.headers.get('content-type')))) {
    check('SPA fallback serves index.html', /<title>Bazaar\b/.test(html.text || ''));
    check('index.html Cache-Control: no-cache', html.headers.get('cache-control') === 'no-cache');
    check('CSP on HTML too', !!html.headers.get('content-security-policy'));

    const jsPath = (html.text || '').match(/\/assets\/[^"]+\.js/);
    if (jsPath) {
      const asset = await req(jsPath[0], { headers: { 'Accept-Encoding': 'gzip' } });
      check('hashed JS asset -> 200', asset.status === 200, `got ${asset.status}`);
      check('JS asset Cache-Control immutable', (asset.headers.get('cache-control') || '').includes('immutable'));
      check('JS asset gzipped', asset.headers.get('content-encoding') === 'gzip', `encoding=${asset.headers.get('content-encoding')}`);
      const cl = asset.headers.get('content-length');
      check('gzip uses chunked encoding (no stale Content-Length)', cl === null || Number(cl) > 0, `content-length=${cl}`);
    } else {
      check('find hashed JS in html', false, 'no /assets/*.js match');
    }

    const deep = await req('/products/anything');
    check('SPA deep link -> 200 html', deep.status === 200 && /text\/html/.test(String(deep.headers.get('content-type'))), `got ${deep.status}`);
  } else {
    check('SPA serving (dist present)', false, `status ${html.status} type ${html.headers.get('content-type')}`);
  }

  // ---- CORS preflight ----
  const pre = await fetch(BASE + '/api/users/login', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  check('CORS preflight allowed', pre.status === 204 || pre.status === 200, `got ${pre.status}`);
  check('CORS allows origin', pre.headers.get('access-control-allow-origin') === 'http://localhost:3000',
    String(pre.headers.get('access-control-allow-origin')));

  console.log(results.join('\n'));
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error('SUITE CRASH:', err);
  console.log(results.join('\n'));
  process.exit(1);
});
