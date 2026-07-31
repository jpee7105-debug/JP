# DESIGN SYSTEM V2 PLAN

> **Standard:** The visual language of `/workspace-v2` is the reference point for the entire Rabbit Hole application. Every surface should feel like it belongs to a single premium, connected-knowledge and intelligence platform — not a generic SaaS dashboard and not a conspiracy-board cliché.

---

## Diagnostic: The Split-Personality Problem

The codebase currently runs two incompatible design systems in parallel.

**System A — Workspace V2 (inline CSS + the `C` object)**
Pure inline CSS driven by a single design-token object (`C` in `workspace.types.ts`). Deep `#08080D` background, layered dark surfaces, `#6C63FF` purple accent, three explicit font families (`Space Grotesk`, `Inter`, `JetBrains Mono`), and precise per-kind semantic colour palettes for node types.

**System B — The rest of the app (Tailwind + HSL CSS variables)**
`index.css` defines `:root` in **light mode** (white background, red primary at `0 72% 30%`, green accent at `142 71% 45%`). Pages use Tailwind utility classes (`text-primary`, `bg-white/5`, `text-green-400`) that resolve to these HSL tokens. Dark styling is patchy — some pages add `bg-black` or `bg-zinc-900` inline, some rely on a `.dark` class that is never consistently toggled.

**Result:** every public page and admin page is technically dark but uses different shades of dark, different accent colours (red, green, purple), and different typography scales. The workspace feels like a different product.

---

## 1. Global Colour Tokens

### Source of truth: extract from `workspace.types.ts → C`

| Token name | Value | Role |
|---|---|---|
| `--color-bg` | `#08080D` | Deepest background (full-bleed canvas) |
| `--color-surface` | `#0F0F18` | Primary surface (cards, panels, nav) |
| `--color-surface-el` | `#13131F` | Elevated surface (dropdowns, tooltips, controls) |
| `--color-border` | `rgba(255,255,255,0.06)` | Default subtle border |
| `--color-border-hi` | `rgba(255,255,255,0.14)` | Hover/active border |
| `--color-accent` | `#6C63FF` | Primary action, selection, focus |
| `--color-accent-dim` | `rgba(108,99,255,0.18)` | Accent fill (active nav, highlighted chips) |
| `--color-text` | `#DDDDF0` | Primary readable text |
| `--color-text-dim` | `#6B6B8A` | Secondary / metadata text |
| `--color-text-muted` | `#3E3E58` | Tertiary / decorative text, placeholders |

### Semantic status colours (replace hardcoded Tailwind colour names)

| Token | Value | Replaces |
|---|---|---|
| `--color-status-verified` | `#4FC87A` | `text-green-400`, `text-green-500` |
| `--color-status-disputed` | `#E8923A` | `text-yellow-500`, `text-orange-400` |
| `--color-status-speculative` | `#9B6EFF` | `text-purple-400` |
| `--color-status-active` | `#5BA3E8` | `text-primary` (currently red) |
| `--color-status-danger` | `#E85A5A` | `text-red-500`, `text-destructive` |
| `--color-status-live` | `#E85A5A` | Live broadcast indicator |

### Node-type semantic palettes (eight kinds)

Each palette is `[bg, border, accent]`. These exist in `C` today; they must move to CSS custom properties so graph components and any future card or badge rendering share the same values without importing TypeScript.

```css
--node-person:        #0D1F35 / #1E4D7A / #5BA3E8;
--node-event:         #0D1F14 / #1E5C2E / #4FC87A;
--node-claim:         #1A0D30 / #4A1E7A / #9B6EFF;
--node-evidence:      #251500 / #6B3C00 / #E8923A;
--node-org:           #200D0D / #5C1A1A / #E85A5A;
--node-investigation: #120820 / #3A1060 / #C060FF;
--node-section:       #081A20 / #104A58 / #30C0D8;
--node-source:        #1A1500 / #4A3A00 / #D0A020;
```

### What to change in `index.css`

The current `:root` block must be replaced with the V2 dark-mode tokens. The HSL red primary (`0 72% 30%`) and green accent (`142 71% 45%`) are inconsistent with the workspace. Once removed, `text-primary` will resolve to the V2 accent colour and every Tailwind utility will work with the new palette.

---

## 2. Background and Surface Hierarchy

Three layers — never collapse them, never jump more than one step at a time.

| Layer | Token | Usage |
|---|---|---|
| Canvas | `--color-bg` (`#08080D`) | Full-screen backgrounds, page root |
| Surface | `--color-surface` (`#0F0F18`) | Cards, nav bar, sidebars, modals, panels |
| Elevated | `--color-surface-el` (`#13131F`) | Dropdowns, tooltips, active control fills, focused inputs |

**Current problem:** pages use `bg-black`, `bg-zinc-900`, `bg-neutral-900`, `bg-gray-900`, `bg-[#0d0d0d]`, and `bg-white/5` for what should all resolve to one of these three tokens. The Connections graph and IntelMap use additional custom backgrounds that need auditing separately.

---

## 3. Typography Hierarchy

The three font families are already declared in `index.css` as `--font-sans`, `--font-display`, `--font-mono`. The workspace uses them; the rest of the app does not consistently apply them.

### Scale

| Level | Font | Size | Weight | Usage |
|---|---|---|---|---|
| Display | Space Grotesk | 24–32px | 700 | Page titles, hero headings |
| Title | Space Grotesk | 15–18px | 600 | Card titles, section headings, panel headers |
| Label | Space Grotesk | 12–13px | 500–600 | Nav items, breadcrumbs, chip labels |
| Body | Inter | 12–14px | 400 | Descriptions, paragraphs, list content |
| Meta | Inter | 11px | 400 | Timestamps, attribution, sub-labels |
| Mono-label | JetBrains Mono | 9–10px | 400 | ALL CAPS badges, status chips, confidence values, data IDs |
| Mono-data | JetBrains Mono | 11–12px | 400 | Dates, counts, coordinates, inline data values |

### Text colour mapping

| Tailwind class → | CSS token |
|---|---|
| `text-foreground` | `--color-text` |
| `text-muted-foreground` | `--color-text-dim` |
| placeholders, tertiary labels | `--color-text-muted` |

**Eliminate:** `text-white`, `text-white/70`, `text-white/50`, `text-gray-*` used as body text. Replace with the three text tokens above.

---

## 4. Spacing System

The workspace uses an implicit 4px base grid. Formalise it.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Inline icon gaps, tiny insets |
| `--space-2` | 8px | Compact padding, badge insets |
| `--space-3` | 12px | Default control padding |
| `--space-4` | 16px | Section padding, card insets |
| `--space-5` | 20px | Medium section gaps |
| `--space-6` | 24px | Large panel padding |
| `--space-8` | 32px | Page-level section separation |
| `--space-10` | 40px | Hero blocks |
| `--space-12` | 48px | Full section padding |

`index.css` already defines `--token-spacing-xs` through `--token-spacing-xl` but they are not referenced in application code. These should be renamed to match the 4px grid above and wired into Tailwind via `@theme`.

---

## 5. Borders, Radii, Shadows, and Glass Effects

### Borders

| Token | Value | Usage |
|---|---|---|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Default card/panel borders |
| `--border-hi` | `rgba(255,255,255,0.14)` | Hover state, active, focused |
| `--border-accent` | `rgba(108,99,255,0.44)` | Selected node, focused input ring |

### Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 2px | Progress bars, thin rule caps |
| `--radius-sm` | 4px | Chips, badges, small buttons, timeline dots |
| `--radius-md` | 5px | Inputs, cards, tooltips |
| `--radius-lg` | 6px | Graph nodes, primary cards |
| `--radius-xl` | 8px | Modals, large panels, search overlay |
| `--radius-full` | 50% | Avatars, dot indicators |

### Shadows

| Token | CSS | Usage |
|---|---|---|
| `--shadow-sm` | `0 2px 6px rgba(0,0,0,0.5)` | Default node/card lift |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.6)` | Active node/hover card |
| `--shadow-glow` | `0 0 18px {accent}33` | Selected node, active input |
| `--shadow-overlay` | `0 8px 32px rgba(0,0,0,0.6)` | Modals, dropdowns, search |

### Glass effects

Used in the workspace canvas tooltip bar and search overlay. Do not overuse. Only apply where content floats over the graph canvas or a full-bleed image.

```css
background: rgba(15,15,24,0.85);
backdrop-filter: blur(12px);
border: 1px solid var(--border-subtle);
```

---

## 6. Buttons and Interaction States

### Button variants

| Variant | Background | Border | Text | Usage |
|---|---|---|---|---|
| Primary | `--color-accent` | none | white | Primary CTAs (Publish, Submit, Confirm) |
| Secondary | `rgba(255,255,255,0.04)` | `--border-subtle` | `--color-text` | Secondary actions (Edit, Cancel, Close) |
| Ghost | transparent | transparent | `--color-text-dim` | Icon buttons, nav items, sidebar toggles |
| Danger | `rgba(232,90,90,0.12)` | `rgba(232,90,90,0.3)` | `#E85A5A` | Delete, remove, destructive |
| Accent-dim | `--color-accent-dim` | `rgba(108,99,255,0.44)` | `--color-accent` | Active nav item, selected view button |

### Interaction states

- **Default:** base styles
- **Hover:** border brightens to `--border-hi`; background nudges `+0.02` opacity; `transition: background 0.15s, border-color 0.15s`
- **Active / selected:** `--color-accent-dim` fill; `--color-accent` left-border 2px; text goes to `--color-accent`
- **Disabled:** opacity 0.4; cursor not-allowed; no hover effect
- **Focus-visible:** `box-shadow: 0 0 0 2px var(--color-accent)44`

---

## 7. Cards, Panels, Forms, Tables, and Modals

### Card

```
background: var(--color-surface)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-lg)
padding: var(--space-4)
```

On hover (interactive cards): border brightens to `--border-hi`, `transition: border-color 0.15s`.

**Current problem:** most pages construct cards inline with `bg-white/5 border border-white/10 rounded`. This pattern repeats identically across Home, Discover, Search, Live, Library, Account, and all Admin pages. It must become a shared `<Card>` component.

### Panel (detail / right-side)

Same as card but with a left border instead of full border:

```
border-left: 1px solid var(--border-subtle)
background: var(--color-surface)
```

### Form inputs

```
background: rgba(255,255,255,0.03)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-md)
color: var(--color-text)
font-family: var(--font-sans)
font-size: 12px
padding: 5px 10px
```

On focus: border → `--border-accent`; `outline: none`; `box-shadow: var(--shadow-glow)`.

Placeholder: `color: var(--color-text-muted)`.

**Current problem:** inputs across the app use varying Tailwind classes (`bg-black`, `bg-zinc-800`, `bg-background`, `placeholder-white/30`) with no consistent focus state. Admin forms are especially inconsistent.

### Tables

Rows alternate very subtly (`background: rgba(255,255,255,0.01)` on odd rows). Header cells use `--font-mono` 10px ALL CAPS with `--color-text-muted`. No outer box-shadow. Horizontal rules use `--border-subtle`.

### Modals / overlays

```
background: var(--color-surface-el)
border: 1px solid var(--border-hi)
border-radius: var(--radius-xl)
box-shadow: var(--shadow-overlay)
```

Scrim: `rgba(8,8,13,0.75)`.

---

## 8. Navigation and Application Shells

### Navbar (current state: dated)

The existing `Navbar.tsx` uses Tailwind classes against the current HSL token set (red primary, green accent). It is functionally correct but uses `bg-background` which resolves to white in the current `:root`, `text-primary` which resolves to red, and has a generic SaaS structure. It needs to be restyled — not restructured — to match the workspace header's visual language: `--color-surface` background, `--border-subtle` bottom border, Space Grotesk logo treatment, `--color-accent` active states, monospace metadata.

### Application shell layers

| Shell | Used by | Key constraints |
|---|---|---|
| Full-screen (no nav) | `/workspace-v2`, `/workspace-v2/:slug` | `width: 100vw; height: 100vh; overflow: hidden` — preserved as-is |
| Page shell (with Navbar) | All public pages | Navbar + scrollable content, `min-h-screen`, `background: var(--color-bg)` |
| Admin shell | All `/admin/*` | `AdminLayout` sidebar + content area, both in `--color-surface` |

**Admin sidebar (`AdminLayout.tsx`):** currently a functional dark sidebar but uses hardcoded colours and generic icon treatment. It should adopt the workspace sidebar's approach: 44px collapsed / 220px expanded, `--border-subtle` right border, mono-label nav items, accent left-border for active state.

---

## 9. Loading, Empty, Error, and Skeleton States

### Loading skeletons

Consistent shimmer: `background: rgba(255,255,255,0.04)` base, animated shimmer overlay from left to right over 1.4s (matches the workspace loading animation). Border-radius matches the content it replaces.

**Current problem:** skeletons are rendered with `animate-pulse bg-white/5` (Tailwind) on some pages and bespoke inline styles on others. The workspace uses a CSS keyframe animation. A single `<Skeleton>` component with size props eliminates this.

### Empty states

Three elements: a muted icon (16–20px, `--color-text-muted`), a one-line message (`--color-text-dim`, 12px, Inter), and an optional CTA. Vertically centred in their container. Never show raw "No results" text without context.

### Error states

Same structure as empty states but with `--color-status-danger` accent on the icon. Include what went wrong (concise) and a recovery action where possible. Never expose API error strings to users.

### Inline empty filter state

When a sidebar category filter is active but no nodes of that type exist, display the kind's own icon + "No {kind} nodes in this investigation" message — the same overlay pattern already in `WorkspaceLayout.tsx`. This pattern should be extracted as a reusable `<FilterEmptyState>` component.

---

## 10. Animation and Transition Standards

| Purpose | Duration | Easing |
|---|---|---|
| Micro-interactions (hover, border) | 150ms | `ease` |
| State changes (button active, tab switch) | 180–220ms | `ease` |
| Panel open/close, sidebar collapse | 220ms | `ease` |
| Confidence bar fill, progress | 400ms | `ease` |
| Focus transitions (pan to node) | 600ms | `ease-in-out` (ReactFlow) |
| Loading shimmer | 1400ms | `ease-in-out`, infinite |

**Rules:**
- No `transition: all` (too broad; use specific properties)
- No `transform` animations that fight layout (prefer `opacity` + `transform: scale/translate`)
- `prefers-reduced-motion`: wrap all non-essential animations in a media query that disables them
- ReactFlow pan/zoom uses its own animation system; do not override it

---

## 11. Graph and Data-Visualisation Styling

The workspace graph is the premium differentiator. Its visual conventions should apply to any future chart or network rendering across the product.

### Graph canvas
- Background: `--color-bg`
- Grid dots: `--color-text-muted` at 35% opacity, 28px gap, 0.5px dot size
- Default edge: `rgba(255,255,255,0.08)` / 1px stroke
- Active edge: `--color-accent` / 2px stroke / `animated: true`
- Faded node/edge: `opacity: 0.12`

### MiniMap
- Background: `--color-surface`
- Border: `--border-subtle`
- Mask: `rgba(8,8,13,0.75)`
- Node colours: node-type border colour (middle of palette triplet)

### Confidence bars
- Track: `rgba(255,255,255,0.06)` / 3px height
- Fill: `#4FC87A` ≥80%, `#E8923A` 60–79%, `#E85A5A` <60%
- Transition: `width 0.4s ease`

### The Connections page (`IntelMap.tsx`)
Existing Leaflet/CartoDB map. The CSP already whitelists CartoDB tile sources. Tile layer should be the dark CartoDB Voyager Dark Matter variant. Relationship overlays should use the node-kind semantic palette.

---

## 12. Responsive and Mobile Rules

The workspace is explicitly a desktop-first experience and must remain full-screen on all viewports. The public site must degrade gracefully.

| Breakpoint | Behaviour |
|---|---|
| ≥ 1280px (desktop) | Full layouts, graph canvas, sidebars |
| 768–1279px (tablet) | Sidebar collapses by default; cards stack to 2 columns |
| < 768px (mobile) | Single column; Navbar hamburger menu; workspace redirects to full-page read view |

**Current problem:** most pages use arbitrary Tailwind breakpoints (`sm:`, `md:`, `lg:`) without a consistent column system. Home uses a 3-column grid that breaks at non-standard widths. Admin pages are not mobile-friendly but do not need to be (admin is desktop-only by policy).

---

## 13. Accessibility Requirements

- **Colour contrast:** all text on surface backgrounds must meet WCAG AA (4.5:1 body, 3:1 large text). `--color-text-dim` (`#6B6B8A`) on `--color-surface` (`#0F0F18`) is borderline — it must be validated and bumped if needed.
- **Focus rings:** all interactive elements must have a visible focus ring. The design uses `box-shadow: 0 0 0 2px rgba(108,99,255,0.44)`. Never use `outline: none` without a replacement.
- **Keyboard navigation:** graph canvas supports ReactFlow's built-in keyboard controls. Sidebar navigation must be keyboard-traversable (`Tab`, `Enter`).
- **Screen readers:** `aria-label` on all icon-only buttons. Graph nodes need `role="button"` and descriptive `aria-label`. Empty/error states should use `role="status"`.
- **Reduced motion:** wrap all CSS keyframe animations in `@media (prefers-reduced-motion: no-preference)`.

---

## Hardcoded Values That Must Move

The following patterns appear repeatedly across the codebase and block a consistent system:

| Pattern | Found in | Replace with |
|---|---|---|
| `bg-white/5`, `bg-white/4`, `bg-white/3` | Home, Live, Library, Admin, Account | `var(--color-surface)` or `var(--color-surface-el)` |
| `border-white/10`, `border-white/8` | Nearly every page | `1px solid var(--border-subtle)` |
| `text-green-400`, `text-green-500` | Home, RabbitHole, Live | `var(--color-status-verified)` |
| `text-yellow-400`, `text-yellow-500` | Home, RabbitHole, Live | `var(--color-status-disputed)` |
| `text-primary` (resolves to red) | Navbar, RabbitHole, Admin | After token update → resolves to `--color-accent` |
| `linear-gradient(135deg, #161a1e 0%, #111418 50%, #161a1e 100%)` | Replay.tsx (×2) | `var(--color-surface)` |
| `bg-black` | Watch.tsx | `var(--color-bg)` |
| `50vh` hero height | Live.tsx | CSS custom property `--hero-height: clamp(320px, 50vh, 600px)` |
| `font-mono` class | All admin pages, badges | `font-family: var(--font-mono)` |
| `text-xs font-mono` (badge label) | RabbitHole, Admin | `<MonoBadge>` shared component |

---

## Shared Components to Extract

These components do not exist yet but are assembled identically in multiple files:

| Component | Currently duplicated in |
|---|---|
| `<Card>` | Home, Discover, Search, Live, Library, Account, all Admin pages |
| `<MonoBadge variant="verified|disputed|active|live">` | Home, RabbitHole, Live, Watch, Admin |
| `<ConfidenceBar value={0–100}>` | WorkspaceDetailsPanel (exists), RabbitHole (reimplemented inline) |
| `<Skeleton width height>` | Home, Discover, Live, Library |
| `<EmptyState icon message cta?>` | Multiple pages |
| `<FilterEmptyState kind>` | WorkspaceLayout (exists inline) |
| `<StatusDot status>` | Live, Watch, AdminLive |
| `<SectionHeader label count?>` | AdminLayout, RabbitHole, DepthReader |
| `<PremiumGate>` | Watch, Replay (duplicate premium walls) |

---

## Migration Order

### Phase A — Shared design foundation *(prerequisite for all other phases)*

**Goal:** replace `index.css` tokens, extract shared components, wire Tailwind to V2 palette.

Steps:
1. Replace `:root` HSL block in `index.css` with V2 CSS custom properties
2. Update `@theme` Tailwind mappings so `bg-background`, `text-foreground`, `text-primary`, `text-accent` all resolve to V2 tokens
3. Create `client/src/design-system/tokens.css` — canonical export of all `--color-*`, `--border-*`, `--radius-*`, `--space-*`, `--shadow-*` tokens
4. Create `client/src/design-system/components/` — Card, MonoBadge, ConfidenceBar, Skeleton, EmptyState, StatusDot

**Risk:** Low-medium. Token changes affect every page simultaneously. Must verify after each token change that no page turns white or loses contrast.

---

### Phase B — Navbar and application shells

| What works | What's outdated | V2 components | Layout | Regression risk |
|---|---|---|---|---|
| Correct links, auth-aware, responsive | Red `text-primary`, `bg-background` resolves to white, generic font treatment | Workspace header visual language, MonoBadge for status | Stays the same (sticky top bar) | Medium — Navbar is global; any change affects every public page |

Steps: restyle Navbar.tsx, restyle AdminLayout.tsx sidebar, verify workspace bypass still works.

---

### Phase C — Homepage, Discover, and Search

**Homepage (`Home.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Hero image, category filtering, investigation cards, live pulse | `bg-white/5` cards, red status colours, `text-green-400`/`text-yellow-400` badges, arbitrary grid breakpoints | Card, MonoBadge | Hero stays; 3-col grid tightened to consistent breakpoints | Low — display only |

**Discover (`Discover.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Category grid, hole cards, filtering | Same card/badge issues as Home | Card, MonoBadge | Stays | Low |

**Search (`Search.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Live search, result highlighting | Raw input styling, card inconsistency | Card, input token | Stays | Low |

---

### Phase D — Investigation page and Depth Reader

**RabbitHole (`RabbitHole.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Tabbed depth node browser, claims, sources, inline RichText | Duplicates ConfidenceBar inline, bespoke status badges, `text-green-500`/`text-yellow-500`/`text-orange-500` hardcoded, `sourceTypeColor` function | ConfidenceBar, MonoBadge, Card | Stays — tab layout is intentional | Medium — complex page with many data states |

**DepthReader (`DepthReader.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Full-width reading mode | Likely uses light-mode prose typography | Section header, body type tokens | Stays | Low-medium — typography-heavy |

---

### Phase E — Connections, Timeline, People, and Library

**Connections (`Connections.tsx` + `IntelMap.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Leaflet map, relationship overlay, person cards | Map tile style may not match V2 dark palette; card/badge inconsistency | Card, MonoBadge, node-kind palette on overlays | Stays | Medium — IntelMap is a complex custom component; CSP covers tile sources |

**Timeline (`Timeline.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Chronological event list, geo tagging | Card/badge inconsistency; map integration | Card, MonoBadge, ConfidenceBar | Stays | Low |

**People / PersonDetail (`PersonDetail.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Bio, relationship graph, avatar | Raw card styling, no semantic node-kind colour for person | Card, node-kind person palette | Stays | Low |

**Library (`Library.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Browse, search, stacked work cards | Visually sparse, narrower max-width than other pages, raw card markup | Card, Skeleton | Stays | Low |

---

### Phase F — Login, Signup, Account, Guide, and Pricing

**Login / Signup**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Form validation, redirect | Light-mode form appearance; input borders inconsistent | Input tokens, Card | Centred single-card layout stays | Low — isolated pages |

**Account (`Account.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Profile card, stats, logout | `calc(100vh-3.5rem)` coupling, raw card/button system, plan map hardcoded | Card, MonoBadge | Stays | Low |

**Guide + Pricing**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Content structure | Generic SaaS appearance; pricing cards likely use Bootstrap-style column layout | Card, MonoBadge | May need section layout review | Low |

---

### Phase G — Admin CMS

**Admin (`Admin.tsx`) — Dashboard**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Stats, recent activity, investigation list | Dated terminal aesthetic, inconsistent table/card treatment | Card, SectionHeader, Skeleton | Stays | Low-medium |

**AdminTimeline (`AdminTimeline.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Timeline CRUD | Raw table; null/undefined TS quirks already fixed | Card, table tokens | Stays | Low |

**AdminPeople (`AdminPeople.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| People list and editor | Raw card and input system | Card, input tokens | Stays | Low |

**AdminInvestigationEditor (`AdminInvestigationEditor.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Multi-section investigation editor, depth node editor, claims/sources CRUD | Extremely bespoke, extremely dense, duplicated controls, 10px typography that strains readability | Card, input tokens, SectionHeader, ConfidenceBar | Structural review needed — most complex admin page | High — central to content creation; many data flows |

**AdminLive (`AdminLive.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Stream lifecycle, chat moderation | Raw inputs, datetime quirks, inconsistent status badge colours | Card, MonoBadge, StatusDot, input tokens | Stays | Medium |

---

### Phase H — Live, Watch, Replay, and lower-priority pages

**Live (`Live.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Hero, featured card, broadcaster section, replay grid | `text-red-600`/`text-yellow-600` status hardcoded, 50vh hero, card markup duplicated | Card, StatusDot, MonoBadge, hero token | Stays | Low-medium |

**Watch (`Watch.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Player layout, chat | `white/30` opacity colours, hardcoded 70% split, PremiumGate inline | Card, PremiumGate, StatusDot | Stays | Medium — iframe/chat interaction |

**Replay (`Replay.tsx`)**
| What works | What's outdated | V2 components | Layout | Risk |
|---|---|---|---|---|
| Player, premium wall | Duplicate `linear-gradient(135deg, #161a1e…)`, duplicate PremiumGate | Card, PremiumGate | Stays | Low |

**Channel, QA, Guide** — Low complexity, low traffic pages. Restyle last.

---

## Implementation Constraints (reminder)

- Do not modify application code until Phase A is approved and tested
- Do not change the backend, database, or API contracts
- Do not remove existing features during restyling
- Do not redesign all pages in a single implementation task — follow the phase order
- Preserve the full-screen workspace experience (`/workspace-v2`, `/workspace-v2/:slug`) exactly as it is
- Avoid generic SaaS dashboard styling (no Bootstrap-style hero gradients, no blue primary buttons)
- Avoid conspiracy-board clichés (no red string, no cork-board texture, no newsprint)
- The entire product must feel like one premium connected-knowledge and intelligence platform
