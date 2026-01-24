export const labConfig = {
    defaultTab: 'position',
    schema: [
        { type: 'spacer' },
        { type: 'data', content: '// ПАРАМЕТРЫ' },
        { type: 'hero', content: 'SETUP' },
        
        { type: 'heading', content: 'DELAY SETTINGS', info: 'Настройка инерции слоев.' },
        { type: 'range', id: 'delay', label: 'DELAY (SEC)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        { type: 'range', id: 'offset', label: 'OFFSET XY', min: 0, max: 500, step: 1, default: 100 },

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
                'Верхним должен стоять слой с ключами анимации.',
                'Примените код к параметру Position или Scale на всех слоях ниже.',
                'Убедитесь, что слои идут по порядку в таймлайне.'
            ] 
        }
    ],

    // Формулы для вкладок
    codeTemplates: {
        position: (v) => `// AE_CHAIN_CORE_POS\nvar delay = ${v.delay};\nvar off = ${v.offset};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  p.transform.position.valueAtTime(time - delay) + [off, 0];\n} else { value; }`,
        
        scale: (v) => `// AE_CHAIN_CORE_SCALE\nvar delay = ${v.delay};\n\nif (index > 1) {\n  var p = thisComp.layer(index-1);\n  p.transform.scale.valueAtTime(time - delay);\n} else { value; }`
    }
};