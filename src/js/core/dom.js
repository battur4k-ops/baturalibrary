export const qs = (selector, root = document) => {
    if (!root) return null;
    return root.querySelector(selector);
};

export const qsa = (selector, root = document) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll(selector));
};

export const setHTML = (el, html) => {
    if (el) el.innerHTML = html;
};
