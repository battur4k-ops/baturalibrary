/* ============================================================
   JS / CORE / CATALOG-ENGINE.JS
   Batura Library | System v21.0 [Universal Index Engine]
   ============================================================ */

export class CatalogEngine {
    /**
     * @param {Array} data - Массив объектов (должен содержать поле title)
     * @param {HTMLElement} container - Куда рендерим
     * @param {Function} templateFn - Функция, которая вернет HTML для одного элемента
     */
    static render(data, container, templateFn) {
        if (!container || !data) return;

        // 1. Очистка и проверка
        if (data.length === 0) {
            container.innerHTML = `<div class="text-body" style="opacity: 0.5;">Empty archive...</div>`;
            return;
        }

        // 2. Сортировка A-Z
        const sorted = [...data].sort((a, b) => a.title.localeCompare(b.title));

        // 3. Группировка
        const groups = {};
        sorted.forEach(item => {
            const letter = item.title[0].toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(item);
        });

        // 4. Сборка итоговой структуры (Твоя фирменная разметка)
        let html = '';
        let globalIndex = 0;

        Object.keys(groups).sort().forEach(letter => {
            html += `
                <div class="b-catalog-section">
                    <div class="b-catalog-header">
                        <span class="letter">${letter}</span>
                        <span class="index">INDEX_${letter}</span>
                    </div>
                    <div class="l-grid-expressions">
                        ${groups[letter].map(item => {
                            globalIndex++;
                            // Вызываем шаблон, который передал конкретный менеджер
                            return templateFn(item, globalIndex);
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
}