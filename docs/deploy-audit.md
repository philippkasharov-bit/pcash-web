# P.Cash — аудит готовности к деплою

Дата: 2026-08-28 (обновлено)

---

## Статус: готов к деплою (1 блокер)

### Единственный блокер

- **script.js:241** — `const FORM_ACCESS_KEY = '';` пустой. Без ключа Web3Forms контактная форма фоллбэчит на `mailto:`. Зарегистрироваться на web3forms.com, получить ключ, вставить.

---

## Исправлено в этой сессии

| Проблема | Решение |
|----------|---------|
| Плейсхолдер домена в canonical/og/robots/sitemap | Заменён на `pcash.pro` на всех страницах |
| Нет `twitter:image` | Добавлен на index, case-krsh, case-pcash, pricing |
| OG/canonical отсутствовали на подстраницах | Добавлены на case-krsh, case-pcash, pricing |
| Sitemap содержал только главную | Включает все 4 страницы |
| Telegram ссылки `href="#"` в футерах кейсов | Заменены на `https://t.me/pcashpro` |
| Мобильное меню — порядок отличался от десктопного | Порядок и состав выровнены на case-krsh и case-pcash |
| Showcase-browser перекрывал текст «Реальные проекты» | `overflow: visible` на `.hero`, clip на декоративные элементы |
| Порядок точек dot-nav не совпадал с секциями | Исправлен: cases → services → about → process → calc → ... |
| Мёртвый код `#reviews` в mood-map и clipMap | Удалён |
| Showcase-слайдер дублировал контент | Заменён на 3D-анимацию процесса (Wireframe → Design → Code → Live) |
| Скриншоты в case-pcash.html устарели | Пересняты с текущей версии сайта |
| Секции «Стек» и «Метрики» отсутствовали в кейсе | Добавлены в case-pcash.html |

---

## Что в порядке

- **Meta**: canonical, og:image (абсолютный URL), twitter:card/image на всех страницах
- **SEO**: robots.txt → pcash.pro, sitemap.xml → все 4 страницы
- **Alt-тексты**: все `<img>` имеют осмысленные alt на обоих языках
- **Lazy loading**: `loading="eager"` только на above-fold
- **WebP**: case-pcash слайды в WebP, case-krsh — JPG
- **Шрифты**: self-hosted .woff2, без внешних CDN
- **A11y**: skip-link, aria-label/expanded, prefers-reduced-motion (30 CSS + 6 JS)
- **Консоль**: чистая, без console.log
- **Безопасность**: нет API-ключей/секретов
- **Favicon**: все размеры + manifest.json

---

## Папка для деплоя

`D:\PCash\Claude\pcash-deploy\` — готова для Netlify и GitHub:
- 176 файлов, ~13 MB
- Включает `netlify.toml` (security headers, кэширование, 404 redirect)
- Исключены: DESIGN.md, PRODUCT.md, docs/

---

## Оставшиеся мелочи (не блокеры)

| # | Задача | Критичность |
|---|--------|-------------|
| 1 | Ключ Web3Forms | Блокер |
| 2 | Аналитика (Plausible) закомментирована | Опционально |
| 3 | 404.html: Google Fonts CDN, нет reduced-motion | Мелочь |
| 4 | README.md + .gitignore для GitHub | Важно (GitHub) |
| 5 | Orphan-файлы case-pcash$3.png / case-pcash$out.png | Мелочь |
