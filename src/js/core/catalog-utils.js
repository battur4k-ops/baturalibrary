export const normalizeCategory = (category, fallback = 'math') => category || fallback;

export const formatCategoryTag = (category) => {
    const safeCategory = normalizeCategory(category);
    return `// AE_${safeCategory.toUpperCase()}`;
};
