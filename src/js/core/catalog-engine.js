export class CatalogEngine {
    static render(data, container, templateFn) {
        if (!container || !data) return;

        if (data.length === 0) {
            container.innerHTML = `<div class="text-body" style="opacity: 0.5;">Empty archive...</div>`;
            return;
        }

        const sorted = [...data].sort((a, b) => a.title.localeCompare(b.title));

        const groups = {};
        sorted.forEach(item => {
            const letter = item.title[0].toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(item);
        });

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
                            return templateFn(item, globalIndex);
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
}