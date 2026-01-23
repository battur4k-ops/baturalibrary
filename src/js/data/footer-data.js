/* ============================================================
   DATA / FOOTER-DATA.JS
   Batura Library | Content Manifest v1.0
   ============================================================ */

export const FOOTER_DATA = {
    // Левая колонка
    brand: {
        label: "Batura Library",
        description: "Архитектура стабильна. Кнопки статичны. <br> Разрабатываем инструменты будущего для тех, кто создает движение сегодня.",
    },

    // Средние колонки (Динамические группы)
    groups: [
        {
            title: "Resources",
            links: [
                { label: "Main Site", url: "#", target: "_blank" },
                { label: "Telegram", url: "https://t.me/batur4k0", target: "_blank" },
                { label: "Donation", url: "#", target: "_blank"}
            ]
        },
        {
            title: "Connect",
            links: [
                { label: "Email Me", url: "mailto:hello@batura.me", target: "_blank" },
                { label: "Support", url: "#", target: "_blank" },
                { label: "System Status", url: "#", target: "_blank" } // Вот так легко добавить новую строку
            ]
        }
    ],

    // Нижняя панель
    bottom: {
        copyright: "© 2026 BATURA SYSTEM",
        version: "V1.0 GRAVITY_CORE"
    }
};