// app.js — routing + business logic
const s = new Proxy({}, {
    get(_, key) { return window.Store?.[key]; }
});

const loadedPages = new Set();

async function ensurePageLoaded(pageId) {
    if (loadedPages.has(pageId)) return;
    const rawHtml = await fetch(`pages/${pageId}.html`).then(r => r.text());
    
    // Sanitize HTML to prevent XSS attacks if DOMPurify is available
    const cleanHtml = typeof DOMPurify !== 'undefined'
        ? DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-i18n'] })
        : rawHtml;
        
    document.getElementById('app-content').insertAdjacentHTML('beforeend', cleanHtml);
    
    // Apply translations on load
    translateElement(document.getElementById(`page-${pageId}`));
    
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

function toggleLanguage() {
    s.currentLang.value = s.currentLang.value === 'EN' ? 'KO' : 'EN';
}

// Route definitions
page('/',          () => renderPage('home'));
page('/about',     () => renderPage('about'));

document.addEventListener('DOMContentLoaded', () => {
    page(); // Start router
});
