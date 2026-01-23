/* ============================================================
   JS / COMPONENTS / ACCORDION-MANAGER.JS
   Batura Library | High-Logic Accordion [Symmetry Edition]
   ============================================================ */

import { ACCORDION_DATA } from '../data/accordion-data.js';

export class AccordionManager {
    constructor() {
        this.container = document.getElementById('mainAccordion');
        if (!this.container) return;
        this.init();
    }

    init() { this.render(); this.bindEvents(); }

    render() {
        this.container.innerHTML = ACCORDION_DATA.map((item, index) => `
            <article class="b-static-card ${index === 0 ? 'is-active' : ''}" 
                     data-category="${item.category || 'math'}" 
                     data-theme="${item.themeIndex}">
                
                <span class="b-static-card__index text-data">${item.index}</span>
                <span class="b-static-card__deco text-data">${item.label}</span>
                
                <div class="b-static-card__viewport">
                    <div class="b-static-card__body">
                        <span class="text-data">// AE_${(item.category || 'math').toUpperCase()}</span>
                        <h3 class="text-heading">${item.title}</h3>
                        <p class="text-body">${item.description}</p>
                    </div>

                    <div class="b-static-card__actions">
                        <!-- Изменили button на ссылку a, сохранив класс .ui-button -->
                        <a href="${item.link || '#'}" class="ui-button">
                            <span>${item.cta || 'Initialize'}</span>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');

        this.cards = Array.from(this.container.querySelectorAll('.b-static-card'));
        
        // При первой загрузке активируем тему первой карточки
        if (window.updateBgTheme) window.updateBgTheme(ACCORDION_DATA[0].themeIndex);
        
        window.dispatchEvent(new CustomEvent('batura:contentReady'));
    }

    bindEvents() {
        this.cards.forEach(card => {
            const activate = (e) => {
                // Если нажали на саму ссылку-кнопку, и карточка уже активна — позволяем переход
                if (e.target.closest('.ui-button') && card.classList.contains('is-active')) {
                    return; 
                }

                if (card.classList.contains('is-active')) return;
                
                // Если карточка не активна, активируем её и блокируем мгновенный переход по ссылке
                e.preventDefault(); 
                this.cards.forEach(c => c.classList.remove('is-active'));
    card.classList.add('is-active');

    const themeIndex = card.dataset.theme;
    if (themeIndex !== undefined && window.updateBgTheme) {
        const index = parseInt(themeIndex);
        window.updateBgTheme(index);
        
        // СОХРАНЯЕМ ТЕМУ: Чтобы следующая страница её подхватила
        localStorage.setItem('batura_theme_index', index);
    }

    window.dispatchEvent(new CustomEvent('batura:contentReady'));
};

            card.addEventListener('mouseenter', activate);
            card.addEventListener('click', activate);
        });
    }
}