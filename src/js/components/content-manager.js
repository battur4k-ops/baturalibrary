import { PAGE_CONTENT } from '../data/page-content.js';
import { qsa } from '../core/dom.js';

export class ContentManager {
    constructor() {
        this.pageKey = document.body?.dataset?.page;
        this.content = this.pageKey ? PAGE_CONTENT[this.pageKey] : null;
        if (!this.content) return;
        this.apply();
    }

    apply() {
        const nodes = qsa('[data-content-key]');
        nodes.forEach((node) => {
            const key = node.dataset.contentKey;
            const value = this.resolve(key);
            if (value === undefined) return;
            if (node.dataset.contentMode === 'html') {
                node.innerHTML = value;
            } else {
                node.textContent = value;
            }
        });
    }

    resolve(path) {
        return path.split('.').reduce((acc, part) => acc?.[part], this.content);
    }
}
