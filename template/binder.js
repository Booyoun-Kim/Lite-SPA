// binder.js — Declarative Reactive Binding utilities for Lite-SPA
(function () {
    const { effect } = window.Signals || {};

    /**
     * Initializes declarative bindings (text, class, attributes) in the target element.
     * @param {HTMLElement} root - The root DOM element to search for bindings.
     * @param {Object} store - The store object containing Signals (defaults to window.Store).
     */
    function initBindings(root = document, store = window.Store) {
        if (!effect || !store) return;

        // 1. data-bind-text: Bind inner text of element to a Signal
        root.querySelectorAll('[data-bind-text]').forEach(el => {
            const stateKey = el.getAttribute('data-bind-text');
            const signal = store[stateKey];
            if (signal) {
                effect(() => {
                    el.textContent = signal.value !== undefined ? signal.value : '';
                });
            }
        });

        // 2. data-bind-class: Toggle class based on Signal boolean value (Format: "className:stateKey")
        root.querySelectorAll('[data-bind-class]').forEach(el => {
            const bindingExpr = el.getAttribute('data-bind-class');
            const [className, stateKey] = bindingExpr.split(':').map(s => s.trim());
            const signal = store[stateKey];
            if (signal) {
                effect(() => {
                    el.classList.toggle(className, !!signal.value);
                });
            }
        });

        // 3. data-bind-attr: Bind element attribute to Signal (Format: "attributeName:stateKey")
        root.querySelectorAll('[data-bind-attr]').forEach(el => {
            const bindingExpr = el.getAttribute('data-bind-attr');
            const [attrName, stateKey] = bindingExpr.split(':').map(s => s.trim());
            const signal = store[stateKey];
            if (signal) {
                effect(() => {
                    const val = signal.value;
                    if (val === true) {
                        el.setAttribute(attrName, '');
                    } else if (val === false || val === null || val === undefined) {
                        el.removeAttribute(attrName);
                    } else {
                        el.setAttribute(attrName, String(val));
                    }
                });
            }
        });
    }

    /**
     * Reusable list binding function that synchronizes a list of items with the DOM using keys to preserve focus/state.
     * @param {string} containerId - The ID of the container element.
     * @param {import('@preact/signals-core').Signal<Array>} listSignal - The Preact Signal containing the array list.
     * @param {Function} itemTemplateFn - Callback function returning HTML string for each item.
     */
    function bindList(containerId, listSignal, itemTemplateFn) {
        const container = document.getElementById(containerId);
        if (!container || !effect) return;

        effect(() => {
            const items = listSignal.value || [];
            const existingElements = new Map();

            // Collect existing child DOM nodes with keys
            Array.from(container.children).forEach(child => {
                const key = child.dataset.key;
                if (key) {
                    existingElements.set(key, child);
                }
            });

            const fragment = document.createDocumentFragment();

            items.forEach(item => {
                const key = String(item.id);
                let element = existingElements.get(key);

                if (element) {
                    // Re-use existing DOM element (prevents focus loss)
                    existingElements.delete(key);
                } else {
                    // Create new DOM element from template
                    const temp = document.createElement('div');
                    temp.innerHTML = itemTemplateFn(item).trim();
                    element = temp.firstElementChild;
                    element.dataset.key = key;
                }

                fragment.appendChild(element);
            });

            // Remove unused elements from DOM
            existingElements.forEach(el => el.remove());

            // Clear and insert sorted elements
            container.innerHTML = '';
            container.appendChild(fragment);
        });
    }

    // Expose utility functions globally
    window.Binder = { initBindings, bindList };
})();
