/**
 * Helper to sort trains for the Train Schedule level.
 * @param {Array} trains - Array of train objects.
 * @param {string} key - Property to sort by (default: 'arrive').
 * @param {string} order - 'ASC' or 'DESC' (default: 'ASC').
 */
export function sortTrains(trains, key = 'arrive', order = 'ASC') {
    if (!trains || !Array.isArray(trains)) return;

    trains.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (order === 'ASC') return valA - valB;
        return valB - valA;
    });
}

/**
 * Helper to record train assignments for visualization.
 * @param {Object} train - The train object.
 * @param {number} platform - The assigned platform index.
 */
export function assignTrainVisual(train, platform) {
    if (typeof window !== 'undefined') {
        if (typeof window.assignments === 'undefined') {
            window.assignments = [];
        }
        window.assignments.push({
            train: train,
            platform: platform
        });
    }
}
