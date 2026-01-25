export const labConfig = {
    defaultTab: 'source',
    previewType: 'text',
    schema: [
        { type: 'spacer' },
        { type: 'data', content: '// ПАРАМЕТРЫ' },
        { type: 'hero', content: 'SETUP' },

        { type: 'toggle', id: 'run', label: 'START_COUNTER', labelOn: 'STOP_COUNTER', labelOff: 'START_COUNTER', default: true },
        { type: 'heading', content: 'COUNTER SETTINGS', info: 'Стартовое значение и инверсия.' },
        { type: 'range', id: 'value', label: 'VALUE', min: 0, max: 1000000, step: 1, default: 100 },
        { type: 'range', id: 'duration', label: 'DURATION (SEC)', min: 0, max: 1000, step: 0.1, default: 5 },
        { type: 'toggle', id: 'invert', label: 'INVERSION', default: false },

        { type: 'heading', content: 'ANIMATION', info: 'Тип плавности анимации.' },
        {
            type: 'tabs',
            id: 'smoothness',
            options: [
                { id: 0, label: 'LINEAR' },
                { id: 1, label: 'EASE IN' },
                { id: 2, label: 'EASE' },
                { id: 3, label: 'EASE OUT' }
            ]
        },

        { type: 'heading', content: 'VISUAL', info: 'Формат вывода числа.' },
        { type: 'range', id: 'format', label: 'FORMAT', min: 1, max: 4, step: 1, default: 2 },

        { side: 'right' },
        { type: 'spacer' },
        { type: 'data', content: '// КОМПИЛЯТОР' },
        { type: 'hero', content: 'OUTPUT' },

        { type: 'tabs', id: 'target', options: [{ id: 'source', label: 'SOURCE_TEXT' }] },
        { type: 'code-block' },
        { type: 'copy-button', label: 'COPY_EXPRESSION' },
        { 
            type: 'instruction', 
            content: [
                'Создайте текст и примените expression к Source Text.'
            ] 
        }
    ],
    codeTemplates: {
        source: (v) => `// BATURA_TEXT_COUNTER_PRO
var value = ${v.value};
var duration = ${v.duration};
var smoothness = ${v.smoothness};
var invert = ${v.invert ? 1 : 0};
var format = ${v.format};

var t = time;
var progress = (duration > 0) ? Math.min(1, Math.max(0, t / duration)) : 1;

function ease(p, mode) {
  if (mode === 0) return p;
  if (mode === 1) return p * p;
  if (mode === 2) return (p < 0.5) ? (2 * p * p) : (1 - Math.pow(-2 * p + 2, 2) / 2);
  return 1 - Math.pow(1 - p, 2);
}

var eased = ease(progress, smoothness);
var amount = invert ? value * (1 - eased) : value * eased;

if (format === 1) {
  amount.toFixed(0);
} else if (format === 2) {
  amount.toFixed(1);
} else if (format === 3) {
  amount.toFixed(2);
} else {
  amount.toFixed(3);
}`
    }
};
