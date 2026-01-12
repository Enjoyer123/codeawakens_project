import { useMemo } from 'react';


export const useLevelElements = (selectedCategory) => {
  // ตรวจสอบว่า item enable หรือไม่
  const isItemEnabled = selectedCategory?.item_enable === true;
  
  // ดึงรายการ item ที่ enable จาก category_items หรือ item (backward compatibility)
  const enabledItems = useMemo(() => {
    if (!isItemEnabled) return [];
    
    // ใช้ category_items ถ้ามี (ตารางใหม่)
    if (selectedCategory?.category_items && Array.isArray(selectedCategory.category_items)) {
      return selectedCategory.category_items.map(ci => ci.item_type);
    }
    
    // Fallback ไปใช้ item (backward compatibility)
    if (!selectedCategory?.item) return [];
    
    let itemData = selectedCategory.item;
    
    // ถ้าเป็น string ให้ parse JSON
    if (typeof itemData === 'string') {
      try {
        itemData = JSON.parse(itemData);
      } catch (e) {
        return [];
      }
    }
    
    // แปลงเป็น array
    return Array.isArray(itemData) ? itemData : [itemData];
  }, [selectedCategory, isItemEnabled]);
  
  // ตรวจสอบว่า item นี้ enable หรือไม่
  const isItemTypeEnabled = (itemName) => {
    if (!isItemEnabled) return false;
    return enabledItems.includes(itemName);
  };

  // ตรวจสอบว่า category เป็น Shortest Path หรือ Minimum Spanning Tree
  const isWeightedGraphCategory = () => {
    if (!selectedCategory) return false;
    const categoryName = (selectedCategory.category_name || '').toLowerCase();
    return categoryName.includes('shortest path') || 
           categoryName.includes('minimum spanning tree') ||
           categoryName.includes('dijkstra') ||
           categoryName.includes('prim') ||
           categoryName.includes('kruskal');
  };

  return {
    isItemEnabled,
    enabledItems,
    isItemTypeEnabled,
    isWeightedGraphCategory
  };
};
