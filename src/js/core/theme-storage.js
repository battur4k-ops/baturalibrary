const STORAGE_KEY = 'batura_theme_index';

export const getStoredThemeIndex = (fallback = 0) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

export const setStoredThemeIndex = (index) => {
    localStorage.setItem(STORAGE_KEY, index);
};
