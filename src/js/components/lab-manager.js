import { EXPRESSIONS_DB } from '../data/library-expressions.js';

export class LabManager {
    constructor() {
        this.body = document.body;
        this.interface = document.querySelector('.l-lab-interface');
        this.currentParams = {};
        this.cleanupTimeout = null;
        this.leftLenis = null;
        this.rightLenis = null;
        
        this.init();
    }

    init() {
        window.addEventListener('batura:openLab', (e) => this.open(e.detail.labID));
        window.addEventListener('batura:labClosed', () => this.close());

        // Закрываем все открытые подсказки при клике в пустую область
        document.addEventListener('click', (e) => {
            if (this.interface) {
                const activeInfos = this.interface.querySelectorAll('.ui-info-group.is-info-active');
                activeInfos.forEach(group => group.classList.remove('is-info-active'));
            }
        });
    }

   /* === ПОПРАВЛЕННЫЙ JS === */

    async open(labID) {
        if (this.cleanupTimeout) { clearTimeout(this.cleanupTimeout); this.cleanupTimeout = null; }
        const data = EXPRESSIONS_DB.find(item => item.labID === labID);
        if (!data || !this.interface) return;

        try {
            const module = await import(`../lab/${labID}.js`);
            const config = module.labConfig;
            this.renderLayout(config);
            
            // УБРАЛИ ПРОВЕРКУ > 1100: Теперь скролл плавный везде
            await this.initScroll('left');
            await this.initScroll('right');
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.body.classList.add('is-lab-active');
                    window.dispatchEvent(new CustomEvent('batura:labOpened', { detail: { labID } }));
                });
            });
        } catch (err) { console.error(`Error: [${labID}]`, err); }
    }

    async initScroll(side) {
        const selector = side === 'left' ? '.l-lab-interface__column--setup' : '.l-lab-interface__column--engine';
        const colEl = this.interface.querySelector(selector);
        const wrapper = colEl?.querySelector('.b-lab-column-body');
        const content = wrapper?.querySelector('.l-flow');
        if (!wrapper || !content) return;
        
        const LenisModule = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm');
        const Lenis = LenisModule.default;
        
        // Настройки для мобилки: чуть выше duration для вязкости
        const lenisInstance = new Lenis({ 
            wrapper, 
            content, 
            duration: 1.4, 
            smoothWheel: true,
            touchMultiplier: 2 // Делает свайп пальцем более отзывчивым
        });
        
        if (side === 'left') this.leftLenis = lenisInstance; else this.rightLenis = lenisInstance;
        
        const scrollFn = (time) => {
            // УБРАЛИ return для мобилок: RAF теперь работает всегда
            if (this.leftLenis && side === 'left') this.leftLenis.raf(time);
            if (this.rightLenis && side === 'right') this.rightLenis.raf(time);
            requestAnimationFrame(scrollFn);
        };
        requestAnimationFrame(scrollFn);
    }
renderLayout(config) {
        const setupCol = this.interface.querySelector('.l-lab-interface__column--setup');
        const engineCol = this.interface.querySelector('.l-lab-interface__column--engine');
        const viewportCol = this.interface.querySelector('.l-lab-interface__column--viewport');

        const prepareCol = (el) => {
            if (!el) return null;
            // Убираем инлайновые стили, чтобы они не перебивали CSS при ресайзе
            el.style.display = ''; 
            el.innerHTML = `<div class="b-lab-column-header l-flow"></div><div class="b-lab-column-body" data-lenis-prevent="true"><div class="l-flow"></div></div>`;
            return { 
                header: el.querySelector('.b-lab-column-header'), 
                body: el.querySelector('.b-lab-column-body .l-flow') 
            };
        };

        const leftCtx = prepareCol(setupCol);
        const rightCtx = prepareCol(engineCol);
        let currentSide = 'left';

        config.schema.forEach(item => {
            if (item.side) currentSide = item.side;
            if (!item.type) return;
            const ctx = currentSide === 'right' ? rightCtx : leftCtx;
            if (!ctx) return;

            switch (item.type) {
                case 'hero': 
                case 'heading':
                    const group = document.createElement('div');
                    group.className = 'ui-info-group';
                    const headerRow = document.createElement('div');
                    headerRow.className = 'ui-info-group__header';

                    const title = document.createElement('h2');
                    title.className = (item.type === 'hero') ? 'text-heading' : 'text-subheading';
                    title.textContent = item.content;
                    headerRow.appendChild(title);

                    if (item.info) {
                        const tag = document.createElement('span');
                        tag.className = 'ui-info-tag';
                        tag.textContent = '[INFO]';
                        const desc = document.createElement('div');
                        desc.className = 'ui-info-group__description';
                        desc.innerHTML = `<div class="description-inner"><p class="text-info-hint">${item.info}</p></div>`;

                        tag.addEventListener('click', (e) => {
                            e.stopPropagation();
                            group.classList.toggle('is-info-active');
                        });

                        headerRow.appendChild(tag);
                        group.appendChild(headerRow);
                        group.appendChild(desc);
                    } else {
                        group.appendChild(headerRow);
                    }
                    
                    if (item.type === 'hero') {
                        ctx.header.appendChild(group);
                        const divider = document.createElement('div');
                        divider.className = 'b-lab-divider';
                        ctx.header.appendChild(divider);
                    } else { 
                        ctx.body.appendChild(group); 
                    }
                    break;

                case 'range': 
                    ctx.body.appendChild(this.createSlider(item)); 
                    break;
                case 'data': 
                    const data = document.createElement('span'); 
                    data.className = 'text-data'; 
                    data.textContent = item.content; 
                    ctx.header.appendChild(data); 
                    break;
                case 'spacer': 
                    const spacer = document.createElement('div'); 
                    spacer.className = 'b-spacer'; 
                    ctx.header.appendChild(spacer); 
                    break;
            }
        });
        
        if (viewportCol) {
            viewportCol.innerHTML = `
                <div class="lab-preview-display">
                    <div id="previewCanvasContainer"></div>
                    <div class="lab-mobile-switch">
                        <button class="ui-button is-active" data-side="setup">
                            <span>SETUP</span>
                        </button>
                        <button class="ui-button" data-side="engine">
                            <span>ENGINE</span>
                        </button>
                    </div>
                </div>
            `;

            const switchBtns = viewportCol.querySelectorAll('.lab-mobile-switch .ui-button');
            
            // Инициализация атрибута (только для мобилки)
            this.interface.setAttribute('data-mobile-panel', 'setup');

            switchBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const side = btn.dataset.side;
                    switchBtns.forEach(b => b.classList.remove('is-active'));
                    btn.classList.add('is-active');

                    // Переключаем через CSS атрибут
                    this.interface.setAttribute('data-mobile-panel', side);
                });
            });
        }
    }

    createSlider(p) {
        this.currentParams[p.id] = p.default;
        const wrap = document.createElement('div');
        wrap.className = 'ui-range';
        wrap.innerHTML = `
            <div class="ui-range__header">
                <span class="text-data">${p.label}</span>
                <span class="text-data value" contenteditable="true" inputmode="decimal">${p.default.toString().replace('.', ',')}</span>
            </div>
            <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}" style="width:100%">
        `;
        const input = wrap.querySelector('input');
        const display = wrap.querySelector('.value');
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            this.currentParams[p.id] = parseFloat(val);
            display.textContent = val.replace('.', ',');
        });
        return wrap;
    }

    close() {
        this.body.classList.remove('is-lab-active');
        if (this.leftLenis) { this.leftLenis.destroy(); this.leftLenis = null; }
        if (this.rightLenis) { this.rightLenis.destroy(); this.rightLenis = null; }
        this.cleanupTimeout = setTimeout(() => {
            if (this.interface) {
                this.interface.querySelectorAll('.l-lab-interface__column').forEach(col => {
                    col.innerHTML = '';
                    col.style.display = ''; // Сброс мобильных стилей
                });
            }
            this.cleanupTimeout = null;
        }, 1000); 
    }
}