// store.js — counter state
(function () {
    const { signal, computed, effect } = window.Signals;

    // ── State ──────────────────────────────────────
    const currentPage = signal('home');
    const count = signal(0);

    // ── Effects (automatic DOM reactions) ─────────
    effect(() => {
        const val = count.value;
        // Automatically sync all elements that should display the counter
        document.querySelectorAll('[data-count]')
            .forEach(el => el.textContent = val);
    });

    // ── Expose globally ────────────────────────────
    window.Store = { currentPage, count };
})();
