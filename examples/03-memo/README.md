# 📝 Example 03: Real-time Memo Pad (Step-by-Step Tutorial)

This example guides you step-by-step through adding a new page, managing state using Preact Signals, and building reactive event flows in Lite-SPA.

## Objectives
1. Create and render a new HTML page template
2. Route a new URL pathway and link it in the navbar
3. Connect shared state (Signals) to `localStorage` for persistence
4. Understand SPA web server routing and conflict resolution (`cleanUrls` bug)

---

## 🛠️ Step-by-Step Implementation

### Step 1: Create the Page View (`pages/memo.html`)

Create a new file `pages/memo.html` and define the UI markup:

```html
<!-- pages/memo.html -->
<div id="page-memo" class="page-view hidden">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-4">📝 Real-time Memo</h1>
    <p class="text-gray-600 mb-6">Memos written here are synced to Preact Signals and persisted via localStorage.</p>
    
    <div class="space-y-4 max-w-md">
        <input 
            id="memo-input" 
            type="text" 
            class="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Type your memo here..."
        />
        
        <button 
            id="save-memo-btn" 
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
        >
            Save Memo
        </button>

        <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 mt-6">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Live Sync Panel</span>
            <p id="saved-memo-text" class="text-lg text-gray-800 font-medium italic">
                (No saved memo)
            </p>
        </div>
    </div>
</div>
```
> [!NOTE]
> * **Key Rule**: The outer wrapper element must have `id="page-[pageId]"` and `class="page-view hidden"`. The dynamic page router controls these classes to toggle screen visibility during transition.

---

### Step 2: Set Up Routing and Menu Link (`index.html` & `app.js`)

1. **Add Navbar Link (`index.html`)**:
   Under `<nav>`, append the button to navigate to `/memo`:
   ```html
   <button onclick="navigateTo('memo')" class="text-blue-500 hover:text-blue-600 font-semibold">Memo</button>
   ```

2. **Register Route (`app.js`)**:
   Add a route callback at the bottom to catch requests for `/memo`:
   ```javascript
   page('/memo',      () => renderPage('memo'));
   ```

---

### Step 3: Global State and Event Binding (`store.js` & `app.js`)

1. **Declare State Signal (`store.js`)**:
   Declare the `memoText` signal initialized with value from `localStorage`:
   ```javascript
   const memoText = signal(localStorage.getItem('memoText') || '');
   
   // ...
   window.Store = { currentPage, currentLang, authToken, isLoggedIn, memoText };
   ```

2. **UI Data Binding and Event Listeners (`app.js`)**:
   * Populate the UI text with initial value when entering the page (`renderPage` modification):
     ```javascript
     if (pageId === 'memo') {
         const el = document.getElementById('saved-memo-text');
         if (el) el.textContent = s.memoText.value || '(No saved memo)';
     }
     ```
   * Listen to state mutations reactively:
     ```javascript
     // 1. Reactive view update: Whenever s.memoText updates, update the DOM text.
     window.Signals.effect(() => {
         const val = s.memoText.value; // ★ Read signal value FIRST to register dependency!
         const el = document.getElementById('saved-memo-text');
         if (el) {
             el.textContent = val || '(No saved memo)';
         }
     });
     ```
   * Bind event listener to save inputs:
     ```javascript
     // 2. Click handler: Set signal and write to localStorage on button click
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

### Step 4: Resolve Local Server Routing Conflicts (`serve.json`)

When using `npx serve -s` (SPA mode), its default "Clean URLs" feature intercepts and redirects `.html` page template requests (e.g. `/pages/home.html` ➡️ `/pages/home`), causing infinite page nesting.

To disable this, create a `serve.json` config file inside the directory:
```json
{
  "cleanUrls": false
}
```
