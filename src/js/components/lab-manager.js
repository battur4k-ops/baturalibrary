import { EXPRESSIONS_DB } from '../data/library-expressions.js';
import { EVENTS, dispatch, on } from '../core/events.js';
import { qs, qsa } from '../core/dom.js';

export class LabManager {
    constructor() {
        this.body = document.body;
        this.interface = qs('.l-lab-interface');
        this.currentParams = {};
        this.activeTab = 'position';
        this.currentLabConfig = null;
        this.cleanupTimeout = null;
        this.leftLenis = null;
        this.rightLenis = null;
        this.readyTimeout = null;
        this.onLabTransitionEnd = null;
        
        this.init();
    }

    init() {
        on(EVENTS.OPEN_LAB, (e) => this.open(e.detail.labID));
        on(EVENTS.LAB_CLOSED, () => this.close());
        
        document.addEventListener('click', (e) => {
            if (this.interface) {
                const activeInfos = qsa('.ui-info-group.is-info-active', this.interface);
                activeInfos.forEach(group => group.classList.remove('is-info-active'));
            }
        });
    }

    async open(labID) {
        if (this.cleanupTimeout) { clearTimeout(this.cleanupTimeout); this.cleanupTimeout = null; }
        if (this.readyTimeout) { clearTimeout(this.readyTimeout); this.readyTimeout = null; }
        const data = EXPRESSIONS_DB.find(item => item.labID === labID);
        if (!data || !this.interface) return;

        try {
            const module = await import(`../lab/${labID}.js`);
            this.currentLabConfig = module.labConfig;
            
            // Сброс параметров
            this.currentParams = {};
            this.activeTab = this.currentLabConfig.defaultTab || 'position';

            this.renderLayout(this.currentLabConfig);
            
            await this.initScroll('left');
            await this.initScroll('right');
            
            this.updateCodeDisplay();

            requestAnimationFrame(() => {
                this.body.classList.add('is-lab-active');
                this.interface.classList.remove('is-lab-ready');
                this.interface.classList.add('is-lab-motion');
                if (this.onLabTransitionEnd) {
                    this.interface.removeEventListener('transitionend', this.onLabTransitionEnd);
                }
                this.onLabTransitionEnd = (event) => {
                    if (event.propertyName !== 'transform') return;
                    this.interface.classList.add('is-lab-ready');
                    this.interface.classList.remove('is-lab-motion');
                    this.interface.removeEventListener('transitionend', this.onLabTransitionEnd);
                };
                this.interface.addEventListener('transitionend', this.onLabTransitionEnd);
                const morphRaw = getComputedStyle(this.interface).getPropertyValue('--d-morph').trim();
                const morphMs = morphRaw.endsWith('ms')
                    ? parseFloat(morphRaw)
                    : parseFloat(morphRaw) * 1000;
                const fallbackDelay = Number.isNaN(morphMs) ? 1000 : morphMs + 50;
                this.readyTimeout = setTimeout(() => {
                    this.interface.classList.add('is-lab-ready');
                }, fallbackDelay);
                dispatch(EVENTS.LAB_OPENED, { labID });
            });
        } catch (err) { console.error(`Error: [${labID}]`, err); }
    }

    renderLayout(config) {
        const setupCol = qs('.l-lab-interface__column--setup', this.interface);
        const engineCol = qs('.l-lab-interface__column--engine', this.interface);
        const viewportCol = qs('.l-lab-interface__column--viewport', this.interface);

        const prepareCol = (el) => {
            if (!el) return null;
            el.style.display = ''; 
            el.innerHTML = `<div class="b-lab-column-header l-flow"></div><div class="b-lab-column-body" data-lenis-prevent="true"><div class="l-flow"></div></div>`;
            return { 
                header: qs('.b-lab-column-header', el), 
                body: qs('.b-lab-column-body .l-flow', el)
            };
        };

        const leftCtx = prepareCol(setupCol);
        const rightCtx = prepareCol(engineCol);
        let currentSide = 'left';

        config.schema.forEach(item => {
            if (item.side) currentSide = item.side;
            const ctx = currentSide === 'right' ? rightCtx : leftCtx;
            if (!ctx) return;

            switch (item.type) {
                case 'hero': 
                case 'heading':
                    ctx[item.type === 'hero' ? 'header' : 'body'].appendChild(this.createHeading(item));
                    if (item.type === 'hero') {
                        const div = document.createElement('div'); div.className = 'b-lab-divider';
                        ctx.header.appendChild(div);
                    }
                    break;

                case 'range': 
                    ctx.body.appendChild(this.createSlider(item)); 
                    break;

                case 'tabs':
                    ctx.body.appendChild(this.createTabs(item));
                    break;

                case 'code-block':
                    ctx.body.appendChild(this.createCodeBlock(item));
                    break;

                case 'copy-button':
                    ctx.body.appendChild(this.createCopyButton(item));
                    break;

                case 'instruction':
                    ctx.body.appendChild(this.createInstruction(item));
                    break;

                case 'data': 
                    const data = document.createElement('span'); 
                    data.className = 'text-data'; data.textContent = item.content; 
                    ctx.header.appendChild(data); 
                    break;

                case 'spacer': 
                    const spacer = document.createElement('div'); spacer.className = 'b-spacer'; 
                    ctx.header.appendChild(spacer); 
                    break;
            }
        });
        
        if (viewportCol) this.renderMobileControls(viewportCol);
    }

    createHeading(item) {
        const group = document.createElement('div'); group.className = 'ui-info-group';
        const row = document.createElement('div'); row.className = 'ui-info-group__header';
        const title = document.createElement('h2');
        title.className = (item.type === 'hero') ? 'text-heading' : 'text-subheading';
        title.textContent = item.content;
        row.appendChild(title);

        if (item.info) {
            const tag = document.createElement('span'); tag.className = 'ui-info-tag'; tag.textContent = '[INFO]';
            const desc = document.createElement('div'); desc.className = 'ui-info-group__description';
            desc.innerHTML = `<div class="description-inner"><p class="text-info-hint">${item.info}</p></div>`;
            tag.addEventListener('click', (e) => { e.stopPropagation(); group.classList.toggle('is-info-active'); });
            row.appendChild(tag);
            group.appendChild(row);
            group.appendChild(desc);
        } else { group.appendChild(row); }
        return group;
    }

    createTabs(item) {
        const wrap = document.createElement('div');
        wrap.className = 'ui-tabs-group';
        item.options.forEach(opt => {
            const btn = document.createElement('button');
            // Стандартная кнопка из твоей системы
            btn.className = `ui-button ${this.activeTab === opt.id ? 'is-active' : ''}`;
            btn.innerHTML = `<span>${opt.label}</span>`;
            btn.onclick = () => {
                wrap.querySelectorAll('.ui-button').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                this.activeTab = opt.id;
                this.updateCodeDisplay();
            };
            wrap.appendChild(btn);
        });
        return wrap;
    }

    createCodeBlock() {
        const wrap = document.createElement('div');
        wrap.className = 'b-code-box';
        wrap.innerHTML = `<div class="b-code-box__content"></div>`;
        return wrap;
    }

    createInstruction(item) {
        const wrap = document.createElement('div');
        wrap.className = 'ui-instruction';
        
        const title = document.createElement('span');
        title.className = 'ui-instruction__title';
        title.textContent = 'INSTRUCTION';
        wrap.appendChild(title);

        const content = document.createElement('div');
        content.className = 'ui-instruction__content';

        item.content.forEach((text, i) => {
            const p = document.createElement('p');
            p.className = 'text-info-hint';
            p.textContent = `${i + 1}. ${text}`;
            content.appendChild(p);
        });
        
        wrap.appendChild(content);
        return wrap;
    }

    createCopyButton(item) {
        const btn = document.createElement('button');
        // Добавляем класс is-full-width, чтобы кнопка растянулась
        btn.className = 'ui-button is-full-width'; 
        btn.dataset.feedback = 'COPIED!';
        btn.innerHTML = `<span>${item.label}</span>`;
        
        btn.onclick = () => {
            const code = this.getCodeContent();
            if (!code) return;
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(code);
            }
            
            // Визуальный фидбек
            btn.classList.add('is-copied');
            if (btn.copyTimeout) clearTimeout(btn.copyTimeout);
            btn.copyTimeout = setTimeout(() => {
                btn.classList.remove('is-copied');
            }, 500);
        };
        return btn;
    }


    createSlider(p) {
        this.currentParams[p.id] = p.default;
        const wrap = document.createElement('div');
        wrap.className = 'ui-range';
        wrap.innerHTML = `
            <div class="ui-range__header"><span class="text-data">${p.label}</span>
            <span class="text-data value" contenteditable="true">${p.default.toString().replace('.', ',')}</span></div>
            <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}" data-lenis-prevent="true">
        `;
        const input = wrap.querySelector('input');
        const display = wrap.querySelector('.value');

        input.addEventListener('input', (e) => {
            const val = e.target.value;
            this.currentParams[p.id] = parseFloat(val);
            display.textContent = val.replace('.', ',');
            this.updateCodeDisplay();
        });

        const activate = () => wrap.classList.add('is-active');
        const deactivate = () => wrap.classList.remove('is-active');
        input.addEventListener('pointerdown', activate);
        input.addEventListener('pointerup', deactivate);
        input.addEventListener('pointercancel', deactivate);
        input.addEventListener('blur', deactivate);
        input.addEventListener('change', deactivate);
        input.addEventListener('touchstart', activate, { passive: true });
        input.addEventListener('touchend', deactivate);

        return wrap;
    }

    getCodeContent() {
        if (!this.currentLabConfig) return '';
        const templateFn = this.currentLabConfig.codeTemplates?.[this.activeTab];
        return templateFn ? templateFn(this.currentParams) : '';
    }

    updateCodeDisplay() {
        const codeEl = qs('.b-code-box__content', this.interface);
        if (!codeEl) return;
        const code = this.getCodeContent();
        if (code) codeEl.innerText = code;
    }

    // --- ОСТАЛЬНАЯ ЛОГИКА (БЕЗ ИЗМЕНЕНИЙ) ---
    async initScroll(side) {
        const selector = side === 'left' ? '.l-lab-interface__column--setup' : '.l-lab-interface__column--engine';
        const colEl = qs(selector, this.interface);
        const wrapper = qs('.b-lab-column-body', colEl);
        const content = qs('.l-flow', wrapper);
        if (!wrapper || !content) return;
        const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
        const isMobile = window.matchMedia('(max-width: 1100px)').matches;
        if (isTouch || isMobile) {
            return;
        }
        const LenisModule = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm');
        const Lenis = LenisModule.default;
        const lenisInstance = new Lenis({ wrapper, content, duration: 1.4, smoothWheel: true });
        if (side === 'left') this.leftLenis = lenisInstance; else this.rightLenis = lenisInstance;
        const scrollFn = (time) => {
            if (this.leftLenis && side === 'left') this.leftLenis.raf(time);
            if (this.rightLenis && side === 'right') this.rightLenis.raf(time);
            requestAnimationFrame(scrollFn);
        };
        requestAnimationFrame(scrollFn);
    }

    renderMobileControls(viewportCol) {
        viewportCol.innerHTML = `
            <div class="lab-preview-display"><div id="previewCanvasContainer"></div>
                <div class="lab-mobile-switch">
                    <button class="ui-button is-active" data-side="setup"><span>SETUP</span></button>
                    <button class="ui-button" data-side="engine"><span>ENGINE</span></button>
                </div>
            </div>`;
        const btns = qsa('.lab-mobile-switch .ui-button', viewportCol);
        this.interface.setAttribute('data-mobile-panel', 'setup');
        btns.forEach(btn => btn.onclick = () => {
            btns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            this.interface.setAttribute('data-mobile-panel', btn.dataset.side);
        });
    }

    close() {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
        if (this.interface) {
            this.interface.classList.remove('is-lab-ready');
            this.interface.classList.add('is-lab-motion');
        }
        if (this.onLabTransitionEnd && this.interface) {
            this.interface.removeEventListener('transitionend', this.onLabTransitionEnd);
        }
        if (this.interface) {
            this.onLabTransitionEnd = (event) => {
                if (event.propertyName !== 'transform') return;
                this.interface.classList.remove('is-lab-motion');
                this.interface.removeEventListener('transitionend', this.onLabTransitionEnd);
            };
            this.interface.addEventListener('transitionend', this.onLabTransitionEnd);
        }
        this.body.classList.remove('is-lab-active');
        const resetScrollLock = () => {
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.height = '';
            document.documentElement.style.position = '';
            document.documentElement.style.minHeight = '';
            document.documentElement.style.touchAction = '';
            document.documentElement.style.overscrollBehavior = '';
            this.body.style.overflow = 'auto';
            this.body.style.height = '';
            this.body.style.position = '';
            this.body.style.minHeight = '';
            this.body.style.touchAction = '';
            this.body.style.overscrollBehavior = '';
            window.scrollTo({ top: window.scrollY, behavior: 'auto' });
        };
        requestAnimationFrame(resetScrollLock);
        setTimeout(() => {
            resetScrollLock();
            window.dispatchEvent(new Event('resize'));
        }, 300);
        if (this.readyTimeout) { clearTimeout(this.readyTimeout); this.readyTimeout = null; }
        if (this.leftLenis) this.leftLenis.destroy();
        if (this.rightLenis) this.rightLenis.destroy();
        this.cleanupTimeout = setTimeout(() => {
            if (this.interface) qsa('.l-lab-interface__column', this.interface).forEach(col => col.innerHTML = '');
        }, 1000); 
    }
}