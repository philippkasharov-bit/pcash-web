# Liquid Background + 3D Cards + Bright Typography — Design Spec

## Goal

Transform P.Cash portfolio from flat dark sections into a living, depth-rich experience: WebGL liquid gradient mesh background that shifts mood per section, 3D-elevated cards with bright borders, gradient+glow headings, glass lens in hero, and clear visual separators between sections.

## Reference

Veronica PW portfolio (video Recording 2026-07-30): liquid gradient mesh background, glass lens element, scroll-driven color mood transitions between sections.

## Architecture

Single-page vanilla HTML/CSS/JS site. All new code lives inside `initAwardAnimations()` IIFE in script.js. WebGL canvas renders behind all content via `position: fixed; z-index: -1`. ScrollTrigger drives per-section color mood interpolation. No external dependencies beyond already-vendored GSAP 3.12.5 + ScrollTrigger + Lenis.

## Tech Stack

- Raw WebGL (no Three.js) — fragment shader with simplex noise
- GSAP 3.12.5 + ScrollTrigger (already vendored)
- CSS `backdrop-filter`, `background-clip: text`, `text-shadow`, multi-layer `box-shadow`

## Global Constraints

- DO NOT change: logo SVG, text content (data-ru/data-en values), CSS color custom property names
- All animation code inside `initAwardAnimations()` IIFE
- Guard with `reducedMotion` and `isTouch` checks
- Mobile: WebGL at 0.5x resolution, no mouse tracking
- `prefers-reduced-motion`: static CSS gradient fallback, no WebGL
- Cache-bust: bump `?v=` on style.css and script.js in index.html
- Existing animations (cursor, magnetic, parallax, clip-path, stagger, horizontal scroll, etc.) must continue working

---

## Feature 1: WebGL Gradient Mesh Background

### What

A fullscreen `<canvas>` element behind all content renders a GLSL fragment shader that produces soft, animated gradient blobs using 3D simplex noise. The background slowly morphs on its own and gently responds to cursor position.

### Implementation

- `<canvas id="liquid-bg">` inserted as first child of `<body>`, before cursor elements
- CSS: `position: fixed; inset: 0; z-index: -1; pointer-events: none`
- Vertex shader: fullscreen quad (2 triangles)
- Fragment shader uniforms:
  - `u_time` (float) — animation clock
  - `u_resolution` (vec2) — canvas size
  - `u_mouse` (vec2) — normalized cursor position (lerped)
  - `u_color1..u_color4` (vec3) — current section's color palette, interpolated
- Simplex 3D noise function inlined in shader (~40 lines)
- 3-4 noise layers at different scales/speeds for depth
- Colors: 4 vec3 uniforms interpolated by ScrollTrigger per section

### Per-Section Color Moods

Each section has a color palette (4 colors). ScrollTrigger lerps between palettes as user scrolls.

| Section | Color 1 | Color 2 | Color 3 | Color 4 |
|---------|---------|---------|---------|---------|
| #hero | #0C0D12 (noir) | #1C1836 (violet-bg) | #7C5CFF (violet) | #14151F (surface-alt) |
| #services | #1C1836 | #7C5CFF (violet) | #FF7A2E (accent) | #2A1B12 (teal-bg) |
| #about | #0C0D12 | #35C87E (go) | #7C5CFF (violet) | #14151F |
| #process | #08090D (deep) | #14151F | #7C5CFF | #0C0D12 |
| #guarantees | #0C0D12 | #1C1836 | #35C87E | #08090D |
| #pricing | #1C1836 | #FF7A2E | #E3A24C (amber) | #2A1B12 |
| #faq | #08090D | #14151F | #7C5CFF | #0C0D12 |
| #contact | #1C1836 | #7C5CFF | #A98BFF (violet-2) | #0C0D12 |

### Mouse Interaction

- `mousemove` updates target mouse position
- Actual uniform lerps toward target at rate 0.05 per frame
- Creates gentle displacement in noise field near cursor
- Desktop only (isTouch guard)

### Performance

- `requestAnimationFrame` tied to gsap.ticker (already running)
- Mobile: canvas at `devicePixelRatio * 0.5` resolution
- Resize handler with debounce (250ms)
- If WebGL not supported: CSS fallback gradient

---

## Feature 2: Section Separators

### What

Visible dividers between sections: a thin gradient line with a soft glow bloom, reinforcing the transition between color moods.

### Implementation

- CSS `::after` pseudo-element on each `.section` (except last)
- `height: 1px; background: linear-gradient(90deg, transparent, rgba(124,92,255,0.3), transparent)`
- `box-shadow: 0 0 30px 10px rgba(124,92,255,0.08)` for glow bloom
- Width: 60% centered
- Existing clip-path transitions remain — separators appear below/above them

---

## Feature 3: 3D Cards

### What

All card elements (`.service-card`, `.guar-card`, `.about-card`, `.step-card`) get multi-layer box-shadow for depth, brighter animated gradient borders, and perspective shadow shift on hover.

### Implementation

#### Multi-layer 3D shadow
```css
box-shadow:
  0 2px 4px rgba(0,0,0,0.3),
  0 8px 16px rgba(0,0,0,0.25),
  0 16px 32px rgba(0,0,0,0.2),
  0 32px 64px rgba(0,0,0,0.15);
```

#### Brighter border
- Existing `--border-angle` animation kept
- Increase gradient opacity/saturation: `conic-gradient(from var(--border-angle), var(--violet), var(--violet-2), #FF7A2E, var(--violet))`

#### Hover 3D tilt shadow
- On mousemove over card: shift shadow offset based on cursor position relative to card center
- `transform: perspective(800px) rotateX(Xdeg) rotateY(Ydeg)` — already exists from 3D tilt
- Shadow offset shifts opposite to tilt direction (light source simulation)

---

## Feature 4: Gradient + Glow Typography

### What

Section headings (h2 inside `.section`) get gradient text fill and a soft glow text-shadow.

### Implementation

#### Gradient text
```css
.section h2 {
  background: linear-gradient(135deg, var(--violet) 0%, var(--violet-2) 50%, #FF7A2E 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

#### Glow
```css
.section h2 {
  filter: drop-shadow(0 0 20px rgba(124,92,255,0.3));
}
```

Using `filter: drop-shadow` instead of `text-shadow` because `text-shadow` doesn't work with `background-clip: text` (transparent fill means no shadow source). `drop-shadow` works on the rendered pixels.

---

## Feature 5: Glass Lens in Hero

### What

A circular glass element (~130px diameter) in the hero section that drifts slowly and refracts content behind it with chromatic aberration.

### Implementation

- `<div class="hero-lens" aria-hidden="true"></div>` inside `#hero`
- CSS:
  - `width: 130px; height: 130px; border-radius: 50%`
  - `backdrop-filter: blur(18px) saturate(1.5)`
  - `border: 1px solid rgba(255,255,255,0.15)`
  - `background: radial-gradient(circle, rgba(124,92,255,0.08), transparent)`
  - `position: absolute` within hero, initially positioned near the right side
- Chromatic aberration: CSS `filter` with slight hue-rotate on a pseudo-element, or SVG feDisplacementMap
- GSAP drift animation: slow x/y movement in a figure-8 pattern, `duration: 20s, repeat: -1, yoyo: true`
- Hover: `scale(1.1)` with elastic ease
- Desktop only (hidden on touch)

---

## Reduced Motion / Fallback

- `prefers-reduced-motion: reduce` → no WebGL canvas, no lens drift, no glow animations
- Static CSS gradient background matching hero mood colors as fallback
- 3D card shadows remain (static, no hover shift)
- Gradient text remains (static)

## Files Modified

- `index.html` — add canvas element, lens element, bump version
- `style.css` — section separators, 3D shadows, gradient text, glow, lens styles
- `script.js` — WebGL init + shader + scroll moods + mouse + lens drift (all inside initAwardAnimations IIFE)
