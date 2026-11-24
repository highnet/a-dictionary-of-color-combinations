---
name: A Dictionary of Color Combinations
description: Sanzo Wada's 348 combinations pulled as woodblock colour proofs on washi.
colors:
  washi: "oklch(0.945 0.0055 125)"
  washi-deep: "oklch(0.908 0.008 120)"
  sumi: "oklch(0.215 0.008 60)"
  sumi-soft: "oklch(0.43 0.012 65)"
  shu: "oklch(0.535 0.185 33)"
  cartouche-ink: "oklch(0.985 0.004 90)"
  ai: "oklch(0.255 0.055 258)"
  ai-soft: "oklch(0.82 0.03 250)"
  rule: "color-mix(in oklch, oklch(0.215 0.008 60) 22%, transparent)"
  input-line: "color-mix(in oklch, oklch(0.215 0.008 60) 45%, transparent)"
typography:
  display:
    fontFamily: "Shippori Mincho B1, Hiragino Mincho ProN, serif"
    fontSize: "clamp(2.5rem, 14cqi, 6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Shippori Mincho B1, Hiragino Mincho ProN, serif"
    fontSize: "clamp(2rem, 4.2vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.05
  headline-plate:
    fontFamily: "Shippori Mincho B1, Hiragino Mincho ProN, serif"
    fontSize: "clamp(1.8rem, 3.4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Shippori Mincho B1, Hiragino Mincho ProN, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: "Zen Kaku Gothic New, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Zen Kaku Gothic New, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Zen Kaku Gothic New, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  data:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  data-narrow:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
    fontVariation: "'wdth' 75"
  cartouche:
    fontFamily: "Shippori Mincho B1, serif"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.08em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(1rem, 3.2vw, 2.75rem)"
  section: "6rem"
  section-md: "8rem"
  topbar: "3.5rem"
  sidebar-open: "15.5rem"
  sidebar-rail: "4rem"
  shell-max: "92rem"
  target: "2.75rem"
  control: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.washi}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ai}"
    textColor: "{colors.washi}"
  button-action:
    textColor: "{colors.sumi}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  segmented-option:
    textColor: "{colors.sumi}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "40px"
  segmented-option-on:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.washi}"
  segmented-option-hover:
    backgroundColor: "{colors.washi-deep}"
  cartouche:
    backgroundColor: "{colors.shu}"
    textColor: "{colors.cartouche-ink}"
    typography: "{typography.cartouche}"
    rounded: "{rounded.none}"
    padding: "0.5em 0.3em 0.62em"
  label-slip:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.sumi}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  search-field:
    textColor: "{colors.sumi}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "10px 0"
  nav-rail-item:
    textColor: "{colors.sumi}"
    height: "44px"
    padding: "0 1.4rem"
  nav-rail-item-hover:
    backgroundColor: "{colors.washi-deep}"
  toast:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.washi}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
---

# Design System: A Dictionary of Color Combinations

## Overview

**Creative North Star: "The Proof Room"**

The archive is a printer's proof room. Every combination is pulled as a woodblock colour proof: flat, unmodulated blocks of exact colour, registered on kozo washi by kentō marks and numbered by a vermilion cartouche. The interface is the paper, the ink and the registration; the colours are the print. Type is sumi on washi, set in a Mincho for headings and a Gothic for everything else, with a mono for every value a designer will copy.

Density favours the working designer. The archive is a packed wall of plates; the plate count and the cartouche are the only ornament. Atmosphere comes from the ground (cool unbleached washi with a faint fibre), from night interludes in ai indigo and sumi, and from one bokashi grade where the hero print meets the paper. Nothing is rounded, nothing floats, nothing is glossy.

The voice is split in two. Headings and section intros are short, original aphorisms in the cadence of *The Art of War* ("Know the number of colours, and you know the shape of the battle."). Controls, values, labels and credits are plain and exact ("Copy CSS variables", "#D96629", "Combinations by Sanzo Wada (1883–1967)"). The swatch-card grid on a white SaaS page and the cream-serif editorial page are both refused.

**Key Characteristics:**
- Kozo washi ground with a faint fibre; sumi ink for type and key-lines.
- Colour fields are flat, full-strength and untextured; they own whole regions.
- Shu vermilion is reserved for the plate cartouche (plus the input caret and error line).
- Kentō marks (kagi corner, hikitsuke bar) register every printed field.
- Square everywhere: every radius token resolves to 0.
- State is shown by ink marks (bars, ticks, underlines, ink inversion), never by a hue.
- Aphoristic headings; plain, exact controls and values.

## Colors

A three-ink world (washi, sumi, shu) with indigo for the night prints; the only other colours on screen are Wada's own.

### Primary
- **Sumi Ink** (`sumi`): all type, key-lines, the primary button, the selected segment, code blocks, toasts and the footer ground. It is the system's working colour.
- **Shu Vermilion** (`shu`): the vertical plate cartouche. Also the text caret in inputs and the quick-find error message. Nowhere else.

### Secondary
- **Ai Indigo** (`ai`): the night interlude ground (the home "strongest orders" wall) and the hover fill of the primary button. **Ai Mist** (`ai-soft`) replaces sumi-soft as secondary text on that ground.

### Neutral
- **Kozo Washi** (`washi`): the page ground, always carrying the fibre texture. Deliberately grey-green, not cream. `themeColor` is `#eceee8`.
- **Deep Washi** (`washi-deep`): the second paper ground (colour index, method sections) and the hover fill for rail items and controls.
- **Faded Sumi** (`sumi-soft`): secondary text, captions, data ranges, inactive tabs.
- **Key-line** (`rule`): 22% sumi; every hairline, border and divider. On dark grounds it is redefined as 24% washi.
- **Input line** (`input-line`): 45% sumi, for field strokes.
- **Cartouche Paper** (`cartouche-ink`): the near-white numerals inside the cartouche.

### Named Rules
**The Texture Never Touches a Swatch Rule.** The fibre lives on grounds (`body`, `.ground-deep`) only. Every swatch, strip, plate and hero band is a flat fill of the exact HEX. A label slip laid on a swatch is plain washi, never fibre.

**The One Seal Rule.** Shu is the printer's seal. It marks the plate number; it never fills a button, a selection, a link or a heading.

**The Colours Are the Content Rule.** UI colour is limited to washi, sumi, ai and shu. Any other hue on screen is one of Wada's 159 colours, at full strength and labelled with name and value.

## Typography

**Display Font:** Shippori Mincho B1 (with Hiragino Mincho ProN, serif), weights 500/700/800
**Body Font:** Zen Kaku Gothic New (with system-ui, sans-serif), weights 400/500/700
**Label/Mono Font:** Martian Mono (variable width axis, with ui-monospace)

**Character:** A Japanese Mincho with brush-cut serifs carries the voice; a quiet Gothic carries the interface; a wide-axis mono carries every value, tabular and copy-exact.

### Hierarchy
- **Display** (800, `clamp(2.5rem, 14cqi, 6rem)` against its container, 0.98): the home title only.
- **Headline** (700, `clamp(2rem, 4.2vw, 3.6rem)`, 1.05): section aphorisms on home and landing pages. Plate-page sections use the smaller `headline-plate` step.
- **Title** (700, 1.5rem): chapter names, drawer nav (Mincho 1.875rem, regular), empty states.
- **Body** (400, 1rem / 1.625; lead 1.125rem): intros and author notes, max width about 28rem (`max-w-md`) to 42rem.
- **Label** (400, 0.875rem): field labels, controls, captions, footer credits, usually in Faded Sumi. Colour names in plate tiles run at 0.78rem.
- **Data** (Martian Mono, 0.75rem, tabular, -0.01em): HEX, RGB, CMYK, plate codes, ranges, counts. HEX is shown uppercase. The narrow cut (75% width, -0.02em, no wrap) fits HEX under a tile column.
- **Cartouche** (Mincho 700, vertical-rl, upright, -0.08em, line-height 1): plate numbers, sized per context (0.8rem in tiles, 1.125–1.25rem on the hero, 1.875–2.25rem on the plate page).

### Named Rules
**The Two Registers Rule.** Mincho speaks (titles, aphorisms, the search entry); Gothic operates (controls, labels, credits); Mono measures (every value). A value is never set in Mincho or Gothic.

**The Exact Value Rule.** Any colour value on screen is set in Data and is one action from the clipboard.

## Layout

An app frame: on desktop (≥1024px) a sticky sidebar (15.5rem open, 4rem rail; width eased over 0.35s) and a fluid content column; below that a 3.5rem sticky topbar with a full-width drawer. Content sits in a shell capped at 92rem with a fluid gutter of `clamp(1rem, 3.2vw, 2.75rem)`.

Pages are built on a 12-column grid. The home first viewport is 5/12 text (title, credit, search, "Open the archive") against 7/12 print; on mobile the print moves first at `min(38svh, 22rem)` and bleeds to the gutter edges. Sections are separated by full-width ground changes or a hairline, with vertical padding of 6rem (8rem from md). The archive is dense: compact walls run 3 to 10 columns (gap 1rem × 1.5rem), expanded walls 1 to 4 (gap 2rem × 3.5rem). Plate pages use an 11rem sticky section index beside the content.

Touch targets are at least 2.75rem (44px); dense toolbar controls are 2.5rem. Sticky toolbars sit on 95% washi with a 2px backdrop blur.

## Elevation & Depth

Flat. Depth comes from grounds (washi, deep washi, ai, sumi) and from kentō marks, not shadows. Hover lifts a printed field by a small translate (0.125–0.375rem), never by a shadow.

### Shadow Vocabulary
- **Slip lift** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.12)`): the label slip resting on a swatch.
- **Toast** (`box-shadow: 0 6px 24px -8px rgb(0 0 0 / 0.35)`): the sumi toast slip at the foot of the page.
- **Cartouche edge** (`box-shadow: inset 0 0 0 1px` 25% sumi): the cut edge of the seal.

### Named Rules
**The Paper Stack Rule.** Surfaces never float. A new layer is a new paper or a new ink ground, separated by a hairline.

## Shapes

Square throughout: every radius token is 0px, including the inherited shadcn scale. Fields are rectangles of 4:3 (expanded tile), 5:3 (compact tile) and 3:4 (proportion studies). Borders are 1px key-lines; the search field is a single 2px sumi underline. The one vertical form is the cartouche, set in `writing-mode: vertical-rl`. Kentō marks are open L-shapes and bars drawn in 1px currentColor at 50% opacity, outside the field.

## Components

### Plate Tile (signature)
One combination pulled as a proof. **Expanded:** a cartouche at left, a 4:3 field of flat colour blocks in book order with kentō marks, and beneath it a definition grid of colour name (0.78rem, truncated) over HEX (Data narrow, uppercase, Faded Sumi), indented to align with the field. **Compact:** a 5:3 field with marks and the plate code in Data below. Hover lifts the field (`-0.25rem` expanded, `-0.125rem` compact) over 500ms on the expo ease; the code darkens from Faded Sumi to Sumi. Focus ring sits 4px off. Tiles use `content-visibility: auto`.

### Cartouche (signature)
A vertical shu seal with upright Mincho numerals reading the three-digit plate code. Appears on plate tiles, on the hero (top right, linking to the current plate, lifts 0.125rem on hover) and as the plate-page title mark. It is the only use of shu fill.

### Kentō Marks (signature)
Registration marks for any printed field: a kagi corner (13×13px, right and bottom 1px edges, offset 8px out from the bottom-right) and a hikitsuke bar (22px, 1px, 10px in from the left, 8px below). currentColor at 50%, so they read on every ground. Applied to plate tiles, the hero print and the plate-page field.

### Label Slip
A washi slip laid on a full colour field (plate page): washi ground, 8px × 12px padding, colour name in Mincho 600 (1–1.125rem) over HEX in Data uppercase, with the slip-lift shadow. It labels the swatch without touching it with texture.

### Buttons
- **Shape:** square (0px).
- **Primary ("Open the archive"):** sumi fill, washi text, 48px tall, 24px side padding, trailing arrow. Hover shifts the fill to ai indigo and nudges the arrow 0.25rem right.
- **Action:** hairline box (1px currentColor at 30%), no fill, 44px tall, 16px padding, 0.875rem text with a 16px Lucide icon at stroke 1.6. Hover takes the border to full currentColor and adds a 4% ink wash. Used for every copy, download, save and compare action; it reads on any ground because it is drawn in currentColor.
- **Copy value:** the value itself in Data 0.8rem with a 14px copy icon at 40% that comes to full on hover/focus and turns to a check for 1.4s after copying; a toast confirms ("Copied #D96629 HEX").
- **Quiet link:** underlined at 35% currentColor, 1px, offset 0.22em; hover takes the underline to full. Arrow links ("All 348", "Colour search") are quiet links at 44px.

### Segmented Controls
A row of options inside a 1px key-line box, each 40px tall with 12px padding. The selected option inverts to sumi fill with washi text; others take deep washi on hover. Used for count, sort and density filters in the archive. Code-format tabs are a lighter variant: a 2px underline in currentColor marks the selected tab; others are Faded Sumi.

### Inputs / Fields
- **Quick find:** no box, a 2px sumi underline; entry in Mincho at 1.5rem (1.125rem medium size), placeholder at 62% currentColor, shu caret, a 48px arrow submit. Label above in Label/Faded Sumi; errors appear below in shu text, in words.
- **Archive search:** 1px sumi underline, leading search icon in Faded Sumi, 0.95rem Gothic, clear button.
- **Focus:** a 2px solid currentColor outline offset 3px, site-wide.

### Navigation
- **Sidebar rail:** logo mark and two-line Mincho title; Lucide icons at stroke 1.5 with Gothic labels, 44px rows. Hover fills deep washi. The active page is a 3px sumi bar at the left edge, inset 8px top and bottom. Below, a Chapters list with ranges in Data. Footer holds the saved count and "Fold the sidebar"; folded, labels fade out and only icons remain.
- **Drawer (mobile):** full-width sheet, Mincho 1.875rem entries on key-lines; the active entry carries a short sumi rule.
- **Section index:** sticky in-page index; the current section is a 1.5rem sumi tick, others a 0.5rem tick at 40%.

### Grounds
- **Washi** (default, fibre), **Deep Washi** (`.ground-deep`, fibre), **Ai** (`.ground-ai`, night interlude) and **Sumi** (`.ground-sumi`, footer). Dark grounds redefine key-line and secondary text so every component works unchanged on them.

### Toasts
Small sumi slips at bottom centre, 0.875rem washi text, 1.8s, square, with the toast shadow.

### Motion
One ease, `cubic-bezier(0.16, 1, 0.3, 1)` (expo out): 500ms for field lifts and strip shifts, 300ms for index swatches and section ticks, 350ms for the sidebar width, 200ms for underline and label fades. The hero bokashi crossfades its colour over 1600ms and prints fade in over 700ms. Smooth scroll and every animation are removed under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** keep every swatch a flat fill of its exact HEX, labelled with its name and value (Data, uppercase).
- **Do** register printed fields with kentō marks and number plates with the shu cartouche.
- **Do** mark state with ink: a 3px sumi bar, a sumi tick, a 2px underline, or a sumi inversion.
- **Do** use the fibre ground on washi and deep washi only; change ground (ai, sumi, deep washi) to separate major sections.
- **Do** write headings as short aphorisms in the cadence of *The Art of War*, and controls, values and credits plainly.
- **Do** keep every radius at 0px and every key-line at 1px `rule`.
- **Do** give every interactive target at least 44px (40px in dense toolbars).

### Don't:
- **Don't** lay texture, gradients, overlays or tints on a swatch.
- **Don't** use shu for anything but the cartouche, the caret and error text; never as a button, selection or link colour.
- **Don't** signal state, selection or meaning by hue alone.
- **Don't** introduce cream grounds, rounded cards or floating shadowed panels.
- **Don't** set colour values in Mincho or Gothic; values are Martian Mono.
- **Don't** reproduce book scans, layouts or editorial text; render everything from data.
