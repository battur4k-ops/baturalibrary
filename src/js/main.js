import { EVENTS, on } from './core/events.js';
import { safeImport } from './core/module-loader.js';

document.body.classList.remove('is-loading');

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

class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.defaultCategory = 'blue';
        this.defaultAccent = '0, 102, 255';
        this.init();
    }

    applyTheme(category) {
        const style = getComputedStyle(this.root);
        
        const accentRGB = style.getPropertyValue(`--p-${category}-rgb`).trim();
        if (accentRGB) {
            this.root.style.setProperty('--theme-accent-rgb', accentRGB);
        }

        const deepColor = style.getPropertyValue(`--p-${category}-deep`).trim();
        if (deepColor) {
            this.root.style.backgroundColor = deepColor;
            this.root.style.setProperty('--color-bg', deepColor);
        }
    }

    init() {
        this.applyTheme(this.defaultCategory);

        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.b-static-card');
            if (!card) return;
            
            const category = card.dataset.category || this.defaultCategory;
            this.applyTheme(category);
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.b-static-card')) {
                this.applyTheme(this.defaultCategory);
            }
        });
    }
}

class NavigationController {
    constructor() {
        this.threshold = 60; 
        window.addEventListener('scroll', () => {
            document.body.classList.toggle('is-scrolled', window.scrollY > this.threshold);
        }, { passive: true });
    }
}

const startBatura = async () => {
    new ThemeController();
    new NavigationController();
    new ViewportPhysics();

    const LenisModule = await safeImport('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/+esm', import.meta.url);
    if (LenisModule) {
        const Lenis = LenisModule.default;
        const lenis = new Lenis({ 
            duration: 1.2, 
            smoothWheel: true,
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

    const ContentModule = await safeImport('./components/content-manager.js', import.meta.url);
    if (ContentModule) new ContentModule.ContentManager();

    await safeImport('./components/navbar.js', import.meta.url);
    await safeImport('./components/footer.js', import.meta.url);

    const LabModule = await safeImport('./components/lab-manager.js', import.meta.url);
    if (LabModule) new LabModule.LabManager(); 

    if (document.getElementById('mainAccordion')) {
        const AccModule = await safeImport('./components/accordion-manager.js', import.meta.url);
        if (AccModule) new AccModule.AccordionManager();
    }

    if (document.getElementById('expressionsGrid')) {
        const CardManagerModule = await safeImport('./components/card-manager.js', import.meta.url);
        if (CardManagerModule) new CardManagerModule.CardManager();

        const PreviewModule = await safeImport('./components/card-preview.js', import.meta.url);
        if (PreviewModule) new PreviewModule.CardPreviewManager();
    }

    if (document.getElementById('tagsContainer')) {
        const ExManagerModule = await safeImport('./components/expression-manager.js', import.meta.url);
        if (ExManagerModule) new ExManagerModule.ExpressionManager();
    }

    console.log('Batura System V7.9: Lab Engine & Blur Sync Integrated.');
};

startBatura();