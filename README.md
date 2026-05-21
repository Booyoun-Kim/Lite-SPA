# Lite-SPA

> Vanilla JS SPA architecture. No build tools. No npm. ~3KB of dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-~3KB-black)]()

Build real SPAs with just an HTML file and JavaScript. No webpack. No `npm install`. No build step.

---

## Philosophy

> Don't abstract what the browser already does well.

`fetch`, `localStorage`, `history.pushState` — browsers have refined these APIs for 20 years. Lite-SPA combines them with a tiny reactive state layer (~1.6KB) to produce something that punches well above its weight.

## Who is it for?

| Audience | Why Lite-SPA |
|---|---|
| Backend developers | Build admin panels without a frontend build pipeline |
| Indie hackers / solo devs | Start in seconds with CDN only |
| Legacy project maintainers | Drop jQuery without adopting React |
| Embedded web UI | IoT consoles, internal dashboards |

## Stack

| Concern | Tool | Size |
|---|---|---|
| Routing | [page.js](https://github.com/visionmedia/page.js) | 1.5KB |
| State | [@preact/signals-core](https://github.com/preactjs/signals) | 1.6KB |
| Styling | [Tailwind CSS](https://tailwindcss.com) (CDN) | — |
| Pages | `fetch` + `insertAdjacentHTML` | 0KB |

**Total external JS: ~3KB. Build steps: 0.**

---

## Quick Start

Copy the `template/` folder and open `index.html` in a browser (or any static file server).

```
template/
├── index.html   ← App shell
├── app.js       ← Routing + logic
├── store.js     ← Global state (signals)
├── i18n.js      ← Translation dictionary
└── pages/
    ├── home.html
    └── about.html
```

> No `npm install`. No config files. Open and run.

---

## Examples

| Example | What it demonstrates | Live |
|---|---|---|
| [01-counter](examples/01-counter/) | Signal basics, shared state across pages | [Open](examples/01-counter/index.html) |
| [02-todo](examples/02-todo/) | Array signals, `computed`, CRUD operations | [Open](examples/02-todo/index.html) |

---

## Core Concepts

### Signals = Reactive State

```js
const count = signal(0);

// Runs automatically whenever count changes
effect(() => {
    document.getElementById('display').textContent = count.value;
});

// Trigger the effect
count.value++;
```

### Dynamic Page Loading

```js
async function renderPage(pageId) {
    // Fetch HTML only on first visit
    if (!loadedPages.has(pageId)) {
        const html = await fetch(`pages/${pageId}.html`).then(r => r.text());
        document.getElementById('app-content').insertAdjacentHTML('beforeend', html);
        loadedPages.add(pageId);
    }
    document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`page-${pageId}`)?.classList.remove('hidden');
}
```

---

## Documentation

- [Guide (English)](docs/guide.en.md)
- [가이드 (한국어)](docs/guide.ko.md)

---

## License

MIT © 2026
