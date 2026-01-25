/* ============================================================
   JS / COMPONENTS / EXPRESSION-MANAGER.JS
   Batura Library | Global Filter System [Pill Style Sync]
   ============================================================ */

import { EXPRESSIONS_DB } from '../data/library-expressions.js';
import { EVENTS, dispatch } from '../core/events.js';
import { qs, qsa, setHTML } from '../core/dom.js';

export class ExpressionManager {
    constructor() {
        this.tagsRoot = qs('#tagsContainer');
        if (!this.tagsRoot) return;
        
        // Автоматический сбор уникальных категорий из БД
        const rawCategories = EXPRESSIONS_DB.map(item => item.category);
        this.categories = ['all', ...new Set(rawCategories)];
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Рендерим кнопки используя системный класс .ui-button
     */
    render() {
        const html = this.categories.map((cat, index) => `
            <button class="ui-button ${index === 0 ? 'is-active' : ''}" 
                    type="button" 
                    data-tag="${cat}">
                <span>${this.formatLabel(cat)}</span>
            </button>
        `).join('');

        setHTML(this.tagsRoot, html);
        this.buttons = qsa('.ui-button', this.tagsRoot);
    }

    /**
     * Форматирование названий (math -> MATHEMATICS)
     */
    formatLabel(cat) {
        if (cat === 'all') return 'All Projects';
        if (cat === 'math') return 'Mathematics';
        return cat.replace('_', ' ').toUpperCase();
    }

    bindEvents() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;

                // Переключение визуального состояния
                this.buttons.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');

                // Отправка сигнала фильтрации в систему
                dispatch(EVENTS.FILTER_CHANGED, { tag });

                console.log(`Batura System: Global filter active -> ${tag}`);
            });
        });
    }
}