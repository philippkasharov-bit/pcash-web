# P.Cash Award-Level Animation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GSAP-powered award-level animations, custom cursor, magnetic buttons, scroll-driven transitions, glass UI, and premium interactions to the P.Cash portfolio site.

**Architecture:** Vendor GSAP 3 + ScrollTrigger into the site directory. All animation logic lives in `script.js` inside an `initAwardAnimations()` function that runs after GSAP loads. CSS additions go into `style.css`. No build tools — pure vanilla.

**Tech Stack:** HTML/CSS/JS, GSAP 3.12+ (gsap.min.js + ScrollTrigger.min.js), Lenis (already present)

## Global Constraints

- Do NOT change: logo SVG, text content (data-ru/data-en values), CSS color custom properties
- All animations: `prefers-reduced-motion: reduce` → disable (check `matchMedia` before init)
- Touch devices: `matchMedia('(hover: none)')` → skip cursor, magnetic, card spotlight
- Performance: use `will-change` sparingly, `force3D: true` on GSAP tweens
- After all changes: bump `?v=N` on style.css and script.js in index.html
- Site root: `C:\Users\Admin\AppData\Local\Temp\claude\C--Users-Admin\1a19074a-b91f-472e-9e21-ef4d3c4c867c\scratchpad\portfolio_site\`

---

### Task 1: GSAP Foundation + Lenis Integration

**Files:**
- Create: `gsap.min.js` (download/vendor from GSAP CDN)
- Create: `ScrollTrigger.min.js` (download/vendor from GSAP CDN)
- Modify: `index.html:565` (add script tags before lenis.min.js)
- Modify: `script.js` (add GSAP+Lenis bridge at top of award-animations block)

**Produces:** `gsap` and `ScrollTrigger` globals available; ScrollTrigger synced with Lenis scroll position; `initAwardAnimations()` wrapper function that all subsequent tasks add to.

- [ ] **Step 1: Download GSAP files**

```bash
cd portfolio_site
curl -o gsap.min.js "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
curl -o ScrollTrigger.min.js "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
```

- [ ] **Step 2: Add script tags to index.html**

Before the existing `<script src="lenis.min.js?v=1"></script>` line, add:

```html
<script src="gsap.min.js"></script>
<script src="ScrollTrigger.min.js"></script>
```

- [ ] **Step 3: Add GSAP+Lenis bridge in script.js**

At the end of script.js (after the existing `})();` blocks), add:

```javascript
/* ===================== GSAP Award Animations ===================== */
(function initAwardAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  if (reducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with ScrollTrigger
  if (typeof lenis !== 'undefined' && lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
})();
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8940`, open DevTools console, type `gsap.version` — should return "3.12.5". Type `ScrollTrigger` — should be defined. No console errors.

- [ ] **Step 5: Bump version**

In index.html, change `style.css?v=34` → `?v=35` and `script.js?v=34` → `?v=35`.

---

### Task 2: Custom Cursor

**Files:**
- Modify: `index.html` (add cursor elements after `<body>`)
- Modify: `style.css` (add cursor styles)
- Modify: `script.js` (add cursor logic inside initAwardAnimations)

**Consumes:** GSAP globals from Task 1
**Produces:** `.cursor-dot` and `.cursor-follow` elements with spring-follow behavior, scale on hover

- [ ] **Step 1: Add cursor HTML**

After `<body>` tag (line 53), add:

```html
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-follow" aria-hidden="true"><span class="cursor-text"></span></div>
```

- [ ] **Step 2: Add cursor CSS**

At end of style.css:

```css
/* custom cursor */
.cursor-dot { position: fixed; top: 0; left: 0; width: 8px; height: 8px; background: var(--ink); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); mix-blend-mode: difference; }
.cursor-follow { position: fixed; top: 0; left: 0; width: 40px; height: 40px; border: 1.5px solid var(--ink); border-radius: 50%; pointer-events: none; z-index: 9998; transform: translate(-50%, -50%); opacity: 0.5; display: flex; align-items: center; justify-content: center; transition: width 0.3s, height 0.3s, opacity 0.3s, background 0.3s; }
.cursor-follow.active { width: 80px; height: 80px; opacity: 0.15; background: var(--ink); }
.cursor-follow.has-text { width: 100px; height: 100px; opacity: 1; background: var(--violet); border-color: var(--violet); }
.cursor-text { font-family: var(--font-mono); font-size: 11px; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0; transition: opacity 0.2s; }
.cursor-follow.has-text .cursor-text { opacity: 1; }
@media (hover: none) { .cursor-dot, .cursor-follow { display: none !important; } }
body.has-custom-cursor { cursor: none; }
body.has-custom-cursor a, body.has-custom-cursor button, body.has-custom-cursor .btn, body.has-custom-cursor input, body.has-custom-cursor textarea { cursor: none; }
```

- [ ] **Step 3: Add cursor JS**

Inside `initAwardAnimations()`, after the Lenis sync block:

```javascript
  // Custom cursor
  if (!isTouch) {
    document.body.classList.add('has-custom-cursor');
    const dot = document.querySelector('.cursor-dot');
    const follow = document.querySelector('.cursor-follow');
    const cursorText = follow.querySelector('.cursor-text');
    if (dot && follow) {
      const xDot = gsap.quickTo(dot, 'left', { duration: 0.05, ease: 'none' });
      const yDot = gsap.quickTo(dot, 'top', { duration: 0.05, ease: 'none' });
      const xFollow = gsap.quickTo(follow, 'left', { duration: 0.35, ease: 'power3' });
      const yFollow = gsap.quickTo(follow, 'top', { duration: 0.35, ease: 'power3' });

      document.addEventListener('mousemove', (e) => {
        xDot(e.clientX); yDot(e.clientY);
        xFollow(e.clientX); yFollow(e.clientY);
      });

      document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; follow.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; follow.style.opacity = '0.5'; });

      document.querySelectorAll('a, button, .btn, .service-card, .guar-card, .step-card').forEach((el) => {
        el.addEventListener('mouseenter', () => follow.classList.add('active'));
        el.addEventListener('mouseleave', () => { follow.classList.remove('active'); follow.classList.remove('has-text'); cursorText.textContent = ''; });
      });

      document.querySelectorAll('.hero-photo-wrap, .post').forEach((el) => {
        el.addEventListener('mouseenter', () => { follow.classList.add('has-text'); cursorText.textContent = 'View'; });
        el.addEventListener('mouseleave', () => { follow.classList.remove('has-text'); cursorText.textContent = ''; });
      });
    }
  }
```

- [ ] **Step 4: Verify**

Move mouse around — dot follows instantly, ring follows with lag. Hover over a button — ring grows. Hover over hero photo area — shows "View" text. On mobile viewport (375px) — no cursor elements visible.

---

### Task 3: Magnetic Buttons

**Files:**
- Modify: `script.js` (add magnetic logic inside initAwardAnimations)

**Consumes:** GSAP globals from Task 1, `isTouch` flag
**Produces:** All `.btn`, `.nav-cta`, `.main-nav a` elements magnetically attract toward cursor

- [ ] **Step 1: Add magnetic JS**

Inside `initAwardAnimations()`, after cursor block:

```javascript
  // Magnetic buttons
  if (!isTouch) {
    document.querySelectorAll('.btn, .nav-cta, .main-nav a').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          const strength = (60 - dist) / 60;
          gsap.to(el, { x: dx * strength * 0.4, y: dy * strength * 0.3, duration: 0.3, ease: 'power2.out' });
        }
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      });
    });
  }
```

- [ ] **Step 2: Verify**

Hover near a button — it shifts toward cursor. Move away — springs back elastically.

---

### Task 4: Hero Parallax + Preloader Upgrade

**Files:**
- Modify: `style.css` (preloader clip-path transition)
- Modify: `script.js` (hero parallax ScrollTrigger + preloader timeline)

**Consumes:** GSAP + ScrollTrigger from Task 1
**Produces:** Hero elements parallax on scroll; preloader exits with circle-expand reveal

- [ ] **Step 1: Add preloader clip-path CSS**

```css
body.clip-revealing { clip-path: circle(0% at 50% 50%); }
body.clip-revealing.loaded { clip-path: circle(100% at 50% 50%); transition: clip-path 1s cubic-bezier(0.22,1,0.36,1); }
```

- [ ] **Step 2: Add hero parallax + preloader JS**

Inside `initAwardAnimations()`:

```javascript
  // Hero parallax
  const heroCopy = document.querySelector('.hero-copy');
  const heroVisual = document.querySelector('.hero-visual');
  if (heroCopy) {
    gsap.to(heroCopy, { yPercent: -15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  if (heroVisual) {
    gsap.to(heroVisual, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Enhanced preloader exit
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(preloader.querySelector('svg'), { scale: 1.5, opacity: 0, duration: 0.6, ease: 'power2.in' })
      .to(preloader, { opacity: 0, duration: 0.4, ease: 'power2.in' }, '-=0.2')
      .call(() => { preloader.style.display = 'none'; });
  }
```

- [ ] **Step 3: Verify**

Scroll down — hero text moves up faster than photo. Reload — preloader logo scales up and fades.

---

### Task 5: Section Clip-Path Transitions

**Files:**
- Modify: `style.css` (initial clip-path states)
- Modify: `script.js` (ScrollTrigger per section)

**Consumes:** GSAP + ScrollTrigger
**Produces:** Each section enters viewport with unique clip-path animation

- [ ] **Step 1: Add clip-path CSS initial states**

```css
.clip-section { clip-path: circle(0% at 50% 50%); }
```

Note: we won't use CSS initial states — GSAP sets `clipPath` directly via `fromTo`.

- [ ] **Step 2: Add section transitions JS**

Inside `initAwardAnimations()`:

```javascript
  // Section clip-path transitions
  const clipMap = {
    services:   { from: 'circle(0% at 50% 50%)',    to: 'circle(150% at 50% 50%)' },
    about:      { from: 'polygon(0 0, 0 0, 0 100%, 0 100%)', to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    cases:      { from: 'inset(10% round 24px)',     to: 'inset(0% round 0px)' },
    process:    { from: 'inset(20%)',                 to: 'inset(0%)' },
    calc:       { from: 'inset(15%)',                 to: 'inset(0%)' },
    guarantees: { from: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)', to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    faq:        null,  // simple fade
    reviews:    { from: 'inset(0 100% 0 0)',          to: 'inset(0 0% 0 0)' },
    contact:    { from: 'circle(0% at 90% 90%)',      to: 'circle(150% at 90% 90%)' }
  };

  Object.entries(clipMap).forEach(([id, clip]) => {
    const section = document.getElementById(id);
    if (!section) return;
    if (!clip) {
      // Simple fade for faq
      gsap.from(section, { opacity: 0, y: 40, scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 40%', scrub: true } });
      return;
    }
    // Apply clip-path to the section's ::before via wrapper
    gsap.fromTo(section, { clipPath: clip.from }, { clipPath: clip.to, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 20%', scrub: true }
    });
  });
```

- [ ] **Step 3: Verify**

Scroll through each section — services expands as circle, about wipes diagonally, guarantees opens as diamond, etc.

---

### Task 6: Stagger Cascade Entry + Content Exit

**Files:**
- Modify: `script.js` (replace existing IntersectionObserver reveals with GSAP stagger)

**Consumes:** GSAP + ScrollTrigger
**Produces:** Section children animate in with staggered timing; content fades out on exit

- [ ] **Step 1: Add cascade entry JS**

Inside `initAwardAnimations()`:

```javascript
  // Stagger cascade entry
  document.querySelectorAll('.section').forEach((section) => {
    const children = section.querySelectorAll('.kicker, h2, .section-sub, .service-card, .post, .faq-item, .guar-card, .step-card, .calc, .review-card, .contact-card, .cases-cta');
    if (!children.length) return;

    gsap.set(children, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(children, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out' });
      }
    });
  });

  // Content exit on scroll out (desktop only)
  if (!isTouch && window.innerWidth > 760) {
    document.querySelectorAll('.section').forEach((section) => {
      gsap.to(section.children, { opacity: 0, y: -30, ease: 'none',
        scrollTrigger: { trigger: section, start: 'bottom 60%', end: 'bottom top', scrub: true }
      });
    });
  }
```

- [ ] **Step 2: Remove old IntersectionObserver reveal CSS initial states**

The existing `.js .section:not(.seen)` rules that set opacity:0 and transform should be overridden since GSAP now handles reveals. Add to style.css:

```css
/* GSAP takes over reveals */
.js .section:not(.seen) :is(.kicker, .section-sub, .service-card, .post, .faq-item, .calc, .review-card, .contact-card, .steps, .guar-card, .step) { opacity: 1; transform: none; }
```

Wait — this would break the fallback for no-GSAP. Instead, add a `gsap-ready` class to body when GSAP initializes, and scope:

```css
body.gsap-ready .section:not(.seen) :is(.kicker, .section-sub, .service-card, .post, .faq-item, .calc, .review-card, .contact-card, .steps, .guar-card, .step) { opacity: unset; transform: unset; transition: none; }
```

And in JS, at start of `initAwardAnimations()`: `document.body.classList.add('gsap-ready');`

- [ ] **Step 3: Verify**

Scroll down — elements cascade in with stagger. Scroll past — content fades out and shifts up.

---

### Task 7: Glass Cards + Border Gradient + Spotlight

**Files:**
- Modify: `style.css` (glass morphism, animated border, spotlight)
- Modify: `script.js` (card spotlight mousemove)

**Consumes:** Task 1 (GSAP)
**Produces:** Cards have glass blur, animated gradient border on hover, cursor-following spotlight

- [ ] **Step 1: Add glass morphism CSS**

```css
/* glass cards */
.service-card, .guar-card, .about-card, .step-card {
  background: rgba(22, 23, 31, 0.6);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.08);
}
```

- [ ] **Step 2: Add animated border gradient CSS**

```css
@property --border-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.service-card { position: relative; }
.service-card::before {
  content: ''; position: absolute; inset: -1px; border-radius: 21px; padding: 1px;
  background: conic-gradient(from var(--border-angle), var(--violet), var(--teal), var(--go), var(--violet));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity 0.4s;
}
.service-card:hover::before { opacity: 1; animation: borderSpin 3s linear infinite; }
@keyframes borderSpin { to { --border-angle: 360deg; } }
```

- [ ] **Step 3: Add card spotlight CSS**

```css
.service-card, .guar-card { --mx: 50%; --my: 50%; }
.service-card::after, .guar-card::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(circle 200px at var(--mx) var(--my), rgba(255,255,255,0.06), transparent 60%);
  opacity: 0; transition: opacity 0.3s;
}
.service-card:hover::after, .guar-card:hover::after { opacity: 1; }
```

- [ ] **Step 4: Add spotlight JS**

Inside `initAwardAnimations()`:

```javascript
  // Card spotlight
  if (!isTouch) {
    document.querySelectorAll('.service-card, .guar-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
```

- [ ] **Step 5: Verify**

Hover over service card — gradient border spins, spotlight follows cursor, glass blur visible behind card.

---

### Task 8: Buttons (Liquid Fill, Pulse, Ghost Arrow, Shimmer)

**Files:**
- Modify: `style.css` (button animation styles)
- Modify: `index.html` (add arrow SVG to ghost buttons)

**Produces:** Primary buttons have liquid fill hover + pulse; ghost buttons have slide-in arrow

- [ ] **Step 1: Add liquid fill CSS**

Replace existing `.btn-primary` hover and `::after` shimmer:

```css
.btn-primary { position: relative; overflow: hidden; z-index: 1; }
.btn-primary::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: var(--go-hover);
  transform: translateY(101%);
  border-radius: 0 0 50% 50% / 0 0 30px 30px;
  transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), border-radius 0.5s;
}
.btn-primary:hover::before { transform: translateY(0); border-radius: 0; }
```

- [ ] **Step 2: Add CTA pulse CSS**

```css
@keyframes ctaPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
.btn-primary.hero-cta-btn { animation: ctaPulse 4s ease-in-out infinite; }
.btn-primary.hero-cta-btn:hover { animation: none; }
```

Add class `hero-cta-btn` to the primary CTA in index.html hero section.

- [ ] **Step 3: Add ghost button arrow CSS**

```css
.btn-ghost { display: inline-flex; align-items: center; gap: 0; }
.btn-ghost .btn-arrow { width: 0; overflow: hidden; transition: width 0.35s cubic-bezier(0.22,1,0.36,1), margin-left 0.35s; margin-left: 0; }
.btn-ghost:hover .btn-arrow { width: 18px; margin-left: 8px; }
```

- [ ] **Step 4: Add arrow SVG to ghost buttons in HTML**

Add inside each `.btn-ghost`:
```html
<svg class="btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
```

- [ ] **Step 5: Improve shimmer**

```css
.btn::after { width: 65%; left: -150%; transition: none; }
@keyframes shimmer { 0% { left: -150%; } 100% { left: 200%; } }
.btn-primary::after { animation: shimmer 1.2s ease-in-out 4s infinite; }
```

- [ ] **Step 6: Verify**

Hover primary button — liquid fills from bottom. Ghost button — arrow slides in. Primary CTA pulses gently every 4s.

---

### Task 9: Navigation (Underline, Shrink, Dropdown, Mobile)

**Files:**
- Modify: `style.css` (nav hover underline, header shrink, dropdown clip)
- Modify: `script.js` (header shrink ScrollTrigger)

**Consumes:** GSAP + ScrollTrigger

- [ ] **Step 1: Add nav underline CSS**

```css
.main-nav a { position: relative; }
.main-nav a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 1.5px; background: var(--teal); transform: scaleX(0); transform-origin: center; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
.main-nav a:hover::after { transform: scaleX(1); }
```

- [ ] **Step 2: Add header shrink**

CSS:
```css
.site-header { transition: padding 0.4s, backdrop-filter 0.4s, background 0.4s; }
.site-header.shrunk { padding-top: 10px; padding-bottom: 10px; backdrop-filter: blur(16px); background: rgba(12,13,18,0.85); }
```

JS inside `initAwardAnimations()`:
```javascript
  // Header shrink
  ScrollTrigger.create({
    start: 80,
    onUpdate: (self) => {
      document.querySelector('.site-header').classList.toggle('shrunk', self.scroll() > 80);
    }
  });
```

- [ ] **Step 3: Add dropdown clip-path CSS**

```css
.nav-drop { clip-path: inset(0 0 100% 0); transition: clip-path 0.35s cubic-bezier(0.22,1,0.36,1); }
.has-drop:hover .nav-drop, .has-drop:focus-within .nav-drop { clip-path: inset(0); }
```

- [ ] **Step 4: Add mobile menu stagger JS**

Inside `initAwardAnimations()`:
```javascript
  // Mobile menu stagger
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    const observer = new MutationObserver(() => {
      if (mobileMenu.classList.contains('open')) {
        gsap.from(mobileMenu.querySelectorAll('a'), { x: 30, opacity: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' });
      }
    });
    observer.observe(mobileMenu, { attributes: true, attributeFilter: ['class'] });
  }
```

- [ ] **Step 5: Verify**

Nav links — underline draws from center on hover. Scroll down 80px — header shrinks with blur. Click burger on mobile — links stagger in.

---

### Task 10: Horizontal Scroll Services

**Files:**
- Modify: `style.css` (horizontal scroll container)
- Modify: `script.js` (ScrollTrigger pin + horizontal scroll)

**Consumes:** GSAP + ScrollTrigger

- [ ] **Step 1: Add horizontal scroll CSS**

```css
@media (min-width: 761px) {
  .services-scroll-wrap { overflow: hidden; }
  .services.horizontal { display: flex; flex-wrap: nowrap; gap: 24px; width: max-content; }
  .services.horizontal .service-card { min-width: 520px; max-width: 520px; flex-shrink: 0; grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Wrap services in scroll container (HTML)**

Wrap the existing `.services` div with:
```html
<div class="services-scroll-wrap">
  <div class="services horizontal">
    ...existing service-card elements...
  </div>
</div>
```

- [ ] **Step 3: Add horizontal scroll JS**

Inside `initAwardAnimations()`:
```javascript
  // Horizontal scroll services
  if (window.innerWidth > 760) {
    const servicesWrap = document.querySelector('.services-scroll-wrap');
    const services = document.querySelector('.services.horizontal');
    if (servicesWrap && services) {
      const totalWidth = services.scrollWidth - servicesWrap.offsetWidth;
      gsap.to(services, {
        x: -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: servicesWrap,
          start: 'top 15%',
          end: () => '+=' + totalWidth,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    }
  }
```

- [ ] **Step 4: Verify**

On desktop — scroll through services section, cards slide horizontally. On mobile — vertical stack as before.

---

### Task 11: Process Steps Pin + Guarantee Stacked Cards

**Files:**
- Modify: `style.css` (sticky card styles)
- Modify: `script.js` (process pin, guarantee sticky)

**Consumes:** GSAP + ScrollTrigger

- [ ] **Step 1: Add process pin JS**

Inside `initAwardAnimations()`:
```javascript
  // Process steps pin
  if (window.innerWidth > 760) {
    const process = document.getElementById('process');
    if (process) {
      const steps = process.querySelectorAll('.step-card, .step');
      gsap.set(steps, { opacity: 0, x: 60 });
      ScrollTrigger.create({
        trigger: process,
        start: 'top 15%',
        end: () => '+=' + (steps.length * 200),
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          steps.forEach((step, i) => {
            const stepProgress = Math.max(0, Math.min(1, (progress * steps.length) - i));
            gsap.set(step, { opacity: stepProgress, x: 60 * (1 - stepProgress) });
          });
        }
      });
    }
  }
```

- [ ] **Step 2: Add guarantee stacked cards CSS**

```css
@media (min-width: 761px) {
  .guar-grid { display: flex; flex-direction: column; gap: 0; }
  .guar-card.sticky-card { position: sticky; top: 100px; transition: transform 0.3s; }
  .guar-card.sticky-card:nth-child(2) { top: 120px; }
  .guar-card.sticky-card:nth-child(3) { top: 140px; }
  .guar-card.sticky-card:nth-child(4) { top: 160px; }
}
```

- [ ] **Step 3: Add sticky-card class via JS**

```javascript
  // Guarantee stacked cards
  if (window.innerWidth > 760) {
    document.querySelectorAll('.guar-card').forEach((card, i) => {
      card.classList.add('sticky-card');
      card.style.zIndex = i + 1;
      gsap.to(card, {
        scale: 1 - (0.02 * i),
        scrollTrigger: { trigger: card, start: 'top 20%', end: 'bottom top', scrub: true }
      });
    });
  }
```

- [ ] **Step 4: Verify**

Process section pins and steps reveal one by one. Guarantee cards stack on top of each other as you scroll.

---

### Task 12: Kinetic Typography (Character Reveal + Number Scramble)

**Files:**
- Modify: `script.js` (character split for h1, number scramble)

**Consumes:** GSAP, existing countUp logic

- [ ] **Step 1: Add hero h1 character reveal JS**

Inside `initAwardAnimations()`:
```javascript
  // Hero h1 character reveal
  const heroH1 = document.querySelector('.hero h1');
  if (heroH1) {
    const html = heroH1.innerHTML;
    heroH1.innerHTML = '';
    let charIndex = 0;
    // Parse HTML to preserve <em> tags
    const temp = document.createElement('div');
    temp.innerHTML = html;
    function processNode(node, parent) {
      if (node.nodeType === 3) {
        [...node.textContent].forEach((ch) => {
          if (ch === ' ') { parent.appendChild(document.createTextNode(' ')); return; }
          const span = document.createElement('span');
          span.style.display = 'inline-block';
          span.style.overflow = 'hidden';
          const inner = document.createElement('span');
          inner.textContent = ch;
          inner.className = 'char';
          inner.style.display = 'inline-block';
          inner.dataset.ci = charIndex++;
          span.appendChild(inner);
          parent.appendChild(span);
        });
      } else if (node.nodeType === 1) {
        const clone = document.createElement(node.tagName.toLowerCase());
        [...node.attributes].forEach((a) => clone.setAttribute(a.name, a.value));
        [...node.childNodes].forEach((child) => processNode(child, clone));
        parent.appendChild(clone);
      }
    }
    [...temp.childNodes].forEach((child) => processNode(child, heroH1));

    const chars = heroH1.querySelectorAll('.char');
    gsap.set(chars, { yPercent: 110, rotateX: -80 });
    // Trigger after preloader
    const charTl = gsap.timeline({ delay: 1.2 });
    charTl.to(chars, { yPercent: 0, rotateX: 0, duration: 0.6, stagger: 0.025, ease: 'power2.out' });
  }
```

- [ ] **Step 2: Add number scramble JS**

```javascript
  // Number scramble
  document.querySelectorAll('.count-up').forEach((el) => {
    const target = parseInt(el.dataset.to);
    const chars = '0123456789!@#$%&';
    let scrambleInterval;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        let frame = 0;
        scrambleInterval = setInterval(() => {
          el.textContent = Array.from({ length: String(target).length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          frame++;
          if (frame > 12) {
            clearInterval(scrambleInterval);
            // Existing countUp takes over
            let current = 0;
            const step = Math.ceil(target / 30);
            const counter = setInterval(() => {
              current = Math.min(current + step, target);
              el.textContent = current;
              if (current >= target) clearInterval(counter);
            }, 30);
          }
        }, 50);
      }
    });
  });
```

- [ ] **Step 3: Verify**

Reload page — hero h1 letters flip in one by one after preloader. Scroll to facts — "15" scrambles random chars before resolving.

---

### Task 13: UI Grid + Spacing System + Bento About

**Files:**
- Modify: `style.css` (spacing vars, bento grid, container widths, asymmetric layouts)

**Produces:** Consistent 8px spacing grid, bento layout for about section, narrow container for FAQ

- [ ] **Step 1: Add spacing variables to :root**

```css
--space-xs: 8px; --space-sm: 16px; --space-md: 24px;
--space-lg: 32px; --space-xl: 48px; --space-2xl: 64px;
--space-3xl: 96px; --space-4xl: 128px;
--container: 1080px; --container-narrow: 800px; --container-wide: 1200px;
```

- [ ] **Step 2: Add bento grid for about section**

```css
.about-cards { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
.about-card:first-child { grid-row: span 2; }
@media (max-width: 760px) { .about-cards { grid-template-columns: 1fr; } .about-card:first-child { grid-row: auto; } }
```

- [ ] **Step 3: Narrow container for FAQ and guarantees**

```css
#faq .wrap, #guarantees .wrap { max-width: var(--container-narrow); }
```

- [ ] **Step 4: Update section padding to use spacing vars**

```css
.section { padding: var(--space-3xl) var(--space-lg); }
@media (max-width: 760px) { .section { padding: var(--space-xl) var(--space-sm); } }
```

- [ ] **Step 5: Verify**

About section — bento grid with first card spanning 2 rows. FAQ/guarantees narrower. Consistent spacing throughout.

---

### Task 14: Form Interactions + Photo Frame + Mobile Polish + Final

**Files:**
- Modify: `style.css` (input focus, photo frame, active states, reduced-motion)
- Modify: `script.js` (form focus animations)
- Modify: `index.html` (bump version to final)

**Produces:** Polished form interactions, decorative photo frame, mobile tap feedback, reduced-motion safety net

- [ ] **Step 1: Add input focus CSS**

```css
.form-group { position: relative; }
.form-group::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 100%; height: 2px; background: var(--violet); transform: scaleX(0); transform-origin: center; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); }
.form-group:focus-within::after { transform: scaleX(1); }
input:focus, textarea:focus { border-color: rgba(124,92,255,0.4); }
```

- [ ] **Step 2: Add photo frame CSS**

```css
.hero-photo-wrap::before { content: ''; position: absolute; inset: -12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 30px; pointer-events: none; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }
.hero-photo-wrap:hover::before { transform: rotate(2deg) scale(1.02); }
```

- [ ] **Step 3: Add mobile tap feedback**

```css
@media (hover: none) {
  .btn:active, .service-card:active, .guar-card:active, .faq-q:active { transform: scale(0.97); transition: transform 0.1s; }
}
```

- [ ] **Step 4: Ensure reduced-motion kills everything**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  .cursor-dot, .cursor-follow { display: none !important; }
  .service-card::before, .service-card::after { display: none; }
}
```

- [ ] **Step 5: Bump final version**

In index.html: `style.css?v=35` and `script.js?v=35`.

- [ ] **Step 6: Full verification**

Test on desktop (1280px):
- Preloader → circle reveal → h1 character flip → hero parallax
- Custom cursor + magnetic buttons
- Scroll: section clip-paths, stagger cascade, horizontal services
- Cards: glass blur, gradient border, spotlight
- Buttons: liquid fill, pulse, ghost arrow
- Nav: underline, header shrink, dropdown clip
- Numbers scramble
- Process pin, guarantee stack

Test on mobile (375px):
- No cursor, no magnetic, no pin
- Vertical service cards
- Tap feedback
- Smooth stagger reveals

Test reduced-motion: all animations instant/disabled.

---

## Self-Review Checklist

- [x] Spec sections 1-13 all covered by Tasks 1-14
- [x] No placeholders — all code blocks have actual implementation
- [x] Function names consistent across tasks (initAwardAnimations, isTouch, reducedMotion)
- [x] Mobile adaptations in each relevant task (not just Task 14)
- [x] Version bump in final task
