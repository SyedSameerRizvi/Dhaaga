# DHAAGA demo store

Static demo for a Pakistani clothing brand. No build step.

| Page | What it is |
|---|---|
| `index.html` | Home page and editorial product grid |
| `product.html?id=…` | Product page (size, quantity, add to bag) |
| `runway.html` | "Try the Look" runway |
| `checkout.html` | Cash on Delivery checkout |
| `admin.html` | Owner-only orders and stock (not linked from the store) |

Shared code: `store.js` (products, stock, bag, orders) and `site.css` (theme).

## Run locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080. Serving over localhost is needed for the bag, orders and admin sign-in.

## Test

```bash
node store.test.js
```

Checks the bag, stock, delivery fee, ordering and cancelling rules in `store.js`.

## Admin (demo)

- URL: `/admin.html`
- Password: ask the store owner (kept out of this repo)

To change it, put the SHA-256 hash of the new password in `ADMIN_HASH` in `admin.html`. Use a long random password: the hash is public in this repo.

## Demo limits

- Orders, stock and the bag live in the browser's localStorage. The admin only sees orders placed in the same browser.
- The password check runs in the browser. It keeps casual visitors out but is not real security.
- Going live needs a backend for orders, stock and admin login (e.g. Supabase).
- Product photos are free Unsplash stand-ins; replace them with your own shoot.
