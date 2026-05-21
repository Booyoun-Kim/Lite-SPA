// app.js — routing + business logic
const s = new Proxy(
  {},
  {
    get(_, key) {
      return window.Store?.[key];
    },
  },
);

const loadedPages = new Set();

// On-demand CSS Loader
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// On-demand Script Loader (returns a Promise)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePageLoaded(pageId) {
  if (loadedPages.has(pageId)) return;
  const html = await fetch(`/pages/${pageId}.html`).then((r) => r.text());
  document.getElementById("app-content").insertAdjacentHTML("beforeend", html);

  // (Optional) Load page-specific CSS on demand if you create pages/[pageId].css
  // loadCSS(`pages/${pageId}.css`);

  // Apply translations on load
  translateElement(document.getElementById(`page-${pageId}`));

  loadedPages.add(pageId);
}

async function renderPage(pageId) {
  await ensurePageLoaded(pageId);
  document
    .querySelectorAll(".page-view")
    .forEach((v) => v.classList.add("hidden"));
  document.getElementById(`page-${pageId}`)?.classList.remove("hidden");

  // 메모 페이지 진입 시, 저장되어 있던 초기값을 화면에 띄워줍니다.
  if (pageId === "memo") {
    const el = document.getElementById("saved-memo-text");
    if (el) el.textContent = s.memoText.value || "(저장된 메모가 없습니다)";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateTo(pageId) {
  page(pageId === "home" ? "/" : `/${pageId}`);
}

function toggleLanguage() {
  s.currentLang.value = s.currentLang.value === "EN" ? "KO" : "EN";
}

// Route definitions
page("/", () => renderPage("home"));
page("/about", () => renderPage("about"));
page("/memo", () => renderPage("memo"));

document.addEventListener("DOMContentLoaded", () => {
  page(); // Start router
});

// 1. 반응형 업데이트: s.memoText가 변하면 자동으로 화면의 글자를 업데이트합니다.
window.Signals.effect(() => {
  const val = s.memoText.value; // ★ 시그널을 먼저 읽어서 감시 대상으로 등록합니다.
  const el = document.getElementById("saved-memo-text");
  if (el) {
    el.textContent = val || "(저장된 메모가 없습니다)";
  }
});

// 2. 이벤트 리스너: 버튼을 누르면 입력창의 값을 s.memoText와 로컬스토리지에 저장합니다.
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "save-memo-btn") {
    const inputEl = document.getElementById("memo-input");
    if (inputEl) {
      const val = inputEl.value.trim();
      s.memoText.value = val; // 시그널 값을 변경 (화면이 알아서 바뀜)
      localStorage.setItem("memoText", val); // 로컬 스토리지 저장 (영구보존)
      inputEl.value = ""; // 입력창 초기화
    }
  }
});
