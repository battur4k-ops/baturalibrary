// Замени весь файл LabManager.js на этот код
import { EXPRESSIONS_DB } from '../data/library-expressions.js';

export class LabManager {
    constructor() {
        this.body = document.body;
        this.interface = document.querySelector('.l-lab-interface');
        this.currentParams = {};
        this.activeTab = 'position'; // По умолчанию вкладка Position
        this.currentLabConfig = null;
        this.cleanupTimeout = null;
        this.leftLenis = null;
        this.rightLenis = null;
        
        this.init();
    }

    init() {
        window.addEventListener('batura:openLab', (e) => this.open(e.detail.labID));
        window.addEventListener('batura:labClosed', () => this.close());
        
        document.addEventListener('click', (e) => {
            if (this.interface) {
                const activeInfos = this.interface.querySelectorAll('.ui-info-group.is-info-active');
                activeInfos.forEach(group => group.classList.remove('is-info-active'));
            }
        });
    }

    async open(labID) {
        if (this.cleanupTimeout) { clearTimeout(this.cleanupTimeout); this.cleanupTimeout = null; }
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
            
            this.updateCodeDisplay(); // Первичный рендер кода

            requestAnimationFrame(() => {
                this.body.classList.add('is-lab-active');
                window.dispatchEvent(new CustomEvent('batura:labOpened', { detail: { labID } }));
            });
        } catch (err) { console.error(`Error: [${labID}]`, err); }
    }

    renderLayout(config) {
        const setupCol = this.interface.querySelector('.l-lab-interface__column--setup');
        const engineCol = this.interface.querySelector('.l-lab-interface__column--engine');
        const viewportCol = this.interface.querySelector('.l-lab-interface__column--viewport');

        const prepareCol = (el) => {
            if (!el) return null;
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

    // --- НОВЫЕ МЕТОДЫ СОЗДАНИЯ ЭЛЕМЕНТОВ ---

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

// Внутри класса LabManager обнови эти методы:

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
                this.updateCodeDisplay(); // Перерисовываем код
            };
            wrap.appendChild(btn);
        });
        return wrap;
    }

    createCodeBlock() {
        const wrap = document.createElement('div');
        // Совмещаем классы для наследования стилей
        wrap.className = 'b-preview-box b-code-box';
        wrap.innerHTML = `<div class="b-code-box__content"></div>`;
        return wrap;
    }

createInstruction(item) {
  const wrap = document.createElement('div');
  wrap.className = 'ui-instruction'; // БЕЗ l-flow
  
  const title = document.createElement('span');
  title.className = 'ui-instruction__title';
  title.textContent = 'INSTRUCTION';
  wrap.appendChild(title);

  // Контейнер только для пунктов
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

    // Метод обновления текста в окне кода
    updateCodeDisplay() {
        const codeEl = this.interface.querySelector('.b-code-box__content');
        if (!codeEl || !this.currentLabConfig) return;
        
        // Берем формулу из конфига экспрешена (например, chain-core.js)
        const templateFn = this.currentLabConfig.codeTemplates[this.activeTab];
        if (templateFn) {
            codeEl.innerText = templateFn(this.currentParams);
        }
    }

    createCodeBlock() {
        const wrap = document.createElement('div');
        wrap.className = 'b-code-box';
        wrap.innerHTML = `<div class="b-code-box__content text-data"></div>`;
        return wrap;
    }

   createCopyButton(item) {
        const btn = document.createElement('button');
        // Добавляем класс is-full-width, чтобы кнопка растянулась
        btn.className = 'ui-button is-full-width'; 
        btn.innerHTML = `<span>${item.label}</span>`;
        
        btn.onclick = () => {
            const code = this.interface.querySelector('.b-code-box__content').innerText;
            navigator.clipboard.writeText(code);
            
            // Визуальный фидбек
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>COPIED!</span>';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        };
        return btn;
    }


    createSlider(p) {
        this.currentParams[p.id] = p.default;
        const wrap = document.createElement('div'); wrap.className = 'ui-range';
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
            this.updateCodeDisplay(); // Обновляем код при движении
        });
        return wrap;
    }

    updateCodeDisplay() {
        const codeEl = this.interface.querySelector('.b-code-box__content');
        if (!codeEl || !this.currentLabConfig) return;
        
        const templateFn = this.currentLabConfig.codeTemplates[this.activeTab];
        if (templateFn) {
            codeEl.innerText = templateFn(this.currentParams);
        }
    }

    // --- ОСТАЛЬНАЯ ЛОГИКА (БЕЗ ИЗМЕНЕНИЙ) ---
    async initScroll(side) {
        const selector = side === 'left' ? '.l-lab-interface__column--setup' : '.l-lab-interface__column--engine';
        const colEl = this.interface.querySelector(selector);
        const wrapper = colEl?.querySelector('.b-lab-column-body');
        const content = wrapper?.querySelector('.l-flow');
        if (!wrapper || !content) return;
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
        const btns = viewportCol.querySelectorAll('.lab-mobile-switch .ui-button');
        this.interface.setAttribute('data-mobile-panel', 'setup');
        btns.forEach(btn => btn.onclick = () => {
            btns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            this.interface.setAttribute('data-mobile-panel', btn.dataset.side);
        });
    }

    close() {
        this.body.classList.remove('is-lab-active');
        if (this.leftLenis) this.leftLenis.destroy();
        if (this.rightLenis) this.rightLenis.destroy();
        this.cleanupTimeout = setTimeout(() => {
            if (this.interface) this.interface.querySelectorAll('.l-lab-interface__column').forEach(col => col.innerHTML = '');
        }, 1000); 
    }
}