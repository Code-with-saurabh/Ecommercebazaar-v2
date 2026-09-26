# Search

## Entry point — header search bar

`layout/Header/HeaderComponents/Search.jsx`

- Controlled `<input>` inside a real `<form role="search">` — **Enter now
  submits** (it previously did nothing).
- Submit → `history.push('/search?query=' + encodeURIComponent(input.trim()))`.
  Empty input → navigation is skipped.
- The magnifier icon is a proper `<button type="submit" aria-label="Search">`.
- **Live suggestions:** the query is passed through `useDebouncedValue(250ms)`
  (`src/hooks/useDebounce.js`) and ranked with `searchProducts()` from
  `src/utils/search.js` — top 6 results shown in a dropdown
  (`.search-suggestions`), each with name + brand. Clicking one (mouse-down
  keeps focus, so the list does not vanish) fills the input and navigates.

## Results page — `/search`

`pages/SearchPage/SearchPage.jsx`

Reads the query from the URL:

```js
const searchQuery = new URLSearchParams(useLocation().search).get('query') || '';
```

Matching runs in `useMemo([searchQuery, productCategories])` through the
shared helper `searchProducts(query, productCategories, { limit: 200 })`:

1. Empty query → no results (and the page shows "Type something to search").
2. **Category match** (tolerant of singular/plural via `findCategoryKey`):
   every product in the matched category is returned with a bonus score —
   no second name filter.
3. Otherwise (and additionally): **name and brand substring matches** across
   all categories, scored (name-prefix > name > brand-exact > brand-prefix
   > brand) and sorted best-first.
4. Renders a result count plus a `VirtualGrid` (`layout="flex"`) of `<Card>`s,
   or the "No products found." empty state.

### Practical examples

| Query | Result |
|---|---|
| `shoes` | whole `shoes` category (the old double-filter returned 0) |
| `nike` | brand match → the Nike product |
| `shirts` | whole `shirts` category, ranked |
| `T-Shirt` | partial matches across product names |

> **Fixed:** the old code found the category and then filtered it by product
> *name*, so category searches almost always came back empty. The old
> `console.log` spam on every render is gone too.

## Data source

Same hardcoded catalog as the Products page:
`state.AllProduct.productCategories` from `store/slices/ForSearch.jsx`.

There is **no** backend search endpoint, no fuzzy matching, no pagination and
no sort/filter options.

## Related helpers

`src/utils/search.js` — shared, pure, unit-testable:

| Helper | Purpose |
|---|---|
| `searchProducts(query, productCategories, {limit})` | ranked results with category bonus |
| `findCategoryKey(query, productCategories)` | tolerant category lookup (`t-shirt` → `tshirts`) |
| `scoreProduct(product, query)` | name/brand score |
| `collectBrands(...)` / `collectCategories(...)` | autocomplete sources |

## Known gaps

| Gap | Impact | Roadmap |
|---|---|---|
| No backend search / pagination | impossible with a real DB | commerce-core |
| No fuzzy matching / synonyms | typos find nothing | commerce-core |
| No sort/filter UI on results | UX | commerce-core |
| No "recent searches" | UX | quick-wins |
