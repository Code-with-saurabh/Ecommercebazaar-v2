# Google Stitch Design Brief — Bazaar Homepage Redesign

> Paste everything below this line into Google Stitch.
> Last updated: 2026-11-23 · Source of truth: repo `Code-with-saurabh/Ecommercebazaar-v2`

---

Act as a senior e-commerce UI/UX designer with 10+ years of experience designing successful commercial websites.

I am providing my existing e-commerce website, **Bazaar**, as a reference. Your task is to redesign its interface while preserving its business identity, product information, branding and core functionality. This brief contains the real brand facts, real content and real constraints of the project — treat them as fixed inputs, not suggestions.

## DESIGN OBJECTIVE

Create a premium, professional, commercially realistic e-commerce website that looks like it was designed by an experienced human design team.

## DESIGN DIRECTION

- Use a clean, sophisticated and timeless visual language.
- Strong typography hierarchy with carefully selected font combinations.
- Professional spacing and alignment.
- Realistic product photography, not AI-looking decorative illustrations.
- A balanced color palette based on the existing brand.
- Subtle borders, shadows and restrained corner radii.
- Clear navigation and intuitive shopping experience.
- Prioritize product discovery and conversion.

## AVOID

- Generic AI-generated website aesthetics.
- Excessive gradients and glassmorphism.
- Oversized headings without purpose.
- Excessive rounded cards and pill-shaped buttons.
- Random decorative elements.
- Unnecessary animations.
- Repetitive section layouts.
- Fake testimonials, fake statistics or invented product information.
- Invented policies (return windows, warranties, "24/7 support") — only use the real claims listed below.

---

# PROJECT CONTEXT (real data — preserve exactly)

**Brand:** Bazaar — an online fashion/apparel store (t-shirts, shirts, pants, shoes).
**Wordmark:** the word "Bazaar" set in a warm coral-to-gold gradient (`#ff6b6b → #caca2b`), editorial in spirit.
**Typography today:** Merriweather (serif, body/editorial voice) + Roboto (UI). Refine the pairing if you can improve hierarchy, but keep a serif editorial character for the brand.
**Core palette (do not replace, may refine):**
- Primary accent: deep teal `#088178` — prices, key CTAs, active states (the brand's signature color)
- Navigation / ink: charcoal `#333` dark bar, near-black text
- Surfaces: white with a warm off-white section background
- Sale/urgency red `#ef233c` — sparingly, only for discount signals
- Gradient (logo + one hero accent maximum): `#ff6b6b → #caca2b`

**Catalog (100% real, no invention):**
- 60 products across 4 categories: **T-shirts (10), Shirts (15), Pants (15), Shoes (20)**
- Real brands: Adidas, ASICS, Brooks, Hoka One One, Converse, Dr. Martens, Fila, Allbirds, Flying Machine, Downtown Designs, and others
- Price band: **$79 – $923**
- Real studio product photography exists (plain-background apparel/shoe shots) — the design must showcase photography, not illustration
- Every product carries: image, brand, name, star rating + review count, price, MRP with strikethrough, discount %, stock state (out-of-stock badge exists)

**Real commercial claims only (all server-verified):**
- Free shipping on orders over **$100** (flat **$10** below that)
- **Cash on Delivery (COD)** available
- Coupons validated server-side (real discount at checkout)
- Live product search with suggestions
- Prices recomputed server-side at checkout — never fake "from" prices

**Real proof signals available:** per-product star ratings (average + count) from the catalog. There are **no authored customer testimonials** — do not invent quotes; express social proof through aggregate ratings and real discount percentages.

**Routes the homepage must feed into:** `/products`, `/products/tshirt`, `/products/shoes`, category filters, `/cart`, `/checkout`, `/wishlist`, `/account`, `/login`, `/help`, `/contact`, `/about`.

**Footer (use this real content, no invention):**
- Contact Us — Phone: 9327115687 · Email: saurabh12166@gmail.com · Address: Gujarat, Surat
- Customer Service — Help, Contact
- About — About Us, Products
- Follow Me — GitHub, LinkedIn, X, Instagram
- © 2024 Saurabh Sharma. All Rights Reserved.

**Current homepage (improve, do not blindly copy):** dark nav → hero with the copy "Super value deals / On all products / Save more with coupons & up to 70% off!" → "Recommended" row (4 newest) → "Features" row (5 featured) → footer. It lacks an announcement bar, category navigation, trust indicators, promo section, newsletter and social proof — your redesign must supply these with purpose.

---

# HOMEPAGE STRUCTURE (design these sections, in order)

1. **Announcement bar** — one real offer line, e.g. free shipping over $100 + COD available + "coupons up to 70% off". Restrained, single line, dismissible.
2. **Main navigation** — logo (Bazaar wordmark), prominent product search with live-suggestion affordance, account, wishlist, cart with count badge. Keep the existing dark charcoal bar identity; improve hierarchy and spacing. Desktop + collapsed mobile pattern.
3. **Hero** — authentic commercial imagery (real apparel/shoe photography, lifestyle or clean studio), not gradients or illustration. Headline built from the real offer ("Super value deals on all products", "up to 70% off with coupons"). One primary CTA → `/products`, one secondary → featured. Keep type proportional to the image.
4. **Shop by category** — four tiles: T-shirts, Shirts, Pants, Shoes, each with a representative product photo, linking to the category pages.
5. **Featured products** — realistic product cards using the real card anatomy: photo, brand, name, star rating, price + struck MRP + discount %, out-of-stock state, add-to-cart. 4-up desktop, responsive down.
6. **Best sellers / trending** — same card system, different selection (the API supports sort by popularity, rating, newest, price). Do not repeat the exact layout of section 5 — vary column count or treatment.
7. **Promotional campaign section** — one coupon-driven campaign block using the real 70%-off message and a real product image as the visual anchor.
8. **Brand benefits & trust indicators** — only real claims: Free shipping over $100 · COD available · Server-verified pricing · Secure checkout. Icon + label row, no fake stats.
9. **Customer reviews** — design a review/social-proof section driven by real aggregate product ratings (stars + counts). No invented names, quotes or numbers. If a quote slot is shown, it must be visually clearly bound to a real product rating.
10. **Newsletter subscription** — email capture block (visual design only; no backend yet). One clear input + button, honest microcopy.
11. **Detailed footer** — the four real columns above, plus payment-trust line (COD) and the real copyright.

---

# REQUIREMENTS

- First deliverable: **one outstanding homepage design** (desktop frame + notes for tablet and mobile). Prioritize visual quality, usability and commercial credibility over unnecessary decoration.
- Responsive for desktop, tablet and mobile.
- Realistic content and consistent spacing (define an 8px spacing rhythm).
- Every section must have a clear purpose; do not add decorative sections.
- Do not blindly copy the existing layout — improve weak layouts and poor visual hierarchy while keeping brand colors, wordmark and product identity.
- Show product cards with real-looking photography and real catalog-style data (brand, rating, price band $79–$923) — no lorem ipsum, no fake "Product Name 1".
