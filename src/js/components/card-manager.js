import { CatalogEngine } from '../core/catalog-engine.js';
import { EXPRESSIONS_DB } from '../data/library-expressions.js';
import { EVENTS, dispatch, on } from '../core/events.js';
import { qs } from '../core/dom.js';
import { formatCategoryTag, normalizeCategory } from '../core/catalog-utils.js';

export class CardManager {
    constructor() {
        this.grid = qs('#expressionsGrid');
        this.visibleItems = [...EXPRESSIONS_DB];
        if (!this.grid) return;
        this.init();
    }

    init() {
        this.render();
        
        this.grid.addEventListener('click', (e) => this.handleActionClick(e));

        on(EVENTS.FILTER_CHANGED, (e) => this.filterByTag(e.detail.tag));
        on(EVENTS.SEARCH, (e) => this.searchByQuery(e.detail.query));
    }

    handleActionClick(event) {
        const button = event.target.closest('[data-action="open-lab"]');
        if (!button) return;

        const labID = button.dataset.labId;
        dispatch(EVENTS.OPEN_LAB, { labID });
    }

    cardTemplate(item, index) {
        const displayIndex = (index + 1).toString().padStart(2, '0');
        const category = normalizeCategory(item.category);
        
        return `
            <article class="b-static-card" data-category="${category}">
                <div class="b-static-card__viewport">
                    <div class="b-static-card__top">
                        <span class="b-static-card__index">${displayIndex}</span>
                        <span class="text-data">${formatCategoryTag(category)}</span>
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
        if (!this.grid) return;
        CatalogEngine.render(this.visibleItems, this.grid, this.cardTemplate.bind(this));
        dispatch(EVENTS.CONTENT_READY);
    }

    filterByTag(tag) {
        this.visibleItems = tag === 'all'
            ? [...EXPRESSIONS_DB]
            : EXPRESSIONS_DB.filter((item) => item.category === tag);
        this.render();
    }

    searchByQuery(query) {
        const q = query.toLowerCase();
        this.visibleItems = EXPRESSIONS_DB.filter((item) => 
            item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
        this.render();
    }
}