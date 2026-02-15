// Knapsack Visual Feedback System
// Provides visual feedback for Knapsack algorithm execution

import { getCurrentGameState } from '../../../shared/game';
import { updateKnapsackCell } from './state';

// Track which items are selected during knapsack execution
// This will be used to show the final result
// We use a map to track decisions at each (i, j) state to avoid duplicates
let knapsackSelectionState = {
  selectedItems: new Set(), // Set of item indices that are selected in final solution
  decisionMap: new Map(), // Map of "(i,j)" -> boolean (true = selected, false = not selected)
  isTracking: false
};

/**
 * Reset knapsack selection tracking state
 */
export function resetKnapsackSelectionTracking() {
  knapsackSelectionState.selectedItems.clear();
  knapsackSelectionState.decisionMap.clear();
  knapsackSelectionState.isTracking = false;
}

/**
 * Start tracking knapsack selections
 */
export function startKnapsackSelectionTracking() {
  knapsackSelectionState.isTracking = true;
  knapsackSelectionState.selectedItems.clear();
  knapsackSelectionState.decisionMap.clear();
}

/**
 * Track that an item is selected at state (i, j)
 * Only tracks the decision, doesn't show visual immediately
 * @param {number} i - Current item index
 * @param {number} j - Current capacity
 */
export function trackKnapsackItemSelection(i, j) {
  if (knapsackSelectionState.isTracking) {
    const key = `${i},${j}`;
    knapsackSelectionState.decisionMap.set(key, true);
    console.log(`📊 Track selection: state (${i}, ${j}) -> selected`);
  }
}

/**
 * Track that an item is unselected at state (i, j)
 * Only tracks the decision, doesn't show visual immediately
 * @param {number} i - Current item index
 * @param {number} j - Current capacity
 */
export function trackKnapsackItemUnselection(i, j) {
  if (knapsackSelectionState.isTracking) {
    const key = `${i},${j}`;
    knapsackSelectionState.decisionMap.set(key, false);
    console.log(`📊 Track unselection: state (${i}, ${j}) -> not selected`);
  }
}

/**
 * Reconstruct the final selected items by tracing back through decisions
 * @param {Array} weights - Array of item weights
 * @param {number} capacity - Knapsack capacity
 * @param {number} n - Number of items
 * @returns {Set} Set of selected item indices
 */
function reconstructSelectedItems(weights, capacity, n) {
  const selected = new Set();
  let i = n - 1;
  let j = capacity;

  console.log('🔍 Starting trace back from state:', { i, j, capacity, n, weights });
  console.log('🔍 Decision map entries:', Array.from(knapsackSelectionState.decisionMap.entries()));

  // Trace back from (n-1, capacity) to (0, 0)
  while (i >= 0 && j > 0) {
    const key = `${i},${j}`;
    const decision = knapsackSelectionState.decisionMap.get(key);

    console.log(`🔍 Checking state (${i}, ${j}): decision =`, decision);

    if (decision === true) {
      // Item i was selected in the optimal solution
      selected.add(i);
      console.log(`✅ Item ${i} was selected, moving from (i=${i}, cap=${j}) to (i=${i - 1}, cap=${j - weights[i]})`);
      j = j - weights[i];
      i = i - 1; // 0/1 knapsack: move to previous item after selecting
    } else if (decision === false) {
      // Item i was not selected
      console.log(`❌ Item ${i} was not selected, moving to previous item`);
      i = i - 1; // Move to previous item
    } else {
      // Decision not found - might be a base case or missing decision
      console.log(`⚠️ No decision found for state (${i}, ${j}), trying previous item`);
      i = i - 1; // Move to previous item
    }
  }

  console.log('✅ Final selected items:', Array.from(selected));
  return selected;
}

/**
 * Show visual feedback for all tracked selected items (final result)
 */
export async function showKnapsackFinalSelection() {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.knapsack || !scene.knapsack.items) {
    return;
  }

  // Get knapsack data to reconstruct the solution
  const levelData = scene.levelData;
  if (!levelData || !levelData.knapsackData) {
    console.warn('⚠️ No knapsack data available for reconstruction');
    return;
  }

  const weights = levelData.knapsackData.items ? levelData.knapsackData.items.map(item => item.weight) : [];
  const capacity = levelData.knapsackData.capacity || 0;
  const n = weights.length;

  // Reconstruct selected items by tracing back through decisions
  const finalSelected = reconstructSelectedItems(weights, capacity, n);

  // Reset all items first
  resetKnapsackItems();

  // Show visual feedback step-by-step (like DFS shows path exploration)
  // Show each selected item one by one with delay
  const selectedArray = Array.from(finalSelected).sort((a, b) => a - b);
  for (let idx = 0; idx < selectedArray.length; idx++) {
    const itemIndex = selectedArray[idx];
    await selectKnapsackItem(itemIndex);
    // Add delay between each item to show step-by-step
    if (idx < selectedArray.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('✅ Showed final knapsack selection step-by-step:', selectedArray);
  console.log('✅ Decision map size:', knapsackSelectionState.decisionMap.size);
  console.log('✅ All decision map entries:');
  Array.from(knapsackSelectionState.decisionMap.entries()).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? 'selected' : 'not selected'}`);
  });
}

/**
 * Select a knapsack item (move it into the bag)
 * @param {number} itemIndex - Index of the item (0-based, matches array index)
 */
export async function selectKnapsackItem(itemIndex) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.knapsack || !scene.knapsack.items) {
    console.warn('⚠️ No knapsack scene or items available');
    return;
  }

  const item = scene.knapsack.items[itemIndex];
  if (!item || !item.sprite) {
    console.warn(`⚠️ Item at index ${itemIndex} not found`);
    return;
  }

  const bag = scene.knapsack.bag;
  if (!bag) {
    console.warn('⚠️ Bag not found');
    return;
  }

  // Get bag position
  const bagX = bag.x;
  const bagY = bag.y;

  // Get original position
  const originalX = item.x;
  const originalY = item.y;

  // Store original position if not already stored
  if (!item.originalX) {
    item.originalX = originalX;
    item.originalY = originalY;
  }

  // Mark item as selected
  item.sprite.setData('selected', true);
  if (item.sprite.getData) {
    item.sprite.getData('selected', true);
  }

  // Move item to bag with animation
  scene.tweens.add({
    targets: [item.sprite, item.labelText, item.infoText, item.glowEffect],
    x: bagX,
    y: bagY,
    duration: 500,
    ease: 'Power2',
    onComplete: () => {
      // Change color to indicate selected
      if (item.sprite.setFillStyle) {
        item.sprite.setFillStyle(0x00ff00, 1); // Green when selected
      }
      if (item.sprite.setStrokeStyle) {
        item.sprite.setStrokeStyle(3, 0x00aa00);
      }
    }
  });

  // Wait for animation to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`✅ Item ${itemIndex} selected and moved to bag`);
}

/**
 * Unselect a knapsack item (move it back to original position)
 * @param {number} itemIndex - Index of the item (0-based, matches array index)
 */
export async function unselectKnapsackItem(itemIndex) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.knapsack || !scene.knapsack.items) {
    console.warn('⚠️ No knapsack scene or items available');
    return;
  }

  const item = scene.knapsack.items[itemIndex];
  if (!item || !item.sprite) {
    console.warn(`⚠️ Item at index ${itemIndex} not found`);
    return;
  }

  // Get original position
  const originalX = item.originalX || item.x;
  const originalY = item.originalY || item.y;

  // Mark item as unselected
  item.sprite.setData('selected', false);
  if (item.sprite.getData) {
    item.sprite.getData('selected', false);
  }

  // Move item back to original position with animation
  scene.tweens.add({
    targets: [item.sprite, item.labelText, item.infoText, item.glowEffect],
    x: originalX,
    y: originalY,
    duration: 500,
    ease: 'Power2',
    onComplete: () => {
      // Change color back to original (gold)
      if (item.sprite.setFillStyle) {
        item.sprite.setFillStyle(0xffd700, 1); // Gold color
      }
      if (item.sprite.setStrokeStyle) {
        item.sprite.setStrokeStyle(3, 0xffaa00);
      }
    }
  });

  // Wait for animation to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`✅ Item ${itemIndex} unselected and moved back`);
}

/**
 * Reset all knapsack items to original positions
 */
export function resetKnapsackItems() {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.knapsack || !scene.knapsack.items) {
    return;
  }

  scene.knapsack.items.forEach((item, index) => {
    if (item && item.sprite) {
      const originalX = item.originalX || item.x;
      const originalY = item.originalY || item.y;

      // Reset position immediately
      item.sprite.x = originalX;
      item.sprite.y = originalY;
      if (item.labelText) {
        item.labelText.x = originalX;
        item.labelText.y = originalY - 35;
      }
      if (item.infoText) {
        item.infoText.x = originalX;
        item.infoText.y = originalY;
      }
      if (item.glowEffect) {
        item.glowEffect.x = originalX;
        item.glowEffect.y = originalY;
      }

      // Reset color
      if (item.sprite.setFillStyle) {
        item.sprite.setFillStyle(0xffd700, 1); // Gold color
      }
      if (item.sprite.setStrokeStyle) {
        item.sprite.setStrokeStyle(3, 0xffaa00);
      }

      // Mark as unselected
      item.sprite.setData('selected', false);
    }
  });

  console.log('✅ All knapsack items reset to original positions');
}

/**
 * Helper function for Math.max in knapsack that tracks item selection decisions
 * This tracks decisions at each (i, j) state without showing visual feedback immediately
 * Visual feedback will be shown at the end using showKnapsackFinalSelection()
 * @param {number} valWithout - Value without selecting current item
 * @param {number} valWith - Value with selecting current item
 * @param {number} i - Current item index parameter
 * @param {number} j - Current capacity parameter
 * @returns {number} Maximum value
 */
export async function knapsackMaxWithVisual(valWithout, valWith, i, j) {
  const maxVal = Math.max(valWithout, valWith);
  const iVal = Number(i);
  const jVal = Number(j);

  // Update DP table cell for UI display (works for both DP and memoized recursion patterns)
  try {
    const chosen = (maxVal === valWith && valWith > valWithout) ? 'with' : 'without';
    updateKnapsackCell(iVal, jVal, maxVal, { valWithout, valWith, chosen });
  } catch (e) {
    // ignore UI update errors
  }

  // Track decision at this (i, j) state
  // If valWith is chosen and it's better, track that item i is selected at capacity j
  if (maxVal === valWith && valWith > valWithout) {
    trackKnapsackItemSelection(iVal, jVal);
  } else if (maxVal === valWithout && valWithout >= valWith) {
    trackKnapsackItemUnselection(iVal, jVal);
  }

  return maxVal;
}

