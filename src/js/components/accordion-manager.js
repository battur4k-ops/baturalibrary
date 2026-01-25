/* ============================================================
   JS / COMPONENTS / ACCORDION-MANAGER.JS
   Batura Library | High-Logic Accordion [Symmetry Edition]
   ============================================================ */

import { ACCORDION_DATA } from '../data/accordion-data.js';
import { EVENTS, dispatch } from '../core/events.js';
import { qs, qsa, setHTML } from '../core/dom.js';
import { formatCategoryTag, normalizeCategory } from '../core/catalog-utils.js';
import { setStoredThemeIndex } from '../core/theme-storage.js';

export class AccordionManager {
    constructor() {
        this.accordionRoot = qs('#mainAccordion');
        if (!this.accordionRoot) return;
        this.init();
    }

    init() {
        this.renderCards();
        this.bindCardEvents();
    }

    renderCards() {
        const html = ACCORDION_DATA.map((item, index) => this.getCardMarkup(item, index)).join('');
        setHTML(this.accordionRoot, html);

        this.cards = qsa('.b-static-card', this.accordionRoot);

        if (window.updateBgTheme) {
            window.updateBgTheme(ACCORDION_DATA[0].themeIndex);
        }

        dispatch(EVENTS.CONTENT_READY);
    }

    getCardMarkup(item, index) {
        const isActive = index === 0 ? 'is-active' : '';
        const category = normalizeCategory(item.category);
        const ctaLabel = item.cta || 'Initialize';
        const link = item.link || '#';

        return `
            <article class="b-static-card ${isActive}" 
                     data-category="${category}" 
                     data-theme="${item.themeIndex}">
                
                <span class="b-static-card__index text-data">${item.index}</span>
                <span class="b-static-card__deco text-data">${item.label}</span>
                
                <div class="b-static-card__viewport">
                    <div class="b-static-card__body">
                        <span class="text-data">${formatCategoryTag(category)}</span>
                        <h3 class="text-heading">${item.title}</h3>
                        <p class="text-body">${item.description}</p>
                    </div>

                    <div class="b-static-card__actions">
                        <a href="${link}" class="ui-button">
                            <span>${ctaLabel}</span>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    bindCardEvents() {
        this.cards.forEach(card => {
            const activate = (e) => this.activateCard(card, e);
            card.addEventListener('mouseenter', activate);
            card.addEventListener('click', activate);
        });
    }

    activateCard(card, event) {
        const isActive = card.classList.contains('is-active');
        const isActionClick = event.target.closest('.ui-button');

        if (isActionClick && isActive) return;
        if (isActive) return;

        event.preventDefault();
        this.cards.forEach((entry) => entry.classList.remove('is-active'));
        card.classList.add('is-active');

        this.applyThemeFromCard(card);
        dispatch(EVENTS.CONTENT_READY);
    }

    applyThemeFromCard(card) {
        const themeIndex = card.dataset.theme;
        if (themeIndex === undefined || !window.updateBgTheme) return;

        const parsed = parseInt(themeIndex, 10);
        if (Number.isNaN(parsed)) return;
        window.updateBgTheme(parsed);
        setStoredThemeIndex(parsed);
    }
}