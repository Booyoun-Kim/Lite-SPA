# Lite-SPA

> Vanilla JS SPA architecture. No build tools. No npm. ~3KB of dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-~3KB-black)]()

[English](README.md) | [한국어](README.ko.md)

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
| AI Coding Agents | Extremely "Agent-Friendly" due to zero build steps and high code density |

### 🤖 Why Lite-SPA is Ideal for AI Agents (Agent-Friendly)

In the era of AI-assisted coding (e.g., Cursor, Copilot, Claude Engineer), Lite-SPA provides an optimized environment for AI agents to read, write, and debug code:
- **Zero Build Failures**: No Webpack, Vite, or TypeScript compilation means AI agents won't waste API tokens fixing package manager resolution errors or bundler configs.
- **Ultra-Compact Context**: The entire app shell, routing, and state flow fit in a single folder. The agent can easily ingest the whole codebase at once, reducing hallucinations.
- **Simple State Reasoning**: Preact Signals use synchronous `.value` updates. AI agents reason about this much better than React's asynchronous render cycle hook rules (e.g., stale closure issues, dependency arrays).
- **Pure Web Standards**: Standard HTML templates and ESM are heavily represented in LLM training data, resulting in extremely clean and error-free code generation.

> [!TIP]
> This repository includes a [SKILL.md](SKILL.md) file. Feed it to your AI agent (or copy it into your `.cursorrules`/`.clinerules`) to immediately teach it the Lite-SPA design patterns and constraints.

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

1. Copy the `template/` folder to your project directory.
2. Start a local static web server in that directory (required due to browser CORS policies blocking `fetch` requests on the `file://` protocol).

### Running a Local Server

You can run a local static server instantly using any of the following methods:

* **VS Code**: Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.
* **Node.js**: Run `npx serve -s` in your project folder.
  > [!IMPORTANT]
  > When using `npx serve -s` (SPA mode), you **must** disable `cleanUrls` in a `serve.json` file in your folder, otherwise it redirects `.html` page template requests and causes recursive nesting. Create `serve.json` with:
  > ```json
  > {
  >   "cleanUrls": false
  > }
  > ```
* **Python**: Run `python -m http.server 8000` in your project folder.
* **PHP**: Run `php -S localhost:8000` in your project folder.

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

> No `npm install`. No config files (unless using `npx serve`). Just run a simple static server and code.

---

## Examples

| Example | What it demonstrates | Live |
|---|---|---|
| [01-counter](examples/01-counter/) | Signal basics, shared state across pages | [Open](examples/01-counter/index.html) |
| [02-todo](examples/02-todo/) | Complex state using Signals, state persistence (localStorage) | [Open](examples/02-todo/index.html) |
| [03-memo (Tutorial)](examples/03-memo/) | Step-by-step beginner's tutorial: custom routing, signals, inputs | [Open](examples/03-memo/index.html) |

> [!TIP]
> If you are new to Lite-SPA, check out the **[03-memo Step-by-Step Tutorial](examples/03-memo/README.md)** (or the Korean version: **[README.ko.md](examples/03-memo/README.ko.md)**). It explains how to build a new page and manage state from scratch!

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

- [Guide (English)](lite-spa-guide.en.md)
- [가이드 (한국어)](lite-spa-guide.ko.md)
- [AI Agent Guide (SKILL.md)](SKILL.md)

---

## License

MIT © 2026
