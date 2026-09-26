# Search

## Entry point — header search bar

`Header/HeaderComponents/Search.jsx`

- Controlled `<input>` + a **Search** button + a clickable search icon.
- On submit: `history.push('/search?query=' + encodeURIComponent(input.trim()))`.
- Empty input → navigation is skipped.
- A `<datalist>` of category names is present but **commented out**
  (autocomplete/suggestions are not wired up).

## Results page — `/search`

`Pages/SearchPage/SearchPage.jsx`

Reads the query from the URL:

```js
const searchQuery = new URLSearchParams(useLocation().search).get('query') || '';
```

Matching algorithm (runs in `useEffect` on `[searchQuery, products]`):

1. Empty/whitespace query → no results shown.
2. Normalise query: `trim().toLowerCase()`.
3. **Category match:** find a category key equal to the query (case-insensitive).
   - If found → filter **that category's** products where
     `ProductName.toLowerCase().includes(query)`.
4. **Else product match:** flatten all categories and filter every product whose
   `ProductName` contains the query.
5. Render matches as `<Card>` components, or the empty state
   **"No products found."**.

### Practical examples

| Query | Result |
|---|---|
| `shoes` | Matches the `shoes` category, then filters by name containing "shoes" → often **0 results** (product names are "Air Max 270", "Ultraboost 21" …) |
| `nike` | No category match → flat search finds the Nike product |
| `sneakers` | Flat search, names containing "sneakers" |
| `T-Shirt` | Category key is `tshirts` (no exact match) → flat search on names |

> **Known weakness:** category-key matching only helps when the user types the
> exact category name, and then the second filter (name must *also* contain the
> query) can empty the results. Searching `shoes` therefore often returns
> nothing even though the category exists. Improving this (brand search,
> category-only results, synonyms) is listed in
> [`../roadmap/quick-wins.md`](../roadmap/quick-wins.md).

## Data source

Same hardcoded catalog as the Products page:
`state.AllProduct.productCategories` from `Redux/ForSearch.jsx`.

There is **no** backend search endpoint, no debouncing, no fuzzy matching, no
pagination and no sort/filter options.

## Debugging

The component logs to the console on every run:

```
Search Query: ...
Products: ...
Category: ...
Filtered Results / Direct Results: ...
```

These `console.log`s should be removed before production (roadmap cleanup).

## Known gaps

| Gap | Impact | Roadmap |
|---|---|---|
| Category + name double filter returns empty results | Confusing UX | quick-wins |
| No brand search | `nike` works only by luck of flat search | quick-wins |
| No autocomplete/suggestions | Commented-out `<datalist>` | quick-wins |
| No debounce / index | Fine for 60 items, breaks at scale | commerce-core |
| No backend search / pagination | Impossible with a real DB | commerce-core |
| `console.log` spam | Console noise | quick-wins |
| No "no query" state on `/search` | Landing on `/search` directly shows "No products found." | quick-wins |
