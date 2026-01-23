/* ============================================================
   JS / MAIN.JS
   Batura Library | Master Logic v7.8 [Lab & Scroll Sync]
   ============================================================ */

/**
 * [LAW: ZERO_G_STABILITY] 
 * Мгновенное снятие лоадера.
 */
document.body.classList.remove('is-loading');

/* --- 1. ВНУТРЕННИЕ СИСТЕМЫ (Ядро) --- */

/**
 * VIEWPORT PHYSICS
 */
class ViewportPhysics {
    constructor() {
        this.observer = null;
        this.config = {
            root: null,
            rootMargin: '-35% 0% -35% 0%', 
            threshold: 0.1
        };
        this.init();
        
        window.addEventListener('batura:contentReady', () => {
            requestAnimationFrame(() => this.refresh());
        });
    }

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-focused', entry.isIntersecting);
            });
        }, this.config);
    }

    refresh() {
        const targets = document.querySelectorAll('.b-static-card, .b-catalog-section');
        targets.forEach(el => this.observer.observe(el));
    }
}

/**
 * THEME CONTROLLER
 */
class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.defaultColor = '0, 102, 255';
        this.init();
    }
    init() {
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.b-static-card');
            if (!card) return;
            const category = card.dataset.category || 'blue';
            const colorValue = getComputedStyle(this.root).getPropertyValue(`--p-${category}-rgb`).trim();
            if (colorValue) this.root.style.setProperty('--theme-accent-rgb', colorValue);
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.b-static-card')) {
                this.root.style.setProperty('--theme-accent-rgb', this.defaultColor);
            }
        });
    }
}

/**
 * NAVIGATION CONTROLLER
 */
class NavigationController {
    constructor() {
        this.threshold = 60; 
        window.addEventListener('scroll', () => {
            document.body.classList.toggle('is-scrolled', window.scrollY > this.threshold);
        }, { passive: true });
    }
}

/* --- 2. УНИВЕРСАЛЬНЫЙ ЗАГРУЗЧИК МОДУЛЕЙ --- */

async function safeImport(path) {
    try {
        return await import(path);
    } catch (error) {
        console.warn(`Batura System: Module [${path}] is missing. Skipping...`);
        return null;
    }
}

/* --- 3. ГЛАВНЫЙ ДИСПЕТЧЕР (Start Engine) --- */

const startBatura = async () => {
    // А) Запуск встроенных систем ядра
    new ThemeController();
    new NavigationController();
    new ViewportPhysics();

    // Б) Внешние зависимости (Smooth Scroll с поддержкой блокировки)
    const LenisModule = await safeImport('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm');
    if (LenisModule) {
        const Lenis = LenisModule.default;
        const lenis = new Lenis({ duration: 1.2, smoothWheel: true });

        // Синхронизация высоты при отрисовке LEGO-блоков
        window.addEventListener('batura:contentReady', () => {
            requestAnimationFrame(() => {
                lenis.resize();
            });
        });

        // [NEW] БЛОКИРОВКА СКРОЛЛА ПРИ ОТКРЫТИИ ЛАБЫ
        window.addEventListener('batura:labOpened', () => {
            lenis.stop();
        });

        // [NEW] РАЗБЛОКИРОВКА ПРИ ЗАКРЫТИИ
        window.addEventListener('batura:labClosed', () => {
            lenis.start();
        });

        const scrollFn = (time) => { lenis.raf(time); requestAnimationFrame(scrollFn); };
        requestAnimationFrame(scrollFn);
    }

    // В) Компоненты UI (Web Components)
    await safeImport('./components/navbar.js');
    await safeImport('./components/footer.js');

    // Г) Динамический Контент (LEGO Constructor)
    
    // ИНИЦИАЛИЗАЦИЯ ЛАБОРАТОРИИ
    const LabModule = await safeImport('./components/lab-manager.js');
    if (LabModule) {
        new LabModule.LabManager(); 
    }

    if (document.getElementById('mainAccordion')) {
        const AccModule = await safeImport('./components/accordion-manager.js');
        if (AccModule) new AccModule.AccordionManager();
    }

    if (document.getElementById('expressionsGrid')) {
        const CardManagerModule = await safeImport('./components/card-manager.js');
        if (CardManagerModule) new CardManagerModule.CardManager();
    }

    if (document.getElementById('tagsContainer')) {
        const ExManagerModule = await safeImport('./components/expression-manager.js');
        if (ExManagerModule) new ExManagerModule.ExpressionManager();
    }

    console.log('Batura System V7.8: Lab Engine & Scroll Control Integrated.');
};

startBatura();