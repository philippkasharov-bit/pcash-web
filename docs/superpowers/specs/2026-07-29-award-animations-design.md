# P.Cash Award-Level Animation & UI System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this spec task-by-task.

**Goal:** Transform P.Cash portfolio from a clean dark-theme site into an Awwwards/CSSDA-level interactive experience with editorial scroll animations, dynamic micro-interactions, and premium UI.

**Stack:** Vanilla HTML/CSS/JS + GSAP 3 (gsap.min.js + ScrollTrigger.min.js) + Lenis (already present). No build tools. CDN or vendored GSAP files.

**Atmosphere:** Mix of editorial (smooth, spacious, serif accents) + dynamic (magnetic, custom cursor, spring physics). Reference: Dennis Snellenberg, Locomotive, Cuberto.

**Constraints:**
- Do NOT change: logo, information/content text, color palette (CSS custom properties)
- All animations must respect `prefers-reduced-motion: reduce`
- Touch devices: disable cursor, magnetic; simplify scroll-driven effects
- Performance: 60fps target, `will-change` only on animating elements, remove after completion
- Cache bust: increment `?v=N` on style.css and script.js after changes

## Files

- `index.html` — structure changes (data attributes for scroll triggers, new containers)
- `style.css` — UI grid, glass cards, button styles, transitions, cursor styles
- `script.js` — GSAP setup, ScrollTrigger scenes, cursor logic, magnetic, interactions
- `gsap.min.js` — vendored GSAP core (~24KB gzipped)
- `ScrollTrigger.min.js` — vendored plugin (~12KB gzipped)

---

## 1. GSAP Foundation

Vendor `gsap.min.js` and `ScrollTrigger.min.js` into the site directory. Load before `script.js`. Register ScrollTrigger plugin. Integrate with existing Lenis smooth scroll via `ScrollTrigger.scrollerProxy()` or `lenis.on('scroll', ScrollTrigger.update)`.

Keep existing IntersectionObserver reveals as fallback for no-JS; GSAP takes over when loaded.

---

## 2. Custom Cursor

Two elements: `.cursor-dot` (8px solid circle) and `.cursor-follow` (40px ring, border only). Both `position: fixed`, `pointer-events: none`, `z-index: 9998`.

- Dot follows mouse position instantly (GSAP `quickTo` or direct set)
- Follower follows with spring lag (GSAP `quickTo`, duration 0.35, ease `power3`)
- On hover `a, button, .btn, .service-card`: follower scales to 2.5, mixes blend-mode `difference`
- On hover `.hero-photo, .post`: follower shows inner text "View" (injected span)
- Hidden on touch devices: `@media (hover: none) { .cursor-dot, .cursor-follow { display: none; } }`
- Hidden when mouse leaves viewport

---

## 3. Magnetic Buttons

All `.btn`, `.nav-cta`, `.main-nav a` elements. On mousemove within 60px radius:
- Element translates toward cursor (max 12px X, 8px Y)
- Spring return on mouseleave (GSAP `to`, ease `elastic.out(1, 0.3)`, duration 0.7)
- Disabled on touch devices

---

## 4. Scroll-Driven Animations (ScrollTrigger)

### 4a. Hero Parallax
- `.hero-copy`: translateY from 0 to -60px as hero scrolls out (scrub: true)
- `.hero-visual`: translateY from 0 to -30px (slower, depth)
- `.hero-canvas`: opacity fades from 0.7 to 0 over first 400px of scroll

### 4b. Services Horizontal Scroll
- `.services` container becomes horizontal scroll section
- Pin the services section; cards scroll horizontally as user scrolls vertically
- Total horizontal distance = (card count * card width + gaps)
- On mobile (<760px): disable pin, vertical stack as-is

### 4c. Process Steps Pin
- Section `#process` pins at top
- Steps reveal one at a time (opacity + translateX) as user scrolls through pinned section
- Progress indicator (line or dots) fills as steps reveal
- On mobile: disable pin, use existing timeline layout

### 4d. Guarantee Stacked Cards
- `.guar-card` elements use `position: sticky` with increasing `top` values
- Each card stacks on top of the previous as user scrolls
- Subtle scale decrease on stacked cards (0.98, 0.96, 0.94) for depth
- Shadow increases on top card

### 4e. Cases Scale Reveal
- Section `#cases` starts at `scale(0.9)` with `border-radius: 24px`
- Scales to 1 and border-radius to 0 as it enters viewport (scrub)

### 4f. Parallax Background Blobs
- Existing gradient blobs in `.section::before` get `data-speed` attributes
- Move at 0.3x scroll speed (slower than content) via ScrollTrigger

---

## 5. Section Transitions

### 5a. Clip-Path Morphs
Each section uses a unique entry clip-path animation (ScrollTrigger scrub):
- `#services`: circle expand from center — `clip-path: circle(0%) → circle(100%)`
- `#about`: diagonal wipe — `clip-path: polygon(0 0, 0 0, 0 100%, 0 100%) → polygon(0 0, 100% 0, 100% 100%, 0 100%)`
- `#cases`: scale reveal (see 4e)
- `#process`: vertical blinds — multiple `clip-path` strips that expand
- `#calc`: inset shrink — `clip-path: inset(20%) → inset(0%)`
- `#guarantees`: diamond — `clip-path: polygon(50% 0, 50% 0, 50% 100%, 50% 100%) → polygon(0 0, 100% 0, 100% 100%, 0 100%)`
- `#faq`: fade + translateY (simple, gives visual rest)
- `#reviews`: slide from right — `clip-path: inset(0 100% 0 0) → inset(0)`
- `#contact`: circle expand from bottom-right

### 5b. Color Bleed
Between adjacent sections, a 100px overlap zone where the background color of the next section fades in via a scrubbed opacity overlay. Implemented with `::before` pseudo-element on each section, opacity scrubbed from 0 to 1 over 100px scroll distance.

### 5c. Content Exit
When a section scrolls out of viewport (scrolling down), its content fades out + translateY(-30px). ScrollTrigger `onLeave` callback. Only on desktop.

### 5d. Stagger Cascade Entry
When section enters viewport, children animate in sequence:
1. Kicker: fadeIn + translateY(20px), 0.4s
2. H2: word-by-word reveal (existing, upgraded to GSAP timeline)
3. Section-sub: fadeIn, 0.3s delay
4. Cards/content: stagger 0.08s each, translateY(40px) + opacity

---

## 6. Kinetic Typography

### 6a. Hero H1 Character Reveal
Split h1 into individual characters (preserve `<em>` tag). Each character animates from `translateY(110%) rotateX(-80deg)` to `none` with 0.025s stagger. Total reveal ~0.8s. GSAP timeline, triggered after preloader exit.

### 6b. Number Scramble
`.count-up` elements: before counting, show random characters (0-9, special symbols) cycling rapidly for 0.4s, then resolve to target number. Combine with existing countUp logic.

### 6c. Price Scramble
Prices in calculator (от 10 000 ₽): on section enter, scramble digits briefly before settling.

---

## 7. Preloader & Page Reveal

### 7a. Enhanced Preloader Exit
Current: simple fade. New sequence:
1. Logo ring completes spin
2. Logo scales up 1.5x with opacity fade
3. `clip-path: circle()` expands from logo center position to reveal page
4. Total duration: 1.2s
5. After reveal: start hero timeline (character reveal, photo mask, etc.)

### 7b. Hero Photo Mask
When photo is added: enters via `clip-path: inset(100% 0 0 0) → inset(0)` (bottom to top wipe), 0.8s after preloader exit. Combined with subtle scale 1.05 → 1.

---

## 8. UI Grid System

### 8a. Baseline Grid
All spacing uses 8px increments. CSS custom properties:
```
--space-xs: 8px; --space-sm: 16px; --space-md: 24px;
--space-lg: 32px; --space-xl: 48px; --space-2xl: 64px;
--space-3xl: 96px; --space-4xl: 128px;
```

### 8b. Asymmetric Section Layouts
Sections alternate between layout patterns:
- **Full-width centered** (hero, contact): max-width 1080px, centered
- **60/40 split** (services cards): content left, visual right
- **40/60 split** (about): text left narrower, cards right wider
- **Bento grid** (about section): replace linear card stack with 2x2 bento grid where one cell spans 2 rows
- **Centered narrow** (FAQ, guarantees): max-width 800px, centered

### 8c. Container Width Variations
```
--container: 1080px;
--container-narrow: 800px;
--container-wide: 1200px;
```

---

## 9. Glass Cards & Frames

### 9a. Glass Morphism
`.service-card`, `.guar-card`, `.about-card`:
```
background: rgba(22, 23, 31, 0.6);
backdrop-filter: blur(20px) saturate(1.3);
border: 1px solid rgba(255,255,255,0.08);
```

### 9b. Animated Border Gradient
On hover, card border becomes animated gradient:
- Use `border-image` or `::before` with `conic-gradient` rotating via `@property --angle`
- Colors: violet → teal → go → violet (360deg loop)
- Animation: 3s linear infinite, only on hover (pause when not hovered)

### 9c. Card Spotlight
On mousemove over card: radial-gradient overlay follows cursor position inside card.
```
background-image: radial-gradient(circle at var(--mx) var(--my),
  rgba(255,255,255,0.06) 0%, transparent 50%);
```
`--mx` and `--my` updated via JS mousemove.

### 9d. Photo Frame
`.hero-photo-wrap`:
- Inner border: 1px solid rgba(255,255,255,0.12)
- Outer decorative frame: `::before` with dashed border, offset 8px, border-radius 28px
- On hover: outer frame rotates 3deg (GSAP spring)

---

## 10. Buttons

### 10a. Liquid Fill
`.btn-primary` hover: SVG wave path fills from bottom to top.
Implementation: `::before` pseudo with background gradient, `translateY(100%) → translateY(0)` with `border-radius: 0 0 50% 50%` on top edge that flattens during transition. Pure CSS approach:
```
.btn-primary::before {
  transform: translateY(101%);
  border-radius: 0 0 50% 50% / 0 0 40px 40px;
  transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), border-radius 0.45s;
}
.btn-primary:hover::before {
  transform: translateY(0);
  border-radius: 0;
}
```

### 10b. CTA Pulse
Primary CTA buttons: subtle scale pulse (1 → 1.03 → 1) every 5 seconds via CSS animation. Stops on hover.

### 10c. Ghost Button Arrow
`.btn-ghost`: on hover, arrow icon slides in from left (translateX) and text shifts right 8px.

### 10d. Shimmer Sweep
Existing `::after` shimmer improved: wider highlight band, slower sweep (1.2s), triggers every 4s via animation-delay loop.

---

## 11. Navigation

### 11a. Underline Draw
Nav links hover: `::after` pseudo-element, `scaleX(0) → scaleX(1)`, `transform-origin: center`. Width matches text width. Color: `var(--teal)`.

### 11b. Header Shrink
On scroll > 80px: header padding reduces 18px → 10px, backdrop-filter: blur(16px), background becomes semi-transparent. GSAP ScrollTrigger with scrub.

### 11c. Dropdown Clip
`.nav-drop` entry: `clip-path: inset(0 0 100% 0) → inset(0)`, 0.35s, ease `power2.out`.

### 11d. Mobile Menu Reveal
`.mobile-menu` items stagger in from right: translateX(30px) + opacity, 0.06s stagger per item.

---

## 12. Form Interactions

### 12a. Input Focus
Border draws in from center: `scaleX(0) → scaleX(1)` bottom border highlight. Label floats up with scale(0.85).

### 12b. Calculator Checkboxes
Custom SVG checkmark: path draws in via `stroke-dashoffset` animation, 0.3s.

### 12c. Submit Success
Form → success transition: form scales down (0.95) + fades, success div scales up from 0.9 with spring. Confetti-like particles optional.

---

## 13. Mobile Adaptations

- Custom cursor: hidden (`display: none` via `@media (hover: none)`)
- Magnetic buttons: disabled
- Horizontal scroll: vertical stack
- Pin sections: unpinned, normal flow
- Clip-path transitions: simplified to fade + translateY
- Stacked cards: normal flow
- Card spotlight: disabled (no hover)
- All spring physics: use CSS transitions instead
- Touch: tap feedback via `:active` scale(0.97)
- `prefers-reduced-motion: reduce`: all animations → instant, no transforms

---

## Implementation Priority

1. GSAP foundation + Lenis integration
2. Custom cursor + magnetic buttons (highest visual impact, quick)
3. Section clip-path transitions (defines the scroll experience)
4. Hero timeline (character reveal, photo mask, preloader upgrade)
5. Horizontal scroll services
6. Glass cards + border gradient + spotlight
7. Buttons (liquid fill, pulse, ghost arrow)
8. UI grid (spacing system, bento, asymmetric)
9. Process pin section
10. Guarantee stacked cards
11. Nav interactions (underline, shrink, dropdown)
12. Form interactions
13. Number scramble
14. Mobile polish + reduced-motion
