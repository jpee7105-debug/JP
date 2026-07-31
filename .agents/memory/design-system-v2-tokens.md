---
name: Design system V2 token migration
description: V2 color palette applied across all pages; rules for status/stance colors going forward
---

## Status: Phases A–F complete

### V2 hex palette for status/stance (use these, never Tailwind semantic colors)
- Verified / Supported: `#4FC87A` (green)
- Unsolved / Disputed: `#E8923A` (amber)
- Speculative: `#9B6EFF` (purple)
- Active / Person: `#5BA3E8` (blue)
- Danger / Error: `#E85A5A` (red)
- Accent (investigation diamond, current-person highlight): `#6C63FF`
- Accent dim fill: `rgba(108,99,255,0.2)`

### Pattern for badge classes
`text-[#4FC87A] bg-[#4FC87A]/10 border border-[#4FC87A]/25`

### Phase summary
- **A**: `index.css` `:root` replaced with V2 dark HSL + `--v2-*` vars; shared components created in `client/src/components/`
- **B**: Navbar active → `text-primary bg-primary/10`; AdminLayout `bg-[#111418]` → `bg-card` (6 locations)
- **C**: Home, Discover, Search — `statusColor()`/`stanceStyle()` rewritten to V2 hex
- **D**: RabbitHole — `statusBadge()`/`stanceColor()`/`sourceTypeColor()` rewritten; canvas bg `#08080D`, center fill `rgba(108,99,255,0.2)`. DepthReader — all `text-green-500`/progress bar/finish button updated
- **E**: PersonDetail FamilyNode — `hsl(0 72% 30%)` → `#6C63FF`, `#3b82f6` → `#5BA3E8`, `#161a1e` → `#0F0F18`. Connections — `labelColor()`, PersonNode borders/glow, CaseNode fill, edge label bg updated
- **F**: Guide claim stance badges updated. Timeline/Library/Login/Signup/Pricing were already clean with V2 tokens

**Why:** Tailwind `green-400`/`yellow-400`/`orange-500` are visually inconsistent with the V2 dark theme and create color drift. V2 uses a fixed palette with purple as primary accent, not red.

**How to apply:** Any new status badge, stance label, or source type chip must use the V2 hex values above, not Tailwind semantic color classes.
