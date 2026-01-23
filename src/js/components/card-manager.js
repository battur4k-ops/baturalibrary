import { CatalogEngine } from '../core/catalog-engine.js';
import { EXPRESSIONS_DB } from '../data/library-expressions.js';

export class CardManager {
    constructor() {
        this.container = document.getElementById('expressionsGrid');
        this.currentData = [...EXPRESSIONS_DB];
        if (!this.container) return;
        this.init();
    }

    init() {
        this.render();
        
        // ДЕЛЕГИРОВАНИЕ КЛИКА: Слушаем весь контейнер
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="open-lab"]');
            if (btn) {
                const labID = btn.dataset.labId;
                // Сигнал Лилит: Открыть интерфейс
                window.dispatchEvent(new CustomEvent('batura:openLab', {
                    detail: { labID: labID }
                }));
            }
        });

        window.addEventListener('batura:filterChanged', (e) => this.filter(e.detail.tag));
        window.addEventListener('batura:search', (e) => this.search(e.detail.query));
    }

    cardTemplate(item, index) {
        const displayIndex = (index + 1).toString().padStart(2, '0');
        
        return `
            <article class="b-static-card" data-category="${item.category || 'math'}">
                <div class="b-static-card__viewport">
                    <div class="b-static-card__top">
                        <span class="b-static-card__index">${displayIndex}</span>
                        <span class="text-data">// AE_${(item.category || 'math').toUpperCase()}</span>
                    </div>
                    
                    ${item.previewID ? `<div class="b-preview-box" data-preview="${item.previewID}"></div>` : ''}

                    <div class="b-static-card__body">
                        <h3 class="text-heading">${item.title}</h3>
                        <p class="text-body">${item.description}</p>
                    </div>

                    <div class="b-static-card__actions">
                        <button class="ui-button" type="button" 
                                data-action="open-lab" 
                                data-lab-id="${item.labID}">
                            <span>Open_Interface</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    render() {
        if (!this.container) return;
        CatalogEngine.render(this.currentData, this.container, this.cardTemplate.bind(this));
        window.dispatchEvent(new CustomEvent('batura:contentReady'));
    }

    filter(tag) {
        this.currentData = tag === 'all' ? [...EXPRESSIONS_DB] : EXPRESSIONS_DB.filter(i => i.category === tag);
        this.render();
    }

    search(query) {
        const q = query.toLowerCase();
        this.currentData = EXPRESSIONS_DB.filter(i => 
            i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
        );
        this.render();
    }
}