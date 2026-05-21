// store.js — global state declarations
(function () {
    const { signal, computed, effect } = window.Signals;

    // ── State ──────────────────────────────────────
    const currentPage = signal('home');
    const currentLang = signal('EN');
    const authToken   = signal(localStorage.getItem('authToken'));

    // ── Computed (derived state) ───────────────────
    const isLoggedIn = computed(() => !!authToken.value);

    // ── Effects (automatic DOM reactions) ─────────
    effect(() => {
        // Automatically toggle navigation or buttons based on auth state
        const loggedIn = isLoggedIn.value;
        document.getElementById('btn-logout')
            ?.classList.toggle('hidden', !loggedIn);
        document.getElementById('btn-login')
            ?.classList.toggle('hidden', loggedIn);
    });

    effect(() => {
        // Automatically translate document when language changes
        const lang = currentLang.value;
        translateAll();
    });

    // ── Expose globally ────────────────────────────
    window.Store = { currentPage, currentLang, authToken, isLoggedIn };
})();
