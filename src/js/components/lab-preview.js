import { qs } from '../core/dom.js';

export class LabPreview {
    constructor() {
        this.root = null;
        this.stack = null;
        this.layers = [];
        this.textEl = null;
        this.params = {};
        this.activeTab = 'position';
        this.previewType = 'layers';
        this.running = false;
        this.rafId = null;
        this.startTime = 0;
        this.lastRun = null;
        this.lastInvert = null;
        this.lastSmoothness = null;
        this.layerSize = 140;
        this.layerStep = 140;
        this.layerRadius = 24;
        this.multiplierScale = 1;
        this.scaleBoost = 1.6;
        this.scaleSpeed = 1;
        this.motionRange = 48;
        this.frameDuration = 1 / 30;
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

    mountTo(rootEl) {
        if (!rootEl) return;
        this.root = rootEl;
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

    }

    readPx(value, fallback) {
        const num = parseFloat(value);
        return Number.isNaN(num) ? fallback : num;
    }

    setState(params, activeTab) {
        this.params = { ...params };
        this.activeTab = activeTab || 'position';
        this.previewType = params.previewType || 'layers';
        if (this.previewType === 'text') {
            const nextRun = !!this.params.run;
            const nextInvert = !!this.params.invert;
            const nextSmoothness = this.params.smoothness;
            if (this.lastRun === null) this.lastRun = nextRun;
            if (this.lastInvert === null) this.lastInvert = nextInvert;
            if (this.lastSmoothness === null) this.lastSmoothness = nextSmoothness;
            if (nextRun !== this.lastRun || nextInvert !== this.lastInvert || nextSmoothness !== this.lastSmoothness) {
                this.startTime = performance.now();
                this.lastRun = nextRun;
                this.lastInvert = nextInvert;
                this.lastSmoothness = nextSmoothness;
            }
        }
        if (this.previewType === 'text') {
            this.ensureText();
        } else {
            this.ensureLayers();
            this.clearText();
        }
    }

    clearStack() {
        if (!this.stack) return;
        this.stack.innerHTML = '';
        this.layers = [];
    }

    ensureText() {
        if (!this.stack) return;
        this.clearStack();
        this.textEl = document.createElement('div');
        this.textEl.className = 'lab-preview-text';
        this.stack.appendChild(this.textEl);
    }

    clearText() {
        if (this.textEl) this.textEl.remove();
        this.textEl = null;
    }

    ensureLayers() {
        if (!this.stack) return;
        if (this.textEl) {
            this.clearText();
            this.clearStack();
        }
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
        this.textEl = null;
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
        if (!this.stack) return;
        if (this.previewType === 'text') {
            this.renderText(time);
            return;
        }
        if (this.layers.length === 0) return;
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

    renderText(time) {
        if (!this.textEl) return;
        const output = Number.isFinite(this.params.value)
            ? this.formatCounter(time)
            : this.formatTimer(time);
        this.textEl.textContent = output;
    }

    formatTimer(time) {
        if (Number.isFinite(this.params.minutes)) {
            const hours = Number(this.params.hours ?? 0);
            const minutes = Number(this.params.minutes ?? 0);
            const seconds = Number(this.params.seconds ?? 0);
            const ms = Number(this.params.ms ?? 0);
            const invert = !!this.params.invert;
            const format = Number(this.params.format ?? 2);
            const speed = Number(this.params.speed ?? 0);
            const run = !!this.params.run;

            const baseSeconds = Math.max(0, hours) * 3600
                + Math.max(0, minutes) * 60
                + Math.max(0, seconds)
                + Math.max(0, ms) / 100;
            const speedFactor = Math.pow(60, speed / 100);
            const rawTime = run ? time : 0;
            const playDuration = baseSeconds > 0 ? baseSeconds : 0;
            const playDurationReal = playDuration > 0 ? playDuration / speedFactor : 0;
            const cycleReal = playDurationReal + 1;
            const tReal = cycleReal > 0 ? rawTime % cycleReal : 0;
            const playTime = tReal > playDurationReal ? playDuration : tReal * speedFactor;
            let current = invert ? Math.max(0, baseSeconds - playTime) : playTime;
            current = Math.max(0, current);

            const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
            const totalSec = Math.floor(current);
            const msPart = Math.floor((current - totalSec) * 100);
            const ss = totalSec % 60;
            const totalMin = Math.floor(totalSec / 60);
            const mm = totalMin % 60;
            const hh = Math.floor(totalMin / 60);

            if (format === 1) {
                return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}:${pad2(msPart)}`;
            }
            if (format === 2) {
                return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
            }
            if (format === 3) {
                return `${pad2(hh)}:${pad2(mm)}`;
            }
            return pad2(hh);
        }

        const start = Number(this.params.start ?? 0);
        const duration = Number(this.params.duration ?? 10);
        const speed = Number(this.params.speed ?? 1);
        const offset = Number(this.params.offset ?? 0);
        const countDown = !!this.params.countDown;
        const clamp = !!this.params.clamp;
        const format = Number(this.params.format ?? 2);
        const pad = !!this.params.pad;
        const showFrames = !!this.params.showFrames;

        let t = Math.max(0, time * speed + offset + start);
        if (countDown) t = Math.max(0, duration - t);
        if (clamp && duration > 0) t = Math.min(t, duration);

        const pad2 = (n) => {
            if (!pad) return `${n}`;
            return n < 10 ? `0${n}` : `${n}`;
        };

        if (showFrames) {
            return `${Math.floor(t / this.frameDuration)}`;
        }

        const s = Math.floor(t);
        if (format === 1) {
            return pad2(s);
        }
        if (format === 2) {
            const mm = Math.floor(s / 60);
            const ss = s % 60;
            return `${pad2(mm)}:${pad2(ss)}`;
        }
        const hh = Math.floor(s / 3600);
        const mm2 = Math.floor((s % 3600) / 60);
        const ss2 = s % 60;
        return `${pad2(hh)}:${pad2(mm2)}:${pad2(ss2)}`;
    }

    formatCounter(time) {
        if (Number.isFinite(this.params.value)) {
            const value = Number(this.params.value ?? 0);
            const duration = Number(this.params.duration ?? 0);
            const smoothness = Number(this.params.smoothness ?? 0);
            const invert = !!this.params.invert;
            const format = Number(this.params.format ?? 2);
            const run = !!this.params.run;

            const rawTime = run ? time : 0;
            const loop = duration > 0 ? duration : 1;
            const t = duration > 0 ? rawTime % (loop + 1) : rawTime;
            const playTime = duration > 0 ? (t > loop ? loop : t) : t;
            const progress = duration > 0 ? Math.min(1, Math.max(0, playTime / duration)) : 1;
            const ease = (p, mode) => {
                if (mode === 0) return p;
                if (mode === 1) return p * p;
                if (mode === 2) return p < 0.5 ? (2 * p * p) : (1 - Math.pow(-2 * p + 2, 2) / 2);
                return 1 - Math.pow(1 - p, 2);
            };
            const eased = ease(progress, smoothness);
            const amount = invert ? value * (1 - eased) : value * eased;
            if (format === 1) return amount.toFixed(0);
            if (format === 2) return amount.toFixed(1);
            if (format === 3) return amount.toFixed(2);
            return amount.toFixed(3);
        }

        const startValue = Number(this.params.startValue ?? 0);
        const step = Number(this.params.step ?? 1);
        const speed = Number(this.params.speed ?? 1);
        const ticks = Math.floor(time * speed);
        const value = startValue + ticks * step;
        const stepStr = step.toString();
        const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
        return value.toFixed(decimals);
    }
}
