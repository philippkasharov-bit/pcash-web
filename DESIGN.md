---
name: P.Cash
description: Freelance portfolio and lead-gen site for a full-cycle web + AI developer
colors:
  noir: "#0C0D12"
  surface-alt: "#14151F"
  card-bg: "#16171F"
  ink: "#ECEAE3"
  ink-soft: "#D8D5CF"
  accent: "#FF7A2E"
  accent-ink: "#FFC79E"
  amber: "#E3A24C"
  go: "#35C87E"
  violet: "#7C5CFF"
  violet-light: "#A98BFF"
  violet-ink: "#C9BAFF"
  red: "#E08A7C"
typography:
  display:
    fontFamily: "'Cormorant Garamond', 'Literata', Georgia, serif"
    fontWeight: 600
    letterSpacing: "-0.015em"
    lineHeight: 1.08
  body:
    fontFamily: "'Work Sans', -apple-system, sans-serif"
    fontWeight: 400
    fontSize: "15.5px"
    lineHeight: 1.65
  mono:
    fontFamily: "'Space Mono', monospace"
    fontSize: "13px"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  2xl: "64px"
  3xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.noir}"
    rounded: "{rounded.full}"
    padding: "14px 30px"
  button-primary-hover:
    backgroundColor: "#FF8F4E"
    textColor: "{colors.noir}"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-go:
    backgroundColor: "{colors.go}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "14px 30px"
  card:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "28px"
---

# Design System: P.Cash

## Overview

**Creative North Star: "The Cosmic Workshop"**

A deep-space atelier where craft happens — dark, precise, with glowing accents like instrument panels on a spacecraft. The surface is noir (#0C0D12), the type is warm cream (#ECEAE3), and the accents burn orange and violet against the void. Every element earns its glow.

The system pairs Cormorant Garamond (high-contrast editorial serif) for display with Work Sans (geometric sans) for body. Display type is large and decisive at weight 600; the high contrast between thick and thin strokes catches light beautifully against dark backgrounds, creating an editorial sophistication that distinguishes the portfolio from typical developer sites. Space Mono handles code labels and metadata.

Density is medium — generous section padding (64–96px), comfortable card padding (28px), and tight internal grouping. Decoration is atmospheric (Three.js wireframe shapes, ambient chips, gradient backgrounds) but never competes with content.

**Key Characteristics:**
- Dark-first: noir backgrounds with warm cream text
- Dual accent: orange (CTA, prices, energy) and violet (structure, borders, secondary)
- High-contrast serif headlines against tech elements — editorial tension
- Glass morphism on panels (backdrop-filter blur)
- GSAP + ScrollTrigger reveals with IntersectionObserver safety net
- Three.js wireframe field as ambient background
- Bilingual: Russian primary, English toggle

## Colors

A dark palette with warm neutrals and two accent temperatures — orange for action and violet for structure.

### Primary
- **Forge Orange** (#FF7A2E): CTA buttons, price highlights, active states, accent text. The hottest color on the page. CSS variable: `--accent`.
- **Amber Signal** (#E3A24C): Secondary warm accent, status indicators, kicker labels.

### Secondary
- **Cosmic Violet** (#7C5CFF): Card borders, section accents, structural highlights, nav active states.
- **Violet Light** (#A98BFF): Gradient endpoints, hover states, softer violet applications.

### Neutral
- **Noir** (#0C0D12): Page background, the void. Also used as button text on orange backgrounds for WCAG contrast.
- **Surface Alt** (#14151F): Elevated card surfaces, section alternation.
- **Ink** (#ECEAE3): Primary text, warm cream — never pure white.
- **Ink Soft** (#D8D5CF): Secondary text, labels, metadata.

### Semantic
- **Go Green** (#35C87E): Success states, positive indicators, form submit buttons.
- **Red** (#E08A7C): Error states, form validation.

### Named Rules
**The Dark Text Rule.** Primary buttons use dark text (noir) on orange backgrounds, not white. White on orange fails WCAG AA at 2.6:1; noir on orange passes at 11.2:1.

## Typography

**Display Font:** Cormorant Garamond (with Literata, Georgia fallback) — a high-contrast Garamond reinterpretation with full Latin + Cyrillic coverage.
**Body Font:** Work Sans (with system sans fallback) — geometric humanist sans. Cyrillic characters fall through to Manrope via unicode-range @font-face.
**Label/Mono Font:** Space Mono — monospaced for eyebrows, labels, and technical metadata. Cyrillic falls through to JetBrains Mono.

**Character:** The tension between elegant serif headlines and clean geometric body text mirrors the brand: creative vision executed with engineering discipline. Cormorant Garamond's hairline serifs catch light against the dark backgrounds, lending editorial authority without preciousness.

### Hierarchy
- **Hero Display** (600, clamp(48px, 8vw, 96px), 1.04): Page hero only. Italic for accent phrases.
- **Section Heading** (600, clamp(34px, 4.5vw, 58px), 1.08): Section h2s. White, no text-shadow.
- **Card Title** (600, 18px, 1.3): Service cards, case study cards, process steps.
- **Body** (400, 15.5px, 1.65): All body copy. Max comfortable width ~65ch.
- **Label** (Space Mono 400, 12–13px, uppercase, 0.12em tracking): Eyebrows, tags, metadata.

### Named Rules
**The Serif-Sans Boundary Rule.** Cormorant Garamond is for headings and the logo only. Body text, buttons, labels, and UI copy stay on Work Sans. Mixing the serif into small UI text breaks the hierarchy.

## Layout

Max container: 1080px (narrow: 800px, wide: 1200px). Sections use 64–96px vertical padding. Cards use CSS Grid with responsive column counts. Spacing scale: 8/16/24/32/48/64/96/128px.

Breakpoints: 860px (hero stacks), 820px (nav collapses to burger), 760px (cards go single-column), 620px (steps go single-column).

Smooth scroll via Lenis with ScrollTrigger sync. Scroll-padding-top at 74px for fixed header clearance.

## Elevation & Depth

Flat tonal layering with selective glass morphism. No traditional box-shadow elevation system. Depth comes from:
- Background color stepping (noir → surface-alt → card-bg)
- Backdrop-filter blur on header and hero panels
- Three.js wireframe field at z-index -1
- Subtle border glow on hover (violet border-color transition + box-shadow)

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Box-shadows appear only as a response to state (hover, CTA glow, scrolled header). No elevation tokens at rest.

## Shapes

Border-radius: 8px (small elements, inputs), 14px (cards, panels), 20px (large containers), 9999px (buttons, pills, tabs). Cards use 1px solid borders with low-opacity violet or line color. Service accordions use a top gradient border (orange → violet). No hard geometric cuts.

## Components

### Buttons
- **Primary (orange)**: Full orange background (#FF7A2E), dark text (noir), pill shape (9999px radius), 14px 30px padding. Hover: lighter orange (#FF8F4E), translateY(-2px), enhanced shadow.
- **Ghost**: Transparent with 1px border (rgba(236,234,227,0.35)), ink text, pill shape. Hover: violet-tinted background, violet border.
- **Go (green)**: Green background (#35C87E) for form submit. White text. Full-width on mobile.

### Cards
- Dark card-bg (#16171F) with 1px violet-tinted border, 14px radius, 28px padding. Hover: border brightens to violet, faint glow.

### Navigation
- Sticky header with backdrop-filter blur on scroll. Logo left (serif), pill-shaped links center, orange CTA pill right. Language toggle (RU/EN) far right. Collapses to burger at 820px. Active link: violet background pill.

### Pricing Tabs
- Pill-shaped tabs with glass background. Active: orange background, dark text, bold 700, slight scale-up with shadow.

### FAQ Accordion
- Service-card style with top gradient border. Chevron toggle. Smooth height transition.

## Do's and Don'ts

### Do:
- **Do** use Cormorant Garamond for display headings and logo only — never for body or UI labels
- **Do** keep orange for CTAs and prices; violet for structural accents
- **Do** use dark text (noir #0C0D12) on orange buttons for WCAG AA contrast
- **Do** use `var(--accent)` for the orange accent — never hardcode hex in new code
- **Do** respect prefers-reduced-motion: disable all animation and scroll effects
- **Do** provide both Latin and Cyrillic font coverage for all text roles

### Don't:
- **Don't** use pure white (#FFF) for body text — use ink (#ECEAE3)
- **Don't** use white text on orange backgrounds — it fails WCAG AA
- **Don't** animate layout-driving properties (width, height, top) — use transforms
- **Don't** add a fourth font family — three is the ceiling
- **Don't** use the CSS variable name `--teal` — it was renamed to `--accent`
