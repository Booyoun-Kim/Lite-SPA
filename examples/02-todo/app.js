// app.js — routing + todo business logic
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
    
    // Sync UI values immediately on page render
    if (pageId === 'home') {
        renderTodoList();
    } else if (pageId === 'about') {
        renderStats();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateTo(pageId) {
    page(pageId === 'home' ? '/' : `/${pageId}`);
}

// ── HTML Escaper ────────────────────────────────
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ── Actions ─────────────────────────────────────
function addTodo(event) {
    event.preventDefault();
    const input = document.getElementById('todo-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now().toString(),
        text: text,
        completed: false
    };

    // Update signal state
    s.todos.value = [...s.todos.value, newTodo];
    input.value = '';
}

function toggleTodo(id) {
    s.todos.value = s.todos.value.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
    );
}

function deleteTodo(id) {
    s.todos.value = s.todos.value.filter(t => t.id !== id);
}

function setFilter(filterVal) {
    s.filter.value = filterVal;
}

function clearCompleted() {
    s.todos.value = s.todos.value.filter(t => !t.completed);
}

// ── Renders ─────────────────────────────────────
function renderTodoList() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    const currentFilter = s.filter.value;
    const items = s.todos.value.filter(t => {
        if (currentFilter === 'active') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
    });

    // Render items list
    list.innerHTML = items.map(t => `
        <li class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg group transition-colors">
            <div class="flex items-center gap-3 flex-grow">
                <input type="checkbox" ${t.completed ? 'checked' : ''} 
                    onchange="toggleTodo('${t.id}')" 
                    class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
                <span class="flex-grow ${t.completed ? 'line-through text-gray-400 font-medium' : 'text-gray-700 font-medium'} select-none">
                    ${escapeHtml(t.text)}
                </span>
            </div>
            <button onclick="deleteTodo('${t.id}')" 
                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 font-semibold text-sm transition-opacity px-2 py-1 rounded hover:bg-red-50">
                Delete
            </button>
        </li>
    `).join('') || `
        <li class="py-8 text-center text-gray-400 flex flex-col items-center justify-center">
            <svg class="h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            No tasks found
        </li>
    `;

    // Update active count
    const activeCount = s.todos.value.filter(t => !t.completed).length;
    const countEl = document.getElementById('active-count');
    if (countEl) {
        countEl.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
    }

    // Toggle styling of filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        if (btn.dataset.filter === currentFilter) {
            btn.className = "px-3 py-1.5 text-xs font-bold bg-blue-500 text-white rounded-md shadow-sm transition-all";
        } else {
            btn.className = "px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all";
        }
    });
}

function renderStats() {
    const totalEl = document.querySelector('[data-stat-total]');
    const completedEl = document.querySelector('[data-stat-completed]');
    const pendingEl = document.querySelector('[data-stat-pending]');
    
    if (totalEl) totalEl.textContent = s.todos.value.length;
    if (completedEl) completedEl.textContent = s.todos.value.filter(t => t.completed).length;
    if (pendingEl) pendingEl.textContent = s.todos.value.filter(t => !t.completed).length;
}

// Expose rendering functions globally so store.js effects can call them
window.renderTodoList = renderTodoList;
window.renderStats = renderStats;

// Expose actions globally for HTML event attributes
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.setFilter = setFilter;
window.clearCompleted = clearCompleted;
window.navigateTo = navigateTo;

// Route definitions
page('/',          () => renderPage('home'));
page('/about',     () => renderPage('about'));

document.addEventListener('DOMContentLoaded', () => {
    page(); // Start router
});
