# Product Catalog & Cards

## Where the data lives

The catalog is **hardcoded** in a Redux slice:

- File: `src/Components/Redux/ForSearch.jsx`
- State: `state.AllProduct.productCategories`
- Shape:

```js
productCategories: {
  tshirts: [ { id, BrandName, ProductName, Price, Imgs }, ... ],
  shirts:  [ ... ],
  pants:   [ ... ],
  shoes:   [ ... ],
}
```

`Imgs` holds an imported image URL (Vite resolves it to a hashed asset path at
build time), not a string filename.

## Inventory (60 products)

| Category | Count | Sample ids | Brands present |
|---|---|---|---|
| `tshirts` | 10 | 1010, 1020 … 1100 | Threaded Elegance, Peak Threads, Urban Loom, Supreme Stitches, Silk & Stitch, PrimeWear Tees, EliteFabric Co., Vivid Threads, Modern Weave |
| `shirts` | 15 | 101 – 115 | Supreme Comfort Tee, Street Smart Tees, Downtown Designs, Metro Essentials, Pinnacle Prints, Highland Hues, … |
| `pants` | 15 | 1021 – 1035 | Stitch & Shine, Lee Cooper, Lee Jeans, Levi's, Flying Machine, Elevated Essentials |
| `shoes` | 20 | 1001 – 10022 | Nike, Adidas, Puma, Reebok, New Balance, Under Armour, ASICS, Saucony, Brooks, Hoka One One, Vans, Converse, Fila, Skechers, Timberland, Merrell, Salomon, The North Face, Dr. Martens, Allbirds |

`Price` is a **string** (`"223"`), so calculations call `Number(product.price)`.

## Products page (`/products`)

`Pages/Products/Products.jsx`:

```jsx
const productCategories = useSelector(state => state.AllProduct.productCategories);

Object.entries(productCategories).map(([category, products]) => (
  <section className={`for-${category} forH`}>
    <h1>{category capitalized}</h1><hr/>
    <div className="GridStyle">
      {products.map(p => <Card key={p.id} ... />)}
    </div>
  </section>
))
```

- One `<section>` per category with a capitalised heading (`Tshirts`, `Shirts`,
  `Pants`, `Shoes`).
- Cards render in a CSS grid (`.GridStyle`).
- **It takes no props** — the `category` prop passed by `/products/tshirt` and
  `/products/shoes` is ignored (see [known gaps](#known-gaps)).

## The product card (`Pages/Home/Card.jsx`)

Props (with defaults):

| Prop | Type | Default |
|---|---|---|
| `id` | number | `0` |
| `BrandName` | string | `"Guest"` |
| `ProductName` | string | `"No Data..."` |
| `Price` | string | `"0"` |
| `Imgs` | string | `profile.jpg` fallback |

Behaviour:

- Truncates text: brand to 8 chars, product name to 70 chars (`short_name`).
- Renders **5 static star images** — ratings are decorative, not data.
- Shows `Price$` (no currency conversion, no discount logic).
- **Add to Cart** button:
  1. `dispatch(additems({ id, Bname, name, price, image }))`
  2. `dispatch(addCart())` → badge count +1
  3. increments a local `count_NUm` (unused in the UI)
- Duplicate protection lives in the slice: if the same `id` is already in the
  cart, it sets `duplicate = true` and does **not** add it again — but the UI
  currently shows **no feedback** for that case.
- PropTypes are declared (`prop-types`), so missing/wrong types log a console
  warning in development.

## Home page cards

`Pages/Home/Home.jsx` renders `<Hero/>` plus two hard-coded sections:

- **Recommended** — 4 cards (ids 101, 102, 103, 104)
- **Features** — 5 cards (ids 105, 1010, 1001, 1001, 1001)

Note: some ids repeat and the Home cards duplicate products that also exist in
the catalog slice with **different prices** (e.g. id 103 is `423` on Home but
`423`/`123` inconsistencies across sources). Home prices are literal props, not
read from Redux — that is a data-consistency gap.

## Product detail page

There is **no** `/products/:id` route. Clicking a card does nothing except
"Add to Cart". Product detail, images gallery, size/colour selection are
roadmap items: [`../roadmap/commerce-core.md`](../roadmap/commerce-core.md).

## Backup file

`Pages/Products/Products-Backup.jsx` (~7 KB) is an older copy of the products
page that is not imported anywhere. It should eventually be deleted (roadmap).

## Known gaps

| Gap | Impact | Roadmap |
|---|---|---|
| Catalog hardcoded in source | Every product change needs a redeploy | commerce-core (Mongo `products` collection + API) |
| No product detail page | Users cannot inspect a product | commerce-core |
| Duplicate cart add gives no feedback | User clicks and nothing happens | quick-wins (toast) |
| Home card prices differ from catalog prices | Inconsistent pricing shown | quick-wins (single source of truth) |
| Duplicate ids across categories (e.g. `1001`, `1030`) | Bad React keys, future API conflicts | quick-wins |
| No stock, size, colour, discount, rating data | Blocks realistic e-commerce | commerce-core |
| `Products-Backup.jsx` dead code | Confusing | quick-wins |
