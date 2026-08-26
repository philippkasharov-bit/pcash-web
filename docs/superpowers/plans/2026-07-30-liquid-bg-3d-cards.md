# Liquid Background + 3D Cards + Bright Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a WebGL liquid gradient mesh background with per-section color moods, 3D elevated cards with bright borders, gradient+glow headings, section separators, and a glass lens in the hero.

**Architecture:** Raw WebGL fragment shader renders to a fixed canvas behind all content. ScrollTrigger interpolates color uniforms per section. CSS handles 3D card shadows, gradient text, glow, section separators, and glass lens styling. All JS lives inside the existing `initAwardAnimations()` IIFE in script.js (lines 553-837).

**Tech Stack:** Raw WebGL (no Three.js), GSAP 3.12.5 + ScrollTrigger (vendored), CSS backdrop-filter, background-clip, multi-layer box-shadow.

## Global Constraints

- DO NOT change: logo SVG, text content (data-ru/data-en values), CSS color custom property names
- All animation JS inside `initAwardAnimations()` IIFE (script.js lines 553-837)
- Guard with `reducedMotion` and `isTouch` at IIFE top (lines 555-557)
- Mobile: WebGL at `devicePixelRatio * 0.5`, no mouse tracking
- `prefers-reduced-motion`: static CSS gradient fallback, no WebGL
- Cache-bust: bump `?v=35` → `?v=36` on style.css and script.js in index.html
- Existing animations must continue working (cursor, magnetic, parallax, clip-path, stagger, horizontal scroll, process pins, guarantee stacked cards)
- Section selectors: `.hero` (no id), `#services`, `#about`, `#cases`, `#process`, `#calc`, `#guarantees`, `#faq`, `#reviews`, `#contact`

---

### Task 1: WebGL Liquid Gradient Mesh Background

**Files:**
- Modify: `index.html:53-54` (add canvas before cursor elements)
- Modify: `style.css` (add canvas + fallback styles at end)
- Modify: `script.js:566-567` (add WebGL init after Lenis sync, before `gsap-ready`)

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `reducedMotion`, `isTouch` from IIFE scope
- Produces: global `liquidBg` object with `{ canvas, gl, program, uniforms, mouseTarget, mouseCurrent }` accessible within the IIFE for Task 5 (scroll moods) to update color uniforms

- [ ] **Step 1: Add canvas element to index.html**

In `index.html`, insert a canvas as first child of `<body>`, before the cursor-dot div (line 54):

```html
<canvas id="liquid-bg" aria-hidden="true"></canvas>
```

So lines 53-55 become:
```html
<body>
<canvas id="liquid-bg" aria-hidden="true"></canvas>
<div class="cursor-dot" aria-hidden="true"></div>
```

- [ ] **Step 2: Add canvas CSS + reduced-motion fallback to style.css**

At the end of style.css (before the final `@media (hover: none)` block at ~line 790), add:

```css
/* liquid bg */
#liquid-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; width: 100%; height: 100%; }
@media (prefers-reduced-motion: reduce) {
  #liquid-bg { display: none; }
  body { background: linear-gradient(135deg, #0C0D12 0%, #1C1836 50%, #0C0D12 100%); }
}
```

- [ ] **Step 3: Add WebGL initialization JS inside initAwardAnimations IIFE**

In `script.js`, after the Lenis sync block (after line 566: `gsap.ticker.lagSmoothing(0); }`) and before line 568 (`document.body.classList.add('gsap-ready');`), insert the WebGL initialization code.

The code must include:
1. Simplex 3D noise GLSL function (~40 lines)
2. Vertex shader (fullscreen quad)
3. Fragment shader using 4 color uniforms + time + resolution + mouse
4. WebGL setup: create canvas context, compile shaders, create program, get uniform locations
5. Fullscreen quad geometry (2 triangles)
6. Render loop hooked into gsap.ticker
7. Mouse tracking with lerp (desktop only)
8. Resize handler with 250ms debounce

```javascript
  // hex to vec3 (0-1 range) — used by WebGL + scroll moods
  function hexToVec3(hex) {
    const n = parseInt(hex.replace('#',''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  // WebGL Liquid Background
  const liquidCanvas = document.getElementById('liquid-bg');
  const liquidBg = { canvas: liquidCanvas, gl: null, program: null, uniforms: {}, mouseTarget: [0.5, 0.5], mouseCurrent: [0.5, 0.5], colors: null };

  if (liquidCanvas) {
    const gl = liquidCanvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
    if (gl) {
      liquidBg.gl = gl;

      const vsSource = `attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0,1); }`;

      const fsSource = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec3 u_c1, u_c2, u_c3, u_c4;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0,.5,1,2);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g,l.zxy);
  vec3 i2=max(g,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
  float n_=1./7.;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291400159-.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float t=u_time*0.08;
  vec2 mOff=(u_mouse-0.5)*0.15;
  float n1=snoise(vec3(uv*1.8+mOff,t))*0.5+0.5;
  float n2=snoise(vec3(uv*2.5-mOff*0.5,t*1.3+10.))*0.5+0.5;
  float n3=snoise(vec3(uv*1.2,t*0.7+20.))*0.5+0.5;
  float blend1=smoothstep(0.2,0.8,n1);
  float blend2=smoothstep(0.3,0.7,n2);
  float blend3=smoothstep(0.25,0.75,n3);
  vec3 col=mix(u_c1,u_c2,blend1);
  col=mix(col,u_c3,blend2*0.6);
  col=mix(col,u_c4,blend3*0.35);
  col*=0.85+0.15*snoise(vec3(uv*3.,t*0.5));
  gl_FragColor=vec4(col,1.);
}`;

      function compileShader(src, type) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      }

      const vs = compileShader(vsSource, gl.VERTEX_SHADER);
      const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.useProgram(prog);
      liquidBg.program = prog;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      liquidBg.uniforms = {
        time: gl.getUniformLocation(prog, 'u_time'),
        res: gl.getUniformLocation(prog, 'u_res'),
        mouse: gl.getUniformLocation(prog, 'u_mouse'),
        c1: gl.getUniformLocation(prog, 'u_c1'),
        c2: gl.getUniformLocation(prog, 'u_c2'),
        c3: gl.getUniformLocation(prog, 'u_c3'),
        c4: gl.getUniformLocation(prog, 'u_c4')
      };

      // Default colors (hero mood)
      liquidBg.colors = {
        c1: hexToVec3('#0C0D12'),
        c2: hexToVec3('#1C1836'),
        c3: hexToVec3('#7C5CFF'),
        c4: hexToVec3('#14151F')
      };

      function resizeLiquid() {
        const dpr = isTouch ? Math.min(devicePixelRatio, 1) : Math.min(devicePixelRatio, 1.5);
        const scale = isTouch ? 0.5 : 1;
        liquidCanvas.width = window.innerWidth * dpr * scale;
        liquidCanvas.height = window.innerHeight * dpr * scale;
        gl.viewport(0, 0, liquidCanvas.width, liquidCanvas.height);
      }

      let resizeTimer;
      window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeLiquid, 250); });
      resizeLiquid();

      if (!isTouch) {
        document.addEventListener('mousemove', (e) => {
          liquidBg.mouseTarget[0] = e.clientX / window.innerWidth;
          liquidBg.mouseTarget[1] = 1 - e.clientY / window.innerHeight;
        });
      }

      let startTime = performance.now();
      gsap.ticker.add(() => {
        liquidBg.mouseCurrent[0] += (liquidBg.mouseTarget[0] - liquidBg.mouseCurrent[0]) * 0.05;
        liquidBg.mouseCurrent[1] += (liquidBg.mouseTarget[1] - liquidBg.mouseCurrent[1]) * 0.05;
        const t = (performance.now() - startTime) / 1000;
        const u = liquidBg.uniforms;
        const c = liquidBg.colors;
        gl.uniform1f(u.time, t);
        gl.uniform2f(u.res, liquidCanvas.width, liquidCanvas.height);
        gl.uniform2f(u.mouse, liquidBg.mouseCurrent[0], liquidBg.mouseCurrent[1]);
        gl.uniform3f(u.c1, c.c1[0], c.c1[1], c.c1[2]);
        gl.uniform3f(u.c2, c.c2[0], c.c2[1], c.c2[2]);
        gl.uniform3f(u.c3, c.c3[0], c.c3[1], c.c3[2]);
        gl.uniform3f(u.c4, c.c4[0], c.c4[1], c.c4[2]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
    }
  }
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8940` (or start dev server). Expect:
- A soft animated gradient background covering the full viewport, behind all content
- Moving the mouse slightly shifts the gradient pattern
- No console errors related to WebGL
- All existing animations (cursor, cards, scroll) still work

- [ ] **Step 5: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: add WebGL liquid gradient mesh background"
```

---

### Task 2: Scroll-Driven Section Color Moods

**Files:**
- Modify: `script.js` (add ScrollTrigger per-section color transitions, after the WebGL block from Task 1)

**Interfaces:**
- Consumes: `liquidBg.colors` object from Task 1 (has `.c1`, `.c2`, `.c3`, `.c4` arrays), `hexToVec3` function from Task 1, `ScrollTrigger`, all section DOM elements
- Produces: Per-section ScrollTriggers that interpolate `liquidBg.colors` values as user scrolls

- [ ] **Step 1: Add section mood map and scroll interpolation**

Inside the IIFE, after the WebGL render loop block (after the closing `}` of `if (gl) {`), add:

```javascript
  // Section color moods — ScrollTrigger interpolation
  if (liquidBg.gl) {
    const moods = [
      { sel: '.hero',        c1:'#0C0D12', c2:'#1C1836', c3:'#7C5CFF', c4:'#14151F' },
      { sel: '#services',    c1:'#1C1836', c2:'#7C5CFF', c3:'#FF7A2E', c4:'#2A1B12' },
      { sel: '#about',       c1:'#0C0D12', c2:'#35C87E', c3:'#7C5CFF', c4:'#14151F' },
      { sel: '#cases',       c1:'#08090D', c2:'#1C1836', c3:'#A98BFF', c4:'#14151F' },
      { sel: '#process',     c1:'#08090D', c2:'#14151F', c3:'#7C5CFF', c4:'#0C0D12' },
      { sel: '#calc',        c1:'#1C1836', c2:'#FF7A2E', c3:'#E3A24C', c4:'#2A1B12' },
      { sel: '#guarantees',  c1:'#0C0D12', c2:'#1C1836', c3:'#35C87E', c4:'#08090D' },
      { sel: '#faq',         c1:'#08090D', c2:'#14151F', c3:'#7C5CFF', c4:'#0C0D12' },
      { sel: '#reviews',     c1:'#0C0D12', c2:'#7C5CFF', c3:'#A98BFF', c4:'#1C1836' },
      { sel: '#contact',     c1:'#1C1836', c2:'#7C5CFF', c3:'#A98BFF', c4:'#0C0D12' }
    ];

    function lerpColor(a, b, t) {
      return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
    }

    moods.forEach((mood) => {
      const el = document.querySelector(mood.sel);
      if (!el) return;
      const target = { c1: hexToVec3(mood.c1), c2: hexToVec3(mood.c2), c3: hexToVec3(mood.c3), c4: hexToVec3(mood.c4) };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'top 20%',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const prev = liquidBg.colors;
          liquidBg.colors = {
            c1: lerpColor(prev.c1, target.c1, p),
            c2: lerpColor(prev.c2, target.c2, p),
            c3: lerpColor(prev.c3, target.c3, p),
            c4: lerpColor(prev.c4, target.c4, p)
          };
        }
      });
    });
  }
```

**Important note about the lerp approach:** The `onUpdate` callback receives the ScrollTrigger's self-reported `progress` (0→1). However, since `prev` references the live object, each scroll frame lerps from the current state toward the target. This creates smooth transitions. The key is that `scrub: true` makes progress track scroll position, so scrolling into a section smoothly transitions colors toward that section's mood.

**Actually, the above has a bug** — it lerps `prev` (the current state) toward target on every update, which means reverse scrolling won't work correctly because `prev` has already been mutated. Instead, store each section's "from" colors as the colors when the trigger was created, and lerp between from and target based on progress:

Replace the ScrollTrigger block above with this corrected version:

```javascript
    moods.forEach((mood, i) => {
      const el = document.querySelector(mood.sel);
      if (!el) return;
      const to = { c1: hexToVec3(mood.c1), c2: hexToVec3(mood.c2), c3: hexToVec3(mood.c3), c4: hexToVec3(mood.c4) };
      const from = i === 0
        ? { c1: hexToVec3('#0C0D12'), c2: hexToVec3('#1C1836'), c3: hexToVec3('#7C5CFF'), c4: hexToVec3('#14151F') }
        : { c1: hexToVec3(moods[i-1].c1), c2: hexToVec3(moods[i-1].c2), c3: hexToVec3(moods[i-1].c3), c4: hexToVec3(moods[i-1].c4) };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'top 20%',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          liquidBg.colors = {
            c1: lerpColor(from.c1, to.c1, p),
            c2: lerpColor(from.c2, to.c2, p),
            c3: lerpColor(from.c3, to.c3, p),
            c4: lerpColor(from.c4, to.c4, p)
          };
        }
      });
    });
```

- [ ] **Step 2: Verify in browser**

Scroll through all sections. Expect:
- Background color mood changes smoothly as you enter each section
- Scrolling back up reverses the color transition
- Hero: dark navy/violet; Services: violet+orange; About: green+violet; etc.
- No flickering or jarring color jumps

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add scroll-driven section color moods for WebGL background"
```

---

### Task 3: Section Separators + 3D Card Shadows + Brighter Borders

**Files:**
- Modify: `style.css:690-716` (update glass card styles, add separators, enhance borders)

**Interfaces:**
- Consumes: Existing `.service-card`, `.guar-card`, `.about-card`, `.step-card` selectors, existing `--border-angle` animation, existing `::before`/`::after` pseudo-elements on cards
- Produces: Visual section dividers, multi-layer 3D shadows on cards, brighter border gradient

- [ ] **Step 1: Add section separator CSS**

After the glass cards block (~line 695), add section separator styles:

```css
/* section separators */
.section + .section::before {
  content: ''; display: block; width: 60%; max-width: 600px; height: 1px; margin: 0 auto;
  background: linear-gradient(90deg, transparent, rgba(124,92,255,0.3), transparent);
  box-shadow: 0 0 30px 10px rgba(124,92,255,0.08);
  position: relative; top: -1px;
}
```

- [ ] **Step 2: Update glass card styles with multi-layer 3D shadow**

Replace the existing glass card block (lines 690-695):

```css
.service-card, .guar-card, .about-card, .step-card {
  background: rgba(22, 23, 31, 0.6);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.08);
}
```

With this enhanced version:

```css
.service-card, .guar-card, .about-card, .step-card {
  background: rgba(22, 23, 31, 0.6);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.3),
    0 8px 16px rgba(0,0,0,0.25),
    0 16px 32px rgba(0,0,0,0.2),
    0 32px 64px rgba(0,0,0,0.15);
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease, border-color 0.3s;
}
.service-card:hover, .guar-card:hover, .about-card:hover, .step-card:hover {
  border-color: rgba(124,92,255,0.3);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.3),
    0 8px 16px rgba(124,92,255,0.08),
    0 20px 40px rgba(0,0,0,0.25),
    0 40px 80px rgba(0,0,0,0.18);
}
```

- [ ] **Step 3: Enhance the animated gradient border**

Replace the existing border gradient (line 701):
```css
  background: conic-gradient(from var(--border-angle), var(--violet), var(--teal), var(--go), var(--violet));
```

With a brighter, more saturated version:
```css
  background: conic-gradient(from var(--border-angle), var(--violet), var(--violet-2), #FF7A2E, var(--go), var(--violet));
```

Also extend the animated border to `.guar-card` and `.about-card`. After the existing `.service-card::before` block (lines 698-708), add:

```css
.guar-card, .about-card { position: relative; }
.guar-card::before, .about-card::before {
  content: ''; position: absolute; inset: -1px; border-radius: 15px; padding: 1px;
  background: conic-gradient(from var(--border-angle), var(--violet), var(--violet-2), #FF7A2E, var(--go), var(--violet));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity 0.4s;
}
.guar-card:hover::before, .about-card:hover::before { opacity: 1; animation: borderSpin 3s linear infinite; }
```

- [ ] **Step 4: Verify in browser**

Expect:
- Thin gradient glowing lines between each section
- All cards have visible depth (multi-layer shadows)
- On hover: border brightens with animated gradient, shadows deepen with violet tint
- Existing spotlight (::after) and tilt effects still work

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "feat: add section separators, 3D card shadows, brighter borders"
```

---

### Task 4: Gradient + Glow Typography

**Files:**
- Modify: `style.css` (add gradient text + glow filter on section h2 elements)

**Interfaces:**
- Consumes: `.section h2` selectors, `.hero h1` selector, CSS vars `--violet`, `--violet-2`
- Produces: Gradient-filled headings with soft glow

- [ ] **Step 1: Add gradient text and glow styles**

At the end of style.css (in the GSAP award section area, after the section separator styles), add:

```css
/* gradient + glow headings */
.section h2, .hero h1 {
  background: linear-gradient(135deg, var(--violet) 0%, var(--violet-2) 45%, #FF7A2E 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px rgba(124,92,255,0.3)) drop-shadow(0 0 40px rgba(124,92,255,0.1));
}
```

**Important:** The hero h1 already has a character-reveal animation that sets `display: inline-block` on child spans. The gradient + clip must work on the parent h1 — verify the spans don't break the gradient by checking that the h1 has the background and the spans inherit `background-clip: text` and `-webkit-text-fill-color: transparent`. If spans break the gradient (they will because each span is a separate element), apply the gradient to each span instead:

```css
.hero h1 span {
  background: linear-gradient(135deg, var(--violet) 0%, var(--violet-2) 45%, #FF7A2E 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero h1 {
  filter: drop-shadow(0 0 20px rgba(124,92,255,0.3)) drop-shadow(0 0 40px rgba(124,92,255,0.1));
}
```

For section h2 (no span splitting), the single rule works:

```css
.section h2 {
  background: linear-gradient(135deg, var(--violet) 0%, var(--violet-2) 45%, #FF7A2E 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px rgba(124,92,255,0.3)) drop-shadow(0 0 40px rgba(124,92,255,0.1));
}
```

- [ ] **Step 2: Handle reduced motion**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .section h2, .hero h1, .hero h1 span { filter: none; }
```

This removes the glow animation but keeps the gradient text (static, no performance cost).

- [ ] **Step 3: Verify in browser**

Expect:
- All section h2 headings show a violet→orange gradient fill
- Hero h1 also has gradient fill on each character span
- Soft purple glow around headings
- Existing text color for body/paragraph text unchanged
- Character reveal animation on hero h1 still works

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "feat: add gradient text and glow effect on section headings"
```

---

### Task 5: Glass Lens in Hero

**Files:**
- Modify: `index.html:119` (add lens div inside hero, after hero-portal)
- Modify: `style.css` (add lens CSS)
- Modify: `script.js` (add GSAP drift animation inside IIFE)

**Interfaces:**
- Consumes: `.hero` section DOM, `gsap`, `isTouch` from IIFE scope
- Produces: Visual glass lens element, no interfaces consumed by other tasks

- [ ] **Step 1: Add lens HTML element**

In `index.html`, after line 119 (`<div class="hero-portal" aria-hidden="true"></div>`), add:

```html
    <div class="hero-lens" aria-hidden="true"></div>
```

- [ ] **Step 2: Add lens CSS**

At the end of style.css (after the gradient typography styles), add:

```css
/* hero glass lens */
.hero-lens {
  position: absolute; right: 12%; top: 18%;
  width: 130px; height: 130px; border-radius: 50%;
  backdrop-filter: blur(18px) saturate(1.5);
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  background: radial-gradient(circle, rgba(124,92,255,0.1) 0%, rgba(124,92,255,0.02) 60%, transparent 100%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2), inset 0 0 30px rgba(124,92,255,0.05);
  pointer-events: none; z-index: 2;
  transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
}
.hero-lens::before {
  content: ''; position: absolute; inset: 4px; border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(255,122,46,0.06), rgba(124,92,255,0.08), rgba(53,200,126,0.06), rgba(255,122,46,0.06));
  filter: blur(4px);
}
.hero-lens::after {
  content: ''; position: absolute; top: 15%; left: 20%; width: 30%; height: 20%;
  background: rgba(255,255,255,0.12); border-radius: 50%;
  filter: blur(6px); transform: rotate(-30deg);
}
@media (hover: none) { .hero-lens { display: none; } }
@media (prefers-reduced-motion: reduce) { .hero-lens { display: none; } }
```

- [ ] **Step 3: Add GSAP drift animation**

In `script.js`, inside the IIFE, after the section mood ScrollTriggers (or after the WebGL block if Task 2 code isn't present yet), and guarded by `if (!isTouch)`, add:

```javascript
  // Glass lens drift
  if (!isTouch) {
    const lens = document.querySelector('.hero-lens');
    if (lens) {
      gsap.to(lens, {
        x: 40, y: 25, duration: 12, repeat: -1, yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to(lens, {
        x: -30, y: -20, duration: 17, repeat: -1, yoyo: true,
        ease: 'sine.inOut', delay: 3
      });
    }
  }
```

This creates a figure-8-like drift by combining two sine motions at different speeds.

- [ ] **Step 4: Verify in browser**

Expect:
- A circular glass-like element in the hero section (right side, upper area)
- Slowly drifts in a smooth pattern
- Blurs and slightly tints content behind it
- Has a subtle chromatic inner ring and a specular highlight
- Hidden on mobile / reduced motion
- Does not interfere with hero text or other elements (pointer-events: none)

- [ ] **Step 5: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: add glass lens element in hero with drift animation"
```

---

### Task 6: 3D Tilt Shadow Shift + Version Bump + Final Polish

**Files:**
- Modify: `script.js` (enhance existing card tilt to shift shadow)
- Modify: `index.html` (bump `?v=35` → `?v=36`)

**Interfaces:**
- Consumes: Existing card spotlight mousemove handler in IIFE (the block that sets `--mx`/`--my` CSS vars), card DOM elements
- Produces: Dynamic shadow offset on card hover/tilt

- [ ] **Step 1: Add dynamic shadow shift to card mousemove handler**

Find the existing card spotlight block in script.js (the one that sets `--mx` and `--my` CSS vars on mousemove). It looks like:

```javascript
    document.querySelectorAll('.service-card, .guar-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
```

Extend it to also shift the box-shadow based on cursor position. After the `--my` line, add:

```javascript
        const dx = (e.clientX - r.left - r.width/2) / (r.width/2);
        const dy = (e.clientY - r.top - r.height/2) / (r.height/2);
        const shadowX = -dx * 12;
        const shadowY = -dy * 12;
        card.style.boxShadow = `
          ${shadowX*0.1}px ${2+shadowY*0.1}px 4px rgba(0,0,0,0.3),
          ${shadowX*0.3}px ${8+shadowY*0.3}px 16px rgba(124,92,255,0.08),
          ${shadowX*0.6}px ${20+shadowY*0.6}px 40px rgba(0,0,0,0.25),
          ${shadowX}px ${40+shadowY}px 80px rgba(0,0,0,0.18)
        `;
```

On `mouseleave`, reset the shadow. Find the existing mouseleave handler (or add one) and add:

```javascript
      card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
      });
```

- [ ] **Step 2: Bump version in index.html**

Replace `style.css?v=35` with `style.css?v=36` and `script.js?v=35` with `script.js?v=36` in index.html.

- [ ] **Step 3: Verify full site in browser**

Open the site and scroll through all sections. Verify:
- WebGL liquid background renders and morphs
- Background color changes per section on scroll
- Section separators visible between sections
- Cards have 3D depth shadows
- Card hover: shadow shifts with cursor position (3D light effect)
- Animated gradient borders appear on card hover
- Section headings have gradient text + purple glow
- Glass lens drifts in hero
- Scrolling up and down works — no content disappearing
- Mobile viewport: WebGL at lower res, lens hidden, cursor hidden
- No console errors

- [ ] **Step 4: Commit**

```bash
git add index.html style.css script.js
git commit -m "feat: add 3D shadow shift on card hover, bump to v36"
```
