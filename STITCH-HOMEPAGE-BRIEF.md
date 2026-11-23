# Google Stitch Design Brief — Bazaar (₹20 Crore Design Challenge)

> Paste everything below this line into Google Stitch.
> Repo: `Code-with-saurabh/Ecommercebazaar-v2` · Updated: 2026-11-23

---

# THE ₹20 CRORE DESIGN CHALLENGE — BAZAAR

STOP. Forget your previous design.

I am giving you a completely new creative challenge.

Imagine BAZAAR has hired your world's most prestigious digital design agency and given you a ₹20 CRORE budget for its e-commerce experience.

You are not an ordinary AI website generator.

You are the combined creative team of:
- An award-winning creative director.
- A world-class fashion brand designer.
- A principal UI/UX architect.
- A typography specialist.
- A senior interaction designer.
- An expert retail conversion strategist.
- A world-class frontend design engineer.

Your agency has one responsibility: deliver an extraordinary digital shopping experience that makes the client immediately feel that every rupee was worth it.

Your reputation depends on this work.

## THE CREATIVE FREEDOM

I am NOT asking you to make another clean, minimal, modern e-commerce template.

I want ORIGINAL DESIGN THINKING.

Think deeply about what would make Bazaar visually distinctive, memorable, sophisticated and commercially successful.

Explore an unexpected but tasteful visual direction.

Build a visual identity through:
- Exceptional art direction.
- Distinctive typography.
- Beautifully composed photography.
- Sophisticated editorial layouts.
- Unexpected but logical compositions.
- Beautifully balanced whitespace.
- Precise alignment and proportions.
- Thoughtful visual transitions between sections.
- High-quality micro-interactions.
- Exceptional product presentation.

Every pixel must look intentional.

## YOUR DESIGN STANDARD

Imagine this website is being presented to the board of a billion-dollar fashion retailer.

Would they be impressed?

Would a world-class design agency put its name on the experience?

Would the experience feel significantly better than an ordinary e-commerce website?

If the answer is no, redesign it.

## BREAK AWAY FROM AI-GENERATED DESIGN

I specifically DO NOT want:

- The typical AI-generated hero with huge text on the left and an image on the right.
- Generic four-column grids repeated throughout the page.
- Every section having a centered heading and subtitle.
- Random rounded rectangles.
- Excessive whitespace that makes the page feel empty.
- Generic pastel backgrounds.
- Unnecessary gradients.
- Decorative floating circles.
- Repeated icon-and-text sections.
- Generic Shopify-style layouts.
- Predictable template-based compositions.

Do not follow these patterns simply because they are common in AI-generated websites.

## THINK LIKE AN ART DIRECTOR

Before designing, independently explore three different creative directions internally.

Evaluate their:
- Originality.
- Brand suitability.
- Visual impact.
- Commercial usability.
- Typography.
- Image composition.
- Long-term design quality.

Choose the strongest direction and execute it with exceptional craftsmanship.

Do not produce three generic template variations.

## BAZAAR BRAND REQUIREMENTS

This is a real fashion e-commerce business.

Preserve:
- Bazaar wordmark.
- Existing brand identity.
- Deep teal #088178.
- Charcoal #333333.
- Warm neutral surfaces.
- Coral-to-gold logo gradient.
- Real product catalog and commercial information.
- Existing shopping functionality and routes.

You have creative freedom over the visual execution, NOT over business facts.

Do not invent products, reviews, offers, policies or statistics.

## EXTREME ATTENTION TO DETAIL

I expect professional-level execution in:

1. Typography: Font selection, scale, weights, optical balance and line heights.
2. Grid: Exact alignment, content widths, columns and proportions.
3. Spacing: Intentional whitespace and consistent vertical rhythm.
4. Photography: Realistic, beautifully cropped fashion imagery.
5. Components: Carefully designed buttons, search, navigation, product cards and controls.
6. Interactions: Meaningful hover, focus, selected and loading states.
7. Responsiveness: Purpose-designed mobile, tablet and desktop experiences.
8. Visual storytelling: A coherent shopping journey from hero to checkout.

Nothing should look like a default component library.

## IMPORTANT CREATIVE INSTRUCTION

Do not merely polish your previous generated design.

Reconsider the entire visual composition.

Be bold in design thinking, but disciplined in execution.

Use your full design capabilities. Make creative decisions instead of asking me to choose every detail.

I would rather receive one extraordinary design than ten average designs.

## FINAL EXPECTATION

Deliver a homepage that feels like an original, internationally competitive fashion retail brand.

It should have personality, elegance, commercial intelligence and exceptional visual craftsmanship.

The client is paying ₹20 CRORE.

NOW DESIGN LIKE IT.

---

# PROJECT CONTEXT (real data — fixed inputs, not suggestions)

**Brand:** Bazaar — fashion e-commerce (t-shirts, shirts, pants, shoes).
**Wordmark:** the word "Bazaar" in a warm coral-to-gold gradient (`#ff6b6b → #caca2b`).
**Typography today:** Merriweather (serif editorial voice) + Roboto (UI). Refine the pairing if it improves hierarchy, but keep a serif editorial character.
**Palette (preserve, refinement allowed):** deep teal `#088178` (prices, CTAs, active states — the signature color) · charcoal `#333333` navigation · white / warm neutral surfaces · sale red `#ef233c` sparingly · logo gradient only where the wordmark lives.

**Catalog (100% real):**
- 60 products — **T-shirts (10), Shirts (15), Pants (15), Shoes (20)**
- Real brands: Adidas, ASICS, Brooks, Hoka One One, Converse, Dr. Martens, Fila, Allbirds, Flying Machine, Downtown Designs, and more
- Price band **$79 – $923**; every product has studio photography (plain-background apparel/shoe shots), brand, name, star rating + count, price, struck MRP, discount %, stock state

**Real commercial claims only (server-verified — never invent others):**
- Free shipping over **$100** (flat **$10** below) · **COD available** · coupons validated server-side · live search suggestions · prices recomputed server-side at checkout

**Proof signals:** per-product aggregate star ratings (avg + count). There are **no authored testimonials** — do not invent quotes, names or statistics.

---

# ROUTE & JOURNEY MAP (every route — the homepage must feed this network)

The site is a React SPA with route-level code splitting (each page lazy-loads with its own skeleton). Design the homepage as the entry point of this complete shopping journey.

## Public storefront

| Route | Page | What it contains | Design notes |
|---|---|---|---|
| `/` | **Home** | Announcement bar (to be added), main nav, hero with the real copy "Super value deals / On all products / Save more with coupons & up to 70% off!", "Recommended" row (4 newest products), "Features" row (5 featured products), footer | The page you are designing. Today it is thin — your redesign supplies category navigation, trust, promo, social proof and newsletter while keeping it purposeful |
| `/products` | **Catalog** | All 60 products in a responsive grid; filters (category, brand, price range, in-stock), sorts (newest, price ↑/↓, rating, popularity, name), pagination (20/page, max 50) | Grid is the workhorse — product card design must be exceptional and reusable here |
| `/products/tshirt` | Catalog → T-shirts | Same catalog pre-filtered to the T-shirts category (10 items) | Linked from category navigation |
| `/products/shoes` | Catalog → Shoes | Same catalog pre-filtered to Shoes (20 items) | Linked from category navigation |
| `/products/:id` | **Product detail** | Accepts slug or id; image gallery + thumbnails, brand, name, rating, price/MRP/discount, size and color selectors, stock state, add-to-cart, related products | The conversion page — gallery crop quality and CTA hierarchy matter most |
| `/search?query=…` | **Search results** | Full results for the query (up to 50), result count, empty state ("No products found"), error state | Reached from the nav search box (live suggestions dropdown in the header) |
| `/cart` | **Cart** | Line items with image, name, line total, qty stepper (1–99, stock-capped), remove; summary with items count + total; per-item Checkout button; empty state with background video ("Your Cart is Empty") | Guest-friendly (works signed-out via cookie cart) |
| `/help` | **Help & Support** | "Help & Support" heading + FAQ accordion | Linked from footer "Customer Service" |
| `/contact` | **Contact** | Contact form (name/email/message) + details | Linked from footer |
| `/about` | **About** | Brand/about content | Linked from footer "About" |

## Purchase flow (login required — signed-out users redirect to `/login`)

| Route | Page | What it contains | Design notes |
|---|---|---|---|
| `/login` | **Login** | Email + password form | Returns the user to where they were headed |
| `/signup` | **Sign up** | Registration form; guest cart merges into the account cart on success | |
| `/checkout` (legacy alias `/ByNow`) | **Checkout** | Address picker + inline new-address form, coupon apply/remove (server verdict), order summary with **live server-priced totals** (subtotal, discount, shipping, tax), COD payment, Place Order → clears cart → receipt | The money page — pricing transparency and trust cues are the design priority |
| `/order/:id/confirmed` | **Order receipt** | Order number, status timeline, address snapshot, priced line items, totals, Continue Shopping / View Orders actions | Post-purchase confidence |
| `/account?tab=…` | **Account** | Tabs: **Profile** (edit name/phone, change password, logout) · **Orders** (paginated history, status labels, cancel when pending) · **Addresses** (CRUD, set default). `?tab=` deep-links a tab | Personal dashboard — default tab = Profile |

## Personal lists

| Route | Page | What it contains |
|---|---|---|
| `/wishlist` | **Wishlist** | Saved product cards with move-to-cart and remove; empty state → CTA to catalog |

## Restricted

| Route | Page | Access | What it contains |
|---|---|---|---|
| `/admin` | **Admin panel** | role = admin (others → `/login`) | Stats cards (users, admins, disabled, new-7d, orders, products) + user management table with search / role / status filters and pagination; enable-disable and role actions. (Backend also exposes admin APIs for the order queue, product CRUD, coupons and review moderation) |
| `/error` and any unknown URL | **Error page** | public | Explicit 404 / error state (never a blank page) |

## Global chrome (every route)

- **Sticky header:** logo (Bazaar wordmark) · nav links (Home, Products, Wishlist, Account when signed in, About, Admin when role=admin) · **live search with suggestions** · cart icon with count badge · account/login control
- **Footer (real content — use exactly):** Contact Us — Phone: 9327115687, Email: saurabh12166@gmail.com, Address: Gujarat, Surat · Customer Service — Help, Contact · About — About Us, Products · Follow Me — GitHub, LinkedIn, X, Instagram · © 2024 Saurabh Sharma. All Rights Reserved.
- **States the design must cover:** loading skeletons shaped like each page's content, empty states (cart, wishlist, search, orders), error + retry, out-of-stock badges, form validation messages, disabled/pending buttons.

## Query parameters (shareable states)

- `/search?query=shoes` — search results
- `/account?tab=orders` — direct tab
- `/products?…` — filters and sort (`category`, `brand`, `minPrice`, `maxPrice`, `inStock`, `featured`, `sort`, `page`, `limit`)
- `/admin` — internal filters (search, role, status, page)

## Backend API map (drives every state above)

`/api/health` · `/api/auth` (register, login, refresh, logout) · `/api/products` (list + detail by slug/id, filters, sorts) · `/api/products/:id/reviews` (list, create, update, helpful) · `/api/cart` (guest cookie + account cart, merge at login, stock-capped qty) · `/api/orders` (preview, place, history, detail, cancel) · `/api/coupons/validate` · `/api/addresses` (CRUD + default) · `/api/wishlist` (add/remove) · `/api/users/me` + `/me/password` · `/api/admin/*` (stats, users, orders queue, products, coupons, reviews)

---

# REQUIREMENTS

- First deliverable: **one extraordinary homepage design** — desktop frame plus purpose-designed tablet and mobile notes. This is the presentation piece for the ₹20 crore pitch.
- The visual system you define (type, grid, color, components, states) must be coherent enough to extend to every route in the map above — state how it scales.
- Realistic content only: real catalog data (brand names, ratings, $79–$923 prices), the real hero and footer copy, the real commercial claims. No lorem ipsum, no fake testimonials, no invented policies.
- Responsive, consistent spacing rhythm, every section with a clear commercial purpose.
