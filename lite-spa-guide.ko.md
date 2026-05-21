# Lite-SPA — Complete Guide

> **빌드 도구 없는 Vanilla JS SPA 아키텍처 패턴**
> npm install 없이, Webpack 없이, 그냥 HTML 파일 하나로 시작하는 SPA.

---

## 목차

1. [Lite-SPA란?](#1-lite-spa란)
2. [초기 설정 (5분)](#2-초기-설정-5분)
3. [튜토리얼 — 첫 번째 SPA 만들기](#3-튜토리얼--첫-번째-spa-만들기)
4. [핵심 기능](#4-핵심-기능)
   - 4-1. 라우팅
   - 4-2. 상태 관리 (Signals)
   - 4-3. 동적 페이지 로딩
   - 4-4. i18n 다국어
   - 4-5. Toast & 로딩 상태 관리
5. [Advanced 패턴](#5-advanced-패턴)
   - 5-1. Store 설계 원칙
   - 5-2. computed / effect 활용
   - 5-3. 이벤트 버스 (Pub/Sub)
   - 5-4. API 레이어 분리
   - 5-5. 대규모 앱 확장 전략
6. [FAQ / React와 비교](#6-faq--react와-비교)

---

## 1. Lite-SPA란?

Lite-SPA는 **프레임워크가 아닙니다.** 빌드 도구 없이 SPA를 만드는 **아키텍처 패턴**입니다.

### 누구를 위한 것인가?

| 이런 분께 추천 | 이유 |
|---|---|
| 백엔드 개발자 | 빌드 환경 없이 관리자 페이지, 대시보드 빠르게 |
| 인디 해커 / 1인 개발자 | npm 없이 CDN만으로 즉시 시작 |
| 레거시 프로젝트 관리자 | jQuery 걷어내고 싶은데 React는 과함 |
| 임베디드 웹 UI 개발자 | IoT 콘솔, 사내 어드민 등 |

### 무엇을 쓰는가?

```
라우팅:       page.js         (CDN, 1.5KB)
상태 관리:    @preact/signals-core  (CDN, 1.6KB)
스타일:       Tailwind CSS    (CDN)
페이지 분리:  fetch + insertAdjacentHTML
```

**합계: ~3KB 외부 의존성, 빌드 단계 0개**

---

## 2. 초기 설정 (5분)

### 디렉토리 구조

```
my-app/
├── index.html      ← 앱 진입점 (셸)
├── app.js          ← 라우팅 + 비즈니스 로직
├── store.js        ← 전역 상태 (signals)
├── i18n.js         ← 다국어 사전
└── pages/
    ├── home.html
    ├── about.html
    └── dashboard.html
```

### index.html 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Lite-SPA</title>

    <!-- Tailwind FOUC 방지 -->
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

    <!-- 스타일 (Tailwind CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- 상태 관리: signals-core를 window.Signals에 노출 -->
    <script type="module">
        import { signal, computed, effect }
            from 'https://esm.sh/@preact/signals-core';
        window.Signals = { signal, computed, effect };
    </script>
</head>
<body>
    <!-- 네비게이션 -->
    <nav>
        <button onclick="navigateTo('home')">홈</button>
        <button onclick="navigateTo('about')">소개</button>
    </nav>

    <!-- 페이지가 여기에 동적으로 로드됨 -->
    <main id="app-content"></main>

    <!-- 스크립트 로드 순서 중요: defer로 모듈 이후 실행 보장 -->
    <script src="https://unpkg.com/page/page.js"></script>
    <script src="i18n.js"></script>
    <script src="store.js" defer></script>
    <script src="app.js" defer></script>
</body>
</html>
```

> [!IMPORTANT]
> `store.js`와 `app.js`에 반드시 `defer`를 붙여야 합니다.
> `type="module"` 브릿지 스크립트가 먼저 실행되어 `window.Signals`를 등록한 후에 `store.js`가 실행되어야 합니다.

### store.js 템플릿

```js
// store.js — 전역 상태 선언
(function () {
    const { signal, computed, effect } = window.Signals;

    // ── 상태 선언 ──────────────────────────────────
    const currentPage = signal('home');
    const authToken   = signal(localStorage.getItem('authToken'));

    // ── computed (파생 상태) ────────────────────────
    const isLoggedIn = computed(() => !!authToken.value);

    // ── effects (자동 DOM 반응) ─────────────────────
    effect(() => {
        // 로그인 상태 변경 시 nav 자동 토글
        const loggedIn = isLoggedIn.value;
        document.getElementById('btn-logout')
            ?.classList.toggle('hidden', !loggedIn);
        document.getElementById('btn-login')
            ?.classList.toggle('hidden', loggedIn);
    });

    // ── 전역 노출 ──────────────────────────────────
    window.Store = { currentPage, authToken, isLoggedIn };
})();
```

### app.js 템플릿

```js
// app.js — 라우팅 + 비즈니스 로직
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

// 라우팅 규칙
page('/',          () => renderPage('home'));
page('/about',     () => renderPage('about'));
page('/dashboard', () => renderPage('dashboard'));

document.addEventListener('DOMContentLoaded', () => {
    page(); // 라우터 시작
});
```

---

## 3. 튜토리얼 — 첫 번째 SPA 만들기

### 목표: 카운터 앱

탭 이동이 가능하고, 카운터 상태가 전역으로 유지되는 미니 SPA.

### Step 1 — 페이지 파일 만들기

**pages/home.html**
```html
<div id="page-home" class="page-view">
    <h1>홈</h1>
    <p>카운터: <span data-count>0</span></p>
    <button onclick="increment()">+1</button>
    <button onclick="navigateTo('about')">소개 페이지로 →</button>
</div>
```

**pages/about.html**
```html
<div id="page-about" class="page-view hidden">
    <h1>소개</h1>
    <p>홈에서 누른 카운터: <span data-count>0</span></p>
    <button onclick="navigateTo('home')">← 홈으로</button>
</div>
```

### Step 2 — store.js에 카운터 상태 추가

```js
const count = signal(0);

// 카운터가 바뀌면 모든 표시 요소 자동 업데이트
effect(() => {
    const val = count.value;
    document.querySelectorAll('[data-count]')
        .forEach(el => el.textContent = val);
});

window.Store = { count, /* ...기존 */ };
```

### Step 3 — HTML에 data-count 속성 추가

```html
<!-- data-count 속성만 붙이면 effect가 자동으로 값을 채워줌 -->
<span data-count></span>
```

### Step 4 — app.js에 함수 추가

```js
function increment() {
    s.count.value++;
    // DOM 직접 건드릴 필요 없음 — effect가 자동 처리
}
```

**결과:** 홈에서 카운터를 올리고 소개 페이지로 이동해도 값이 유지됩니다.
이것이 signals 기반 전역 상태의 핵심입니다.

---

## 4. 핵심 기능

### 4-1. 라우팅

[page.js](https://github.com/visionmedia/page.js)를 사용합니다.

```js
// 기본 라우팅
page('/', () => renderPage('home'));
page('/user/:id', (ctx) => {
    const userId = ctx.params.id;  // URL 파라미터 추출
    renderPage('user');
    loadUserProfile(userId);
});

// 쿼리스트링 추출
page('/reset-password', (ctx) => {
    const params = new URLSearchParams(ctx.querystring);
    const token = params.get('token');
});

// 프로그래매틱 이동
function navigateTo(pageId) {
    page(pageId === 'home' ? '/' : `/${pageId}`);
}
```

**페이지 전환 애니메이션 추가:**
```js
async function renderPage(pageId) {
    await ensurePageLoaded(pageId);

    // 현재 페이지 fade out
    const current = document.querySelector('.page-view:not(.hidden)');
    if (current) {
        current.style.opacity = '0';
        await new Promise(r => setTimeout(r, 150));
        current.classList.add('hidden');
        current.style.opacity = '';
    }

    // 새 페이지 fade in
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

### 4-2. 상태 관리 (Signals)

#### signal — 기본 상태

```js
const count = signal(0);

// 읽기
console.log(count.value);  // 0

// 쓰기 (연결된 effect 자동 실행)
count.value = 5;
count.value++;
```

#### computed — 파생 상태

```js
const firstName = signal('길동');
const lastName  = signal('홍');

// firstName 또는 lastName이 바뀔 때 자동 재계산
const fullName = computed(() => `${lastName.value} ${firstName.value}`);

console.log(fullName.value); // "홍 길동"
```

#### effect — 자동 DOM 반응

```js
// 읽는 signal이 바뀔 때마다 자동 실행
effect(() => {
    const name = fullName.value; // 이 signal을 "구독"
    document.getElementById('name-display').textContent = name;
});
```

> [!TIP]
> effect 내에서 `.value`로 읽은 signal만 구독됩니다.
> 조건문 안에 있어도 한 번이라도 읽히면 구독 대상이 됩니다.

#### 배열/객체 상태 업데이트

```js
const items = signal([]);

// ❌ 잘못된 방법: 참조가 안 바뀌어서 effect 미실행
items.value.push('새 항목');

// ✅ 올바른 방법: 새 배열로 교체
items.value = [...items.value, '새 항목'];

// 객체도 동일
const user = signal({ name: '홍길동', age: 30 });
user.value = { ...user.value, age: 31 };
```

---

### 4-3. 동적 페이지 로딩

```js
const loadedPages = new Set(); // 중복 로드 방지

async function ensurePageLoaded(pageId) {
    if (loadedPages.has(pageId)) return; // 이미 로드됨

    const response = await fetch(`pages/${pageId}.html`);
    if (!response.ok) throw new Error(`페이지 없음: ${pageId}`);

    const html = await response.text();
    document.getElementById('app-content')
        .insertAdjacentHTML('beforeend', html);

    // 번역 적용
    translateElement(document.getElementById(`page-${pageId}`));

    // 페이지별 초기화 실행
    pageInitializers[pageId]?.();

    loadedPages.add(pageId);
}

// 페이지별 초기화 함수 등록
const pageInitializers = {
    dashboard: () => loadDashboardData(),
    profile:   () => loadUserProfile(),
};
```

**장점:** 첫 로드 시 모든 HTML을 받지 않고, 사용자가 방문할 때만 로드합니다.
네트워크 효율이 좋고 초기 렌더링이 빠릅니다.

---

### 4-4. i18n 다국어

```js
// i18n.js
const dictionary = {
    KO: {
        'nav-home':   '홈',
        'nav-about':  '소개',
        'btn-submit': '제출',
        'greeting':   '안녕하세요, {name}님!',
    },
    EN: {
        'nav-home':   'Home',
        'nav-about':  'About',
        'btn-submit': 'Submit',
        'greeting':   'Hello, {name}!',
    }
};
```

```html
<!-- HTML에 data-i18n 속성만 붙이면 됨 -->
<button data-i18n="btn-submit">제출</button>
<h1 data-i18n="nav-home">홈</h1>
```

```js
// store.js — 언어 변경 시 자동 번역
const currentLang = signal('KO');

effect(() => {
    const lang = currentLang.value;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang]?.[key]) el.innerHTML = dictionary[lang][key];
    });
});

// 토글
function toggleLanguage() {
    s.currentLang.value = s.currentLang.value === 'KO' ? 'EN' : 'KO';
    // effect가 자동으로 전체 번역 처리
}
```

---

### 4-5. Toast & 로딩 상태 관리

SPA에서 가장 자주 필요한 두 가지 UI 피드백 패턴입니다.

#### Toast 알림

```js
// components/toast.js
const toasts = signal([]);

// store.js effect — toasts 변경 시 자동 렌더
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
<!-- index.html body 끝에 추가 -->
<div id="toast-container" class="fixed bottom-4 right-4 space-y-2 z-50"></div>
```

```js
// 어디서든 호출
showToast('저장되었습니다.', 'success');
showToast('네트워크 오류', 'error');
showToast('잠깐, 처리 중입니다.', 'info', 5000);
```

#### 전역 로딩 상태

```js
// store.js
const isLoading = signal(false);

// 로딩 상태 변경 시 스피너 자동 토글
effect(() => {
    document.getElementById('global-spinner')
        ?.classList.toggle('hidden', !isLoading.value);
    // 로딩 중 버튼 비활성화
    document.querySelectorAll('button[data-loading-lock]')
        .forEach(btn => btn.disabled = isLoading.value);
});
```

```js
// API 호출 래퍼 — 로딩 상태 자동 관리
async function withLoading(asyncFn) {
    s.isLoading.value = true;
    try {
        return await asyncFn();
    } finally {
        s.isLoading.value = false;
    }
}

// 사용 예시
async function handleSave() {
    await withLoading(async () => {
        const data = await API.merchants.update(id, payload);
        s.merchants.value = data;
        showToast('저장되었습니다.', 'success');
    });
}
```

```html
<!-- 전역 스피너 -->
<div id="global-spinner" class="hidden fixed inset-0 bg-black/20 flex items-center justify-center z-[999]">
    <div class="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
</div>

<!-- 로딩 중 자동 비활성화가 필요한 버튼 -->
<button data-loading-lock onclick="handleSave()">저장</button>
```

---

## 5. Advanced 패턴

### 5-1. Store 설계 원칙

규모가 커지면 Store를 **도메인별로 분리**합니다.

```
stores/
├── auth.store.js      ← 인증 상태
├── ui.store.js        ← UI 상태 (탭, 모달, 언어)
├── merchant.store.js  ← 비즈니스 도메인
└── store.js           ← 전체 조합 (aggregator)
```

```js
// stores/auth.store.js
(function() {
    const { signal, computed, effect } = window.Signals;

    const authToken   = signal(localStorage.getItem('authToken'));
    const isLoggedIn  = computed(() => !!authToken.value);

    // authToken 변경 시 localStorage 자동 동기화
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

### 5-2. computed / effect 활용

#### 체인 computed

```js
const rawPrice  = signal(100);
const taxRate   = signal(0.1);
const discount  = signal(0);

const taxedPrice    = computed(() => rawPrice.value * (1 + taxRate.value));
const finalPrice    = computed(() => taxedPrice.value - discount.value);
const formattedPrice = computed(() =>
    `₩${finalPrice.value.toLocaleString()}`
);

// formattedPrice는 rawPrice, taxRate, discount 중 하나라도 바뀌면 자동 재계산
effect(() => {
    document.getElementById('price-display').textContent = formattedPrice.value;
});
```

#### effect cleanup (인터벌/이벤트 정리)

```js
effect(() => {
    const merchantId = s.currentMerchantId.value;
    if (!merchantId) return;

    // 폴링 시작
    const interval = setInterval(() => fetchStatus(merchantId), 5000);

    // effect가 재실행되기 전에 자동 정리
    return () => clearInterval(interval);
});
```

---

### 5-3. 이벤트 버스 (Pub/Sub)

컴포넌트 간 직접 참조 없이 통신할 때 유용합니다.

```js
// eventBus.js
const EventBus = {
    _listeners: {},

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        // cleanup 함수 반환
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
// 사용 예시
// A 모듈: 이벤트 발행
EventBus.emit('payment:completed', { amount: 100, currency: 'USDT' });

// B 모듈: 이벤트 구독
EventBus.on('payment:completed', ({ amount, currency }) => {
    showToast(`${amount} ${currency} 결제 완료`);
    refreshDashboard();
});
```

> [!TIP]
> signals는 **동기적 상태 공유**에, EventBus는 **비동기 이벤트 전파**에 각각 사용합니다.
> 두 패턴을 함께 쓰면 대부분의 상황을 커버할 수 있습니다.

---

### 5-4. API 레이어 분리

API 호출을 별도 파일로 분리하면 유지보수가 쉬워집니다.

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

// 도메인별 API 함수
const API = {
    auth: {
        login:    (email, pw)  => apiFetch('/user/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) }),
        logout:   ()           => apiFetch('/user/logout', { method: 'POST' }),
        profile:  ()           => apiFetch('/user/profile'),
    },
    merchants: {
        list:     ()           => apiFetch('/merchants'),
        create:   (data)       => apiFetch('/merchants', { method: 'POST', body: JSON.stringify(data) }),
        update:   (id, data)   => apiFetch(`/merchants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
};

window.API = API;
```

```js
// app.js에서 사용
async function handleLogin() {
    try {
        const { token } = await API.auth.login(email, password);
        s.authToken.value = token; // effect가 nav 자동 처리
        navigateTo('dashboard');
    } catch (err) {
        showError(err.message);
    }
}
```

---

### 5-5. 대규모 앱 확장 전략

#### 권장 파일 구조

```
my-app/
├── index.html
├── app.js
├── api.js             ← API 레이어
├── i18n.js
├── eventBus.js        ← 이벤트 버스
├── stores/
│   ├── auth.store.js
│   ├── ui.store.js
│   └── store.js       ← aggregator
├── components/        ← 재사용 UI 조각 (선택)
│   ├── toast.js
│   └── modal.js
└── pages/
    ├── home.html
    ├── dashboard.html
    └── settings.html
```

#### 상태 변경 규칙 (Convention)

대규모 팀에서 규칙을 정해두면 디버깅이 쉬워집니다.

```js
// ✅ 상태 변경은 반드시 Store를 통해서
s.authToken.value = newToken;
s.merchants.value = [...s.merchants.value, newMerchant];

// ❌ DOM을 직접 찾아서 바꾸지 않음 (effect가 처리)
// document.getElementById('nav-login').classList.add('hidden');
```

#### 로컬 스토리지 자동 동기화 패턴

```js
// 앱 시작 시 복원 + 변경 시 자동 저장
function persistedSignal(key, defaultValue) {
    const stored = localStorage.getItem(key);
    const sig = signal(stored ? JSON.parse(stored) : defaultValue);

    effect(() => {
        localStorage.setItem(key, JSON.stringify(sig.value));
    });

    return sig;
}

// 사용 예시
const theme    = persistedSignal('theme', 'light');
const lastPage = persistedSignal('lastPage', 'home');
```

---

## 6. FAQ / React와 비교

### Q. React 대신 써도 되나요?

| 상황 | 권장 |
|------|------|
| 관리자 페이지, 대시보드, 내부 도구 | ✅ Lite-SPA |
| 빌드 서버 없는 정적 파일 서빙 | ✅ Lite-SPA |
| 마케팅 사이트, 랜딩 페이지 | ✅ Lite-SPA |
| 대규모 팀, 컴포넌트 재사용 중심 | React / Solid.js |
| 모바일 앱 수준의 복잡한 인터랙션 | React Native / Flutter |

### Q. Virtual DOM이 없으면 느리지 않나요?

아닙니다. Virtual DOM은 "느린 DOM 접근을 줄이기 위한 최적화"인데,
Lite-SPA는 signals의 **정밀 타겟 업데이트**로 같은 목표를 달성합니다.
바뀐 signal을 구독하는 effect만 실행되므로 불필요한 리렌더가 없습니다.

### Q. SSR이 안 되는 거 아닌가요?

클라이언트 사이드 렌더링만 지원합니다. SEO가 중요한 퍼블릭 콘텐츠 페이지에는 맞지 않습니다.
다만 **관리자 패널, 인증 후 대시보드**처럼 로그인 후 접근하는 화면엔 SEO가 불필요합니다.

### Q. insertAdjacentHTML로 주입하면 XSS 공격에 취약하지 않나요?

매우 날카로운 질문입니다! Lite-SPA의 템플릿 파일(`pages/*.html`)은 개발자가 직접 작성하는 신뢰할 수 있는 소스코드이므로 로드 시점에 필터링할 필요가 없으며, 이벤트 핸들러(onclick 등)를 보존하기 위해 **원본 그대로 삽입**합니다.

대신, **외부 사용자로부터 받은 비신뢰 데이터**를 처리할 때 다음과 같은 확실한 보안 대책을 준수합니다:
1. **텍스트 렌더링은 `.textContent` 강제**: 유저 닉네임, 본문 등은 절대 `innerHTML`로 바인딩하지 않고, 브라우저 엔진이 자동 이스케이프를 수행하는 `.textContent`에 대입합니다.
2. **동적 HTML이 불가피한 경우에만 DOMPurify 사용**: 사용자 입력에 마크업을 허용해야 하는 경우(예: 웹 에디터 결과물 렌더링)에 한해, 해당 바인딩 지점에서 **DOMPurify**를 선별 적용하여 소독합니다.
   * **예제**:
     ```html
     <!-- 필요 시점에만 DOMPurify 로드 -->
     <script src="https://unpkg.com/dompurify@3.0.8/dist/purify.min.js"></script>
     <script>
         const rawUserInput = "<img src=x onerror=alert(1)>";
         // 특정 주입 시점에만 정제하여 바인딩
         document.getElementById('comment-box').innerHTML = DOMPurify.sanitize(rawUserInput);
     </script>
     ```

### Q. Tailwind Play CDN을 쓸 때 화면이 깜빡거리는 현상(FOUC)은 어떻게 해결하나요?

Tailwind CDN이 HTML을 분석하고 스타일을 인젝션하기까지 극히 짧은 순간 스타일이 풀려 보이는 현상이 발생할 수 있습니다.
* **해결법**: `index.html`에서 Tailwind 스크립트를 불러오기 **전**에 `body { opacity: 0; }` 스타일과 함께 `window.tailwind` 설정을 안전하게 확장 정의합니다. 그 후 Tailwind CDN 컴파일 완료 시점인 `window.tailwind.ready` 이벤트 콜백에서 `body`에 `.tailwind-ready` 클래스를 추가하여 `opacity: 1`로 부드럽게 페이드인합니다.
  ```html
  <script>
      window.tailwind = window.tailwind || {};
      window.tailwind.config = window.tailwind.config || {};
      window.tailwind.ready = () => document.body.classList.add('tailwind-ready');
      setTimeout(() => document.body.classList.add('tailwind-ready'), 500);
  </script>
  ```

### Q. 대규모 프로젝트에서 컴포넌트 간 ID 충돌과 CSS 스타일 오염은 어떻게 방어하나요?

대규모 협업이나 공통 컴포넌트 관리가 필요할 때는 브라우저 표준인 **Web Components(Shadow DOM)**를 부분 도입하면 빌드 도구 없이도 완벽한 CSS/DOM 샌드박스를 구성할 수 있습니다.
* **Shadow DOM 사용 예시**:
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
* 일반적인 페이지 선택 시에는 `document` 범위로 요소를 쿼리하지 않고, 특정 컴포넌트의 루트 영역(`pageRoot.querySelector('.btn')`)으로 검색 범위를 제한하는 룰을 준수합니다.

### Q. TypeScript를 쓸 수 없나요?

`.js` 파일에 JSDoc을 쓰면 IDE 자동완성을 활용할 수 있습니다.

```js
/** @type {import('@preact/signals-core').Signal<string | null>} */
const authToken = signal(null);
```

### Q. 컴포넌트 재사용은 어떻게 하나요?

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

HTML 조각이 필요하면 **템플릿 함수**로 만듭니다.

```js
function renderProductCard(product) {
    return `
        <div class="border p-4">
            <h3>${product.name}</h3>
            <p>${product.price} USD</p>
            <button onclick="addToCart('${product.id}')">담기</button>
        </div>
    `;
}
```

---

## 마치며

Lite-SPA의 핵심 철학은 단 하나입니다.

> **브라우저가 이미 잘 하는 것을 굳이 추상화하지 말자.**

`fetch`, `CustomEvent`, `Proxy`, `localStorage` — 브라우저가 20년 넘게 발전시켜 온 API들을 조합하면, 3KB짜리 외부 의존성만으로도 충분히 복잡한 앱을 만들 수 있습니다.

React를 몰라도 됩니다. npm을 몰라도 됩니다.
HTML 파일 하나와 JavaScript로, 지금 바로 시작하세요.

---

*Lite-SPA Pattern — MIT License*
