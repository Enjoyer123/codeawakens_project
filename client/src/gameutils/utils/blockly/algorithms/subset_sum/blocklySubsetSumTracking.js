// Subset Sum Tracking System
// Tracks decisions during subset sum algorithm execution to show final result

// Track which warriors are in which side during recursive calls
let subsetSumTrackingState = {
  decisions: [], // Array of {index, side: 1 or 2, sum} for each recursive call
  isTracking: false
};

/**
 * Reset subset sum tracking state
 */
export function resetSubsetSumTracking() {
  subsetSumTrackingState.decisions = [];
  subsetSumTrackingState.isTracking = false;
}

/**
 * Start tracking subset sum decisions
 */
export function startSubsetSumTracking() {
  subsetSumTrackingState.isTracking = true;
  subsetSumTrackingState.decisions = [];
}

/**
 * Track decision to include warrior (add to side1)
 * @param {number} index - Warrior index
 * @param {number} sum - Current sum after including this warrior
 */
export function trackIncludeWarrior(index, sum) {
  if (subsetSumTrackingState.isTracking) {
    subsetSumTrackingState.decisions.push({ index, side: 1, sum, action: 'include' });
    console.log(`📊 Track include: warrior ${index} -> side1, sum: ${sum}`);
  }
}

/**
 * Track decision to exclude warrior (add to side2)
 * @param {number} index - Warrior index
 * @param {number} sum - Current sum (unchanged)
 */
export function trackExcludeWarrior(index, sum) {
  if (subsetSumTrackingState.isTracking) {
    subsetSumTrackingState.decisions.push({ index, side: 2, sum, action: 'exclude' });
    console.log(`📊 Track exclude: warrior ${index} -> side2, sum: ${sum}`);
  }
}

/**
 * Reconstruct the final solution path from tracked decisions
 * This works by finding the path where sum equals targetSum
 * We need to track the decision tree properly for backtracking
 * @param {number} targetSum - Target sum to achieve
 * @returns {Array} Array of warrior indices that are in side1 (the solution)
 */
export function reconstructSubsetSumSolution(targetSum) {
  console.log('🔍 Reconstructing solution for targetSum:', targetSum);
  console.log('🔍 All decisions:', subsetSumTrackingState.decisions);

  // Since subset sum uses backtracking, we need to find the path that succeeds
  // We'll look for the last decision where sum == targetSum
  const solution = [];

  // Try to find a successful path by checking decisions in reverse
  // We look for include decisions that lead to targetSum
  for (let i = subsetSumTrackingState.decisions.length - 1; i >= 0; i--) {
    const decision = subsetSumTrackingState.decisions[i];
    if (decision.side === 1 && decision.sum === targetSum) {
      // Found a successful path, collect all include decisions before this
      for (let j = 0; j <= i; j++) {
        const d = subsetSumTrackingState.decisions[j];
        if (d.side === 1 && !solution.includes(d.index)) {
          solution.push(d.index);
        }
      }
      console.log('✅ Found solution path:', solution);
      return solution;
    }
  }

  // If no exact match, return empty solution (let visual blocks handle it)
  console.log('⚠️ No exact solution path found, decisions may not be tracked correctly');
  return solution;
}

/**
 * Show final subset sum solution visually
 * Instead of using tracking, we check the current state of warriors and ensure
 * all warriors are placed in a side (side1 or side2)
 * @param {number} targetSum - Target sum that was achieved
 */
export async function showSubsetSumFinalSolution(targetSum) {
  const { getCurrentGameState } = await import('../../../gameUtils');
  const { addWarriorToSide1, addWarriorToSide2 } = await import('./blocklySubsetSumVisual');

  const currentState = getCurrentGameState();
  const scene = currentState.currentScene;

  if (!scene || !scene.subsetSum || !scene.subsetSum.warriors) {
    console.warn('⚠️ No subset sum scene or warriors available');
    return;
  }

  // If no warriors were placed during execution (common for DP solutions that don't use visual blocks),
  // fall back to reconstructing a valid subset using DP from the current warrior powers.
  const computeSubsetIndicesDP = (values, target) => {
    const t = Number(target);
    if (!Number.isFinite(t) || t < 0) return [];
    const n = values.length;
    const dp = Array.from({ length: n + 1 }, () => Array(t + 1).fill(false));
    for (let i = 0; i <= n; i++) dp[i][0] = true;
    for (let i = 1; i <= n; i++) {
      const w = Number(values[i - 1]);
      for (let cap = 1; cap <= t; cap++) {
        dp[i][cap] = dp[i - 1][cap] || (Number.isFinite(w) && w <= cap && dp[i - 1][cap - w]);
      }
    }
    if (!dp[n][t]) return [];
    const selected = [];
    let cap = t;
    for (let i = n; i >= 1; i--) {
      if (dp[i - 1][cap]) {
        // excluded
        continue;
      }
      const w = Number(values[i - 1]);
      if (Number.isFinite(w) && w <= cap && dp[i - 1][cap - w]) {
        selected.push(i - 1);
        cap -= w;
      }
    }
    return selected.reverse();
  };

  // Check current state of warriors
  // Warriors that are already in side1 should stay there
  // Warriors that are not in any side should be moved to side2
  const allIndices = scene.subsetSum.warriors.map((w, idx) => idx);
  const warriorsInSide1 = [];
  const warriorsNotPlaced = [];

  for (const warriorIndex of allIndices) {
    const warrior = scene.subsetSum.warriors[warriorIndex];
    if (warrior && warrior.sprite) {
      const currentSide = warrior.sprite.getData('side');
      if (currentSide === 1) {
        warriorsInSide1.push(warriorIndex);
      } else if (currentSide !== 2) {
        // Warrior is not in any side yet
        warriorsNotPlaced.push(warriorIndex);
      }
    }
  }

  // If nothing is placed yet, try to place a valid solution set into side1.
  // Priority:
  // 1) Use tracked decisions (backtracking solution)
  // 2) If no tracking exists (DP solution), compute a subset via DP from warrior powers
  if (warriorsInSide1.length === 0 && warriorsNotPlaced.length > 0) {
    let solutionIndices = [];

    if (subsetSumTrackingState.decisions.length > 0) {
      solutionIndices = reconstructSubsetSumSolution(targetSum);
    } else {
      const values = scene.subsetSum.warriors.map(w => w?.power ?? 0);
      solutionIndices = computeSubsetIndicesDP(values, targetSum);
    }

    // Place solution indices to side1 first (so they don't get swept into side2)
    for (const idx of solutionIndices) {
      await addWarriorToSide1(idx);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Move any remaining unplaced warriors to side2
  const remainingUnplaced = [];
  for (const warriorIndex of allIndices) {
    const warrior = scene.subsetSum.warriors[warriorIndex];
    if (warrior && warrior.sprite) {
      const currentSide = warrior.sprite.getData('side');
      if (currentSide !== 1 && currentSide !== 2) remainingUnplaced.push(warriorIndex);
    }
  }
  for (const warriorIndex of remainingUnplaced) {
    await addWarriorToSide2(warriorIndex);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('✅ Ensured all subset sum warriors are placed:', {
    side1: warriorsInSide1,
    side2: allIndices.filter(idx => !warriorsInSide1.includes(idx) && !remainingUnplaced.includes(idx)).concat(remainingUnplaced),
    unplaced: remainingUnplaced
  });
}

/**
 * Get current tracking state (for debugging)
 */
export function getSubsetSumTrackingState() {
  return {
    decisions: [...subsetSumTrackingState.decisions],
    isTracking: subsetSumTrackingState.isTracking
  };
}

