// Ant DP visual helpers
// Provides selection/consideration visuals for applied dynamic Ant DP (grid path max sugar).

import { getCurrentGameState, setCurrentGameState } from '../../../gameUtils';
import { updateAntDpCellVisual } from './antDpStateManager';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Visual helper for Math.max inside Ant DP.
 * Convention: A = "top", B = "left" (we still highlight both; chosen is based on values).
 *
 * @param {number} valTop
 * @param {number} valLeft
 * @param {number} r - current row
 * @param {number} c - current col
 * @returns {number} max(valTop, valLeft)
 */
export async function antMaxWithVisual(valTop, valLeft, r, c) {
  const rr = Number(r);
  const cc = Number(c);

  // ROBUST SAFETY: Treat undefined/null/NaN/-Infinity as 0
  const safeNum = (v) => (v !== undefined && v !== null && Number.isFinite(Number(v))) ? Number(v) : 0;
  const a = safeNum(valTop);
  const b = safeNum(valLeft);

  // FAST PATH for Tests: skip all visuals if not a visual run
  if (typeof globalThis !== 'undefined' && !globalThis.__isVisualRun) {
    return Math.max(a, b);
  }

  console.log(`antMaxWithVisual [Debug] Top: ${valTop} -> ${a}, Left: ${valLeft} -> ${b}, Result: ${Math.max(a, b)}`);

  // If we can't reason about indices, just return numeric max.
  if (!Number.isFinite(rr) || !Number.isFinite(cc)) {
    return Math.max(a, b);
  }

  const upR = rr - 1;
  const upC = cc;
  const leftR = rr;
  const leftC = cc - 1;

  // Consider step (yellow): show current cell and its two candidates (if in bounds, Ant board will clamp anyway).
  try { updateAntDpCellVisual(rr, cc, null, { kind: 'consider', keepTrail: false }); } catch (e) { }
  await sleep(35);
  try { updateAntDpCellVisual(upR, upC, null, { kind: 'consider', keepTrail: false, from: 'top' }); } catch (e) { }
  await sleep(35);
  try { updateAntDpCellVisual(leftR, leftC, null, { kind: 'consider', keepTrail: false, from: 'left' }); } catch (e) { }
  await sleep(35);

  const maxVal = Math.max(Number.isFinite(a) ? a : -Infinity, Number.isFinite(b) ? b : -Infinity);
  const chosen = (Number.isFinite(a) && (a >= b || !Number.isFinite(b))) ? 'top' : 'left';

  // Chosen step (green): highlight chosen predecessor and keep trail.
  try {
    if (chosen === 'top') updateAntDpCellVisual(upR, upC, null, { kind: 'chosen', keepTrail: true });
    else updateAntDpCellVisual(leftR, leftC, null, { kind: 'chosen', keepTrail: true });
  } catch (e) { }

  // Persist decision so we can reconstruct a path later if needed.
  try {
    const gs = getCurrentGameState();
    const ds = gs?.antDpState || {};
    const decisions = (ds.decisions && typeof ds.decisions === 'object') ? ds.decisions : {};
    const key = `${rr},${cc}`;
    decisions[key] = { chosen, rr, cc, t: Date.now() };
    setCurrentGameState({
      antDpState: {
        ...ds,
        decisions: { ...decisions },
        updatedAt: Date.now(),
      }
    });
  } catch (e) { }

  return maxVal;
}

/**
 * Reconstructs and highlights the optimal path from goal to start in green.
 * This is called after the main DP calculation is complete.
 */
export async function showAntDpFinalPath() {
  const gs = getCurrentGameState();
  const ds = gs?.antDpState || {};
  const decisions = ds.decisions || {};
  const dims = ds.dims || { rows: 1, cols: 1 };

  // Get start/goal - these were injected or calculated during init
  // We can try to get them from the state if we stored them, 
  // or use the dimensions as fallback (though start might not be 0,0).
  // useCodeExecution.js injects 'start' and 'goal' objects into the global scope usually,
  // but for the visual helper we should rely on what's in the game state.

  // In Ant DP levels, the goal is often the bottom-right of the grid provided in payload.
  // Decisions are keyed by "r,c".

  // We need the actual goal from the level data.
  const level = gs?.currentScene?.levelData || gs?.levelData;
  const applied = level?.appliedData || level?.applied_data;
  const payload = applied?.payload || {};

  // Normalize point helper (similar to useCodeExecution)
  const normPoint = (p, fallback) => {
    const isArray = Array.isArray(p);
    const obj = (p && typeof p === 'object' && !isArray) ? p : (isArray ? { r: p[0], c: p[1] } : {});
    const rRaw = (obj.r ?? obj.row ?? obj.y ?? obj.rr);
    const cRaw = (obj.c ?? obj.col ?? obj.x ?? obj.cc);
    const rNum = Number(rRaw);
    const cNum = Number(cRaw);
    return {
      r: Number.isFinite(rNum) ? rNum : fallback.r,
      c: Number.isFinite(cNum) ? cNum : fallback.c
    };
  };

  const start = normPoint(payload.start, { r: 0, c: 0 });
  let goal = normPoint(payload.goal, { r: dims.rows - 1, c: dims.cols - 1 });

  // ROBUST GOAL DETECTION
  // If the provided goal is not in decisions, try to find the max reachable cell
  if (!decisions[`${goal.r},${goal.c}`]) {
    console.warn(`Goal ${goal.r},${goal.c} not found in decisions. Searching for max bounds...`);
    let maxR = -1;
    let maxC = -1;
    Object.keys(decisions).forEach(k => {
      const [r, c] = k.split(',').map(Number);
      if (r >= maxR && c >= maxC) { maxR = r; maxC = c; } // Simple heuristic for bottom-right
    });
    if (maxR !== -1) {
      goal = { r: maxR, c: maxC };
      console.log(`Updated goal to ${maxR},${maxC}`);
    }
  }

  console.log('🏁 showAntDpFinalPath: Start point normalized:', start);
  console.log('🏁 showAntDpFinalPath: Goal point normalized:', goal);
  console.log('🏁 showAntDpFinalPath: Backtracking from', goal, 'to', start);
  console.log('🏁 showAntDpFinalPath: Decisions available:', Object.keys(decisions).length);

  let currR = goal.r;
  let currC = goal.c;
  const path = [];

  // Safety limit to prevent infinite loops
  let safety = 1000;
  while (safety-- > 0) {
    path.push({ r: currR, c: currC });

    if (currR === start.r && currC === start.c) break;

    const key = `${currR},${currC}`;
    const decision = decisions[key];

    if (!decision) {
      console.warn(`No decision found for cell ${key}. Stopping backtrack.`);
      break;
    }

    if (decision.chosen === 'top') {
      currR -= 1;
    } else if (decision.chosen === 'left') {
      currC -= 1;
    } else {
      console.warn(`Invalid decision for cell ${key}:`, decision);
      break;
    }
  }

  // Highlight the path (reverse it to show forward flow, or show backtrack)
  // Let's show it from goal to start (backtrack) as it's often more intuitive for DP.
  for (const step of path) {
    try {
      updateAntDpCellVisual(step.r, step.c, null, { kind: 'path', isChosen: true, keepTrail: true });
      await sleep(100); // Animation speed for the green line
    } catch (e) {
      console.error('Error updating path visual:', e);
    }
  }
}



