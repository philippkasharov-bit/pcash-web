document.documentElement.classList.add('js');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- first-load reveal (preloader out + staged hero entrance) ----
const preloaderFill = document.getElementById('preloaderFill');
let loadProgress = 0;
const fillInterval = setInterval(() => {
  loadProgress = Math.min(loadProgress + Math.random() * 15 + 5, 90);
  if (preloaderFill) preloaderFill.style.width = loadProgress + '%';
}, 120);

function markLoaded() {
  clearInterval(fillInterval);
  if (preloaderFill) preloaderFill.style.width = '100%';
  setTimeout(() => requestAnimationFrame(() => document.body.classList.add('loaded')), 300);
}
if (document.readyState === 'complete') { setTimeout(markLoaded, 300); }
else { window.addEventListener('load', () => setTimeout(markLoaded, 350)); }
setTimeout(markLoaded, 2500); // safety fallback

// ---- language toggle ----
const langButtons = document.querySelectorAll('.lang-toggle button');
const i18nNodes = document.querySelectorAll('[data-ru]');
let currentLang = 'ru';

function setLang(lang) {
  currentLang = lang;
  i18nNodes.forEach((n) => {
    if (n.dataset[lang] !== undefined) {
      if (n.dataset[lang].includes('<')) n.innerHTML = n.dataset[lang];
      else n.textContent = n.dataset[lang];
    }
  });
  document.querySelectorAll('[data-ph-ru]').forEach(el => {
    el.placeholder = el.dataset['ph' + (lang === 'ru' ? 'Ru' : 'En')];
  });
  langButtons.forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  document.documentElement.lang = lang;
}
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---- section reveal on scroll ----
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('seen'); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.section').forEach((s) => revealObserver.observe(s));

// ---- clip-path section transitions ----
(function () {
  const clipEls = [...document.querySelectorAll('.clip-reveal')];
  if (!clipEls.length) return;
  // IntersectionObserver, not a scroll listener — Lenis drives scrolling and a
  // missed scroll event used to leave a section stranded at opacity 0.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('clip-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  clipEls.forEach((el) => io.observe(el));
  // safety net: anything still hidden after load gets revealed outright
  window.addEventListener('load', () => setTimeout(() => {
    clipEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('clip-in');
    });
  }, 400));
})();

// ---- mobile menu (burger) ----
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
}

// ---- active nav highlight ----
const navLinks = document.querySelectorAll('.main-nav a:not(.nav-cta):not(.drop-link)');
const navMap = {};
navLinks.forEach((a) => { navMap[a.getAttribute('href').slice(1)] = a; });
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && navMap[entry.target.id]) {
      navLinks.forEach((a) => a.classList.remove('active'));
      navMap[entry.target.id].classList.add('active');
    }
  });
}, { threshold: 0.5 });
['services','about','cases','process','calc','guarantees','faq','contact'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) navObserver.observe(el);
});

// ---- anchor dots (replaces the old "01 / 11" counter, which showed a
// number but could not take you anywhere) ----
(function () {
  const nav = document.getElementById('dotNav');
  if (!nav) return;
  const names = {
    services: 'Услуги', about: 'Обо мне', cases: 'Работы', process: 'Процесс',
    calc: 'Цены', guarantees: 'Гарантии', faq: 'Вопросы', contact: 'Контакты'
  };
  const secs = [{ id: 'top', el: document.querySelector('.hero'), name: 'Начало' }]
    .concat(Object.keys(names)
      .map((id) => ({ id, el: document.getElementById(id), name: names[id] }))
      .filter((s) => s.el));

  secs.forEach((s) => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.setAttribute('aria-label', s.name);
    a.innerHTML = '<span class="dot-label">' + s.name + '</span>';
    nav.appendChild(a);
    s.link = a;
  });

  // Активной была последняя секция, пересёкшая порог 0.35: на высоком
  // экране порог одновременно проходят несколько, и нижняя затирала
  // верхнюю — подсветка перескакивала через «Вопросы» на «Контакты».
  // Считать «кто накрывает середину экрана» тоже неверно: секции здесь
  // короче экрана, и после перехода по якорю середину накрывает уже
  // следующая секция. Берём обычный scroll-spy: активна последняя
  // секция, чей верх поднялся выше линии под липкой шапкой.
  const SPY_LINE = 140;
  function syncDots() {
    let best = secs[0];
    secs.forEach((s) => {
      if (s.el.getBoundingClientRect().top - SPY_LINE <= 0) best = s;
    });
    // у самого низа страницы последняя секция может не дотянуть до линии
    const atBottom = window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (atBottom) best = secs[secs.length - 1];
    secs.forEach((s) => s.link.classList.toggle('active', s === best));
  }
  syncDots();
  // Скроллом управляет Lenis, а он подавляет нативное событие scroll —
  // слушать только window бесполезно. IntersectionObserver срабатывает
  // от изменения геометрии и служит основным триггером.
  const io = new IntersectionObserver(syncDots, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  secs.forEach((s) => io.observe(s.el));
  window.addEventListener('resize', syncDots);
  window.addEventListener('scroll', syncDots, { passive: true });
  window.__syncDots = syncDots;
})();

// ---- scroll progress + back to top ----
const scrollProgress = document.getElementById('scrollProgress');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const denom = h.scrollHeight - h.clientHeight;
  const scrolled = denom > 0 ? h.scrollTop / denom : 0;
  // scaleX is composited; animating width relayouts on every scroll frame
  if (scrollProgress) scrollProgress.style.transform = 'scaleX(' + scrolled + ')';
  if (toTop) toTop.classList.toggle('show', h.scrollTop > 500);
}, { passive: true });
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---- count-up on hero facts ----
document.querySelectorAll('.count-up').forEach((el) => {
  const target = parseInt(el.dataset.to, 10);
  const cObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      obs.unobserve(el);
      let cur = 0;
      const step = () => { cur += 1; el.textContent = cur; if (cur < target) setTimeout(step, 260); };
      step();
    });
  }, { threshold: 0.6 });
  cObs.observe(el);
});

// ---- process steps reveal ----
const steps = document.querySelectorAll('.step');
const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const idx = [...steps].indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('lit'), idx * 180);
    }
  });
}, { threshold: 0.4 });
steps.forEach((s) => stepObserver.observe(s));

// ---- faq ----
document.querySelectorAll('.faq-q').forEach((btn) => {
  // keep aria-expanded truthful — a static "false" lies to screen readers
  btn.setAttribute('aria-expanded', String(btn.parentElement.classList.contains('open')));
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((i) => {
      i.classList.remove('open');
      const b = i.querySelector('.faq-q');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// review form removed together with its section — no reviews to show yet

/* ---------------------------------------------------------------
   Form delivery.
   Put a Web3Forms access key in FORM_ACCESS_KEY (free, no account
   needed to start: https://web3forms.com — the key is a public form
   identifier, not a secret). Until it is set, the form falls back to
   opening the visitor's mail client with everything pre-filled, so a
   message is never silently swallowed the way the old prototype did.
   --------------------------------------------------------------- */
const FORM_ACCESS_KEY = '';                      // <-- paste key here
const FORM_ENDPOINT   = 'https://api.web3forms.com/submit';
const FORM_EMAIL      = 'philippkasharov@gmail.com';

function formPayload(form) {
  const fd = new FormData(form);
  const o = {};
  fd.forEach((v, k) => { o[k] = v; });
  const rating = form.querySelectorAll('#stars button.on').length;
  if (rating) o['Оценка'] = rating + '/5';
  return o;
}

function showFormResult(form, ok) {
  const successEl = document.getElementById('formSuccess');
  if (ok && successEl) {
    form.style.display = 'none';
    successEl.hidden = false;
  } else {
    const parent = form.parentElement;
    const msg = document.createElement('div');
    msg.className = 'form-success';
    const ru = currentLang === 'ru';
    msg.innerHTML = ru
      ? '<span class="success-icon">✉</span><h3>Почти отправлено</h3><p>Откроется почтовый клиент с готовым письмом — нажмите «Отправить». Если клиент не открылся, напишите напрямую на ' + FORM_EMAIL + '</p>'
      : '<span class="success-icon">✉</span><h3>Almost sent</h3><p>Your mail app will open with a draft — hit send. If nothing opens, email me directly at ' + FORM_EMAIL + '</p>';
    form.style.display = 'none';
    parent.appendChild(msg);
  }
}

function mailtoFallback(form, subject) {
  const data = formPayload(form);
  const body = Object.entries(data)
    .filter(([k, v]) => v && k !== 'access_key')
    .map(([k, v]) => k + ': ' + v).join('\n');
  window.location.href = 'mailto:' + FORM_EMAIL +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
}

function validateContactForm(form) {
  let valid = true;
  const ru = currentLang === 'ru';
  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  const name = form.querySelector('#cf-name');
  if (name && !name.value.trim()) {
    name.classList.add('invalid');
    name.nextElementSibling.textContent = ru ? 'Введите имя' : 'Enter your name';
    valid = false;
  }

  const contact = form.querySelector('#cf-contact');
  if (contact) {
    const v = contact.value.trim();
    const looksLikeEmail = /\S+@\S+\.\S+/.test(v);
    const looksLikeTelegram = /^@?\w{3,}/.test(v);
    if (!v) {
      contact.classList.add('invalid');
      contact.nextElementSibling.textContent = ru ? 'Укажите email или Telegram' : 'Enter email or Telegram';
      valid = false;
    } else if (!looksLikeEmail && !looksLikeTelegram) {
      contact.classList.add('invalid');
      contact.nextElementSibling.textContent = ru ? 'Введите email (you@mail.ru) или Telegram (@ник)' : 'Enter an email (you@mail.com) or Telegram (@handle)';
      valid = false;
    }
  }

  const msg = form.querySelector('#cf-msg');
  if (msg && !msg.value.trim()) {
    msg.classList.add('invalid');
    msg.nextElementSibling.textContent = ru ? 'Опишите задачу' : 'Describe your task';
    valid = false;
  }
  return valid;
}

function submitWithFeedback(form, subjectRu, subjectEn) {
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateContactForm(form)) return;
    const btn = form.querySelector('button[type="submit"]');
    if (!btn || btn.classList.contains('loading') || btn.classList.contains('success')) return;
    const subject = currentLang === 'ru' ? subjectRu : subjectEn;
    btn.classList.add('loading');
    if (window.plausible) window.plausible('Form submit', { props: { form: form.id } });

    if (!FORM_ACCESS_KEY) {
      mailtoFallback(form, subject);
      showFormResult(form, false);
      return;
    }
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.assign(
          { access_key: FORM_ACCESS_KEY, subject: subject, from_name: 'P.Cash — сайт' },
          formPayload(form)))
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showFormResult(form, true);
    } catch (err) {
      // network or service failure must not eat the message
      mailtoFallback(form, subject);
      showFormResult(form, false);
    }
  });
}
submitWithFeedback(document.getElementById('contactForm'), 'Заявка с сайта P.Cash', 'Enquiry from the P.Cash site');

// ---- chat widget ----
const kb = [
  { keys: ['цена','стоит','сколько','прайс','стоимость','price','cost','how much'], ru: 'Сайт под ключ — от $250, ИИ-бот — от $80, UX-аудит — от $25. Точная цена — после брифа.', en: 'Full site — from $250, AI bot — from $80, UX audit — from $25. Exact price after a brief.' },
  { keys: ['бот','ии','чат','автоматиз','bot','ai','chat','automat'], ru: 'Делаю ИИ-ботов, которые отвечают по базе знаний вашего бизнеса — на сайте или в мессенджерах. Плюс любые автоматизации: заявки, CRM, уведомления. Бот вроде меня.', en: 'I build AI bots that answer from your business knowledge base — on the site or in messengers. Plus any automation: leads, CRM, notifications. A bot like me.' },
  { keys: ['срок','долго','когда','время','time','deadline','how long'], ru: 'Лендинг — от недели, сайт с ботом — 2-3 недели, аудит — 2-3 дня. Срок фиксируем до старта.', en: 'Landing — from a week, site with a bot — 2-3 weeks, audit — 2-3 days. Deadline fixed before we start.' },
  { keys: ['опыт','отзыв','кейс','кто','experience','review','case','who'], ru: 'Филип — дизайнер и разработчик с 2 годами практики. Первым клиентам — цена ниже рынка за честный отзыв.', en: 'Philip — designer and developer with 2 years of practice. First clients get below-market pricing for an honest review.' },
  { keys: ['оплат','предоплат','pay','payment'], ru: 'Предоплата 50%, остаток — после сдачи и вашей проверки.', en: '50% upfront, the rest after delivery and your review.' },
  { keys: ['привет','здравств','hello','hi'], ru: 'Привет! Спросите про услуги, цены или сроки.', en: 'Hi! Ask about services, prices or timelines.' },
];
const fallback = { ru: 'На это лучше ответит сам Филип — напишите в форму внизу или на philippkasharov@gmail.com.', en: 'Philip can answer that best — use the form below or email philippkasharov@gmail.com.' };

const fab = document.getElementById('fab');
const panel = document.getElementById('panel');
const log = document.getElementById('log');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const quickRow = document.getElementById('quickRow');
let opened = false;

if (fab && panel && chatInput && chatSend) {
  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (!opened) {
      opened = true;
      if (window.plausible) window.plausible('Chat open');
      setTimeout(() => botSay(currentLang === 'ru' ? 'Это демо ИИ-бота — такого же я соберу под ваш бизнес. Спросите про услуги, цены или сроки.' : "This is a live demo of the AI bot I build. Ask about services, prices or timelines."), 350);
    }
  });
  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'msg ' + who; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function botSay(text) {
    const t = document.createElement('div');
    t.className = 'typing'; t.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(t); log.scrollTop = log.scrollHeight;
    setTimeout(() => { t.remove(); addMsg(text, 'bot'); }, 700 + Math.random() * 400);
  }
  function answer(q) {
    const lower = q.toLowerCase();
    const hit = kb.find((item) => item.keys.some((k) => lower.includes(k)));
    botSay(hit ? hit[currentLang] : fallback[currentLang]);
  }
  function submitChat() {
    const q = chatInput.value.trim();
    if (!q) return;
    addMsg(q, 'user'); chatInput.value = ''; answer(q);
  }
  chatSend.addEventListener('click', submitChat);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitChat(); });
  quickRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick');
    if (!btn) return;
    addMsg(btn.textContent, 'user');
    answer(btn.dataset.q);
  });
}

// 3D card tilt removed — the rotation fought the flat block styling

// ---- floating trade icons in the fog --------------------------------
// These replace the dot particles rather than joining them: two particle
// systems at once would make the background noisy and pull attention off
// the copy. Same canvas, same rAF loop, same visibility guard.
(function () {
  const c = document.getElementById('bgWaves');
  if (!c || reducedMotion) return;
  const ctx = c.getContext('2d');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  // One symbol per thing Phil sells. Drawn as paths on a 24x24 grid so
  // they stay crisp at any size and cost nothing to load.
  // Ten symbols, one per thing Phil sells. Each is built from several
  // paths on a 24x24 grid so it reads as a drawn schematic rather than a
  // silhouette — that internal structure is what gives it the technical
  // character. Circles use the compact arc form.
  const C = (x, y, r) => 'M' + x + ' ' + y + 'm-' + r + ' 0a' + r + ' ' + r +
                         ' 0 10' + (r * 2) + ' 0a' + r + ' ' + r + ' 0 10-' + (r * 2) + ' 0';
  const GLYPHS = [
    // микрочип — корпус, ядро, выводы с четырёх сторон
    ['M7 7h10v10H7z', 'M10.5 10.5h3v3h-3z',
     'M9.5 7V4', 'M12 7V4', 'M14.5 7V4',
     'M9.5 17v3', 'M12 17v3', 'M14.5 17v3',
     'M7 9.5H4', 'M7 12H4', 'M7 14.5H4',
     'M17 9.5h3', 'M17 12h3', 'M17 14.5h3'],
    // терминал — окно, заголовок, приглашение и строка
    ['M3 5h18v14H3z', 'M3 9h18', C(5.6, 7, 0.6), C(7.8, 7, 0.6), C(10, 7, 0.6),
     'M6 12.5l2.4 2.2L6 16.9', 'M11.5 16.9h6'],
    // нейросеть — три слоя узлов со связями
    [C(5, 7, 1.5), C(5, 17, 1.5), C(12, 12, 1.5), C(19, 7, 1.5), C(19, 17, 1.5),
     'M6.4 7.8l4.2 3.4', 'M6.4 16.2l4.2-3.4', 'M13.4 11.2l4.2-3.4', 'M13.4 12.8l4.2 3.4'],
    // API — скобки и полезная нагрузка между ними
    ['M9 4C6 4 7 10 4 12c3 2 2 8 5 8', 'M15 4c3 0 2 6 5 8-3 2-2 8-5 8',
     C(10.4, 12, 0.85), C(13.6, 12, 0.85)],
    // база данных — три слоя с индикатором
    ['M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3z',
     'M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6',
     'M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6',
     'M16.5 17.5h1.5'],
    // автоматизация — узлы и связи потока
    ['M3 4h6v5H3z', 'M15 4h6v5h-6z', 'M9 15h6v5H9z',
     'M9 6.5h6', 'M18 9v3.5H12V15', 'M6 9v6.5h3',
     'M15.6 5.9l1.4 1.4 2-2.4'],
    // артборд — рамка с точками привязки и сеткой
    ['M6.5 6.5h11v11h-11z', 'M6.5 11h11', 'M11 6.5v11',
     C(6.5, 6.5, 1.4), C(17.5, 6.5, 1.4), C(6.5, 17.5, 1.4), C(17.5, 17.5, 1.4)],
    // безье — кривая с управляющими рычагами
    ['M4 18c6.5 0 9.5-12 16-12', 'M4 18l5-6', 'M20 6l-5 6',
     C(4, 18, 1.5), C(20, 6, 1.5), C(9, 12, 0.9), C(15, 12, 0.9)],
    // git — ветвление с коммитами
    [C(6, 5.5, 1.8), C(6, 18.5, 1.8), C(18, 9.5, 1.8),
     'M6 7.3v9.4', 'M18 11.3v.7c0 3.4-4.2 3.6-6.6 4.8'],
    // сигнал — осциллограмма на сетке
    ['M2 20V4', 'M2 20h20', 'M2 12h20',
     'M4 12l2.5-6 2.6 12L12 9l2.2 5 2.3-8L19 12h3']
  ];

  let W = 0, H = 0, items = [], raf = null;
  const mouse = { x: -9999, y: -9999 };

  function build() {
    W = c.width = Math.floor(innerWidth * dpr);
    H = c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    const count = innerWidth < 760 ? 9 : 18;
    items = Array.from({ length: count }, (_, i) => spawn(i));
  }

  function spawn(i) {
    // three depth layers: far ones smaller, fainter, slower
    const depth = 0.35 + Math.random() * 0.65;
    return {
      paths: GLYPHS[i % GLYPHS.length],
      x: Math.random() * W,
      y: Math.random() * H,
      size: (22 + depth * 24) * dpr,
      vx: (Math.random() - 0.5) * 0.10 * depth * dpr,
      vy: (0.05 + Math.random() * 0.10) * depth * dpr,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.0018,
      alpha: 0.09 + depth * 0.13,
      warm: Math.random() < 0.35,
      depth,
      // shove + jitter state, both decay back to the drift
      px: 0, py: 0, jitter: 0
    };
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    for (const it of items) {
      if (fine) {
        const dx = it.x - mouse.x, dy = it.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = 130 * dpr;
        if (d2 < R * R) {
          const d = Math.max(Math.sqrt(d2), 1);
          const force = (1 - d / R) * 0.9;          // falls off with distance
          it.px += (dx / d) * force;                 // push away from the pointer
          it.py += (dy / d) * force;
          it.jitter = Math.min(1, it.jitter + force * 0.5);
        }
      }
      // shove decays, so it drifts back into its normal motion
      it.px *= 0.94; it.py *= 0.94;
      it.jitter *= 0.90;

      const shake = it.jitter * 2.2 * dpr;
      it.x += it.vx + it.px + (Math.random() - 0.5) * shake;
      it.y += it.vy + it.py + (Math.random() - 0.5) * shake;
      it.rot += it.spin + it.jitter * 0.02;

      const m = it.size * 2;
      if (it.y - m > H) { it.y = -m; it.x = Math.random() * W; }
      if (it.x < -m) it.x = W + m; else if (it.x > W + m) it.x = -m;

      draw(it);
    }
    raf = requestAnimationFrame(step);
  }

  function draw(it) {
    const s = it.size / 24;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    ctx.scale(s, s);
    ctx.translate(-12, -12);
    ctx.lineWidth = 1.35 / s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const a = it.alpha * (1 + it.jitter * 0.8);
    ctx.strokeStyle = it.warm
      ? 'rgba(255,150,90,' + a + ')'
      : 'rgba(170,140,255,' + a + ')';
    for (const d of it.paths) ctx.stroke(new Path2D(d));
    ctx.restore();
  }

  function start() { if (!raf) raf = requestAnimationFrame(step); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  build();
  addEventListener('resize', build);
  if (fine) addEventListener('mousemove', (e) => {
    mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr;
  }, { passive: true });
  addEventListener('mouseout', () => { mouse.x = mouse.y = -9999; });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
})();

// ===================== award-site animations (Lenis, split-text, cursor, magnetic, parallax) =====================
(function () {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 1 — Lenis smooth inertia scroll
  let lenis = null;
  if (window.Lenis && !reducedMotion) {
    try {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      window.__lenis = lenis;
      // If GSAP is present, its ticker will drive Lenis (see GSAP IIFE
      // below). Otherwise fall back to a standalone RAF loop.
      if (typeof gsap === 'undefined') {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id && id.length > 1) { const t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }
      }));
    } catch (e) { lenis = null; }
  }

  // word-split reveal removed — GSAP ScrollTrigger handles h2 reveals

  // 3D card tilt on mouse move
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const tiltCards = document.querySelectorAll('.service-card, .guar-card, .step-card, .post, .about-principles li');
    tiltCards.forEach((card, i) => {
      card.style.setProperty('--card-i', i);
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // hero canvas scroll fade
  if (typeof window.__heroCanvasFade === 'function') {
    if (lenis) lenis.on('scroll', (e) => window.__heroCanvasFade(e.scroll));
    else window.addEventListener('scroll', () => window.__heroCanvasFade(window.scrollY), { passive: true });
  }
})();

/* ===================== interactive hero blob ===================== */
(function () {
  const wrap = document.querySelector('.hero-photo.photo-placeholder');
  if (!wrap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.width = 380; canvas.height = 507;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:24px;pointer-events:none;z-index:1;';
  wrap.style.position = 'relative';
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let mx = 0.5, my = 0.5, t = 0;

  wrap.parentElement.addEventListener('mousemove', (e) => {
    const r = wrap.getBoundingClientRect();
    mx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    my = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
  });

  function draw() {
    t += 0.012;
    ctx.clearRect(0, 0, 380, 507);
    const cx = 190 + (mx - 0.5) * 80;
    const cy = 253 + (my - 0.5) * 80;
    for (let i = 3; i >= 0; i--) {
      const r = 80 + i * 35 + Math.sin(t + i) * 18;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const alpha = 0.15 - i * 0.03;
      grad.addColorStop(0, 'rgba(124,92,255,' + alpha + ')');
      grad.addColorStop(0.5, 'rgba(255,122,46,' + (alpha * 0.5) + ')');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx + Math.sin(t * 0.8 + i * 1.2) * 25, cy + Math.cos(t * 0.6 + i) * 25, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ===================== GSAP Award Animations ===================== */
(function initAwardAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  const isTouch = matchMedia('(hover: none)').matches;
  if (reducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with ScrollTrigger
  const _lenis = window.__lenis;
  if (_lenis) {
    _lenis.on('scroll', ScrollTrigger.update);
    _lenis.on('scroll', () => { if (window.__syncDots) window.__syncDots(); });
    gsap.ticker.add((time) => { _lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

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

// Vanta-style FOG: fractal brownian motion warped by a second fbm.
// Soft drifting cloud banks with no hard edges — the colour ramp runs
// base -> lowlight -> midtone -> highlight across the noise value.
float fbm(vec3 p){
  // 3 octaves, not 5: the last two land below the size of a visible
  // fog wisp and cost 40% of the shader for detail nobody can see.
  float v=0.0, a=0.5;
  for(int i=0;i<3;i++){
    v+=a*snoise(p);
    p*=2.02;
    a*=0.5;
  }
  return v;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float asp=u_res.x/u_res.y;
  vec2 p=vec2(uv.x*asp,uv.y)*1.15;      // zoom
  float t=u_time*0.035;                  // slow drift
  vec2 mOff=(u_mouse-0.5)*0.10;

  // domain warp — this is what gives fog its billowing, non-repeating look
  vec3 q=vec3(p+mOff,t);
  float w1=fbm(q);
  float w2=fbm(q+vec3(5.2,1.3,0.0));
  vec3 r=vec3(p+0.55*vec2(w1,w2)+mOff*0.5,t*1.1);
  float f=fbm(r);

  float n=clamp(f*0.5+0.5,0.0,1.0);
  n=smoothstep(0.08,0.92,n);             // soften, keep the mid range wide

  // the pointer thins the fog: banks fade toward the base tone around it,
  // with a wide falloff so the clearing has no edge
  float d=distance(vec2(uv.x*asp,uv.y),vec2(u_mouse.x*asp,u_mouse.y));
  float clear=1.0-smoothstep(0.0,0.34,d);
  n=mix(n,n*0.28,clear*0.72);

  // four-stop ramp, each band wide so transitions stay blurry
  vec3 col=mix(u_c1,u_c2,smoothstep(0.00,0.45,n));
  col=mix(col,u_c3,smoothstep(0.35,0.78,n));
  col=mix(col,u_c4,smoothstep(0.68,1.00,n));

  // faint large-scale breathing so it never looks static
  col*=0.94+0.06*fbm(vec3(p*0.6,t*0.5));
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

      liquidBg.colors = {
        c1: hexToVec3('#07080C'),
        c2: hexToVec3('#191233'),
        c3: hexToVec3('#4A2E86'),
        c4: hexToVec3('#7E52B3')
      };

      function resizeLiquid() {
        // Fog is nothing but smooth gradients, so it does not need one
        // texel per screen pixel — rendering at 45% and letting the GPU
        // upscale costs ~5x fewer fragment shader runs and is not visible.
        const dpr = 1;
        const scale = isTouch ? 0.4 : 0.45;
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
      let lastDraw = 0;
      gsap.ticker.add(() => {
        // the fog drifts at 0.035 units/sec — 30fps is indistinguishable
        // from 60 here and halves the shader work
        const nowMs = performance.now();
        if (nowMs - lastDraw < 33) return;
        lastDraw = nowMs;
        liquidBg.mouseCurrent[0] += (liquidBg.mouseTarget[0] - liquidBg.mouseCurrent[0]) * 0.12;
        liquidBg.mouseCurrent[1] += (liquidBg.mouseTarget[1] - liquidBg.mouseCurrent[1]) * 0.12;
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

  // Section color moods — ScrollTrigger interpolation
  if (liquidBg.gl) {
    function lerpColor(a, b, t) {
      return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
    }

    // Fog ramp per section: c1 base (darkest) -> c2 lowlight ->
    // c3 midtone -> c4 highlight. Kept dark enough that body copy stays
    // above 7:1 contrast while the cloud banks are clearly readable.
    const moods = [
      { sel: '.hero',        c1:'#07080C', c2:'#191233', c3:'#4A2E86', c4:'#7E52B3' },
      { sel: '#services',    c1:'#07080C', c2:'#1B1226', c3:'#4E2A52', c4:'#9D543A' },
      { sel: '#about',       c1:'#07080C', c2:'#101C22', c3:'#2A3F63', c4:'#685DAD' },
      { sel: '#cases',       c1:'#06070A', c2:'#151030', c3:'#3E2878', c4:'#7A52B4' },
      { sel: '#process',     c1:'#06070A', c2:'#0F1720', c3:'#28324F', c4:'#5E5A9E' },
      { sel: '#calc',        c1:'#07080C', c2:'#1E1524', c3:'#572F44', c4:'#955A33' },
      { sel: '#guarantees',  c1:'#06070A', c2:'#0E1A1C', c3:'#1F3A44', c4:'#38726A' },
      { sel: '#faq',         c1:'#06070A', c2:'#12112A', c3:'#332863', c4:'#6A54A6' },
      { sel: '#reviews',     c1:'#07080C', c2:'#181234', c3:'#452B84', c4:'#7F53AE' },
      { sel: '#contact',     c1:'#08090F', c2:'#1C1440', c3:'#523098', c4:'#8152AD' }
    ];

    moods.forEach((mood, i) => {
      const el = document.querySelector(mood.sel);
      if (!el) return;
      const to = { c1: hexToVec3(mood.c1), c2: hexToVec3(mood.c2), c3: hexToVec3(mood.c3), c4: hexToVec3(mood.c4) };
      const from = i === 0
        ? { c1: hexToVec3('#07080C'), c2: hexToVec3('#191233'), c3: hexToVec3('#4A2E86'), c4: hexToVec3('#7E52B3') }
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
  }

  document.body.classList.add('gsap-ready');

  // Custom cursor — arrow glyph leads, small dot trails it
  if (!isTouch) {
    document.body.classList.add('has-custom-cursor');
    const pen = document.querySelector('.cursor-pen');
    const dot = document.querySelector('.cursor-dot');
    if (pen && dot) {
      const xPen = gsap.quickTo(pen, 'left', { duration: 0.05, ease: 'none' });
      const yPen = gsap.quickTo(pen, 'top', { duration: 0.05, ease: 'none' });
      const xDot = gsap.quickTo(dot, 'left', { duration: 0.45, ease: 'power3' });
      const yDot = gsap.quickTo(dot, 'top', { duration: 0.45, ease: 'power3' });

      document.addEventListener('mousemove', (e) => {
        xPen(e.clientX); yPen(e.clientY);
        xDot(e.clientX); yDot(e.clientY);
      });

      document.addEventListener('mouseleave', () => { pen.style.opacity = '0'; dot.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { pen.style.opacity = '1'; dot.style.opacity = '1'; });
    }
  }

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

  // Section clip-path transitions
  const clipMap = {
    services:   { from: 'circle(0% at 50% 50%)',    to: 'circle(150% at 50% 50%)' },
    about:      { from: 'polygon(0 0, 0 0, 0 100%, 0 100%)', to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    cases:      { from: 'inset(10% round 24px)',     to: 'inset(0% round 0px)' },
    process:    { from: 'inset(20%)',                 to: 'inset(0%)' },
    calc:       { from: 'inset(15%)',                 to: 'inset(0%)' },
    guarantees: { from: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)', to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    faq:        { from: 'inset(8% round 20px)',      to: 'inset(0% round 0px)' },
    reviews:    { from: 'inset(0 100% 0 0)',          to: 'inset(0 0% 0 0)' },
    contact:    { from: 'circle(0% at 90% 90%)',      to: 'circle(150% at 90% 90%)' }
  };

  Object.entries(clipMap).forEach(([id, clip]) => {
    const section = document.getElementById(id);
    if (!section) return;
    gsap.fromTo(section, { clipPath: clip.from }, { clipPath: clip.to, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 85%', once: true }
    });
  });

  // Reveal order: heading block first, then everything else, all of it
  // surfacing out of the fog (blur -> sharp) rather than just sliding.
  //
  // Blur is applied ONLY to blocks, never to the headings: those paint
  // through background-clip:text, and a filter on such an element breaks
  // the clip and the glyphs disappear. clearProps drops the inline filter
  // once the tween ends so no stray containing block is left behind.
  const BLOCKS = '.service-card, .post, .guar-card, .step-card, .faq-item, ' +
                 '.calc, .review-card, .contact-card, .cases-cta, .price-teaser, ' +
                 '.about-principles li, .wf-card, .hero-visual';

  // Initial states go on immediately (no flash of finished content), but
  // the triggers are built after load and after a refresh: created too
  // early they were computing start positions against a layout that had
  // not settled, so every one of them fired at once and — being `once` —
  // killed itself, leaving the whole page revealed before any scrolling.
  const revealGroups = [];
  document.querySelectorAll('.section').forEach((section) => {
    // GSAP owns section reveals — remove clip-fade so the CSS
    // IntersectionObserver system doesn't compete.
    section.classList.remove('clip-fade');
    section.classList.add('clip-in');
    const head = [...section.querySelectorAll(':scope > .kicker, :scope > h2, :scope > .section-sub')];
    const blocks = [...section.querySelectorAll(BLOCKS)];
    if (head.length) gsap.set(head, { opacity: 0, y: 26 });
    blocks.forEach((el) => gsap.set(el, { opacity: 0, y: 30 }));
    revealGroups.push({ section, head, blocks });
  });

  function buildRevealTriggers() {
    revealGroups.forEach(({ section, head, blocks }) => {
      const headDelay = head.length ? 0.4 : 0;
      if (head.length) {
        ScrollTrigger.create({
          trigger: section, start: 'top 84%', once: true,
          onEnter: () => gsap.to(head, {
            opacity: 1, y: 0, duration: 1.0, stagger: 0.12, ease: 'expo.out'
          })
        });
      }
      blocks.forEach((el, i) => {
        const isCard = el.matches('.service-card, .guar-card, .step-card, .post, .about-principles li, .review-card, .contact-card, .faq-item');
        if (isCard) {
          gsap.set(el, { opacity: 0, y: 40, scale: 0.94 });
        }
        ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: () => {
            const siblings = blocks.filter(b => b.parentElement === el.parentElement);
            const idx = siblings.indexOf(el);
            gsap.to(el, {
              opacity: 1, y: 0, scale: 1,
              duration: isCard ? 0.85 : 0.75,
              delay: headDelay + (isCard ? idx * 0.1 : 0),
              ease: isCard ? 'back.out(1.2)' : 'power3.out',
              onComplete: () => { if (isCard) el.classList.add('seen-card'); }
            });
          }
        });
      });
    });
    ScrollTrigger.refresh();
  }

  function scheduleRevealTriggers() {
    requestAnimationFrame(() => requestAnimationFrame(buildRevealTriggers));
  }
  if (document.readyState === 'complete') scheduleRevealTriggers();
  else window.addEventListener('load', () => setTimeout(scheduleRevealTriggers, 200));

  // ---- 3D drum: sections tilt through the viewport ----------------
  // Each section rides a cylinder — it enters tipped away from you,
  // straightens as it reaches the middle of the screen and tips back as
  // it leaves. Applied to .section only, never .hero: the headline
  // letters paint through background-attachment, and a transform on an
  // ancestor would break that.
  //
  // The tilt is deliberately partial rather than a full 90deg face turn.
  // Edge-on text is unreadable, and this page has to be read.
  if (!isTouch) {
    // 6deg, not 15: at 15 the cards visibly go trapezoid near the edges
    // of the viewport. This keeps the sense of a turning surface while the
    // rectangles still read as rectangles.
    // ONE tween per section. There were two, and both wrote `scale` —
    // GSAP had two sources fighting over the same property every frame,
    // which is what the juddering was. Rotation alone carries the effect.
    const TILT = 3;
    document.querySelectorAll('.section').forEach((section) => {
      gsap.fromTo(section,
        { rotateX: TILT },
        {
          rotateX: -TILT,
          ease: 'none',
          overwrite: 'auto',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            // scrub:true maps straight to scroll position. A numeric scrub
            // adds catch-up lag, and Lenis is already smoothing the scroll —
            // two smoothing passes on top of each other stutter.
            scrub: true,
            invalidateOnRefresh: true
          }
        });
    });
  }

  // Content exit removed — caused invisible sections on scroll-back

  // Card spotlight
  if (!isTouch) {
    document.querySelectorAll('.service-card, .guar-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        const dx = (e.clientX - r.left - r.width/2) / (r.width/2);
        const dy = (e.clientY - r.top - r.height/2) / (r.height/2);
        const sx = -dx * 12, sy = -dy * 12;
        card.style.boxShadow = `${sx*0.1}px ${2+sy*0.1}px 4px rgba(0,0,0,0.3), ${sx*0.3}px ${8+sy*0.3}px 16px rgba(124,92,255,0.08), ${sx*0.6}px ${20+sy*0.6}px 40px rgba(0,0,0,0.25), ${sx}px ${40+sy}px 80px rgba(0,0,0,0.18)`;
      });
      card.addEventListener('mouseleave', () => { card.style.boxShadow = ''; });
    });
  }

  // Glass lens drift
  if (!isTouch) {
    const lens = document.querySelector('.hero-lens');
    if (lens) {
      // One tween, not two: the previous pair both animated x and y, so
      // the second simply overrode the first instead of layering. A single
      // timeline with different periods gives the drifting motion honestly.
      gsap.timeline({ repeat: -1, yoyo: true })
        .to(lens, { x: 40, y: 25, duration: 12, ease: 'sine.inOut' })
        .to(lens, { x: -30, y: -20, duration: 17, ease: 'sine.inOut' });
    }
  }

  // Header shrink
  ScrollTrigger.create({
    start: 80,
    onUpdate: (self) => {
      document.querySelector('.site-header').classList.toggle('shrunk', self.scroll() > 80);
    }
  });

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

  // Services stack vertically — no pinned sideways track

  // Process steps — quick cascade on enter, no pinning (no extra scroll distance)
  {
    const process = document.getElementById('process');
    if (process) {
      const steps = process.querySelectorAll('.step-card, .step');
      gsap.set(steps, { opacity: 0, x: 30 });
      ScrollTrigger.create({
        trigger: process,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.to(steps, { opacity: 1, x: 0, duration: 0.35, stagger: 0.07, ease: 'power2.out' });
        }
      });
    }
  }

  // Hero entrance — simple fade + slide, no character splitting
  const heroH1 = document.querySelector('.hero h1');
  const heroCopyEls = document.querySelectorAll('.hero-copy > *');
  if (heroH1) {
    gsap.set(heroH1, { opacity: 0, y: 20 });
    gsap.set(heroCopyEls, { opacity: 0, y: 14 });

    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl.to(heroH1, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
    heroTl.to(heroCopyEls, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, '-=0.3');
  }

  // Hero showcase — auto-rotate slides
  const showcaseSlides = document.querySelectorAll('.showcase-slide');
  const showcasePips = document.querySelectorAll('.showcase-pip');
  const showcaseUrl = document.querySelector('.showcase-url');
  const showcaseUrls = ['pcash.pro', 'pcash.pro/cases', 'krsh.store', 'pcash.pro/pricing'];
  if (showcaseSlides.length > 1) {
    let current = 0;
    const showcaseBrowser = document.querySelector('.showcase-browser');
    if (showcaseBrowser) {
      gsap.set(showcaseBrowser, { opacity: 0, x: 40, rotateY: -8 });
      gsap.to(showcaseBrowser, { opacity: 1, x: 0, rotateY: 0, duration: 1.1, delay: 0.7, ease: 'power3.out' });
    }
    function goToSlide(idx) {
      showcaseSlides[current].classList.remove('active');
      showcasePips[current].classList.remove('active');
      current = idx;
      showcaseSlides[current].classList.add('active');
      showcasePips[current].classList.add('active');
      if (showcaseUrl) showcaseUrl.textContent = showcaseUrls[current] || 'pcash.pro';
    }
    showcasePips.forEach((pip, i) => pip.addEventListener('click', () => { goToSlide(i); }));
    setInterval(() => { goToSlide((current + 1) % showcaseSlides.length); }, 4000);
  }

  // Hero facts entrance — staggered scale+slide from below
  const heroFacts = document.querySelectorAll('.hero-facts .fact');
  if (heroFacts.length) {
    gsap.set(heroFacts, { opacity: 0, y: 30, scale: 0.9 });
    const factsTl = gsap.timeline({ delay: 1.2 });
    factsTl.to(heroFacts, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.8, stagger: 0.15, ease: 'back.out(1.4)'
    });
  }

  // Number scramble
  document.querySelectorAll('.count-up').forEach((el) => {
    const target = parseInt(el.dataset.to);
    const scrambleChars = '0123456789!@#$%&';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        let frame = 0;
        const scrambleInterval = setInterval(() => {
          el.textContent = Array.from({ length: String(target).length }, () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)]).join('');
          frame++;
          if (frame > 12) {
            clearInterval(scrambleInterval);
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
})();

/* ===================== hero interactivity + header state ===================== */
(function () {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // header condenses and gains contrast once you leave the top
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!fine || reducedMotion) return;

  // site-wide cursor glow — centred exactly on the pointer, no easing lag
  const glow = document.querySelector('.cursor-glow');
  if (glow) {
    document.addEventListener('mousemove', (e) => {
      glow.style.setProperty('--gx', e.clientX + 'px');
      glow.style.setProperty('--gy', e.clientY + 'px');
      glow.classList.add('on');
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
  }

  const hero = document.querySelector('.hero');
  if (!hero) return;

  // headline letters lift when the pointer passes near them
  const chars = [...hero.querySelectorAll('h1 .char')];
  if (chars.length) {
    let raf = null, mx = 0, my = 0;
    const RADIUS = 90;
    const apply = () => {
      raf = null;
      chars.forEach((c) => {
        const r = c.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height / 2);
        c.classList.toggle('near', dx * dx + dy * dy < RADIUS * RADIUS);
      });
    };
    hero.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('mouseleave', () => chars.forEach((c) => c.classList.remove('near')));
  }
})();

/* ===================== Hero Constellation Network ===================== */
(function initConstellation() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(max-width: 860px)').matches) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COUNT = 200;
  const LINK_DIST = 165;
  const MOUSE_R = 260;
  const MOUSE_GLOW_R = 320;

  let W = 0, H = 0, dpr = 1;
  let mx = -9999, my = -9999;
  let mxSmooth = -9999, mySmooth = -9999;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const nodes = [];
  for (let i = 0; i < COUNT; i++) {
    nodes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.8 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.6,
      hue: Math.random()
    });
  }

  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 250); });

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
  });

  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    mxSmooth += (mx - mxSmooth) * 0.08;
    mySmooth += (my - mySmooth) * 0.08;

    for (let i = 0; i < COUNT; i++) {
      const n = nodes[i];
      n.vx += Math.sin(t * n.speed + n.phase) * 0.006;
      n.vy += Math.cos(t * n.speed * 0.7 + n.phase) * 0.005;

      const dx = n.x - mxSmooth;
      const dy = n.y - mySmooth;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_R && dist > 0) {
        const f = (1 - dist / MOUSE_R);
        n.vx += (dx / dist) * f * f * 1.8;
        n.vy += (dy / dist) * f * f * 1.8;
      }

      n.vx *= 0.97; n.vy *= 0.97;
      n.x += n.vx; n.y += n.vy;

      if (n.x < -30) n.x = W + 30;
      if (n.x > W + 30) n.x = -30;
      if (n.y < -30) n.y = H + 30;
      if (n.y > H + 30) n.y = -30;
    }

    // mouse glow
    if (mxSmooth > -5000) {
      const grd = ctx.createRadialGradient(mxSmooth, mySmooth, 0, mxSmooth, mySmooth, MOUSE_GLOW_R);
      grd.addColorStop(0, 'rgba(124,92,255,' + (0.16) + ')');
      grd.addColorStop(0.4, 'rgba(124,92,255,' + (0.05) + ')');
      grd.addColorStop(1, 'rgba(124,92,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    // lines
    for (let i = 0; i < COUNT; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < COUNT; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.32;

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const mDist = Math.sqrt((midX - mxSmooth) ** 2 + (midY - mySmooth) ** 2);
          const mouseBoost = mDist < MOUSE_R ? (1 - mDist / MOUSE_R) * 0.4 : 0;

          ctx.strokeStyle = 'rgba(169,139,255,' + (alpha + mouseBoost) + ')';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (let i = 0; i < COUNT; i++) {
      const n = nodes[i];
      const breathe = 0.6 + 0.4 * Math.sin(t * n.speed * 2 + n.phase);
      const r = n.r * breathe;

      const mDist = Math.sqrt((n.x - mxSmooth) ** 2 + (n.y - mySmooth) ** 2);
      const nearMouse = mDist < MOUSE_R ? (1 - mDist / MOUSE_R) : 0;
      const glow = r + nearMouse * 8;

      const alpha = (0.4 + breathe * 0.4 + nearMouse * 0.3);

      if (glow > 3) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow * 3);
        grad.addColorStop(0, 'rgba(124,92,255,' + (alpha * 0.3) + ')');
        grad.addColorStop(1, 'rgba(124,92,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glow * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const col = n.hue > 0.85 ? '255,122,46' : n.hue > 0.5 ? '245,243,237' : '169,139,255';
      ctx.fillStyle = 'rgba(' + col + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  tick();
})();


