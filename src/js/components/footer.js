/**
 * BATURA LIBRARY | WEB COMPONENTS
 * Unified Footer v7.0 [Data-Driven Edition]
 */

import { FOOTER_DATA } from '../data/footer-data.js';

class BaturaFooter extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        const { brand, groups, bottom } = FOOTER_DATA;

        this.innerHTML = `
            <footer class="b-footer l-container">
                <div class="b-footer__grid">
                    
                    <!-- BRAND COLUMN -->
                    <div class="b-footer__brand l-flow">
                        <span class="text-data">${brand.label}</span>
                        <p class="text-body">${brand.description}</p>
                        
                        <div class="b-footer__logo">
                            <div class="b-logo">
                                <svg viewBox="0 0 796 1027" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M327.5 0H795.5L749 1027H409L425.5 893.5H384.5L357 1027H0L327.5 0Z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- DYNAMIC GROUPS (Resources, Connect, etc.) -->
                    ${groups.map(group => `
                        <div class="b-footer__group">
                            <span class="text-data">${group.title}</span>
                            <div class="l-flow">
                                ${group.links.map(link => `
                                    <a href="${link.url}" 
                                       class="b-footer__link" 
                                       ${link.target ? `target="${link.target}"` : ''}>
                                        ${link.label}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}

                </div>

                <!-- BOTTOM TERMINAL -->
                <div class="b-footer__bottom">
                    <span class="text-data">${bottom.copyright}</span>
                    <span class="text-data">${bottom.version}</span>
                </div>
            </footer>
        `;
    }
}

if (!customElements.get('batura-footer')) {
    customElements.define('batura-footer', BaturaFooter);
}