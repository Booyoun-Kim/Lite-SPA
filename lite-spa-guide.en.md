# Lite-SPA — Complete Guide

> **A Vanilla JS SPA Architecture Pattern Without Build Tools**
> Start with just an HTML file — no npm install, no Webpack, no bundler.

---

## Table of Contents

1. [What is Lite-SPA?](#1-what-is-lite-spa)
2. [Quick Start (5 minutes)](#2-quick-start-5-minutes)
3. [Tutorial — Build Your First SPA](#3-tutorial--build-your-first-spa)
4. [Core Features](#4-core-features)
   - 4-1. Routing
   - 4-2. State Management (Signals)
   - 4-3. Dynamic Page Loading
   - 4-4. i18n Internationalization
   - 4-5. Toast & Loading State
5. [Advanced Patterns](#5-advanced-patterns)
   - 5-1. Store Design Principles
   - 5-2. computed / effect Patterns
   - 5-3. Event Bus (Pub/Sub)
   - 5-4. API Layer Separation
   - 5-5. Scaling Strategy
6. [FAQ / Comparison with React](#6-faq--comparison-with-react)

---

## 1. What is Lite-SPA?

Lite-SPA is **not a framework.** It's an **architecture pattern** for building SPAs without build tools.

### Who is it for?

| Audience | Why |
|---|---|
| Backend developers | Build admin panels and dashboards without a frontend build pipeline |
| Indie hackers / solo devs | Start instantly with CDN only — no npm |
| Legacy project maintainers | Drop jQuery without reaching for React |
| Embedded web UI developers | IoT consoles, internal admin tools, etc. |

### What does it use?

```
Routing:        page.js               (CDN, 1.5KB)
State:          @preact/signals-core  (CDN, 1.6KB)
Styling:        Tailwind CSS          (CDN)
Page splitting: fetch + insertAdjacentHTML
```

**Total: ~3KB external dependencies, 0 build steps**

---

## 2. Quick Start (5 minutes)

### Directory Structure

```
my-app/
├── index.html      ← App entry point (shell)
├── app.js          ← Routing + business logic
├── store.js        ← Global state (signals)
├── i18n.js         ← Translation dictionary
└── pages/
    ├── home.html
    ├── about.html
    └── dashboard.html
```

### index.html Template

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Lite-SPA</title>

    <!-- Prevent FOUC (Flash of Unstyled Content) with Tailwind CDN -->
    <style>
        body { opacity: 0; transition: opacity 0.15s ease-in; }
        body.tailwind-ready { opacity: 1; }
    </style>
    <script>
        window.tailwind = window.tailwind || {};
        window.tailwind.config = window.tailwind.config || {};
        window.tailwind.ready = () => document.body.classList.add('tailwind-ready');
        setTimeout(() => document.body.classList.add('tailwind-ready'), 500);
    </script>

    <!-- Styling (Tailwind CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- State management: expose signals-core to window.Signals -->
    <script type="module">
        import { signal, computed, effect }
            from 'https://esm.sh/@preact/signals-core';
        window.Signals = { signal, computed, effect };
    </script>
</head>
<body>
    <!-- Navigation -->
    <nav>
        <button onclick="navigateTo('home')">Home</button>
        <button onclick="navigateTo('about')">About</button>
    </nav>

    <!-- Pages are dynamically loaded here -->
    <main id="app-content"></main>

    <!-- Script load order matters: defer ensures modules run first -->
    <script src="https://unpkg.com/page/page.js"></script>
    <script src="i18n.js"></script>
    <script src="store.js" defer></script>
    <script src="app.js" defer></script>
</body>
</html>
```

> [!IMPORTANT]
> `store.js` and `app.js` must have the `defer` attribute.
> The `type="module"` bridge script must run first to register `window.Signals` before `store.js` executes.

### store.js Template

```js
// store.js — global state declarations
(function () {
    const { signal, computed, effect } = window.Signals;

    // ── State ──────────────────────────────────────
    const currentPage = signal('home');
    const authToken   = signal(localStorage.getItem('authToken'));

    // ── Computed (derived state) ───────────────────
    const isLoggedIn = computed(() => !!authToken.value);

    // ── Effects (automatic DOM reactions) ─────────
    effect(() => {
        // Automatically toggle nav when auth state changes
        const loggedIn = isLoggedIn.value;
        document.getElementById('btn-logout')
            ?.classList.toggle('hidden', !loggedIn);
        document.getElementById('btn-login')
            ?.classList.toggle('hidden', loggedIn);
    });

    // ── Expose globally ────────────────────────────
    window.Store = { currentPage, authToken, isLoggedIn };
})();
```

### app.js Template

```js
// app.js — routing + business logic
const s = new Proxy({}, {
    get(_, key) { return window.Store?.[key]; }
});

const loadedPages = new Set();

async function ensurePageLoaded(pageId) {
    if (loadedPages.has(pageId)) return;
    const html = await fetch(`pages/${pageId}.html`).then(r => r.text());
    document.getElementById('app-content').insertAdjacentHTML('beforeend', html);
    loadedPages.add(pageId);
}

async function renderPage(pageId) {
    await ensurePageLoaded(pageId);
    document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`page-${pageId}`)?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateTo(pageId) {
    page(pageId === 'home' ? '/' : `/${pageId}`);
}

// Route definitions
page('/',          () => renderPage('home'));
page('/about',     () => renderPage('about'));
page('/dashboard', () => renderPage('dashboard'));

document.addEventListener('DOMContentLoaded', () => {
    page(); // Start router
});
```

---

## 3. Tutorial — Build Your First SPA

### Goal: Counter App

A mini SPA with tab navigation where counter state persists across pages.

### Step 1 — Create page files

**pages/home.html**
```html
<div id="page-home" class="page-view">
    <h1>Home</h1>
    <p>Counter: <span data-count>0</span></p>
    <button onclick="increment()">+1</button>
    <button onclick="navigateTo('about')">Go to About →</button>
</div>
```

**pages/about.html**
```html
<div id="page-about" class="page-view hidden">
    <h1>About</h1>
    <p>Counter from Home: <span data-count>0</span></p>
    <button onclick="navigateTo('home')">← Back to Home</button>
</div>
```

### Step 2 — Add counter state to store.js

```js
const count = signal(0);

// Automatically update all elements with data-count when count changes
effect(() => {
    const val = count.value;
    document.querySelectorAll('[data-count]')
        .forEach(el => el.textContent = val);
});

window.Store = { count, /* ...existing */ };
```

### Step 3 — Add data-count attribute to HTML

```html
<!-- Just add data-count — the effect fills in the value automatically -->
<span data-count></span>
```

### Step 4 — Add function to app.js

```js
function increment() {
    s.count.value++;
    // No direct DOM manipulation needed — effect handles it
}
```

**Result:** Increment the counter on the Home page, navigate to About, and the value persists.
This is the core of signals-based global state.

---

## 4. Core Features

### 4-1. Routing

Uses [page.js](https://github.com/visionmedia/page.js).

```js
// Basic routing
page('/', () => renderPage('home'));
page('/user/:id', (ctx) => {
    const userId = ctx.params.id;  // Extract URL params
    renderPage('user');
    loadUserProfile(userId);
});

// Querystring extraction
page('/reset-password', (ctx) => {
    const params = new URLSearchParams(ctx.querystring);
    const token = params.get('token');
});

// Programmatic navigation
function navigateTo(pageId) {
    page(pageId === 'home' ? '/' : `/${pageId}`);
}
```

**Adding page transition animations:**
```js
async function renderPage(pageId) {
    await ensurePageLoaded(pageId);

    // Fade out current page
    const current = document.querySelector('.page-view:not(.hidden)');
    if (current) {
        current.style.opacity = '0';
        await new Promise(r => setTimeout(r, 150));
        current.classList.add('hidden');
        current.style.opacity = '';
    }

    // Fade in next page
    const next = document.getElementById(`page-${pageId}`);
    if (next) {
        next.style.opacity = '0';
        next.classList.remove('hidden');
        requestAnimationFrame(() => {
            next.style.transition = 'opacity 0.2s';
            next.style.opacity = '1';
        });
    }
}
```

---

### 4-2. State Management (Signals)

#### signal — basic state

```js
const count = signal(0);

// Read
console.log(count.value);  // 0

// Write (automatically triggers connected effects)
count.value = 5;
count.value++;
```

#### computed — derived state

```js
const firstName = signal('John');
const lastName  = signal('Doe');

// Automatically recalculates when firstName or lastName changes
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

console.log(fullName.value); // "John Doe"
```

#### effect — automatic DOM reactions

```js
// Runs automatically whenever a read signal changes
effect(() => {
    const name = fullName.value; // "subscribes" to this signal
    document.getElementById('name-display').textContent = name;
});
```

> [!TIP]
> Only signals read via `.value` inside an effect are subscribed.
> Even signals inside conditionals are tracked if they are read at least once.

#### Updating array / object state

```js
const items = signal([]);

// ❌ Wrong: reference doesn't change, effect won't fire
items.value.push('new item');

// ✅ Correct: replace with a new array
items.value = [...items.value, 'new item'];

// Same for objects
const user = signal({ name: 'John', age: 30 });
user.value = { ...user.value, age: 31 };
```

---

### 4-3. Dynamic Page Loading

```js
const loadedPages = new Set(); // Prevent duplicate loads

async function ensurePageLoaded(pageId) {
    if (loadedPages.has(pageId)) return; // Already loaded

    const response = await fetch(`pages/${pageId}.html`);
    if (!response.ok) throw new Error(`Page not found: ${pageId}`);

    const html = await response.text();
    document.getElementById('app-content')
        .insertAdjacentHTML('beforeend', html);

    // Apply translations
    translateElement(document.getElementById(`page-${pageId}`));

    // Run page-specific initializer
    pageInitializers[pageId]?.();

    loadedPages.add(pageId);
}

// Register page-specific initializers
const pageInitializers = {
    dashboard: () => loadDashboardData(),
    profile:   () => loadUserProfile(),
};
```

**Benefit:** HTML is fetched on first visit only, not on initial load.
Better network efficiency and faster first paint.

---

### 4-4. i18n Internationalization

```js
// i18n.js
const dictionary = {
    EN: {
        'nav-home':   'Home',
        'nav-about':  'About',
        'btn-submit': 'Submit',
        'greeting':   'Hello, {name}!',
    },
    KO: {
        'nav-home':   '홈',
        'nav-about':  '소개',
        'btn-submit': '제출',
        'greeting':   '안녕하세요, {name}님!',
    }
};
```

```html
<!-- Just add data-i18n attribute to HTML elements -->
<button data-i18n="btn-submit">Submit</button>
<h1 data-i18n="nav-home">Home</h1>
```

```js
// store.js — auto-translate when language changes
const currentLang = signal('EN');

effect(() => {
    const lang = currentLang.value;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang]?.[key]) el.innerHTML = dictionary[lang][key];
    });
});

// Toggle
function toggleLanguage() {
    s.currentLang.value = s.currentLang.value === 'EN' ? 'KO' : 'EN';
    // effect handles full re-translation automatically
}
```

---

### 4-5. Toast & Loading State

The two most commonly needed UI feedback patterns in any SPA.

#### Toast Notifications

```js
// components/toast.js
const toasts = signal([]);

// store.js effect — auto-render whenever toasts changes
effect(() => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    container.innerHTML = toasts.value.map(t => `
        <div class="toast toast--${t.type}" data-id="${t.id}">
            ${t.message}
        </div>
    `).join('');
});

function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now();
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
}

window.showToast = showToast;
```

```html
<!-- Add to the end of index.html body -->
<div id="toast-container" class="fixed bottom-4 right-4 space-y-2 z-50"></div>
```

```js
// Call from anywhere
showToast('Saved successfully.', 'success');
showToast('Network error', 'error');
showToast('Processing, please wait...', 'info', 5000);
```

#### Global Loading State

```js
// store.js
const isLoading = signal(false);

// Automatically toggle spinner when loading state changes
effect(() => {
    document.getElementById('global-spinner')
        ?.classList.toggle('hidden', !isLoading.value);
    // Disable buttons while loading
    document.querySelectorAll('button[data-loading-lock]')
        .forEach(btn => btn.disabled = isLoading.value);
});
```

```js
// API call wrapper — auto-manages loading state
async function withLoading(asyncFn) {
    s.isLoading.value = true;
    try {
        return await asyncFn();
    } finally {
        s.isLoading.value = false;
    }
}

// Usage example
async function handleSave() {
    await withLoading(async () => {
        const data = await API.merchants.update(id, payload);
        s.merchants.value = data;
        showToast('Saved successfully.', 'success');
    });
}
```

```html
<!-- Global spinner -->
<div id="global-spinner" class="hidden fixed inset-0 bg-black/20 flex items-center justify-center z-[999]">
    <div class="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
</div>

<!-- Buttons that should auto-disable during loading -->
<button data-loading-lock onclick="handleSave()">Save</button>
```

---

## 5. Advanced Patterns

### 5-1. Store Design Principles

As the app grows, **split the Store by domain**.

```
stores/
├── auth.store.js      ← Authentication state
├── ui.store.js        ← UI state (tabs, modals, language)
├── merchant.store.js  ← Business domain
└── store.js           ← Aggregator
```

```js
// stores/auth.store.js
(function() {
    const { signal, computed, effect } = window.Signals;

    const authToken  = signal(localStorage.getItem('authToken'));
    const isLoggedIn = computed(() => !!authToken.value);

    // Auto-sync authToken to localStorage on change
    effect(() => {
        const token = authToken.value;
        if (token) localStorage.setItem('authToken', token);
        else localStorage.removeItem('authToken');
    });

    window.AuthStore = { authToken, isLoggedIn };
})();
```

```js
// store.js — aggregator
window.Store = {
    ...window.AuthStore,
    ...window.UIStore,
    ...window.MerchantStore,
};
```

---

### 5-2. computed / effect Patterns

#### Chained computed

```js
const rawPrice  = signal(100);
const taxRate   = signal(0.1);
const discount  = signal(0);

const taxedPrice     = computed(() => rawPrice.value * (1 + taxRate.value));
const finalPrice     = computed(() => taxedPrice.value - discount.value);
const formattedPrice = computed(() =>
    `$${finalPrice.value.toLocaleString()}`
);

// formattedPrice auto-recalculates when any dependency changes
effect(() => {
    document.getElementById('price-display').textContent = formattedPrice.value;
});
```

#### effect cleanup (intervals / listeners)

```js
effect(() => {
    const merchantId = s.currentMerchantId.value;
    if (!merchantId) return;

    // Start polling
    const interval = setInterval(() => fetchStatus(merchantId), 5000);

    // Automatically cleaned up before the effect re-runs
    return () => clearInterval(interval);
});
```

---

### 5-3. Event Bus (Pub/Sub)

Useful for cross-component communication without direct references.

```js
// eventBus.js
const EventBus = {
    _listeners: {},

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        // Returns a cleanup function
        return () => this.off(event, callback);
    },

    off(event, callback) {
        this._listeners[event] =
            (this._listeners[event] || []).filter(cb => cb !== callback);
    },

    emit(event, data) {
        (this._listeners[event] || []).forEach(cb => cb(data));
    }
};

window.EventBus = EventBus;
```

```js
// Usage example
// Module A: emit an event
EventBus.emit('payment:completed', { amount: 100, currency: 'USDT' });

// Module B: listen for the event
EventBus.on('payment:completed', ({ amount, currency }) => {
    showToast(`${amount} ${currency} payment received`);
    refreshDashboard();
});
```

> [!TIP]
> Use **signals** for synchronous state sharing and **EventBus** for asynchronous event propagation.
> Together they cover virtually every real-world communication pattern.

---

### 5-4. API Layer Separation

Separating API calls into a dedicated file makes maintenance much easier.

```js
// api.js
const API_BASE = 'http://localhost:3000/v1';

async function apiFetch(path, options = {}) {
    const token = window.Store?.authToken?.value;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
}

// Domain-specific API functions
const API = {
    auth: {
        login:   (email, pw) => apiFetch('/user/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) }),
        logout:  ()          => apiFetch('/user/logout', { method: 'POST' }),
        profile: ()          => apiFetch('/user/profile'),
    },
    merchants: {
        list:   ()         => apiFetch('/merchants'),
        create: (data)     => apiFetch('/merchants', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => apiFetch(`/merchants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
};

window.API = API;
```

```js
// Usage in app.js
async function handleLogin() {
    try {
        const { token } = await API.auth.login(email, password);
        s.authToken.value = token; // effect auto-updates nav
        navigateTo('dashboard');
    } catch (err) {
        showError(err.message);
    }
}
```

---

### 5-5. Scaling Strategy

#### Recommended file structure

```
my-app/
├── index.html
├── app.js
├── api.js              ← API layer
├── i18n.js
├── eventBus.js         ← Event bus
├── stores/
│   ├── auth.store.js
│   ├── ui.store.js
│   └── store.js        ← Aggregator
├── components/         ← Reusable UI fragments (optional)
│   ├── toast.js
│   └── modal.js
└── pages/
    ├── home.html
    ├── dashboard.html
    └── settings.html
```

#### State mutation convention

Defining clear rules reduces debugging time significantly.

```js
// ✅ Always mutate state through the Store
s.authToken.value = newToken;
s.items.value = [...s.items.value, newItem];

// ❌ Never reach into the DOM directly (effects handle it)
// document.getElementById('nav-login').classList.add('hidden');
```

#### Persisted signal pattern

```js
// Restore from localStorage on startup + auto-save on change
function persistedSignal(key, defaultValue) {
    const stored = localStorage.getItem(key);
    const sig = signal(stored ? JSON.parse(stored) : defaultValue);

    effect(() => {
        localStorage.setItem(key, JSON.stringify(sig.value));
    });

    return sig;
}

// Usage
const theme    = persistedSignal('theme', 'light');
const lastPage = persistedSignal('lastPage', 'home');
```

---

## 6. FAQ / Comparison with React

### Q. Can I use this instead of React?

| Situation | Recommendation |
|---|---|
| Admin panels, dashboards, internal tools | ✅ Lite-SPA |
| Static file serving without a build server | ✅ Lite-SPA |
| Marketing sites, landing pages | ✅ Lite-SPA |
| Large teams, heavy component reuse | React / Solid.js |
| Mobile-app-level interaction complexity | React Native / Flutter |

### Q. Isn't it slow without a Virtual DOM?

No. The Virtual DOM exists to minimize expensive DOM access.
Lite-SPA achieves the same goal through signals' **surgical targeted updates**.
Only the effects subscribed to a changed signal re-run — there is no unnecessary re-render.

### Q. SSR is not supported, right?

Only Client-Side Rendering is supported. It's not suitable for public content pages where SEO is critical.
However, SEO is unnecessary for screens accessed post-login, like **admin panels or authentication-gated dashboards**.

### Q. Isn't inserting HTML using `insertAdjacentHTML` vulnerable to XSS?

An excellent question! Lite-SPA's template files (`pages/*.html`) are written by developers (a trusted source), so they do not need sanitization at fetch time. Loading them **raw** preserves all event handlers (like `onclick`).

Instead, we enforce safety measures when displaying **untrusted user-generated content**:
1. **Force `.textContent` for Text Rendering**: Never bind user inputs using `innerHTML`. Assigning to `.textContent` triggers native browser-level escaping automatically.
2. **Use DOMPurify selectively for Dynamic HTML**: If you must render markup provided by users (e.g. rich text output), import and run **DOMPurify** at that specific insertion point.
   * **Example**:
     ```html
     <!-- Load DOMPurify only when needed -->
     <script src="https://unpkg.com/dompurify@3.0.8/dist/purify.min.js"></script>
     <script>
         const rawUserInput = "<img src=x onerror=alert(1)>";
         // Sanitize only at the specific injection site
         document.getElementById('comment-box').innerHTML = DOMPurify.sanitize(rawUserInput);
     </script>
     ```

### Q. How can I fix FOUC (Flash of Unstyled Content) when using the Tailwind Play CDN?

Because the Tailwind compiler operates at runtime, unstyled raw HTML might flash on the screen briefly before styles kick in.
* **Solution**: In `index.html`, **before** calling the Tailwind script, define the `body { opacity: 0; }` style and safely extend `window.tailwind` without overwriting it. Then, use Tailwind's `ready()` callback hook to append a `.tailwind-ready` class (`opacity: 1`) to the body, yielding a smooth fade-in transition.
  ```html
  <script>
      window.tailwind = window.tailwind || {};
      window.tailwind.config = window.tailwind.config || {};
      window.tailwind.ready = () => document.body.classList.add('tailwind-ready');
      setTimeout(() => document.body.classList.add('tailwind-ready'), 500);
  </script>
  ```

### Q. How do we prevent ID collisions and global CSS pollution in large projects?

For collaborative environments, we can partially adopt the browser-standard **Web Components (Shadow DOM)** to achieve complete scoped CSS and DOM isolation without needing build systems.
* **Shadow DOM Example**:
  ```js
  class PrimaryButton extends HTMLElement {
      constructor() {
          super();
          this.attachShadow({ mode: 'open' });
      }
      connectedCallback() {
          this.shadowRoot.innerHTML = `
              <style>
                  button { background: #3b82f6; color: white; border-radius: 4px; padding: 8px 16px; }
              </style>
              <button><slot></slot></button>
          `;
      }
  }
  customElements.define('primary-button', PrimaryButton);
  ```
* Inside standard pages, avoid query selecting globally (e.g. `document.querySelector`). Instead, restrict query selection to the page's root container (`pageRoot.querySelector('.btn')`).

### Q. Can I use TypeScript?

You can use JSDoc in `.js` files to get IDE autocomplete without a build step.

```js
/** @type {import('@preact/signals-core').Signal<string | null>} */
const authToken = signal(null);
```

### Q. How do I reuse UI components?

```js
// components/toast.js
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded
        ${type === 'error' ? 'bg-red-500' : 'bg-black'} text-white text-sm`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;
```

For HTML fragments, use **template functions**:

```js
function renderProductCard(product) {
    return `
        <div class="border p-4">
            <h3>${product.name}</h3>
            <p>${product.price} USD</p>
            <button onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
    `;
}
```

---

## Closing

The core philosophy of Lite-SPA is simple:

> **Don't abstract what the browser already does well.**

`fetch`, `CustomEvent`, `Proxy`, `localStorage` — combine the APIs that browsers have refined over 20 years, and you can build surprisingly complex apps with just ~3KB of external dependencies.

You don't need to know React. You don't need npm.
Just an HTML file and JavaScript — start right now.

---

*Lite-SPA Pattern — MIT License*
