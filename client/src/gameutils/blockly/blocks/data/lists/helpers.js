// Data Operation Helpers — Pure logic (list + dict mutations)
// Used by lists_add_item, lists_setIndex, and dict_set generators

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
 * Pure dictSet — no visuals
 */
export function dictSet(dict, key, value) {
    if (dict && (typeof dict === 'object' || typeof dict === 'function')) {
        dict[key] = value;
    }
}
