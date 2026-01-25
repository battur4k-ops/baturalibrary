export const labConfig = {
    defaultTab: 'source',
    previewType: 'text',
    schema: [
        { type: 'spacer' },
        { type: 'data', content: '// ПАРАМЕТРЫ' },
        { type: 'hero', content: 'SETUP' },

        { type: 'toggle', id: 'run', label: 'START TIMER', labelOn: 'STOP TIMER', labelOff: 'START TIMER', default: true },
        { type: 'heading', content: 'TIMER SETTINGS', info: 'Базовое время и направление таймера.' },
        { type: 'range', id: 'hours', label: 'TIME (HOUR)', min: 0, max: 1000, step: 1, default: 2 },
        { type: 'range', id: 'minutes', label: 'TIME (MIN)', min: 0, max: 59, step: 1, default: 0 },
        { type: 'range', id: 'seconds', label: 'TIME (SEC)', min: 0, max: 59, step: 1, default: 0 },
        { type: 'range', id: 'ms', label: 'TIME (MS)', min: 0, max: 99, step: 1, default: 0 },
        { type: 'toggle', id: 'invert', label: 'INVERSION', default: false },
        { type: 'heading', content: 'VISUAL', info: 'Отображение и скорость таймера. -100 медленно, 100 быстро.' },
        { type: 'range', id: 'speed', label: 'SPEED', min: -100, max: 100, step: 1, default: 0, freeInput: true },
        { type: 'range', id: 'format', label: 'FORMAT', min: 1, max: 4, step: 1, default: 2 },

        { side: 'right' },
        { type: 'spacer' },
        { type: 'data', content: '// КОМПИЛЯТОР' },
        { type: 'hero', content: 'OUTPUT' },

        { type: 'tabs', id: 'target', options: [{ id: 'source', label: 'SOURCE TEXT' }] },
        { type: 'code-block' },
        { type: 'copy-button', label: 'COPY EXPRESSION' },
        { 
            type: 'instruction', 
            content: [
                'Создайте текст и примените expression к Source Text.'
            ] 
        }
    ],
    codeTemplates: {
        source: (v) => `// BATURA_TEXT_TIMER_PRO
var hours = ${v.hours};
var minutes = ${v.minutes};
var seconds = ${v.seconds};
var ms = ${v.ms};
var format = ${v.format};
var speed = ${v.speed};
var invert = ${v.invert ? 1 : 0};

var baseSeconds = Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60 + Math.max(0, seconds) + Math.max(0, ms) / 100;
var speedFactor = Math.pow(60, speed / 100);

var t = time * speedFactor;

var current = invert ? Math.max(0, baseSeconds - t) : t;
current = Math.max(0, current);

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

var totalSec = Math.floor(current);
var ms = Math.floor((current - totalSec) * 100);
var ss = totalSec % 60;
var totalMin = Math.floor(totalSec / 60);
var mm = totalMin % 60;
var hh = Math.floor(totalMin / 60);
if (format === 1) {
  pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss) + ':' + pad2(ms);
} else if (format === 2) {
  pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss);
} else if (format === 3) {
  pad2(hh) + ':' + pad2(mm);
} else {
  pad2(hh);
}`
    }
};
