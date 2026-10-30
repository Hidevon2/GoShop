# GoShop design extraction metadata

This companion stores extension details that the canonical DESIGN.md YAML cannot express. It is intentionally at `DESIGN.meta.md` under the delegated write boundary; `.impeccable/design.json` was not created. The JSON block below uses the documenter's schemaVersion 2 extension shape. Frontmatter primitives remain owned by DESIGN.md. No synthetic tonal ramps were generated: the observed lilac shades are distinct component fills, not an established scale.

Evidence: `PRODUCT.md`, the direction contract in `index.html`, `src/styles.css`, and representative `src/lib.tsx`, `src/main.tsx`, `src/shop.tsx`. Extraction date: 2026-10-29. Direction: retail receipt, candidate 4, seed db1250f0; no incumbent identity. Source review status supplied by the finish reviewer: SOURCE REVIEW PASS after six fixes. Browser/CUA transport unavailable; no screenshot, approved comp, computed-style sample or browser visual pass. Parent-reported verification: 19 tests pass; production build passes. This document does not certify WCAG compliance. Source contrast overrides are recorded as effective cascade values, not independently measured compliance.

```json
{
  "schemaVersion": 2,
  "generatedAt": "2026-10-29T02:33:41Z",
  "title": "Design System: GoShop",
  "extensions": {
    "colorMeta": {
      "purple": {"role": "primary", "displayName": "Ledger Violet"},
      "store-action": {"role": "primary", "displayName": "Store Violet"},
      "paper": {"role": "neutral", "displayName": "Working Paper"},
      "canvas": {"role": "neutral", "displayName": "Cool Canvas"},
      "line": {"role": "neutral", "displayName": "Ledger Line"},
      "stock-paper": {"role": "primary", "displayName": "Stock Docket Lilac"}
    },
    "typographyMeta": {
      "display": {"displayName": "Storefront hero", "purpose": "Desktop base rule; explicit breakpoint overrides win."},
      "headline": {"displayName": "Workspace title", "purpose": "Page heading base rule."},
      "body": {"displayName": "Form control text", "purpose": "Not a global body size; local paragraph sizes vary."},
      "ledger": {"displayName": "Ledger rows", "purpose": "Compact data; monetary cells add tabular figures."}
    },
    "shadows": [
      {"name":"account-popover","value":"0 8px 30px #36234f12","purpose":"Temporary account menu."},
      {"name":"drawer","value":"-10px 0 40px #3214480c","purpose":"Right-side dialog."},
      {"name":"toast","value":"0 8px 32px #32203d26","purpose":"Temporary feedback."},
      {"name":"field-focus","value":"0 0 0 3px #eee8f7","purpose":"Native field focus."},
      {"name":"search-focus","value":"0 0 0 3px #f0ebf7","purpose":"Composed search focus-within."}
    ],
    "motion": [
      {"name":"button","value":"background .18s, color .18s, box-shadow .18s","purpose":"Button state changes; CSS default easing."},
      {"name":"sidebar","value":"transform .25s ease-out","purpose":"Mobile navigation."},
      {"name":"drawer-in","value":".28s cubic-bezier(.2,.8,.2,1)","purpose":"From translateX(35px), opacity .4 to rest."},
      {"name":"backdrop-in","value":".2s ease-out","purpose":"From #22123300 to #22123345."},
      {"name":"toast-in","value":".22s ease-out","purpose":"From opacity 0 and translate 0 6px."},
      {"name":"product-photo","value":"transform .35s cubic-bezier(.2,.7,.2,1)","purpose":"Hover scale 1.035."},
      {"name":"photo-arrow","value":"opacity .2s","purpose":"Hover reveal."},
      {"name":"loading-spin","value":"spin 1s linear infinite","purpose":"Loading feedback."},
      {"name":"reduced-motion","value":"animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important","purpose":"Applied to all elements and pseudo-elements under prefers-reduced-motion:reduce."}
    ],
    "breakpoints": [
      {"name":"wide","value":"min-width:1500px"},
      {"name":"compact-desktop","value":"max-width:1200px"},
      {"name":"tablet-wide","value":"max-width:1000px"},
      {"name":"mobile-navigation","value":"max-width:760px"},
      {"name":"phone","value":"max-width:480px"}
    ]
  },
  "components": [
    {
      "name":"Primary Button","kind":"button","refersTo":"button-primary","description":"Main staff action, with source hover and focus states.",
      "html":"<button class=\"ds-primary\">Save changes</button>",
      "css":".ds-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 17px;border:0;border-radius:8px;min-height:40px;font:650 12px/1.5 Manrope,ui-sans-serif,sans-serif;background:var(--purple,#7560ae);color:#fff;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}.ds-primary:hover:not(:disabled){background:var(--purple-dark,#604997)}.ds-primary:focus-visible{outline:3px solid #a68bda;outline-offset:3px;border-radius:5px}.ds-primary:disabled{opacity:.5;cursor:not-allowed}"
    },
    {
      "name":"Secondary Button","kind":"button","refersTo":"button-secondary","description":"Quiet bordered action.",
      "html":"<button class=\"ds-secondary\">Cancel</button>",
      "css":".ds-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 17px;border:1px solid #e4e1e9;border-radius:8px;min-height:40px;font:650 12px/1.5 Manrope,ui-sans-serif,sans-serif;background:#fff;color:#514c5e;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}.ds-secondary:hover:not(:disabled){background:#f6f3fa;border-color:#cec4df}.ds-secondary:focus-visible{outline:3px solid #a68bda;outline-offset:3px;border-radius:5px}.ds-secondary:disabled{opacity:.5;cursor:not-allowed}"
    },
    {
      "name":"Danger Button","kind":"button","refersTo":"button-danger","description":"Destructive action; source establishes no separate hover fill.",
      "html":"<button class=\"ds-danger\">Archive product</button>",
      "css":".ds-danger{padding:11px 17px;border:0;border-radius:8px;min-height:40px;font:650 12px/1.5 Manrope,ui-sans-serif,sans-serif;background:#a43f4a;color:#fff;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}.ds-danger:focus-visible{outline:3px solid #a68bda;outline-offset:3px;border-radius:5px}.ds-danger:disabled{opacity:.5;cursor:not-allowed}"
    },
    {
      "name":"Store Action","kind":"button","refersTo":"button-store","description":"Photographic storefront hero action.",
      "html":"<a class=\"ds-store-action\" href=\"#collection\">Find your everyday</a>",
      "css":".ds-store-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;border-radius:5px;min-height:40px;font:650 10px/1.5 Manrope,ui-sans-serif,sans-serif;background:#846296;color:#fff;text-decoration:none;transition:background .18s,color .18s,box-shadow .18s}.ds-store-action:hover{background:#725180}.ds-store-action:focus-visible{outline:3px solid #a68bda;outline-offset:3px}"
    },
    {
      "name":"Labeled Field","kind":"input","refersTo":"input","description":"Standard wrapped label and control.",
      "html":"<label class=\"ds-field\"><span>Product name</span><input placeholder=\"Enter product name\" /></label>",
      "css":".ds-field{display:flex;flex-direction:column;gap:7px;font:11px Manrope,ui-sans-serif,sans-serif;color:#8d6c9f}.ds-field input{border:1px solid #e5e2eb;border-radius:8px;background:#fff;color:var(--ink,#292633);padding:10px 12px;outline:none;min-width:0;font:13px/1.6 Manrope,ui-sans-serif,sans-serif}.ds-field input::placeholder{color:#746c80}.ds-field input:focus{border-color:#9b86c3;box-shadow:0 0 0 3px #eee8f7}"
    },
    {
      "name":"Chapter Navigation","kind":"nav","refersTo":"navigation-active","description":"Active staff navigation link with inline Lucide package geometry.",
      "html":"<nav aria-label=\"Workspace\"><a class=\"ds-nav-active\" href=\"#products\" aria-current=\"page\"><svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5M12 22V12\"/></svg>Products</a></nav>",
      "css":".ds-nav-active{display:flex;align-items:center;gap:11px;padding:12px 13px;margin-bottom:3px;border-radius:7px;background:#eee9f7;color:#7255a7;font:700 11.5px/1.5 Manrope,ui-sans-serif,sans-serif;text-decoration:none}.ds-nav-active:hover{background:#eee9f7;color:#7255a7}.ds-nav-active:focus-visible{outline:3px solid #a68bda;outline-offset:3px;border-radius:5px}"
    },
    {
      "name":"Positive Status","kind":"chip","refersTo":"status-positive","description":"Text and dot accompany semantic color; noninteractive badge.",
      "html":"<span class=\"ds-status\"><i></i>Completed</span>",
      "css":".ds-status{display:inline-flex;align-items:center;gap:4px;border-radius:5px;padding:4px 7px;font:550 8px/1.4 Manrope,ui-sans-serif,sans-serif;text-transform:capitalize;white-space:nowrap;background:#eff5ee;color:#6e8c65}.ds-status i{height:3px;width:3px;display:inline-block;border-radius:50%;background:currentColor}"
    },
    {
      "name":"Paper Ledger Panel","kind":"card","refersTo":"panel","description":"Flat container and ruled data rows.",
      "html":"<section class=\"ds-panel\"><h2 class=\"ds-panel-title\">Recent transactions</h2><table class=\"ds-ledger\"><thead><tr><th>Order</th><th>Total</th></tr></thead><tbody><tr><td>GS-1001</td><td class=\"ds-money\">₱1,250.00</td></tr></tbody></table></section>",
      "css":".ds-panel{background:#fff;border:1px solid var(--line,#eeecf2);border-radius:var(--radius,14px);overflow:hidden;min-width:0;font-family:Manrope,ui-sans-serif,sans-serif}.ds-panel-title{font-size:14px;font-weight:700;letter-spacing:-.02em;margin:0;padding:22px 23px 19px;color:var(--ink,#292633)}.ds-ledger{width:100%;border-collapse:collapse;text-align:left;font-size:10px}.ds-ledger th{background:#fbfafc;color:#a094aa;font-weight:550;font-size:9px;padding:12px 19px;white-space:nowrap;border-bottom:1px solid #f0edf4}.ds-ledger td{padding:15px 19px;border-bottom:1px solid #f1eef5;vertical-align:middle;color:#63566f;line-height:1.55}.ds-ledger tbody tr:last-child td{border-bottom:0}.ds-ledger tbody tr:hover{background:#fdfbff}.ds-ledger .ds-money{text-align:right;font-weight:650;white-space:nowrap;font-variant-numeric:tabular-nums}"
    }
  ],
  "narrative": {
    "northStar":"The Connected Shop Ledger",
    "overview":"GoShop uses paper-white surfaces, dark ink, lilac chapter tabs and ruled transaction rows to make a connected retail business readable. Compact Manrope typography supports dense operations; restrained violet actions provide the next step. The same family opens into a photographic storefront with larger headlines and more breathing room.",
    "keyCharacteristics":["White working paper over a cool near-white canvas.","Lilac navigation and exception dockets, violet primary actions.","Horizontal rules, compact tables and tabular monetary figures.","Local Manrope variable type, Lucide line icons and product photography.","Sparse shadows reserved for temporary overlays."],
    "rules":[
      {"name":"The Action Ink Rule","body":"Keep the strong violet fill attached to a clear action. Use pale lilac for selection and grouping.","section":"colors"},
      {"name":"The Ledger Figures Rule","body":"Preserve tabular figures and right alignment when adding monetary columns.","section":"typography"},
      {"name":"The Working Paper Rule","body":"Preserve flat panels and row rules for persistent operational content; reserve shadows for overlays and focus.","section":"elevation"}
    ],
    "dos":["Do preserve white paper, fine horizontal rules and a restrained violet action hierarchy.","Do use local Manrope and Lucide line icons consistently across staff and customer screens.","Do keep product photos, status words and tabular currency readable in their existing roles.","Do retain keyboard focus styles, input labels, skip links and the shared drawer behavior.","Do follow the final contrast overrides when extending pale surfaces; verify new foreground/background pairs in the rendered interface."],
    "donts":["Don't add decorative shadows to every persistent panel.","Don't replace labeled operational states with color alone.","Don't treat the compact desktop type scale as proof of mobile legibility; inspect the rendered result at the relevant breakpoints.","Don't claim visual approval or accessibility certification from this source-only extraction."]
  }
}
```

Additional cascade details: the base field-focus border and composed search-focus border differ (`#9b86c3` versus `#a78bc7`). Secondary button border changes from `#e4e1e9` to `#cec4df`. Mobile navigation scrim is `#27103555` (z-index 24), sidebar is 25, account popover 40, drawer backdrop 100, toast 150. Drawer backdrop is `#22123345`. Toast default fill is `#393043`, error fill `#87516a`. Photo caption and stock tag fill is `#fffffff0`.

The final contrast patch assigns storefront headings `#604d70`, ordinary storefront prose and collection metadata `#7f688d`, hero supporting text `#80648e`, checkout supporting text `#846692`, authentication supporting text `#83658e`, integration/report supporting text `#856795`, and order/POS details `#856695`. The final `.muted`, hints, field hints and checkbox labels resolve to `#85718f`. Other components, including status pairs, retain their explicit local colors. Do not infer a globally replaced text token or a passed contrast threshold.

Store hero heading cascade: base `clamp(40px,4.6vw,68px)`; at max 1000px `48px`; at max 760px `39px`; at max 480px `49px`. Workspace title cascade: base `27px`; min 1500px `31px`; max 1200px `25px`; max 1000px `23px`; max 760px `24px`. These are observed source rules, not a synthesized fluid scale.

The component examples are self-contained CSS/HTML translations for inspection. They use token fallbacks where actual root variables exist, inline the navigation SVG, and preserve source states. Noninteractive status and panel examples intentionally have no fabricated focus or press behavior. The font declaration lives in the application, so a detached preview needs the local Manrope asset available to match its type exactly. No browser render of these examples was performed.
