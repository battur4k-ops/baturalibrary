/**
 * BATURA LIBRARY | WEB COMPONENTS
 * Unified Navbar v8.0 [Morphing Search-X Controller]
 */

import { EVENTS, dispatch } from '../core/events.js';
import { qs } from '../core/dom.js';

class BaturaNavbar extends HTMLElement {
    constructor() {
        super();
        this._handleScroll = this._handleScroll.bind(this);
        this._ticking = false;
        this._isScrolled = false;
    }

    connectedCallback() {
        this.render();
        window.addEventListener('scroll', this._handleScroll, { passive: true });
        this._checkContext();
        this._setupSearch();
        this._handleScroll(); 
    }

    disconnectedCallback() {
        window.removeEventListener('scroll', this._handleScroll);
    }

    _checkContext() {
        const hasCatalog = !!document.getElementById('expressionsGrid') || !!document.querySelector('.l-grid-expressions');
        const searchContainer = qs('.b-navbar__search', this);
        if (hasCatalog && searchContainer) {
            searchContainer.classList.remove('is-hidden');
        }
    }

    _setupSearch() {
        const input = qs('#globalSearch', this);
        if (!input) return;

        // Обычный поиск
        input.addEventListener('input', (e) => {
            if (!document.body.classList.contains('is-lab-active')) {
                dispatch(EVENTS.SEARCH, { query: e.target.value });
            }
        });

        // Логика кнопки закрытия
        input.addEventListener('click', (e) => {
            if (document.body.classList.contains('is-lab-active')) {
                e.preventDefault();
                
                // ХИРУРГИЧЕСКОЕ ВМЕШАТЕЛЬСТВО:
                // 1. Немедленно убираем фокус, чтобы :focus в CSS не сработал после смены стейта
                input.blur(); 
                
                // 2. Генерируем событие закрытия
                dispatch(EVENTS.LAB_CLOSED);
            }
        });
    }

    _handleScroll() {
        if (!this._ticking) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.scrollY;
                const threshold = this._isScrolled ? 15 : 60;
                const shouldScroll = currentScroll > threshold;

                if (this._isScrolled !== shouldScroll) {
                    this._isScrolled = shouldScroll;
                    document.body.classList.toggle('is-scrolled', shouldScroll);
                }
                this._ticking = false;
            });
            this._ticking = true;
        }
    }

    render() {
        this.innerHTML = `
            <nav class="b-navbar" id="mainNav">
                <a href="index.html" class="b-navbar__brand" aria-label="Batura Home">
                    <div class="ui-button ui-button--logo">
                        <div class="b-logo">
                            <svg viewBox="0 0 796 1027" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M327.5 0H795.5L749 1027H409L425.5 893.5H384.5L357 1027H0L327.5 0Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                </a>

                <div class="b-navbar__search is-hidden">
                    <input type="text" id="globalSearch" placeholder="Search_Library..." autocomplete="off">
                    
                    <!-- Иконка крестика (показывается только в Lab Mode) -->
                    <div class="close-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                </div>
            </nav>
        `;
    }
}

if (!customElements.get('batura-navbar')) {
    customElements.define('batura-navbar', BaturaNavbar);
}