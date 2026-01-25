import { qs } from '../core/dom.js';

export class LabPreview {
    constructor() {
        this.root = null;
        this.stack = null;
        this.layers = [];
        this.params = {};
        this.activeTab = 'position';
        this.running = false;
        this.rafId = null;
        this.startTime = 0;
        this.layerSize = 140;
        this.layerStep = 140;
        this.layerRadius = 24;
        this.multiplierScale = 1;
        this.scaleBoost = 1.6;
        this.scaleSpeed = 1;
        this.motionRange = 48;
        this.onResize = null;
        this.tick = this.tick.bind(this);
    }

    mount(interfaceEl) {
        if (!interfaceEl) return;
        this.root = qs('#previewCanvasContainer', interfaceEl);
        if (!this.root) {
            const viewportCol = qs('.l-lab-interface__column--viewport', interfaceEl);
            if (viewportCol) {
                viewportCol.innerHTML = `
                    <div class="lab-preview-display">
                        <div id="previewCanvasContainer"></div>
                        <div class="lab-mobile-switch">
                            <button class="ui-button is-active" data-side="setup"><span>SETUP</span></button>
                            <button class="ui-button" data-side="engine"><span>ENGINE</span></button>
                        </div>
                    </div>
                `;
                this.root = qs('#previewCanvasContainer', interfaceEl);
            }
        }
        if (!this.root) return;
        this.root.innerHTML = '';
        this.stack = document.createElement('div');
        this.stack.className = 'lab-preview-stack';
        this.root.appendChild(this.stack);
        this.readMetrics();
    }

    readMetrics() {
        if (!this.stack) return;
        const styles = getComputedStyle(this.stack);
        this.layerSize = this.readPx(styles.getPropertyValue('--lab-preview-layer-size'), 140);
        this.layerStep = this.readPx(styles.getPropertyValue('--lab-preview-step'), this.layerSize);
        this.layerRadius = this.readPx(styles.getPropertyValue('--lab-preview-layer-radius'), 24);
        this.multiplierScale = this.readPx(styles.getPropertyValue('--lab-preview-mult'), 1);
        this.scaleBoost = this.readPx(styles.getPropertyValue('--lab-preview-scale-boost'), 1.6);
        this.scaleSpeed = this.readPx(styles.getPropertyValue('--lab-preview-scale-speed'), 1);
        this.motionRange = this.readPx(styles.getPropertyValue('--lab-preview-motion'), 48);

        const isMobile = window.matchMedia('(max-width: 1100px)').matches;
        if (isMobile) {
            this.layerSize *= 0.4;
            this.layerStep *= 0.4;
            this.layerRadius *= 0.4;
        }
    }

    readPx(value, fallback) {
        const num = parseFloat(value);
        return Number.isNaN(num) ? fallback : num;
    }

    setState(params, activeTab) {
        this.params = { ...params };
        this.activeTab = activeTab || 'position';
        this.ensureLayers();
    }

    ensureLayers() {
        if (!this.stack) return;
        const count = Math.max(2, Math.min(12, Number(this.params.layers || 5)));
        const current = this.layers.length;
        if (current === count) return;
        if (current < count) {
            for (let i = current; i < count; i += 1) {
                const layer = document.createElement('div');
                layer.className = 'lab-preview-layer';
                layer.style.setProperty('--layer-index', i + 1);
                this.stack.appendChild(layer);
                this.layers.push(layer);
            }
        } else {
            for (let i = current - 1; i >= count; i -= 1) {
                const layer = this.layers.pop();
                if (layer) layer.remove();
            }
        }
        this.readMetrics();
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        if (!this.onResize) {
            this.onResize = () => {
                if (this._resizeRAF) cancelAnimationFrame(this._resizeRAF);
                this._resizeRAF = requestAnimationFrame(() => {
                    this.readMetrics();
                });
            };
            window.addEventListener('resize', this.onResize, { passive: true });
        }
        this.rafId = requestAnimationFrame(this.tick);
    }

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        if (this.onResize) {
            window.removeEventListener('resize', this.onResize);
            this.onResize = null;
        }
        if (this._resizeRAF) cancelAnimationFrame(this._resizeRAF);
        this._resizeRAF = null;
        if (this.stack) this.stack.innerHTML = '';
        this.layers = [];
    }

    tick(now) {
        if (!this.running) return;
        const t = (now - this.startTime) / 1000;
        this.render(t);
        this.rafId = requestAnimationFrame(this.tick);
    }

    baseSample(time) {
        const x = Math.sin(time * 1.2) * this.motionRange;
        const y = Math.cos(time * 0.9) * (this.motionRange * 0.65);
        return { x, y };
    }

    baseScaleSample(time) {
        return 1 + Math.sin(time * 0.7 * this.scaleSpeed) * 0.06;
    }

    getScale(index, time, delay, stepFactor, useDelay, cache) {
        const key = `${index}:${time.toFixed(3)}`;
        if (cache[key]) return cache[key];
        if (index === 0) {
            const base = this.baseScaleSample(time);
            cache[key] = base;
            return base;
        }
        const prevTime = useDelay ? time - delay : time;
        const prev = this.getScale(index - 1, prevTime, delay, stepFactor, useDelay, cache);
        const scale = prev * stepFactor;
        cache[key] = scale;
        return scale;
    }

    getLayerPos(index, time, delay, mX, mY, scales, cache) {
        const key = `${index}:${time.toFixed(3)}`;
        if (cache[key]) return cache[key];
        if (index === 0) {
            const base = this.baseSample(time);
            cache[key] = base;
            return base;
        }
        const prev = this.getLayerPos(index - 1, time - delay, delay, mX, mY, scales, cache);
        const scale = scales[index] ?? 1;
        const vW = this.layerStep * scale;
        const vH = this.layerStep * scale;
        const pos = {
            x: prev.x + vW * mX,
            y: prev.y + vH * mY
        };
        cache[key] = pos;
        return pos;
    }

    render(time) {
        if (!this.stack || this.layers.length === 0) return;
        const delay = Number.isFinite(this.params.delay) ? Number(this.params.delay) : 0.5;
        const mX = Number.isFinite(this.params.mX) ? Number(this.params.mX) * this.multiplierScale : 0.4;
        const mY = Number.isFinite(this.params.mY) ? Number(this.params.mY) * this.multiplierScale : 1.08;
        const step = Number.isFinite(this.params.step) ? Number(this.params.step) : 0;
        const scaleDelay = !!this.params.scaleDelay;
        const stepFactor = 1 + step / 100;
        const posCache = {};
        const scaleCache = {};
        const scales = scaleDelay
            ? this.layers.map((_, i) =>
                this.getScale(i, time, delay, stepFactor, scaleDelay, scaleCache)
            )
            : this.layers.map((_, i) => Math.pow(stepFactor, i));

        this.layers.forEach((layer, i) => {
            const scale = scales[i] ?? 1;
            const size = this.layerSize * scale;
            const radius = this.layerRadius * scale;
            const pos = this.getLayerPos(i, time, delay, mX, mY, scales, posCache);
            layer.style.width = `${size}px`;
            layer.style.height = `${size}px`;
            layer.style.borderRadius = `${radius}px`;
            layer.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        });
    }
}
