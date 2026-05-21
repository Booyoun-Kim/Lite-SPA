# Lite-SPA

> 빌드 도구와 npm이 없는 Vanilla JS SPA 아키텍처. 의존성 크기 약 3KB.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-~3KB-black)]()

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

`template/` 폴더를 복사한 후 브라우저나 정적 파일 서버에서 `index.html`을 엽니다.

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

> `npm install`도, 환경 설정 파일도 없습니다. 열고 실행하기만 하면 됩니다.

---

## 예제 (Examples)

| 예제 | 핵심 시연 내용 | 라이브 데모 |
|---|---|---|
| [01-counter](examples/01-counter/) | 시그널 기초, 여러 페이지 간의 상태 공유 | [열기](examples/01-counter/index.html) |

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

---

## 라이선스 (License)

MIT © 2026
