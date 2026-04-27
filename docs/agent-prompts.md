# Agent Prompt Patterns

Copy/paste prompts that work well with Claude's managed agent on this monorepo. Read `../CLAUDE.md` first — it has the SDK reference, design system, and deploy flow that the agent grounds against.

---

## Wire a mock app to real Keenan data

```
Read _mock-price-book/index.html. It uses a hardcoded PRODUCTS array.

Replace the mock data with a real Keenan.api.get("/catalog/products")
call. Keep the search-as-you-type UX. Use Keenan.ready to wait for the
bridge token, and surface load errors in the UI rather than silently
failing.

Then commit and push.
```

Variations:
- "...add pagination — page through 50 at a time."
- "...also fetch brand names from /catalog/brands and join client-side instead of just showing the brand_id."
- "...filter to only is_visible=true products."

---

## Apply the design system

```
Apply the Keenan design system to _mock-price-book/index.html.

Use the kn-* classes from _sdk/keenan-design.css. The page should look
like a Keenan-branded internal tool — card layout, kn-table, brand
red for the heading, kn-badge for status pills (kn-badge-success for
"active", kn-badge-default for "discontinued"). Drop the inline
<style> tag entirely.
```

---

## Build a new app from a description

```
Build a new app called "stock-on-hand" in this monorepo.

Behavior:
- Lists products with current inventory level across all locations
- Uses Keenan.api.get("/catalog/products") and /inventory/levels
- Highlights items below their reorder point in red
- Uses the Keenan design system (kn-card, kn-table, kn-badge)

When done, push it. I'll create the matching app record in the portal
with github_path = "stock-on-hand".
```

---

## Tune the design tokens

```
Make the brand red a touch darker — change --kn-brand to #B82E22 in
both _sdk/keenan-design.css and _sdk/design-tokens.json. Then push.
The portal sandbox will deploy the new tokens to every app.
```

(The SDK files in `_sdk/` are reference copies — the portal sandbox serves its own copy at runtime. To actually update the brand for all apps, this same change has to land in the portal's `sandbox/public/_sdk/` and a portal redeploy. Worth flagging when asking for token-level changes.)

---

## Add error handling to an existing app

```
Read _example-app/index.html. The current error handling lumps all
failures into one generic alert. Split it into:
- 401/403: "Sign in or check the app's Keenan Services scopes"
- 429: "Rate limited — try again in a moment"
- 5xx: "Server error — try again"
- network: "Check your connection"

Use err.status from the SDK. Test the UI states by temporarily hard-
coding each path before committing the final version.
```

---

## Things to remember

- The SDK is **auto-injected** — no `<script src=".../keenan-sdk.js">` needed in the app's HTML. The agent occasionally tries to bundle it; just remove that.
- Commerce API responses are **snake_case** (`is_visible`, `retail_price`, `customer_group_id`). The agent will sometimes default to camelCase; correct it.
- App folders starting with `_` are **prototypes**. They still deploy if linked to a portal app, but the leading underscore signals "this is template/example/mock". Real apps should have plain slugs.
- `Keenan.ready` returns a Promise — every API call after page load needs to await it (or chain off it).
