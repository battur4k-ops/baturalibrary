const resolveImportUrl = (path, baseUrl) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    return new URL(path, baseUrl).href;
};

export const safeImport = async (path, baseUrl = import.meta.url) => {
    try {
        const resolved = resolveImportUrl(path, baseUrl);
        return await import(resolved);
    } catch (error) {
        console.warn(`Batura System: Module [${path}] is missing. Skipping...`);
        return null;
    }
};
