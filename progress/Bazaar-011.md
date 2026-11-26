# Bazaar-011 — Editorial storefront through order receipt

**Date:** 2026-11-26 · **Base:** `3260d9e` · **Status:** working tree

The design system and navigation (`c3687b9`), product cards (`f09ea12`), home and newsletter (`669d514`), and URL-driven catalog (`3260d9e`) established the editorial storefront. This milestone carries it through purchase, account management and customer service.

## Shopping journey

- Product detail now pairs a numbered gallery with a purchase panel. Size and color selections identify distinct cart lines; they survive local persistence, guest-to-account cart merge, quantity edits, server checkout preview and the final receipt. Older cart entries without variants still load.
- The bag shows unit/line prices, shipping progress and a clearly labeled estimate. Checkout uses the order-preview API for the amount to approve; removing a coupon refreshes the undiscounted price. Place order is disabled until a successful preview is available. Preview checks stock across variants sharing the same inventory.
- The receipt shows the recorded status events and dates, item variants, delivery-address snapshot and payment status. Cancelling a pending COD order updates the timeline and shows that no payment is due.
- Account history consumes the paginated API envelope directly. The address book supports editing saved addresses; edits do not change previous receipts. Sign-in and registration preserve the intended customer destination.
- Wishlist, search, admin, and the support directory use the shared layout and form primitives. The FAQ describes the available COD and shipping options. Contact opens a prefilled email draft for the shopper to send in their email app.

## Verification

- Frontend: `npm run build` passed; `npm run lint` reported **0 errors, 10 existing warnings**. `node --test tests/recently-viewed.test.mjs` passed **15/15**.
- Backend: `tests/api.test.cjs` (the `npm test` suite) passed **132/132** against an isolated MongoDB database seeded with the catalog and a test admin. New checks cover variant identity in preview and receipt, and shared stock limits. The database was removed afterwards.
- Headless Edge exercised the production build served by Express. At 375px, a guest added a piece, registered, returned to the product, saved it to the wishlist, and added another size/color. After reload, changing one quantity left the other untouched. Both variants appeared on the COD receipt; applying and removing a coupon restored the original server total.
- The browser also checked receipt cancellation, order history, an address edit persisted after reload without changing the receipt snapshot, FAQ expansion, catalog search, contact/404 routes, and admin login and filtering at desktop width. No uncaught browser errors during the flow.

**Manual regression check:** Add two sizes of one product from its detail page. Reload `/cart`, change one quantity, and go to checkout. Compare both lines and the displayed total with the placed order. Open `/account?tab=orders` and follow the order number back to that receipt.
