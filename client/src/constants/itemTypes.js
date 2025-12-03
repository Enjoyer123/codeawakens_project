/**
 * Level Item Types Constants
 * รายการ item types ที่สามารถใช้ใน level
 */

export const ITEM_TYPES = {
  COIN_POSITIONS: 'coin_positions',
  PEOPLE: 'people',
  TREASURES: 'treasures',
};

/**
 * Item Type Labels (สำหรับแสดงใน UI)
 */
export const ITEM_TYPE_LABELS = {
  [ITEM_TYPES.COIN_POSITIONS]: 'Coins (เหรียญ)',
  [ITEM_TYPES.PEOPLE]: 'People (คน)',
  [ITEM_TYPES.TREASURES]: 'Treasures (สมบัติ)',
};

/**
 * Item Type Short Labels (สำหรับแสดงใน badge)
 */
export const ITEM_TYPE_SHORT_LABELS = {
  [ITEM_TYPES.COIN_POSITIONS]: 'Coins',
  [ITEM_TYPES.PEOPLE]: 'People',
  [ITEM_TYPES.TREASURES]: 'Treasures',
};

/**
 * Available Items สำหรับเลือกใน form
 */
export const AVAILABLE_ITEMS = [
  { value: ITEM_TYPES.COIN_POSITIONS, label: ITEM_TYPE_LABELS[ITEM_TYPES.COIN_POSITIONS] },
  { value: ITEM_TYPES.PEOPLE, label: ITEM_TYPE_LABELS[ITEM_TYPES.PEOPLE] },
  { value: ITEM_TYPES.TREASURES, label: ITEM_TYPE_LABELS[ITEM_TYPES.TREASURES] },
];

/**
 * Get all item type values as array
 */
export const getAllItemTypes = () => Object.values(ITEM_TYPES);

/**
 * Check if item type is valid
 */
export const isValidItemType = (itemType) => {
  return Object.values(ITEM_TYPES).includes(itemType);
};

