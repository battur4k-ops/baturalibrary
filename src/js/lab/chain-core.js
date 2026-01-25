export const labConfig = {
    defaultTab: 'position',
    schema: [
        { type: 'spacer' },
        { type: 'data', content: '// ПАРАМЕТРЫ' },
        { type: 'hero', content: 'SETUP' },
        
        { type: 'heading', content: 'POSITION SETTINGS', info: 'Смещение слоев относительно предыдущего.' },
        { type: 'range', id: 'delay', label: 'DELAY (SEC)', min: 0, max: 2, step: 0.1, default: 1 },
        { type: 'range', id: 'mX', label: 'MULTIPLIER X', min: -2, max: 2, step: 0.01, default: 1 },
        { type: 'range', id: 'mY', label: 'MULTIPLIER Y', min: -2, max: 2, step: 0.01, default: 1 },

        { type: 'heading', content: 'SCALE SETTINGS', info: 'Каждый следующий слой меньше или больше.' },
        { type: 'toggle', id: 'scaleDelay', label: 'SCALE DELAY', default: false },
        { type: 'range', id: 'step', label: 'STEP (%)', min: -90, max: 90, step: 1, default: 0 },
        
        { side: 'right' }, 
        { type: 'spacer' },
        { type: 'data', content: '// КОМПИЛЯТОР' },
        { type: 'hero', content: 'ENGINE' },

        // Вкладки
        { 
            type: 'tabs', 
            id: 'mode', 
            options: [
                { id: 'position', label: 'POSITION' },
                { id: 'scale', label: 'SCALE' }
            ] 
        },

        // Окно кода
        { type: 'code-block' },

        // Кнопка копирования
        { type: 'copy-button', label: 'COPY EXPRESSION' },
 
        // Инструкция
        { 
            type: 'instruction', 
            content: [
                'Самым верхним должен стоять слой, который вы уже анимировали ключами.',
                'На все слои ниже примените этот код к параметру Position или Scale.',
                'Рекомендуется использовать одинаковое значение Scale на всех слоях (например, 100).'
            ] 
        }
    ],

    // Формулы для вкладок
    codeTemplates: {
        position: (v) => `// AE_CHAIN_CORE_PRO\nvar delay = ${v.delay};\nvar mX = ${v.mX};\nvar mY = ${v.mY};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  var r = sourceRectAtTime();\n  var vW = r.width * (transform.scale[0]/100);\n  var vH = r.height * (transform.scale[1]/100);\n  var pPos = p.transform.position.valueAtTime(time - delay);\n  pPos + [vW * mX, vH * mY];\n} else {\n  value;\n}`,

        scale: (v) => {
            const source = v.scaleDelay ? 'valueAtTime(time - delay)' : 'value';
            const delayLine = v.scaleDelay ? `var delay = ${v.delay};\n` : 'var delay = 0;\n';
            return `// AE_CHAIN_CORE_PRO\n${delayLine}var step = ${v.step};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  var s = p.transform.scale.${source};\n  s * (1 + step/100);\n} else {\n  value;\n}`;
        }
    }
};