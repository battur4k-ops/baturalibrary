/* ============================================================
   JS / MAIN.JS
   Batura Library | Master Logic v7.9 [Lab & Blur Sync Optimized]
   ============================================================ */

import { EVENTS, on } from './core/events.js';
import { safeImport } from './core/module-loader.js';

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
        
        on(EVENTS.CONTENT_READY, () => {
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
 * Оптимизирован для предотвращения "белых пятен" и корректной работы блюра на краях.
 */
class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.defaultCategory = 'blue';
        this.defaultAccent = '0, 102, 255';
        this.init();
    }

    /**
     * Вспомогательный метод для применения темы к CSS-переменным и фону вьюпорта
     */
    applyTheme(category) {
        const style = getComputedStyle(this.root);
        
        // 1. Обновляем акцентный цвет (RGB)
        const accentRGB = style.getPropertyValue(`--p-${category}-rgb`).trim();
        if (accentRGB) {
            this.root.style.setProperty('--theme-accent-rgb', accentRGB);
        }

        // 2. СИНХРОНИЗАЦИЯ ПОДЛОЖКИ (Fix для блюра и мобильного скролла)
        // Берем глубокий цвет темы и красим сам HTML элемент. 
        // Это убирает белое пространство, если шейдер не успевает за скроллом.
        const deepColor = style.getPropertyValue(`--p-${category}-deep`).trim();
        if (deepColor) {
            this.root.style.backgroundColor = deepColor;
            this.root.style.setProperty('--color-bg', deepColor);
        }
    }

    init() {
        // Устанавливаем начальный фон при загрузке
        this.applyTheme(this.defaultCategory);

        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.b-static-card');
            if (!card) return;
            
            const category = card.dataset.category || this.defaultCategory;
            this.applyTheme(category);
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.b-static-card')) {
                // Возврат к стандартной теме
                this.applyTheme(this.defaultCategory);
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

/* --- 2. ГЛАВНЫЙ ДИСПЕТЧЕР (Start Engine) --- */

const startBatura = async () => {
    // А) Запуск встроенных систем ядра
    new ThemeController();
    new NavigationController();
    new ViewportPhysics();

    // Б) Внешние зависимости (Smooth Scroll с поддержкой блокировки)
    const LenisModule = await safeImport('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm', import.meta.url);
    if (LenisModule) {
        const Lenis = LenisModule.default;
        const lenis = new Lenis({ 
            duration: 1.2, 
            smoothWheel: true,
            // Для мобилок важно, чтобы Lenis корректно считал размеры
            syncTouch: true 
        });

        on(EVENTS.CONTENT_READY, () => {
            requestAnimationFrame(() => {
                lenis.resize();
            });
        });

        on(EVENTS.LAB_OPENED, () => lenis.stop());
        on(EVENTS.LAB_CLOSED, () => lenis.start());

        const scrollFn = (time) => { 
            lenis.raf(time); 
            requestAnimationFrame(scrollFn); 
        };
        requestAnimationFrame(scrollFn);
    }

    // В) Контент
    const ContentModule = await safeImport('./components/content-manager.js', import.meta.url);
    if (ContentModule) new ContentModule.ContentManager();

    // Г) Компоненты UI (Web Components)
    await safeImport('./components/navbar.js', import.meta.url);
    await safeImport('./components/footer.js', import.meta.url);

    // Д) Динамический Контент (LEGO Constructor)
    const LabModule = await safeImport('./components/lab-manager.js', import.meta.url);
    if (LabModule) new LabModule.LabManager(); 

    if (document.getElementById('mainAccordion')) {
        const AccModule = await safeImport('./components/accordion-manager.js', import.meta.url);
        if (AccModule) new AccModule.AccordionManager();
    }

    if (document.getElementById('expressionsGrid')) {
        const CardManagerModule = await safeImport('./components/card-manager.js', import.meta.url);
        if (CardManagerModule) new CardManagerModule.CardManager();
    }

    if (document.getElementById('tagsContainer')) {
        const ExManagerModule = await safeImport('./components/expression-manager.js', import.meta.url);
        if (ExManagerModule) new ExManagerModule.ExpressionManager();
    }

    console.log('Batura System V7.9: Lab Engine & Blur Sync Integrated.');
};

startBatura();