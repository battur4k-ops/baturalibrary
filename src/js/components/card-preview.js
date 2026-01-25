import { EXPRESSIONS_DB } from '../data/library-expressions.js';
import { EVENTS, on } from '../core/events.js';
import { qsa } from '../core/dom.js';
import { LabPreview } from './lab-preview.js';

const extractDefaults = (config) => {
    const params = {};
    if (!config?.schema) return params;
    config.schema.forEach((item) => {
        if (item.type === 'range') params[item.id] = item.default;
        if (item.type === 'toggle') params[item.id] = !!item.default;
    });
    return params;
};

export class CardPreviewManager {
    constructor() {
        this.instances = [];
        this.instanceByBox = new Map();
        this.rafId = null;
        this.startTime = 0;
        this.resizeObserver = null;
        on(EVENTS.CONTENT_READY, () => this.init());
        this.init();
    }

    handleBoxResize(box) {
        const instance = this.instanceByBox.get(box);
        if (!instance) return;
        const width = box.getBoundingClientRect().width;
        const styles = getComputedStyle(box);
        const baseSize = parseFloat(styles.getPropertyValue('--lab-preview-layer-size')) || 140;
        const baseRadius = parseFloat(styles.getPropertyValue('--lab-preview-layer-radius')) || 24;
        const radiusRatio = baseRadius / baseSize;
        const targetSize = Math.min(104, Math.max(52, width * 0.16));
        const targetRadius = Math.max(6, targetSize * radiusRatio);
        const targetMotion = Math.min(36, Math.max(14, width * 0.06));
        box.style.setProperty('--lab-preview-layer-size', `${targetSize}px`);
        box.style.setProperty('--lab-preview-layer-radius', `${targetRadius}px`);
        box.style.setProperty('--lab-preview-step', `${targetSize}px`);
        box.style.setProperty('--lab-preview-motion', `${targetMotion}px`);
        if (instance.readMetrics) instance.readMetrics();
    }

    async init() {
        this.stop();
        const boxes = qsa('.b-preview-box[data-preview]');
        if (!boxes.length) return;

        if (!this.resizeObserver && 'ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => this.handleBoxResize(entry.target));
            });
        }

        for (const box of boxes) {
            const previewId = box.dataset.preview;
            const item = EXPRESSIONS_DB.find((entry) => entry.previewID === previewId);
            if (!item) continue;
            try {
                const module = await import(`../lab/${item.labID}.js`);
                const params = extractDefaults(module.labConfig);
                params.previewType = module.labConfig?.previewType || 'layers';
                const defaultTab = module.labConfig?.defaultTab || 'position';
                const instance = new LabPreview();
                instance.mountTo(box);
                instance.setState(params, defaultTab);
                this.instances.push(instance);
                this.instanceByBox.set(box, instance);
                this.handleBoxResize(box);
                if (this.resizeObserver) this.resizeObserver.observe(box);
            } catch (err) {
                // ignore missing preview
            }
        }
        if (this.instances.length) {
            this.startTime = performance.now();
            this.tick = this.tick.bind(this);
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    tick(now) {
        const t = (now - this.startTime) / 1000;
        this.instances.forEach((instance) => instance.render(t));
        this.rafId = requestAnimationFrame(this.tick);
    }

    stop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.instances = [];
        this.instanceByBox.clear();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
