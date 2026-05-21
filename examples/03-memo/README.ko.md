# 📝 예제 03: 실시간 메모장 (Step-by-Step Tutorial)

이 예제는 Lite-SPA에 새로운 페이지를 추가하고, 반응형 상태(Preact Signals)를 어떻게 이벤트와 연결하는지 단계적으로 안내하는 초심자용 튜토리얼입니다.

## 학습 목표
1. 새로운 정적 HTML 템플릿 페이지 추가
2. 주소창(라우팅) 및 메뉴 버튼 연결
3. 전역 상태(Signal)와 로컬 저장소(localStorage) 연동
4. 개발 환경에서의 SPA 서버 충돌 대처 방법 이해

---

## 🛠️ Step-by-Step 구현 단계

### 1단계: 화면 설계하기 (`pages/memo.html` 생성)

사용자에게 보일 메모장 UI를 정의합니다.
`pages/` 폴더 내에 `memo.html` 파일을 생성하고 아래 코드를 작성합니다.

```html
<!-- pages/memo.html -->
<div id="page-memo" class="page-view hidden">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-4">📝 실시간 메모장</h1>
    <p class="text-gray-600 mb-6">입력한 메모는 전역 상태와 로컬 스토리지에 동기화되어 보존됩니다.</p>
    
    <div class="space-y-4 max-w-md">
        <input 
            id="memo-input" 
            type="text" 
            class="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="메모를 여기에 입력해보세요..."
        />
        
        <button 
            id="save-memo-btn" 
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
        >
            메모 저장하기
        </button>

        <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 mt-6">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">저장된 메모 실시간 동기화</span>
            <p id="saved-memo-text" class="text-lg text-gray-800 font-medium italic">
                (저장된 메모가 없습니다)
            </p>
        </div>
    </div>
</div>
```
> [!NOTE]
> * **핵심 규칙**: 최상단 컨테이너 div에 반드시 `id="page-[페이지이름]"`과 `class="page-view hidden"`을 지정해야 합니다. 라우터가 화면 전환 시 이 클래스를 조작하여 화면을 숨기거나 나타냅니다.

---

### 2단계: 주소 및 메뉴 연결 (`index.html` & `app.js` 수정)

새로 만든 페이지로 갈 수 있는 길(Route)을 뚫어줍니다.

1. **메뉴 버튼 추가 (`index.html`)**:
   네비게이션 바(`<nav>`) 영역에 Memo 메뉴로 가는 버튼을 추가합니다.
   ```html
   <button onclick="navigateTo('memo')" class="text-blue-500 hover:text-blue-600 font-semibold">Memo</button>
   ```

2. **라우터 주소 등록 (`app.js`)**:
   주소창 뒤에 `/memo`가 들어오면 `memo` 페이지를 렌더링하도록 지시합니다.
   ```javascript
   page('/memo',      () => renderPage('memo'));
   ```

---

### 3단계: 상태 관리와 이벤트 연결 (`store.js` & `app.js` 수정)

1. **상태(Signal) 선언 (`store.js`)**:
   모든 페이지에서 접근 가능한 메모 데이터 공간을 확보합니다. 로컬스토리지에 기존 값이 저장되어 있다면 이를 초기값으로 읽어옵니다.
   ```javascript
   const memoText = signal(localStorage.getItem('memoText') || '');
   
   // ... 생략 ...
   window.Store = { currentPage, currentLang, authToken, isLoggedIn, memoText };
   ```

2. **데이터 화면 연동 및 이벤트 바인딩 (`app.js`)**:
   * 페이지 진입 시 저장되어 있던 초기값을 화면에 띄워줍니다 (`renderPage` 수정).
     ```javascript
     if (pageId === 'memo') {
         const el = document.getElementById('saved-memo-text');
         if (el) el.textContent = s.memoText.value || '(저장된 메모가 없습니다)';
     }
     ```
   * 값이 변할 때 화면을 실시간으로 업데이트하는 반응형 뷰를 작성합니다.
     ```javascript
     // 1. 반응형 업데이트: s.memoText가 변하면 자동으로 화면의 글자를 업데이트합니다.
     window.Signals.effect(() => {
         const val = s.memoText.value; // ★ 시그널을 먼저 읽어서 감시 대상으로 자동 등록(구독)해야 합니다.
         const el = document.getElementById('saved-memo-text');
         if (el) {
             el.textContent = val || '(저장된 메모가 없습니다)';
         }
     });
     ```
   * 버튼 클릭 이벤트를 등록하여 입력값을 상태 및 로컬 스토리지에 저장합니다.
     ```javascript
     // 2. 이벤트 리스너: 버튼을 누르면 입력창의 값을 저장합니다.
     document.addEventListener('click', (e) => {
         if (e.target && e.target.id === 'save-memo-btn') {
             const inputEl = document.getElementById('memo-input');
             if (inputEl) {
                 const val = inputEl.value.trim();
                 s.memoText.value = val;
                 localStorage.setItem('memoText', val);
                 inputEl.value = '';
             }
         }
     });
     ```

---

### 4단계: 로컬 개발 서버 충돌 해소 (`serve.json` 생성)

`npx serve -s`와 같이 SPA 전용 서버를 사용할 경우, `.html` 파일 요청 시 확장자를 생략하려 리다이렉트하는 기능(Clean URLs)과 충돌하여 홈 화면이 중첩되어 로딩되는 현상이 발생합니다. 

이를 해결하기 위해 루트 폴더 내에 `serve.json`을 아래와 같이 생성하여 관련 기능을 비활성화해 줍니다.
```json
{
  "cleanUrls": false
}
```
