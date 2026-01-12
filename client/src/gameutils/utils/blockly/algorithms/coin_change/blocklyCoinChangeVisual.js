// Coin Change Visual Feedback System
// Provides visual feedback for Coin Change algorithm execution

import { getCurrentGameState } from '../../../gameUtils';

// Track selected warriors during coin change execution
// Unlike Knapsack, Coin Change can select the same warrior multiple times
// So we need to track each selection individually
let coinChangeSelectionState = {
  selectedWarriors: [], // Array of { index, power, copyId } for each selection
  decisionMap: new Map(), // Map of "amount,index" -> { include: number, exclude: number, chosen: 'include'|'exclude' }
  isTracking: false
};

/**
 * Reset coin change selection tracking state
 */
export function resetCoinChangeSelectionTracking() {
  coinChangeSelectionState.selectedWarriors = [];
  coinChangeSelectionState.decisionMap.clear();
  coinChangeSelectionState.isTracking = false;
}

/**
 * Start tracking coin change selections
 */
export function startCoinChangeSelectionTracking() {
  console.log('🔍 startCoinChangeSelectionTracking called');
  coinChangeSelectionState.isTracking = true;
  coinChangeSelectionState.selectedWarriors = [];
  coinChangeSelectionState.decisionMap.clear();
  console.log('✅ Coin change tracking started:', coinChangeSelectionState);
}

/**
 * Track a decision at state (amount, index)
 * @param {number} amount - Current amount
 * @param {number} index - Current coin index
 * @param {number} include - Result from including current coin
 * @param {number} exclude - Result from excluding current coin
 */
export function trackCoinChangeDecision(amount, index, include, exclude) {
  if (!coinChangeSelectionState.isTracking) {
    return;
  }

  const key = `${amount},${index}`;
  let chosen = null;

  // Determine which path was chosen
  if (include === -1 && exclude === -1) {
    chosen = null; // Both invalid
  } else if (include === -1) {
    chosen = 'exclude'; // Only exclude is valid
  } else if (exclude === -1) {
    chosen = 'include'; // Only include is valid
  } else {
    chosen = include <= exclude ? 'include' : 'exclude'; // Choose minimum
  }

  coinChangeSelectionState.decisionMap.set(key, { include, exclude, chosen });
  console.log(`📊 Track decision: state (${amount}, ${index}) -> include=${include}, exclude=${exclude}, chosen=${chosen}`);
}

/**
 * Add warrior to selection box (copy and move it into the box)
 * @param {number} warriorIndex - Index of warrior (0-based)
 */
export async function addWarriorToSelection(warriorIndex) {
  console.log('🔍 addWarriorToSelection called with index:', warriorIndex);
  console.log('🔍 Tracking state:', coinChangeSelectionState.isTracking);

  // Note: isTracking may be false when showing final solution, but that's okay
  // We still want to add warriors to the display
  // if (!coinChangeSelectionState.isTracking) {
  //   console.warn('❌ Coin change selection tracking is not active');
  //   return;
  // }

  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  console.log('🔍 Scene exists:', !!scene);
  console.log('🔍 coinChange exists:', !!scene?.coinChange);

  if (!scene || !scene.coinChange) {
    console.warn('❌ Coin change scene not found');
    return;
  }

  const warriors = scene.coinChange.warriors;
  if (!warriors || warriorIndex < 0 || warriorIndex >= warriors.length) {
    console.warn(`Invalid warrior index: ${warriorIndex}`);
    return;
  }

  const warrior = warriors[warriorIndex];
  if (!warrior) {
    console.warn(`Warrior at index ${warriorIndex} not found`);
    return;
  }

  // Create a copy of the warrior visual elements
  const copyId = `copy_${Date.now()}_${Math.random()}`;
  const selectedBox = scene.coinChange.selectedBox;

  // Calculate position in selection box (arrange horizontally)
  const boxX = selectedBox.x;
  const boxY = selectedBox.y;
  const boxWidth = selectedBox.width;
  const boxHeight = selectedBox.height;
  const currentCount = coinChangeSelectionState.selectedWarriors.length;
  const spacing = 80; // Spacing between warrior copies
  const startX = boxX - (boxWidth / 2) + 50; // Start from left side of box
  const copyX = startX + (currentCount * spacing);
  const copyY = boxY;

  // Only copy if it fits in the box
  if (copyX > boxX + (boxWidth / 2) - 50) {
    console.warn('Selection box is full, cannot add more warriors');
    return;
  }

  // Copy the circle and number text
  const copiedCircle = scene.add.circle(copyX, copyY, 30, 0x0066ff, 1); // Blue
  copiedCircle.setStrokeStyle(3, 0x0044cc);
  copiedCircle.setDepth(7);

  const copiedNumberText = scene.add.text(copyX, copyY, warrior.number.toString(), {
    fontSize: '20px',
    color: '#ffffff',
    fontStyle: 'bold'
  });
  copiedNumberText.setOrigin(0.5, 0.5);
  copiedNumberText.setDepth(8);

  // Copy the power square and text (smaller size for box)
  const copiedPowerSquare = scene.add.rectangle(copyX, copyY - 45, 40, 40);
  copiedPowerSquare.setFillStyle(0xffffff, 0);
  copiedPowerSquare.setStrokeStyle(2, 0x000000, 0.8);
  copiedPowerSquare.setDepth(7);

  const copiedPowerText = scene.add.text(copyX, copyY - 45, warrior.power.toString(), {
    fontSize: '16px',
    color: '#000000',
    fontStyle: 'bold'
  });
  copiedPowerText.setOrigin(0.5, 0.5);
  copiedPowerText.setDepth(8);

  // Animate: start from original position and move to box
  copiedCircle.setPosition(warrior.x, warrior.y + 60); // Start at original circle position
  copiedNumberText.setPosition(warrior.x, warrior.y + 60);
  copiedPowerSquare.setPosition(warrior.x, warrior.y);
  copiedPowerText.setPosition(warrior.x, warrior.y);

  // Animate movement
  await new Promise((resolve) => {
    scene.tweens.add({
      targets: [copiedCircle, copiedNumberText],
      x: copyX,
      y: copyY,
      duration: 500,
      ease: 'Power2',
      onComplete: resolve
    });

    scene.tweens.add({
      targets: [copiedPowerSquare, copiedPowerText],
      x: copyX,
      y: copyY - 45,
      duration: 500,
      ease: 'Power2'
    });
  });

  // Track this selection
  coinChangeSelectionState.selectedWarriors.push({
    index: warriorIndex,
    power: warrior.power,
    copyId: copyId,
    circle: copiedCircle,
    numberText: copiedNumberText,
    powerSquare: copiedPowerSquare,
    powerText: copiedPowerText
  });

  console.log(`✅ Added warrior ${warriorIndex} (power: ${warrior.power}) to selection box`);
}

/**
 * Reset coin change visual display
 * @param {boolean} clearTracking - Whether to clear tracking state (default: true)
 */
export function resetCoinChangeVisual(scene, clearTracking = true) {
  if (!scene || !scene.coinChange) {
    return;
  }

  // Remove all copied warriors from selection box
  coinChangeSelectionState.selectedWarriors.forEach(selection => {
    if (selection.circle) selection.circle.destroy();
    if (selection.numberText) selection.numberText.destroy();
    if (selection.powerSquare) selection.powerSquare.destroy();
    if (selection.powerText) selection.powerText.destroy();
  });

  // Clear selectedWarriors array but preserve decisionMap if clearTracking is false
  coinChangeSelectionState.selectedWarriors = [];

  if (clearTracking) {
    resetCoinChangeSelectionTracking();
  }
}

/**
 * Reconstruct final solution from decision map
 * @param {number} amount - Initial amount
 * @param {Array} coins - Array of coin values
 * @param {number} index - Initial index
 * @returns {Array} Array of coin indices that were selected
 */
function reconstructCoinChangeSolution(amount, coins, index) {
  const solution = [];
  let currentAmount = amount;
  let currentIndex = index;
  let iterations = 0;
  const maxIterations = 1000; // Safety limit to prevent infinite loops

  console.log('🔍 Starting reconstruction from:', { currentAmount, currentIndex, coins });
  console.log('🔍 Decision map size:', coinChangeSelectionState.decisionMap.size);
  console.log('🔍 Decision map entries:', Array.from(coinChangeSelectionState.decisionMap.entries()).slice(0, 10));

  while (currentAmount > 0 && currentIndex < coins.length && iterations < maxIterations) {
    iterations++;
    const key = `${currentAmount},${currentIndex}`;
    const decision = coinChangeSelectionState.decisionMap.get(key);

    console.log(`🔍 Iteration ${iterations}: Checking state (${currentAmount}, ${currentIndex}):`, decision);

    if (!decision) {
      console.warn(`⚠️ No decision found for state (${currentAmount}, ${currentIndex}), stopping reconstruction`);
      break;
    }

    if (decision.chosen === 'include') {
      // Coin at currentIndex was selected
      solution.push(currentIndex);
      currentAmount = currentAmount - coins[currentIndex];
      // Keep same index to allow selecting same coin again (this is the key for Coin Change!)
      console.log(`✅ Coin ${currentIndex} (value ${coins[currentIndex]}) selected, new amount: ${currentAmount}, keeping index: ${currentIndex}`);
    } else if (decision.chosen === 'exclude') {
      // Coin at currentIndex was not selected, move to next
      const prevIndex = currentIndex;
      currentIndex = currentIndex + 1;
      console.log(`❌ Coin ${prevIndex} not selected, moving to index ${currentIndex}`);
    } else {
      // Both invalid or no decision
      console.warn(`⚠️ Invalid decision for state (${currentAmount}, ${currentIndex}), stopping reconstruction`);
      break;
    }

    // Safety check: if amount becomes negative, something is wrong
    if (currentAmount < 0) {
      console.error(`❌ Amount became negative: ${currentAmount}, stopping reconstruction`);
      break;
    }
  }

  if (iterations >= maxIterations) {
    console.warn(`⚠️ Reconstruction reached max iterations (${maxIterations}), stopping`);
  }

  console.log('✅ Final solution:', solution);
  console.log(`   Remaining amount: ${currentAmount}, Final index: ${currentIndex}`);
  return solution;
}

/**
 * Show final coin change solution from tracking state
 * Reconstructs the solution from decision map and displays it
 */
export async function showCoinChangeFinalSolution() {
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.coinChange) {
    console.warn('❌ Coin change scene not found');
    return;
  }

  // Get initial parameters from scene
  const coinChangeData = scene.levelData?.coinChangeData;
  if (!coinChangeData) {
    console.warn('❌ Coin change data not found in scene');
    return;
  }

  const initialAmount = coinChangeData.monster_power || 32;
  const coins = coinChangeData.warriors || [1, 5, 10, 25];
  const initialIndex = 0;

  console.log('🔍 [showCoinChangeFinalSolution] Decision map before reconstruction:');
  console.log('   Size:', coinChangeSelectionState.decisionMap.size);
  console.log('   Sample entries:', Array.from(coinChangeSelectionState.decisionMap.entries()).slice(0, 20));

  if (coinChangeSelectionState.decisionMap.size === 0) {
    // Greedy solutions often animate selections during execution (using addWarriorToSelection).
    // In that case, we should NOT replay again here, otherwise the user sees the same sequence twice.
    if (coinChangeSelectionState.selectedWarriors.length > 0) {
      console.log('✅ Coin Change already displayed during execution (no decisionMap). Skipping final replay.');
      return;
    }

    console.warn('⚠️ Decision map is empty; falling back to DP reconstruction for display');

    // DP fallback: compute min coins and reconstruct one optimal multiset.
    const amount = Number(initialAmount);
    const startIndex = Number(initialIndex) || 0;
    const INF = 1e9;
    if (!Number.isFinite(amount) || amount < 0) return;

    const dp = Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let i = startIndex; i < coins.length; i++) {
      const coin = Number(coins[i]);
      if (!Number.isFinite(coin) || coin <= 0) continue;
      for (let a = coin; a <= amount; a++) {
        if (dp[a - coin] + 1 < dp[a]) dp[a] = dp[a - coin] + 1;
      }
    }

    if (dp[amount] >= INF) {
      console.warn('⚠️ DP fallback: no solution exists');
      return;
    }

    // Reconstruct: prefer larger coins first (nicer looking, fewer pieces earlier)
    const solution = [];
    let a = amount;
    let guard = 0;
    while (a > 0 && guard++ < 2000) {
      let picked = false;
      for (let i = coins.length - 1; i >= startIndex; i--) {
        const coin = Number(coins[i]);
        if (!Number.isFinite(coin) || coin <= 0) continue;
        if (a - coin >= 0 && dp[a] === dp[a - coin] + 1) {
          solution.push(i);
          a -= coin;
          picked = true;
          break;
        }
      }
      if (!picked) {
        console.warn('⚠️ DP fallback: reconstruction got stuck at amount:', a);
        break;
      }
    }

    resetCoinChangeVisual(scene, true);
    for (let i = 0; i < solution.length; i++) {
      const coinIndex = solution[i];
      await addWarriorToSelection(coinIndex);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('✅ Coin change final solution displayed (DP fallback)');
    return;
  }

  // Reset visual display but keep decisionMap (don't clear tracking)
  resetCoinChangeVisual(scene, false);

  // Reconstruct solution from decision map
  const solution = reconstructCoinChangeSolution(initialAmount, coins, initialIndex);

  console.log('🔍 [showCoinChangeFinalSolution] Reconstructed solution:', solution);
  console.log('   Solution length:', solution.length);

  if (solution.length === 0) {
    console.warn('⚠️ Reconstructed solution is empty');
    return;
  }

  // Display each coin in the solution
  for (let i = 0; i < solution.length; i++) {
    const coinIndex = solution[i];
    console.log(`🔍 [showCoinChangeFinalSolution] Adding coin at index ${coinIndex} (${i + 1}/${solution.length})`);
    await addWarriorToSelection(coinIndex);
    // Small delay between each addition for better visual effect
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('✅ Coin change final solution displayed');
  console.log(`   Total coins selected: ${solution.length}`);
}

