// Subset Sum Visual Feedback System
// Provides visual feedback for Subset Sum algorithm execution

import { getCurrentGameState } from '../../../gameUtils';

/**
 * Add a warrior to side1 (move warrior sprite to side1)
 * @param {number} warriorIndex - Index of the warrior (0-based, matches array index)
 */
export async function addWarriorToSide1(warriorIndex) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.subsetSum || !scene.subsetSum.warriors) {
    console.warn('⚠️ No subset sum scene or warriors available');
    return;
  }

  console.log(`🔍 [addWarriorToSide1] Called with warriorIndex: ${warriorIndex}`);
  const warrior = scene.subsetSum.warriors[warriorIndex];
  if (!warrior || !warrior.sprite) {
    console.warn(`⚠️ Warrior at index ${warriorIndex} not found`);
    return;
  }

  const side1 = scene.subsetSum.side1;
  if (!side1) {
    console.warn('⚠️ Side1 not found');
    return;
  }

  // Get side1 position (center of the rectangle)
  const side1X = side1.x;
  const side1Y = side1.y;

  // Get original position (store if not already stored)
  const originalX = warrior.x;
  const originalY = warrior.y;

  if (!warrior.originalX) {
    warrior.originalX = originalX;
    warrior.originalY = originalY;
  }

  // Calculate offset position within side1 (to avoid overlapping warriors)
  // Count how many warriors are already in side1 (excluding the current warrior being moved)
  const warriorsInSide1 = scene.subsetSum.warriors.filter(w =>
    w.sprite && w.sprite.getData('side') === 1 && w !== warrior
  ).length;

  // Mark warrior as selected and set side (after counting)
  warrior.sprite.setData('selected', true);
  warrior.sprite.setData('side', 1);

  // Position warriors in a line within side1
  const side1Width = 150; // Width of side1 rectangle
  const spacing = side1Width / (warriorsInSide1 + 2); // Space warriors evenly
  const offsetX = side1X - side1Width / 2 + spacing * (warriorsInSide1 + 1);
  const offsetY = side1Y;

  // Move warrior to side1 with animation
  scene.tweens.add({
    targets: [warrior.sprite, warrior.labelText, warrior.powerText],
    x: offsetX,
    y: offsetY,
    duration: 500,
    ease: 'Power2',
    onComplete: () => {
      console.log(`✅ Warrior ${warriorIndex} moved to side1 at (${offsetX}, ${offsetY})`);
    }
  });

  // Add a small delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Add a warrior to side2 (move warrior sprite to side2)
 * @param {number} warriorIndex - Index of the warrior (0-based, matches array index)
 */
export async function addWarriorToSide2(warriorIndex) {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.subsetSum || !scene.subsetSum.warriors) {
    console.warn('⚠️ No subset sum scene or warriors available');
    return;
  }

  console.log(`🔍 [addWarriorToSide2] Called with warriorIndex: ${warriorIndex}`);
  const warrior = scene.subsetSum.warriors[warriorIndex];
  if (!warrior || !warrior.sprite) {
    console.warn(`⚠️ Warrior at index ${warriorIndex} not found`);
    return;
  }

  const side2 = scene.subsetSum.side2;
  if (!side2) {
    console.warn('⚠️ Side2 not found');
    return;
  }

  // Get side2 position (center of the rectangle)
  const side2X = side2.x;
  const side2Y = side2.y;

  // Get original position (store if not already stored)
  const originalX = warrior.x;
  const originalY = warrior.y;

  if (!warrior.originalX) {
    warrior.originalX = originalX;
    warrior.originalY = originalY;
  }

  // Calculate offset position within side2 (to avoid overlapping warriors)
  // Count how many warriors are already in side2 (excluding the current warrior being moved)
  const warriorsInSide2 = scene.subsetSum.warriors.filter(w =>
    w.sprite && w.sprite.getData('side') === 2 && w !== warrior
  ).length;

  // Mark warrior as selected and set side (after counting)
  warrior.sprite.setData('selected', true);
  warrior.sprite.setData('side', 2);

  // Position warriors in a line within side2
  const side2Width = 150; // Width of side2 rectangle
  const spacing = side2Width / (warriorsInSide2 + 2); // Space warriors evenly
  const offsetX = side2X - side2Width / 2 + spacing * (warriorsInSide2 + 1);
  const offsetY = side2Y;

  // Move warrior to side2 with animation
  scene.tweens.add({
    targets: [warrior.sprite, warrior.labelText, warrior.powerText],
    x: offsetX,
    y: offsetY,
    duration: 500,
    ease: 'Power2',
    onComplete: () => {
      console.log(`✅ Warrior ${warriorIndex} moved to side2 at (${offsetX}, ${offsetY})`);
    }
  });

  // Add a small delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Reset all warriors to their original positions
 */
export function resetSubsetSumWarriors() {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.subsetSum || !scene.subsetSum.warriors) {
    return;
  }

  scene.subsetSum.warriors.forEach((warrior) => {
    if (warrior.sprite && warrior.originalX !== undefined && warrior.originalY !== undefined) {
      // Reset position immediately (no animation on reset)
      warrior.sprite.x = warrior.originalX;
      warrior.sprite.y = warrior.originalY;
      if (warrior.labelText) warrior.labelText.x = warrior.originalX;
      if (warrior.labelText) warrior.labelText.y = warrior.originalY - 40;
      if (warrior.powerText) warrior.powerText.x = warrior.originalX;
      if (warrior.powerText) warrior.powerText.y = warrior.originalY;

      // Reset data
      warrior.sprite.setData('selected', false);
      warrior.sprite.setData('side', null);
    }
  });

  console.log('🔄 Reset all subset sum warriors to original positions');
}

