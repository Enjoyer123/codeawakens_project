// Subset Sum State Manager
// Manages DP table steps for Subset Sum to display in a real-time, step-by-step table UI.

import { getCurrentGameState, setCurrentGameState } from '../../../gameUtils';

let stepBuffer = [];
let flushTimer = null;
let resetCounter = 0;

function getSubsetSumDimsFromSceneOrLevel() {
  const state = getCurrentGameState();
  const level = state?.currentScene?.levelData || state?.levelData || null;
  const subsetSumData = level?.subsetSumData || null;

  const targetSum = Number(subsetSumData?.target_sum ?? 0) || 0;
  const warriors = Array.isArray(subsetSumData?.warriors) ? subsetSumData.warriors : [];
  const n = warriors.length;

  return { n, targetSum };
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushSteps();
  }, 50);
}

function flushSteps() {
  if (stepBuffer.length === 0) return;
  const currentState = getCurrentGameState();
  const existingSteps = Array.isArray(currentState.subsetSumState?.steps) ? currentState.subsetSumState.steps : [];
  const merged = existingSteps.concat(stepBuffer);
  stepBuffer = [];

  const MAX_STEPS = 6000;
  const capped = merged.length > MAX_STEPS ? merged.slice(merged.length - MAX_STEPS) : merged;

  setCurrentGameState({
    subsetSumState: {
      ...currentState.subsetSumState,
      steps: capped,
      updatedAt: Date.now(),
    }
  });
}

export function flushSubsetSumStepsNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushSteps();
}

export async function waitForSubsetSumPlaybackDone({ timeoutMs = 15000, pollMs = 50 } = {}) {
  const start = Date.now();
  try { flushSubsetSumStepsNow(); } catch (e) { }

  while (Date.now() - start < timeoutMs) {
    try { flushSubsetSumStepsNow(); } catch (e) { }
    const state = getCurrentGameState();
    const ss = state?.subsetSumState;
    const total = Array.isArray(ss?.steps) ? ss.steps.length : 0;
    if (total <= 0) return true;

    const pb = ss?.playback;
    const cursor = Number(pb?.cursor ?? 0);
    // Don't treat "paused" as "done" when waiting for completion; Victory/visuals should still wait.
    if (cursor >= total) return true;
    await new Promise(r => setTimeout(r, pollMs));
  }
  return false;
}

export function resetSubsetSumTableState() {
  const currentState = getCurrentGameState();
  resetCounter += 1;
  stepBuffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  setCurrentGameState({
    subsetSumState: {
      ...currentState.subsetSumState,
      dims: getSubsetSumDimsFromSceneOrLevel(),
      steps: [],
      resetId: resetCounter,
      lastProduced: null,
      updatedAt: Date.now(),
    }
  });
}

export function ensureSubsetSumTableState() {
  const currentState = getCurrentGameState();
  const dims = getSubsetSumDimsFromSceneOrLevel();
  setCurrentGameState({
    subsetSumState: {
      ...currentState.subsetSumState,
      dims,
      steps: Array.isArray(currentState.subsetSumState?.steps) ? currentState.subsetSumState.steps : [],
      resetId: currentState.subsetSumState?.resetId ?? resetCounter,
      lastProduced: currentState.subsetSumState?.lastProduced ?? null,
      updatedAt: Date.now(),
    }
  });
  return dims;
}

/**
 * Update a subset sum cell step.
 * We interpret (i, j) as:
 * - i: item index (0-based, in warriors array)
 * - j: sum/remain index (0..targetSum)
 * - value: boolean (reachable / true)
 */
export function updateSubsetSumCellVisual(i, j, value, meta = {}) {
  const iVal = Number(i);
  const jVal = Number(j);
  if (!Number.isFinite(iVal) || !Number.isFinite(jVal)) return;

  const { n, targetSum } = ensureSubsetSumTableState();
  const row = Math.max(0, Math.min(Math.max(1, n) - 1, iVal));
  const col = Math.max(0, Math.min(Math.max(1, targetSum + 1) - 1, jVal));

  const step = {
    i: row,
    j: col,
    // Allow null to mean "visit/highlight only" without changing the stored cell value in UI
    value: (value === null || typeof value === 'undefined') ? null : !!value,
    meta,
    t: Date.now(),
  };
  stepBuffer.push(step);
  scheduleFlush();

  const currentState = getCurrentGameState();
  setCurrentGameState({
    subsetSumState: {
      ...currentState.subsetSumState,
      lastProduced: step,
      updatedAt: Date.now(),
    }
  });
}


