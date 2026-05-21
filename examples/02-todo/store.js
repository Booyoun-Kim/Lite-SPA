// store.js — Todo application state
(function () {
    const { signal, effect } = window.Signals;

    // ── Load Initial State ──────────────────────────
    let initialTodos = [];
    try {
        const saved = localStorage.getItem('lite_spa_todos');
        if (saved) {
            initialTodos = JSON.parse(saved);
            if (!Array.isArray(initialTodos)) {
                initialTodos = [];
            }
        }
    } catch (e) {
        console.error("Failed to parse todos from localStorage:", e);
    }

    // ── State ──────────────────────────────────────
    const todos = signal(initialTodos);
    const filter = signal('all'); // 'all', 'active', 'completed'

    // ── Effects ────────────────────────────────────
    // 1. Sync todos to localStorage automatically
    effect(() => {
        try {
            localStorage.setItem('lite_spa_todos', JSON.stringify(todos.value));
        } catch (e) {
            console.error("Failed to save todos to localStorage:", e);
        }
    });

    // 2. Automatically sync global header pending counts
    effect(() => {
        const pendingCount = todos.value.filter(t => !t.completed).length;
        const headerPending = document.querySelector('[data-header-pending]');
        if (headerPending) {
            headerPending.textContent = pendingCount;
        }
    });

    // 3. Automatically run UI renders when state changes
    effect(() => {
        // Register dependencies
        todos.value;
        filter.value;

        // Execute rendering functions if they are defined on window (by app.js)
        if (typeof window.renderTodoList === 'function') {
            window.renderTodoList();
        }
        if (typeof window.renderStats === 'function') {
            window.renderStats();
        }
    });

    // ── Expose globally ────────────────────────────
    window.Store = { todos, filter };
})();
