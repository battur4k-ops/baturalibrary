/* ============================================================
   JS / COMPONENTS / EXPRESSION-MANAGER.JS
   Batura Library | Global Filter System [Pill Style Sync]
   ============================================================ */

import { EXPRESSIONS_DB } from '../data/library-expressions.js';

export class ExpressionManager {
    constructor() {
        this.container = document.getElementById('tagsContainer');
        if (!this.container) return;
        
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
        this.container.innerHTML = this.categories.map((cat, index) => `
            <button class="ui-button ${index === 0 ? 'is-active' : ''}" 
                    type="button" 
                    data-tag="${cat}">
                <span>${this.formatLabel(cat)}</span>
            </button>
        `).join('');

        this.buttons = Array.from(this.container.querySelectorAll('.ui-button'));
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
                window.dispatchEvent(new CustomEvent('batura:filterChanged', {
                    detail: { tag: tag }
                }));

                console.log(`Batura System: Global filter active -> ${tag}`);
            });
        });
    }
}