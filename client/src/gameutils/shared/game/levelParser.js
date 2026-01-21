/**
 * Utility functions for parsing and normalizing level data
 */

export const safeParse = (data, defaultValue = []) => {
    if (data === null || data === undefined) return defaultValue;
    // If data is already an object (parsed by Prisma), return it
    if (typeof data === 'object' && !Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return defaultValue;
        }
    }
    return Array.isArray(data) ? data : defaultValue;
};

export const normalizeNodes = (nodes) => {
    if (!nodes) return [];
    if (typeof nodes === 'string') {
        try {
            nodes = JSON.parse(nodes);
        } catch {
            return [];
        }
    }
    return Array.isArray(nodes) ? nodes : [];
};

export const normalizeEdges = (edges) => {
    if (!edges) return [];
    if (typeof edges === 'string') {
        try {
            edges = JSON.parse(edges);
        } catch {
            return [];
        }
    }
    return Array.isArray(edges) ? edges : [];
};

export const normalizePatternHints = (rawHints) => {
    if (Array.isArray(rawHints)) {
        return rawHints.map((hint) => ({
            step: hint.step || 0,
            content: hint.content || {},
            trigger: hint.trigger || 'onXmlMatch',
            hintType: hint.hintType || 'guidance',
            difficulty: hint.difficulty || 'basic',
            visualGuide: hint.visualGuide
                ? {
                    highlightBlocks: Array.isArray(hint.visualGuide.highlightBlocks)
                        ? hint.visualGuide.highlightBlocks
                        : []
                }
                : {},
            xmlCheck: hint.xmlCheck,
            effect: hint.effect // Ensure effect is conserved
        }));
    }
    if (typeof rawHints === 'object') {
        return [rawHints];
    }
    return [];
};
