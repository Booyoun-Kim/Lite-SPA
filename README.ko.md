# Lite-SPA

> 빌드 도구와 npm이 없는 Vanilla JS SPA 아키텍처. 의존성 크기 약 3KB.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-~3KB-black)](#기술-스택-stack)

[English](README.md) | [한국어](README.ko.md)

HTML 파일 하나와 JavaScript만으로 실제 SPA를 빌드해 보세요. webpack도, `npm install`도, 빌드 단계도 필요 없습니다.

---

## 철학 (Philosophy)

> 브라우저가 이미 잘 지원하고 있는 기능을 굳이 추상화하지 마세요.

`fetch`, `localStorage`, `history.pushState` 등 브라우저는 지난 20년 동안 이러한 API들을 다듬어 왔습니다. Lite-SPA는 이를 아주 가벼운 반응형 상태 계층 (~1.6KB)과 결합하여 크기 대비 강력한 시너지를 냅니다.

## 누구를 위한 것인가요?

| 대상 독자 | Lite-SPA를 선택해야 하는 이유 |
|---|---|
| 백엔드 개발자 | 프론트엔드 빌드 파이프라인 없이 관리자 페이지 구축 |
| 1인 개발자 / 인디 해커 | CDN만으로 몇 초 만에 즉시 시작 |
| 레거시 프로젝트 유지보수자 | React를 도입하지 않고 jQuery 걷어내기 |
| 임베디드 웹 UI | IoT 콘솔, 내부 대시보드 |
| AI 코딩 에이전트 | 빌드 오류 차단 및 초소형 컨텍스트로 극대화된 "에이전트 친화성" |

### 🤖 왜 AI 에이전트에게 Lite-SPA가 이상적일까요? (Agent-Friendly)

Cursor, Copilot, Claude Engineer 등 AI 코딩 에이전트를 적극 활용하는 현대 개발 흐름에서 Lite-SPA는 AI가 코드를 작성하고 디버깅하기에 최적의 환경을 제공합니다.
- **빌드 실패 제로 (Zero-Build)**: 컴파일 단계나 번들링(Webpack/Vite/TSConfig)이 없기 때문에, AI 에이전트가 의존성 충돌이나 빌드 설정 오류를 해결하느라 API 토큰을 낭비하지 않습니다.
- **초소형 컨텍스트 크기**: 단순한 ES Modules로 구성되어 프로젝트 전체 구조가 매우 단순합니다. AI 에이전트가 전체 코드를 한눈에 파악할 수 있어, 컨텍스트가 잘리거나 엉뚱한 코드를 생성(환각 현상)하는 일이 거의 없습니다.
- **단순한 상태 흐름 판단**: Preact Signals는 `.value`를 직접 조작하는 동기식 구조입니다. React의 복잡한 훅 규칙(의존성 배열, Stale Closure 등)이 없기 때문에 AI 에이전트가 상태 흐름을 훨씬 더 정확하게 제어합니다.
- **웹 표준 기반**: 표준 HTML과 ESM은 LLM(대형 언어 모델)이 가장 많이 학습한 데이터 구조입니다. 따라서 변환 과정 없이 가장 에러가 적고 깔끔한 코드를 생성합니다.

> [!TIP]
> 이 저장소에는 AI 에이전트를 위한 [SKILL.md](SKILL.md) 가이드가 포함되어 있습니다. AI 에이전트에게 이 파일을 읽히거나 `.cursorrules` / `.clinerules`에 추가하면 즉시 Lite-SPA 디자인 패턴과 제약 조건을 학습시킬 수 있습니다.

## 기술 스택 (Stack)

| 관심사 | 도구 | 크기 |
|---|---|---|
| 라우팅 | [page.js](https://github.com/visionmedia/page.js) | 1.5KB |
| 상태 관리 | [@preact/signals-core](https://github.com/preactjs/signals) | 1.6KB |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com) (CDN) | — |
| 페이지 로드 | `fetch` + `insertAdjacentHTML` | 0KB |

**총 외부 JS: ~3KB. 빌드 단계: 0.**

---

## 빠른 시작 (Quick Start)

1. `template/` 폴더를 복사하여 프로젝트 디렉토리를 구성합니다.
2. 해당 디렉토리에서 **로컬 정적 웹 서버를 구동**합니다. (브라우저 보안 정책인 CORS 문제로 인해 `file://` 프로토콜로 `index.html`을 직접 열면 `fetch` 호출이 차단됩니다.)

### 로컬 웹 서버 구동 방법

아래 방법 중 하나를 선택하여 로컬 서버를 즉시 띄울 수 있습니다:

* **VS Code**: **Live Server** 익스텐션을 설치한 뒤, `index.html` 우클릭 -> **Open with Live Server** 실행.
* **Node.js**: 프로젝트 폴더에서 `npx serve -s` 실행.
  > [!IMPORTANT]
  > `npx serve -s` (SPA 모드)를 사용할 경우, Vercel의 Clean URLs 기능과의 충돌을 방지하기 위해 반드시 **`serve.json`** 파일을 생성하여 `cleanUrls`를 비활성화해야 합니다. 그렇지 않으면 `.html` 템플릿 요청이 리다이렉트되어 중첩 렌더링 루프가 발생합니다. 폴더 내에 다음과 같이 `serve.json` 파일을 작성해 주세요:
  > ```json
  > {
  >   "cleanUrls": false
  > }
  > ```
* **Python**: 프로젝트 폴더에서 `python -m http.server 8000` 실행.
* **PHP**: 프로젝트 폴더에서 `php -S localhost:8000` 실행.

```
template/
├── index.html   ← 앱 셸
├── app.js       ← 라우팅 + 로직
├── store.js     ← 전역 상태 (signals)
├── i18n.js      ← 다국어 번역 사전
└── pages/
    ├── home.html
    └── about.html
```

> `npm install`도, 환경 설정 파일도 없습니다 (`npx serve`를 쓸 때만 `serve.json`이 필요합니다). 단순 정적 서버 하나만 켜고 바로 코딩을 시작하세요.

---

## 배포 가이드 (Deployment)

Single Page Application(SPA) 특성상, 정적 파일이 아닌 가상 라우팅 경로(예: `/dashboard`)로 직접 접속하거나 새로고침을 할 경우 서버에 해당 파일이 없어 404 에러가 발생합니다. 따라서 모든 가상 경로 요청을 `index.html`로 리다이렉트(재작성)하되, JS, CSS, HTML 템플릿, 이미지 등의 정적 리소스는 그대로 서빙되도록 설정해야 합니다.

### AWS Amplify

AWS Amplify 콘솔의 **Rewrites and redirects (재작성 및 리디렉션)** 규칙에 아래 설정을 추가합니다. 정적 리소스가 `index.html`로 덮어써져 발생하는 중복 렌더링이나 리소스 로드 오류를 방지해 줍니다.

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webmanifest|html)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

### Vercel

프로젝트 루트 디렉토리에 `vercel.json` 파일을 생성하여 다음과 같이 설정합니다. 동적 HTML 템플릿 파일(`/pages/*.html`)의 파일 확장자가 누락되어 발생하는 무한 로딩/중첩 렌더링 문제를 방지하기 위해 `cleanUrls`를 비활성화하고, 가상 경로를 `index.html`로 리다이렉트합니다.

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

## 예제 (Examples)

| 예제 | 핵심 시연 내용 | 라이브 데모 |
|---|---|---|
| [01-counter](examples/01-counter/) | 시그널 기초, 여러 페이지 간의 상태 공유 | [열기](examples/01-counter/index.html) |
| [02-todo](examples/02-todo/) | 시그널 기반 복잡한 상태 관리, 로컬 저장소(localStorage) 연동 및 상태 영속화 | [열기](examples/02-todo/index.html) |
| [03-memo (튜토리얼)](examples/03-memo/) | 단계별 초심자 튜토리얼: 커스텀 라우팅, 시그널 상태 관리, 폼 데이터 바인딩 | [열기](examples/03-memo/index.html) |

> [!TIP]
> Lite-SPA를 처음 접하신다면, 처음부터 직접 새 페이지를 만들고 상태를 연결해 보는 **[03-memo 단계별 튜토리얼 (한글 설명서)](examples/03-memo/README.ko.md)** (영문 설명서: **[README.md](examples/03-memo/README.md)**)를 먼저 따라해 보시는 것을 강력히 추천합니다!

---

## 핵심 개념 (Core Concepts)

### Signals = 반응형 상태 (Reactive State)

```js
const count = signal(0);

// count가 변경될 때마다 자동으로 실행됨
effect(() => {
    document.getElementById('display').textContent = count.value;
});

// 이펙트 트리거
count.value++;
```

### 동적 페이지 로딩 (Dynamic Page Loading)

```js
async function renderPage(pageId) {
    // 첫 방문 시에만 HTML fetch
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

## 상세 문서 (Documentation)

- [Guide (English)](lite-spa-guide.en.md)
- [가이드 (한국어)](lite-spa-guide.ko.md)
- [AI 에이전트 가이드 (SKILL.md)](SKILL.md)

---

## 라이선스 (License)

MIT © 2026
