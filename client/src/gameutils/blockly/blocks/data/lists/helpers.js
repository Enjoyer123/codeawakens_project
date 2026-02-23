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

