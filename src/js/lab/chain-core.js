export const labConfig = {
    defaultTab: 'position',
    schema: [
        { type: 'spacer' },
        { type: 'data', content: '// ПАРАМЕТРЫ' },
        { type: 'hero', content: 'SETUP' },
        
        { type: 'heading', content: 'POSITION SETTINGS', info: 'Смещение каждого слоя от предыдущего.' },
        { type: 'range', id: 'delay', label: 'DELAY (SEC)', min: 0, max: 2, step: 0.1, default: 1 },
        { type: 'range', id: 'mX', label: 'MULTIPLIER X', min: -2, max: 2, step: 0.01, default: 1 },
        { type: 'range', id: 'mY', label: 'MULTIPLIER Y', min: -2, max: 2, step: 0.01, default: 1 },

        { type: 'heading', content: 'SCALE SETTINGS', info: 'Шаг масштаба для каждого следующего слоя.' },
        { type: 'toggle', id: 'scaleDelay', label: 'SCALE_DELAY', default: false },
        { type: 'range', id: 'step', label: 'STEP (%)', min: -90, max: 90, step: 1, default: 0 },
        
        { side: 'right' }, 
        { type: 'spacer' },
        { type: 'data', content: '// КОМПИЛЯТОР' },
        { type: 'hero', content: 'ENGINE' },

        { 
            type: 'tabs', 
            id: 'mode', 
            options: [
                { id: 'position', label: 'POSITION' },
                { id: 'scale', label: 'SCALE' }
            ] 
        },

        { type: 'code-block' },

        { type: 'copy-button', label: 'COPY_EXPRESSION' },
 
        { 
            type: 'instruction', 
            content: [
                'Верхний слой — тот, который анимирован ключами.',
                'На слои ниже примените expression к Position или Scale.',
                'Если не используете Scale, задайте одинаковый масштаб (например 100) для корректного отображения.'
            ] 
        }
    ],

    codeTemplates: {
        position: (v) => `var delay = ${v.delay};\nvar mX = ${v.mX};\nvar mY = ${v.mY};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  var r = sourceRectAtTime();\n  var vW = r.width * (transform.scale[0]/100);\n  var vH = r.height * (transform.scale[1]/100);\n  var pPos = p.transform.position.valueAtTime(time - delay);\n  pPos + [vW * mX, vH * mY];\n} else {\n  value;\n}`,

        scale: (v) => {
            const source = v.scaleDelay ? 'valueAtTime(time - delay)' : 'value';
            const delayLine = v.scaleDelay ? `var delay = ${v.delay};\n` : 'var delay = 0;\n';
            return `${delayLine}var step = ${v.step};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  var s = p.transform.scale.${source};\n  s * (1 + step/100);\n} else {\n  value;\n}`;
        }
    }
};