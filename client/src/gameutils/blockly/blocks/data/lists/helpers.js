// List Operation Helpers — Pure logic + WithVisual wrappers
// Used by lists_add_item and lists_setIndex generators

/**
 * Pure list push — no visuals
 */
export function listPush(list, item) {
    list.push(item);
}

/**
 * Pure list set — no visuals
 */
export function listSet(list, index, value) {
    if (index >= list.length) list.length = index + 1;
    list[index] = value;
}

/**
 * Create a visual-aware listPush function bound to visual dependencies.
 * Called once during context building — returns the bound async function.
 */
export function createListPushWithVisual(deps) {
    const { markVisitedWithVisual, showPathUpdateWithVisual, updateDijkstraPQ, showMSTEdgesFromList } = deps;

    return async function listPushWithVisual(list, item, listName) {
        list.push(item);

        if (listName.includes('visited') || listName.includes('visit')) {
            await markVisitedWithVisual(item);
        } else if (listName.includes('container') || listName.includes('stack')) {
            await showPathUpdateWithVisual(item);
        } else if (listName.includes('PQ') || listName.includes('pq')) {
            updateDijkstraPQ(list);
        } else if (listName.includes('MST_edges') || listName.includes('mst_edges')) {
            showMSTEdgesFromList(list);
        }
    };
}

/**
 * Create a visual-aware listSet function bound to DP visual dependencies.
 * Called once during context building — returns the bound async function.
 */
export function createListSetWithVisual(deps) {
    const { updateCoinChangeCellVisual, updateSubsetSumCellVisual } = deps;

    return async function listSetWithVisual(list, index, value, listName, meta) {
        if (index >= list.length) list.length = index + 1;
        list[index] = value;

        try {
            // Coin Change — list name contains 'dp'
            if (/\bdp\b/.test(listName)) {
                if (typeof updateCoinChangeCellVisual === 'function') {
                    updateCoinChangeCellVisual(meta.coinIndex || 0, index, value, { kind: 'set' });
                }
            }

            // Subset Sum — list name contains 'curr'
            if (/\bcurr\b/.test(listName)) {
                if (typeof updateSubsetSumCellVisual === 'function' && meta.itemIndex !== undefined) {
                    updateSubsetSumCellVisual(meta.itemIndex, index, value);
                }
            }
        } catch (e) { /* ignore visual errors */ }
    };
}
