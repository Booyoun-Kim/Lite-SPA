// i18n.js — Translation dictionary + functions
const dictionary = {
    EN: {
        'nav-home':   'Home',
        'nav-about':  'About',
        'btn-submit': 'Submit',
        'greeting':   'Hello, {name}!',
    },
    KO: {
        'nav-home':   '홈',
        'nav-about':  '소개',
        'btn-submit': '제출',
        'greeting':   '안녕하세요, {name}님!',
    }
};

function translateElement(element) {
    if (!element) return;
    const lang = window.Store?.currentLang?.value || 'EN';
    
    // Check if the root element itself has data-i18n
    if (element.hasAttribute('data-i18n')) {
        const key = element.getAttribute('data-i18n');
        if (dictionary[lang]?.[key]) element.innerHTML = dictionary[lang][key];
    }
    
    // Find all children with data-i18n
    element.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang]?.[key]) el.innerHTML = dictionary[lang][key];
    });
}

function translateAll() {
    translateElement(document.documentElement);
}
