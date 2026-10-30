---
name: GoShop
description: A paper-white retail ledger connecting the counter and storefront.
colors:
  ink: "#292633"
  muted-token: "#817d8b"
  purple: "#7560ae"
  purple-dark: "#604997"
  lilac: "#eee9f8"
  line: "#eeecf2"
  green: "#4d785f"
  amber: "#966b22"
  canvas: "#f7f7fa"
  paper: "#fff"
  secondary-ink: "#514c5e"
  secondary-hover: "#f6f3fa"
  field-border: "#e5e2eb"
  field-focus: "#9b86c3"
  focus-outline: "#a68bda"
  placeholder: "#746c80"
  muted-text: "#85718f"
  danger: "#a43f4a"
  ledger-heading: "#a094aa"
  ledger-text: "#63566f"
  ledger-head-bg: "#fbfafc"
  ledger-hover: "#fdfbff"
  chapter-tab: "#eee9f7"
  chapter-tab-ink: "#7255a7"
  stock-paper: "#eee8f7"
  stock-ink: "#5b457d"
  store-hero: "#eee8f4"
  store-heading: "#604d70"
  store-text: "#7f688d"
  store-hero-text: "#80648e"
  store-action: "#846296"
  store-action-hover: "#725180"
  status-positive-bg: "#eff5ee"
  status-positive-ink: "#6e8c65"
  status-pending-bg: "#fcf3e5"
  status-pending-ink: "#ae8d4f"
  status-processing-bg: "#f1eaf8"
  status-processing-ink: "#9872b9"
  status-shipped-bg: "#edf1f8"
  status-shipped-ink: "#7a91b7"
  status-negative-bg: "#f9eaec"
  status-negative-ink: "#b97d84"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "clamp(40px, 4.6vw, 68px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "-.02em"
  body:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.5
  ledger:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "10px"
    lineHeight: 1.55
rounded:
  photo: "3px"
  tag: "5px"
  compact: "7px"
  control: "8px"
  popover: "10px"
  summary: "12px"
  panel: "14px"
  circle: "50%"
spacing:
  tight: "4px"
  small: "8px"
  control-gap: "10px"
  medium: "12px"
  large: "20px"
  panel-gap: "22px"
  panel-inset: "23px"
  roomy: "25px"
  workspace-gutter: "36px"
components:
  button-primary:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-primary-hover:
    backgroundColor: "{colors.purple-dark}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.secondary-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-store:
    backgroundColor: "{colors.store-action}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tag}"
    padding: "12px 18px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
  navigation-active:
    backgroundColor: "{colors.chapter-tab}"
    textColor: "{colors.chapter-tab-ink}"
    rounded: "{rounded.compact}"
    padding: "12px 13px"
  status-positive:
    backgroundColor: "{colors.status-positive-bg}"
    textColor: "{colors.status-positive-ink}"
    rounded: "{rounded.tag}"
    padding: "4px 7px"
---

# Design System: GoShop

## Overview

**Creative North Star: "The Connected Shop Ledger"**

GoShop uses paper-white surfaces, dark ink, lilac chapter tabs and ruled transaction rows to make a connected retail business readable. Compact Manrope typography supports dense operations; restrained violet actions provide the next step. The same family opens into a photographic storefront with larger headlines and more breathing room.

This is a descriptive extraction of the implemented source, grounded in the retail receipt direction in `index.html` (candidate 4; seed `db1250f0`). The metaphor above names that observed direction; it is not a separately approved creative workshop result. No incumbent identity was supplied. Source review passed after six findings were resolved; browser transport was unavailable, so no screenshot, approved comp or rendered visual pass supports this document. The parent build reports 19 passing tests and a passing production build. These facts do not constitute a WCAG certification.

**Key Characteristics:**

- White working paper over a cool near-white canvas.
- Lilac navigation and exception dockets, violet primary actions.
- Horizontal rules, compact tables and tabular monetary figures.
- Local Manrope variable type, Lucide line icons and product photography.
- Sparse shadows reserved for temporary overlays.

## Colors

The palette combines violet and lilac with warm purple-tinted secondary text; green, amber, blue and rose identify operational states.

### Primary

- **Ledger Violet** (`purple`) identifies staff primary buttons, links and checkbox accents; its darker sibling handles hover.
- **Store Violet** (`store-action`) supplies the storefront call to action, with a separate darker hover value.
- **Lilac Paper** (`lilac`, `chapter-tab`, `stock-paper`, `store-hero`) separates navigation, stock exceptions and editorial retail copy. These are distinct source values, not an interchangeable ramp.

### Secondary

- **Positive Sage**, **Pending Amber**, **Processing Lilac**, **Shipped Blue** and **Negative Rose** use the corresponding paired status tokens. Status labels remain visible alongside color and a small current-color dot.
- The `green` and `amber` custom properties are source primitives; component status styles use their own paired values.

### Neutral

- **Ink** is the global text anchor. **Paper** holds panels and fields; **Canvas** distinguishes the surrounding workspace.
- **Ledger Line** divides panels and totals. Table headers, row rules and secondary borders use small literal variations recorded in the sidecar.
- **Store Heading**, **Store Text** and **Store Hero Text** reflect the final contrast-repair overrides. The declared `muted-token` differs from the final `.muted` utility (`muted-text`). Follow the effective context, not an earlier overridden foreground.

**The Action Ink Rule.** Keep the strong violet fill attached to a clear action. Use pale lilac for selection and grouping.

## Typography

**Display and body font:** Manrope, with `ui-sans-serif, sans-serif` fallbacks. The local `/fonts/manrope.ttf` declares a variable weight range (400–800), uses `font-display: swap`, and disables font synthesis. No separate mono family is established.

**Character:** A compact, rounded sans keeps the shop approachable while supporting inventory and order density. The frontend frequently uses intermediate weights (550, 600 and 650).

### Hierarchy

- **Display:** Storefront hero uses the fluid display token. Its breakpoint overrides are recorded in the sidecar. Authentication uses a related fluid heading (`clamp(42px, 4.8vw, 72px)`, weight 650).
- **Headline:** Workspace page title uses the headline token; it changes with viewport width. Storefront collection titles use a separate lighter heading (29px, weight 600).
- **Title:** General second-level heading uses the title token; panel headings reduce to 14px. Third-level headings are 15px.
- **Body:** The body token describes standard form controls, not a global body size. Paragraphs inherit their local size and default to line-height 1.7; hero prose uses 1.9 and a measure of about 31ch.
- **Label:** Buttons use the label token. Navigation is 11.5px/550 on desktop. Table headers are 9px/550; table body is 10px, with smaller supporting rows.
- **Ledger:** Monetary cells and headline totals use `font-variant-numeric: tabular-nums`; amounts stay unbroken. PHP values use the `en-PH` currency formatter.

**The Ledger Figures Rule.** Preserve tabular figures and right alignment when adding monetary columns.

## Layout

The desktop workspace has a fixed left index (232px), a top bar (76px), and a flexible content area capped at 1700px. Normal content padding is 34px 36px 32px. Common panel gaps are 22px; panel headers use 22px 23px 19px. Four summary figures share one ruled strip. The principal analysis grid uses `minmax(0, 2.17fr) minmax(250px, 1fr)`; the lower grid uses `minmax(0, 1.8fr) minmax(300px, 1fr)`.

Responsive rules are explicit, not a generic framework scale:

- At **min-width 1500px**, content padding grows to 40px 45px, headings and totals increase, and the chart grows to 270px.
- At **max-width 1200px**, sidebar width is 210px, content padding is 28px 25px, panel gaps tighten to 17px, and the staff catalogue has three columns.
- At **max-width 1000px**, sidebar width is 190px; totals become two columns; dashboard and reports stack; the storefront catalogue has three columns. The staff catalogue has two columns.
- At **max-width 760px**, the workspace sidebar becomes a 228px off-canvas menu; the main offset disappears; the top bar is 65px. Store navigation hides and product tiles become two columns. Checkout stacks. The staff catalogue uses three columns at this interval because of the later cascade.
- At **max-width 480px**, workspace padding is 23px 16px; staff catalogue returns to two columns; POS stacks; drawers fill the width. The storefront hero stacks above its image, with 4.5% margins, a 49px heading and a 230px image.

The storefront uses 5.5% desktop gutters, four product columns with 35px by 23px gaps, and a two-column copy/photo hero with a 440px minimum height. Product photos use `object-fit: cover`. Data tables retain horizontal scrolling; small-screen order tables keep a 680px minimum width rather than compressing every column.

## Elevation & Depth

The main interface is flat at rest: white panels, pale fills and fine rules do the structural work. Account menus, drawers and toasts use restrained shadows. Translucent scrims separate modal work from the page. Storefront photo captions use an almost opaque white layer.

### Shadow Vocabulary

- **Account popover:** `0 8px 30px #36234f12`.
- **Drawer:** `-10px 0 40px #3214480c`.
- **Toast:** `0 8px 32px #32203d26`.
- **Field focus:** `0 0 0 3px #eee8f7`; composed search fields use `0 0 0 3px #f0ebf7`.

**The Working Paper Rule.** Preserve flat panels and row rules for persistent operational content; reserve shadows for overlays and focus.

## Shapes

Controls use gently curved corners (8px). Navigation and compact images use 7px; status badges and storefront actions use 5px; panels use the shared 14px radius. Summary strips use 12px. Storefront product photos are nearly square with restrained 3px corners; the hero has 2px corners. Avatars and add controls are circular. Borders are normally 1px. Rounded containers clip their contents so table headers and imagery meet the outer silhouette cleanly.

## Components

### Buttons

Compact, clearly labeled actions pair text with Lucide icons. Primary, secondary and danger variants share 11px 17px padding, 8px corners, a 40px minimum height and an 8px internal gap. The small variant uses 7px 11px padding and a 32px minimum height. Secondary buttons use a white fill and fine border; hover changes both fill and border. Primary hover darkens violet. Disabled buttons use half opacity and a not-allowed cursor. The storefront hero action has a quieter 5px shape and its own fill.

Buttons and links receive a 3px violet focus-visible outline offset by 3px; the focus rule sets a 5px radius. Preserve this visible state when adding variants.

### Chips and Status

Operational status badges are compact (8px/550), capitalized, and include a 3px current-color dot. Background and foreground change together by status. Storefront category filters use bordered 5px tabs; selected tabs gain a pale lilac fill. Order filters use an underline and counts rather than filled pills.

### Cards / Containers

Panels use white fill, a fine ledger-line border, the shared panel radius and clipped overflow. Summary strips share dividers. The stock docket is a lilac exception surface with a 25px heading and 23px 23px 19px padding; its list stays anchored toward the bottom on desktop. Product tiles rely on photography and type instead of a raised card shell.

### Inputs / Fields

Fields have a white fill, 1px border, 8px corners, 10px 12px padding and 13px type. Focus shifts the border and adds the pale ring described above. Labels wrap their controls; hints appear beneath. Search fields form one bordered group with an icon, inner borderless input and a focus-within ring. Native required, length and input-type constraints complement inline errors; errors use alert semantics where present.

### Navigation

The staff index combines Lucide icons (19px; stroke width 1.6) and compact labels. Active links use a lilac chapter tab, heavier text and a slightly stronger icon stroke (2). Groups are introduced by uppercase, tracked 9px labels. The mobile menu toggles dialog semantics, an expanded state, scrim and body scroll lock; source code manages initial focus, Tab containment, Escape dismissal and focus restoration. Closed mobile navigation is hidden from visibility.

### Ruled Ledger

Tables collapse borders and align left by default. Header cells have a pale fill and a bottom rule, with 12px 19px padding; ordinary cells use 15px 19px padding and a softer bottom rule. Hover gives rows a near-white violet tint. Supporting identifiers sit below the main cell text. Actionable record names are real buttons; money stays aligned and unbroken.

### Drawers and Feedback

Drawers open from the right at 480px, or 650px for the wide variant, with a sticky ruled header and a 28px body inset. The shared drawer declares dialog semantics and implements focus containment, Escape dismissal, scroll lock and return focus. Toasts sit bottom-center, dismiss after five seconds, include a dismissal control, and use status or alert roles. Loading, empty and failure states include text and Lucide icons; failures expose a retry action.

### Photography and Motion

The storefront hero uses the local bright interior photograph, and catalogue tiles use product imagery with lazy loading. The shared image component falls back to a Package icon over the product color if an image fails. Product hover scales the image to 1.035 and reveals a circular arrow. UI movement remains short: button changes (180ms), sidebar (250ms), drawer entrance (280ms), toast (220ms), photo zoom (350ms). A reduced-motion media query reduces animation and transition durations and disables smooth scrolling.

## Do's and Don'ts

### Do:

- **Do** preserve white paper, fine horizontal rules and a restrained violet action hierarchy.
- **Do** use local Manrope and Lucide line icons consistently across staff and customer screens.
- **Do** keep product photos, status words and tabular currency readable in their existing roles.
- **Do** retain keyboard focus styles, input labels, skip links and the shared drawer behavior.
- **Do** follow the final contrast overrides when extending pale surfaces; verify new foreground/background pairs in the rendered interface.

### Don't:

- **Don't** add decorative shadows to every persistent panel.
- **Don't** replace labeled operational states with color alone.
- **Don't** treat the compact desktop type scale as proof of mobile legibility; inspect the rendered result at the relevant breakpoints.
- **Don't** claim visual approval or accessibility certification from this source-only extraction.
