export const labConfig = {
    // Схема для построения интерфейса
    schema: [
        // По умолчанию всё идет в LEFT
        { type: 'spacer' },
        { type: 'data',    content: '// ПАРАМЕТРЫ' },
        
        // ПРИМЕР 1: Инфо для главного заголовка
        { 
            type: 'hero',    
            content: 'SETUP', 
        },
        
        
        // ПРИМЕР 2: Инфо для подзаголовка группы
        { 
            type: 'heading', 
            content: 'EXPRESSION', 
            info: 'Параметры математической формулы вычисления координат.' 
        },
        
        { type: 'range',   id: 'delay_1', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        { type: 'range',   id: 'delay_2', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        
        { type: 'heading', content: 'EXPRESSION' },
        { type: 'range',   id: 'delay_3', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        { type: 'range',   id: 'delay_4', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },

        // ПЕРЕКЛЮЧАЕМ НА ПРАВО
        { side: 'right' }, 
        
        { type: 'spacer' },
        { type: 'data',    content: '// РЕЗУЛЬТАТ' },
        
        // ПРИМЕР 3: Инфо на правой стороне
        { 
            type: 'hero',    
            content: 'OUTPUT', 
            info: 'Здесь отображается итоговый результат генерации кода для After Effects.' 
        },
                { 
            type: 'heading', 
            content: 'EXPRESSION', 
            info: 'Параметры математической формулы вычисления координат.' 
        },
        
        { type: 'range',   id: 'amp', label: 'АМПЛИТУДА', min: 0, max: 100, step: 1, default: 50 },
        { type: 'range',   id: 'delay_right_1', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        { type: 'range',   id: 'delay_right_2', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        
        { type: 'heading', content: 'EXPRESSION' },
        { type: 'range',   id: 'delay_right_3', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
        { type: 'range',   id: 'delay_right_4', label: 'ЗАДЕРЖКА (СЕК)', min: 0.1, max: 2, step: 0.1, default: 0.5 },
    ],

    codeTemplate: (v) => {
        return `var delay = ${v.delay}; \nposition.valueAtTime(time - delay);`;
    }
};