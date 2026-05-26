# Lite-SPA Developer Agent Skill Guide (SKILL.md)

This file contains system instructions, architectural constraints, and code patterns for AI Coding Agents (such as Cursor, Copilot, Windsurf, or Claude Engineer) working in this repository.

> [!IMPORTANT]
> If you are an AI coding agent, read and adhere to this file strictly when writing or modifying code in this project.

---

## 1. Core Constraints & Philosophy

- **ZERO BUILD STEP**: Never introduce a compilation step, Webpack, Vite, Rollup, Babel, or TypeScript compilation. The code must run instantly when opening `index.html` in a browser.
- **NO NPM INSTALLATION**: Never run `npm install` or add Node dependencies. All external libraries are loaded via standard ES module CDNs (e.g., ESM.sh, unpkg) or local files.
- **NATIVE ES MODULES (ESM)**: Always use standard ESM (`import`/`export` syntax) and `<script type="module">`.
- **LIGHT DOM**: Never use Shadow DOM or virtual DOM. Work directly on standard HTML elements using template literals and native browser DOM APIs.

---

## 2. Technical Stack

| Category | Library / API | CDN URL (ESM) |
|---|---|---|
| **Routing** | [page.js](https://github.com/visionmedia/page.js) | `https://esm.sh/page` |
| **State Management** | [@preact/signals-core](https://github.com/preactjs/signals) | `https://esm.sh/@preact/signals-core` |
| **Styling** | Tailwind CSS | `https://cdn.tailwindcss.com` |

---

## 3. Directory Structure

Ensure any new assets, scripts, or pages adhere to the template directory structure:

```
├── template/ (or app root)
│   ├── index.html       # Single entry point / app layout shell
│   ├── app.js           # Main script: handles routes, dynamic page loading, utility helpers
│   ├── store.js         # Global state store using Preact Signals
│   ├── i18n.js          # Simple translation dictionary
│   └── pages/           # Dynamic page HTML files (fetched as text on-demand)
│       ├── home.html
│       └── about.html
```

---

## 4. Key Implementation Patterns

### 4.1 State Management (Preact Signals)

State must be defined in `store.js` using Preact Signals. Avoid manual DOM queries for setting values where possible; use `effect()` to keep DOM updated.

```javascript
// store.js
import { signal, computed } from 'https://esm.sh/@preact/signals-core';

export const count = signal(0);
export const doubleCount = computed(() => count.value * 2);
```

```javascript
// app.js / UI side
import { count } from './store.js';
import { effect } from 'https://esm.sh/@preact/signals-core';

// Automatically syncs signal value with DOM
effect(() => {
  document.getElementById('counter-btn').textContent = `Count: ${count.value}`;
});

// ⚠️ CRITICAL REACTIVITY GOTCHA FOR DYNAMIC DOM:
// If the target DOM element is rendered dynamically (e.g. inside pages/*.html fetched at runtime),
// you MUST read the signal value at the very beginning of the effect callback.
// If you check for the DOM element first and return early, Preact will NOT register the signal dependency,
// and subsequent mutations to the signal value will fail to re-trigger the effect!
effect(() => {
  const val = count.value; // ★ Read signal value first to register subscription!
  const el = document.getElementById('dynamic-counter-text');
  if (el) {
    el.textContent = `Count: ${val}`;
  }
});

// Mutate state directly
document.getElementById('counter-btn').addEventListener('click', () => {
  count.value++;
});
```

### 4.2 Routing and Page Lifecycle (`page.js` + Dynamic Fetching)

Routes are defined using `page.js`. Pages are lazily fetched, cached in memory, and toggle visibility.

```javascript
// Defining routes in app.js
import page from 'https://esm.sh/page';

page('/', () => renderPage('home'));
page('/about', () => renderPage('about'));
page('*', () => renderPage('404'));
page.start();
```

### 4.3 Page Lifecycle & Asset Loading Helpers

When loading a page that requires its own scripts or styles, use the `loadScript` and `loadCSS` helpers. Cleanup event listeners or intervals when navigating away.

```javascript
// Dynamic page-specific script loading helper inside app.js
export function loadScript(src, id, onLoad) {
  if (document.getElementById(id)) {
    if (onLoad) onLoad();
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.id = id;
  script.type = 'module';
  script.onload = onLoad;
  document.body.appendChild(script);
}

// Example usage when rendering a dynamic page
async function renderPage(pageId) {
  // 1. Fetch & inject template if not cached
  if (!loadedPages.has(pageId)) {
    // Note: Always use absolute paths (leading '/') to fetch templates to prevent relative path resolution 
    // nesting bugs when handling deep SPA routing paths.
    const html = await fetch(`/pages/${pageId}.html`).then(r => r.text());
    document.getElementById('app-content').insertAdjacentHTML('beforeend', html);
    loadedPages.add(pageId);
  }
  
  // 2. Hide other views, show target view
  document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`page-${pageId}`).classList.remove('hidden');

  // 3. Load script for this specific page if needed
  if (pageId === 'todo') {
    loadScript('./pages/todo.js', 'todo-script', () => {
      // Execute page initialization if necessary
    });
  }
}
```

---

## 5. Server & Deployment Configurations (SPA Fallbacks)

When serving or deploying a zero-build Lite-SPA, you must ensure your server correctly falls back to `index.html` on refresh without interfering with dynamic HTML template fetches.

### 5.1 Vercel `serve` (`npx serve -s`)
Vercel's `serve` features **Clean URLs** by default, which strips `.html` extensions and redirects requests. This conflicts with dynamic page fetches (fetching `/pages/home.html` gets redirected to `/pages/home`, which then falls back to `index.html` in SPA mode, causing infinite HTML nesting).
- **Rule**: Always create a `serve.json` in the root of the project to disable clean URLs:
  ```json
  {
    "cleanUrls": false
  }
  ```

### 5.2 Nginx Configuration
Use `try_files` to serve files/directories, falling back to `/index.html`:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5.3 AWS Amplify Deployment Rule
In the AWS Amplify Console, navigate to **Rewrites and redirects** under your app settings and add the following rule:
```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webmanifest|html)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

### 5.4 Vercel Deployment (`vercel.json`)
Create a `vercel.json` file in the root of your project to disable `cleanUrls` and rewrite virtual routes to `index.html`:
```json
{
  "cleanUrls": false,
  "rewrites": [
    {
      "source": "/((?!.*\\.(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webmanifest|html)$).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 6. Instructions for Coding

1. **Keep HTML template wrapper clean**: Page templates in `pages/*.html` must be wrapped in a container like `<div id="page-[name]" class="page-view hidden">`.
2. **Never hardcode paths**: Always use relative paths when importing modules.
3. **Keep functions pure and modular**: Write helper functions for repetitive tasks.
4. **Style with Tailwind CSS classes**: Do not write custom CSS unless absolutely necessary. Rely on Tailwind CSS via CDN.
