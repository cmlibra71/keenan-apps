# Keenan Apps Monorepo

This repo contains apps that run in the Keenan Portal sandbox. Each top-level folder (other than `_sdk/`) is one app — the folder name is the app's slug, and the portal auto-deploys it on push.

## Repository Layout

```
.
├── _sdk/                    # Auto-injected by the sandbox — DO NOT modify here
│   ├── keenan-sdk.js        # window.Keenan client (reference copy)
│   ├── keenan-design.css    # Reference design system stylesheet
│   └── design-tokens.json   # Brand tokens (colors, spacing, typography)
├── docs/
│   └── commerce-api.md      # Full Commerce API reference
├── price-book/              # one app
│   ├── index.html           # required entry
│   ├── main.js
│   └── styles.css
├── stock-on-hand/           # another app
│   └── index.html
└── CLAUDE.md                # this file
```

## App Requirements

- Each app folder MUST contain `index.html` at its root.
- Optional `server.js` makes the app a Node runtime app (otherwise it's served as static files).
- Allowed file extensions: `html`, `htm`, `css`, `js`, `mjs`, `cjs`, `json`, `map`, `txt`, `md`, `xml`, `svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `ico`, `bmp`, `woff`, `woff2`, `ttf`, `otf`, `eot`, `wasm`. Other extensions are silently dropped on deploy.
- Per-file limit: 10 MB. Per-app limit: 100 MB. Max 500 files per app.
- The folder name maps to a slug in the portal — keep it lowercase, alphanumeric, hyphens only.
- Do NOT include `node_modules/`, build artifacts, or anything that shouldn't ship to S3.

## Deploy Flow

1. Push to `main`.
2. The portal's GitHub webhook receives the event, detects which app folders changed, downloads files via the GitHub API, uploads them to S3, and creates a new version.
3. The sandbox syncs and serves the new version within ~30s.
4. To link a local folder name to an app record in the portal, set its **GitHub Source > Monorepo Folder Path** in the Command Center to match the folder name.

The version note will read `Deployed from GitHub (<sha>)`.

## Keenan SDK

Every app gets `window.Keenan` auto-injected by the sandbox at runtime. **Do not bundle the SDK into your app** — it's loaded from `/_sdk/keenan-sdk.js` and the portal handles bridge tokens, scope filtering, and refreshes.

### Usage

```html
<!doctype html>
<html>
<head>
  <title>My App</title>
</head>
<body class="kn-app">
  <h1 id="title">Loading…</h1>
  <ul id="products"></ul>

  <script>
    // Wait for the bridge token (postMessage from the portal)
    Keenan.ready.then(async () => {
      document.getElementById("title").textContent =
        "Hello, " + (Keenan.context.userName || "user");

      const { data } = await Keenan.api.get("/catalog/products", { limit: 10 });
      const ul = document.getElementById("products");
      for (const p of data) {
        const li = document.createElement("li");
        li.textContent = p.name + " — $" + p.price;
        ul.appendChild(li);
      }
    });

    // Optional: re-fetch when the token rotates (every ~13 min)
    Keenan.onTokenRefresh(() => {
      console.log("Token refreshed — could re-fetch live data here");
    });
  </script>
</body>
</html>
```

### API Surface

```js
Keenan.ready                           // Promise — resolves on first bridge token
Keenan.context                         // { userId, userName, userEmail, scopes }
Keenan.api.get(path, params?)          // GET — params become query string
Keenan.api.post(path, body?)           // POST — body sent as JSON
Keenan.api.put(path, body?)            // PUT
Keenan.api.delete(path, params?)       // DELETE
Keenan.onTokenRefresh(fn)              // Callback when token rotates
```

All `api.*` methods return Promises and throw `Error` (with `.status` and `.data`) on non-2xx responses.

### Scopes & Permissions

The token only carries the scopes configured in the portal's "Keenan Services" tab for the app. If a call returns 403, the user has the right scopes but is hitting a write endpoint while the app has `allow_writes` off.

Common scopes:
- `read_products`, `write_products` — products, variants, categories, brands
- `read_orders`, `write_orders` — orders, carts, shipments
- `read_customers`, `write_customers` — customers, addresses, groups
- `read_accounts`, `write_accounts` — accounts, contacts, sales reps
- `read_inventory`, `write_inventory` — locations, levels
- `read_pricing`, `write_pricing` — price lists, promotions, coupons
- `read_content`, `write_content` — channels, sites, settings

## Commerce API — Quick Reference

Base path: `/api/v1/commerce` (handled automatically by the SDK).

| Resource | Path | Notes |
|----------|------|-------|
| Channels | `/channels` | Storefronts, marketplaces |
| Categories | `/catalog/categories` | Hierarchical |
| Brands | `/catalog/brands` |  |
| Products | `/catalog/products` | Supports `?include=variants,images,categories` |
| Variants | `/catalog/products/{id}/variants` |  |
| Customers | `/customers` |  |
| Accounts | `/accounts` | B2B accounts (companies) |
| Carts | `/carts` |  |
| Orders | `/orders` |  |
| Price Lists | `/pricing/price-lists` |  |
| Promotions | `/promotions` |  |
| Inventory | `/inventory` | Locations + levels |
| Reviews | `/reviews` |  |
| Settings | `/settings` |  |

**See `docs/commerce-api.md` for the full reference (4900 lines): every endpoint, request/response shapes, filter/sort syntax, error codes.**

### Filtering & Pagination

```js
// Pagination
await Keenan.api.get("/catalog/products", { limit: 50, page: 2 });

// Filtering — comma-separated for IN
await Keenan.api.get("/catalog/products", { "id:in": "1,2,3" });

// Sorting
await Keenan.api.get("/orders", { sort: "-date_created" });
```

### Response Shape

Most list endpoints return:
```json
{ "data": [...], "meta": { "pagination": { "total": 1234, "count": 50, "page": 1 } } }
```

Detail endpoints return:
```json
{ "data": { ... } }
```

### Data Conventions

**The Commerce API returns `snake_case` field names** (e.g. `customer_group_id`, not `customerGroupId`). When wiring an app to real data, replace prototype property accesses accordingly.

## Design System

Apps automatically get `keenan-design.css` injected. Use `kn-` prefixed classes to opt in — bare HTML elements remain unstyled (so apps with their own design language can stay that way).

### Tokens (`_sdk/design-tokens.json`)

Source of truth for colors, typography, spacing. Mirrored into CSS custom properties:

```css
var(--kn-brand)            /* #C73629 */
var(--kn-text)             /* #18181b */
var(--kn-text-secondary)   /* #71717a */
var(--kn-border)           /* #e4e4e7 */
var(--kn-radius)           /* 0.5rem */
/* ...see _sdk/keenan-design.css for the full set */
```

### Component Classes

```html
<!-- Opt the app into the design system -->
<body class="kn-app">

  <!-- Card -->
  <div class="kn-card">
    <h2 class="kn-heading kn-heading-lg">Title</h2>
    <p class="kn-text kn-text-secondary">Subtitle</p>
  </div>

  <!-- Buttons -->
  <button class="kn-btn kn-btn-primary">Save</button>
  <button class="kn-btn kn-btn-secondary">Cancel</button>
  <button class="kn-btn kn-btn-ghost kn-btn-sm">More</button>

  <!-- Form -->
  <label class="kn-label">Name</label>
  <input class="kn-input" placeholder="Type here…">

  <!-- Table -->
  <table class="kn-table">
    <thead><tr><th>SKU</th><th>Name</th></tr></thead>
    <tbody><tr><td>ABC-1</td><td>Widget</td></tr></tbody>
  </table>

  <!-- Badges and alerts -->
  <span class="kn-badge kn-badge-success">In stock</span>
  <div class="kn-alert kn-alert-warning">Low inventory</div>

</body>
```

Full class list is in `_sdk/keenan-design.css`. Apps can override any token with their own CSS custom property at `:root` to retheme without forking.

### Evolving the Design System

The CSS lives in this monorepo and ships with every deploy. To change brand-wide design (e.g. shift the primary color), edit `_sdk/design-tokens.json` and `_sdk/keenan-design.css` directly — the change reaches every app on the next deploy of any app.

## Common Wiring Patterns

When converting a prototype app to use real data:

### Mock fetch → Keenan SDK

```js
// Before
const res = await fetch("https://mock-api.com/products?limit=10");
const products = await res.json();

// After
const { data: products } = await Keenan.api.get("/catalog/products", { limit: 10 });
```

### Auth headers → automatic

```js
// Before
fetch(url, { headers: { Authorization: "Bearer " + apiKey } })

// After — bridge token is handled by the SDK, no header needed
Keenan.api.get(path)
```

### User identity

```js
// Before — hardcoded "Demo User"
const user = { name: "Demo User", id: 1 };

// After — real user from the portal session
await Keenan.ready;
const user = { name: Keenan.context.userName, id: Keenan.context.userId };
```

### Error handling

```js
try {
  const result = await Keenan.api.post("/orders", payload);
} catch (err) {
  if (err.status === 403) {
    // App's allow_writes is off, or scope not granted
  } else if (err.status === 422) {
    // Validation error — err.data has details
  }
}
```

## Things to Avoid

- **Do not bundle the SDK** — it's auto-injected. `import` or `<script>` tags pointing at `/_sdk/keenan-sdk.js` would just load it twice.
- **Do not store the bridge token** in localStorage — it rotates every 15 min, and a stale token fails silently. Always read it via `Keenan.api.*`.
- **Do not call API routes other than `/api/v1/commerce/*`** — bridge tokens only carry Commerce scopes.
- **Do not assume CORS is configured** for external services — the iframe runs on a different origin from the portal. If you need an external API, the integration belongs in the portal's connector framework, not in the app.
- **Do not use `..` in import paths** — the sandbox blocks paths with parent traversal at serve time.
