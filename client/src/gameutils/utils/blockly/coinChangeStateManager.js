// Coin Change State Manager
// Manages a (index, amount) table as step events for Coin Change algorithms (DP/backtrack).

import { getCurrentGameState, setCurrentGameState } from '../gameUtils';

let stepBuffer = [];
let flushTimer = null;
let resetCounter = 0;

function getCoinChangeDimsFromSceneOrLevel() {
  const state = getCurrentGameState();
  const level = state?.currentScene?.levelData || state?.levelData || null;
  const coinChangeData = level?.coinChangeData || null;

  const amount = Number(coinChangeData?.monster_power ?? 0) || 0;
  const coins = Array.isArray(coinChangeData?.warriors) ? coinChangeData.warriors : [];
  const n = coins.length;

  return { n, amount };
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
  const existingSteps = Array.isArray(currentState.coinChangeState?.steps) ? currentState.coinChangeState.steps : [];
  const merged = existingSteps.concat(stepBuffer);
  stepBuffer = [];

  const MAX_STEPS = 6000;
  const capped = merged.length > MAX_STEPS ? merged.slice(merged.length - MAX_STEPS) : merged;

  setCurrentGameState({
    coinChangeState: {
      ...currentState.coinChangeState,
      steps: capped,
      updatedAt: Date.now(),
    }
  });
}

export function flushCoinChangeStepsNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushSteps();
}

export async function waitForCoinChangePlaybackDone({ timeoutMs = 15000, pollMs = 50 } = {}) {
  const start = Date.now();
  try { flushCoinChangeStepsNow(); } catch (e) { }

  while (Date.now() - start < timeoutMs) {
    try { flushCoinChangeStepsNow(); } catch (e) { }
    const state = getCurrentGameState();
    const cs = state?.coinChangeState;
    const total = Array.isArray(cs?.steps) ? cs.steps.length : 0;
    if (total <= 0) return true;

    const pb = cs?.playback;
    const cursor = Number(pb?.cursor ?? 0);
    // Don't treat "paused" as "done" when waiting for completion; Victory/visuals should still wait.
    if (cursor >= total) return true;
    await new Promise(r => setTimeout(r, pollMs));
  }
  return false;
}

export function resetCoinChangeTableState() {
  const currentState = getCurrentGameState();
  resetCounter += 1;
  stepBuffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  setCurrentGameState({
    coinChangeState: {
      ...currentState.coinChangeState,
      dims: getCoinChangeDimsFromSceneOrLevel(),
      steps: [],
      resetId: resetCounter,
      lastProduced: null,
      updatedAt: Date.now(),
    }
  });
}

export function ensureCoinChangeTableState() {
  const currentState = getCurrentGameState();
  const dims = getCoinChangeDimsFromSceneOrLevel();
  setCurrentGameState({
    coinChangeState: {
      ...currentState.coinChangeState,
      dims,
      steps: Array.isArray(currentState.coinChangeState?.steps) ? currentState.coinChangeState.steps : [],
      resetId: currentState.coinChangeState?.resetId ?? resetCounter,
      lastProduced: currentState.coinChangeState?.lastProduced ?? null,
      updatedAt: Date.now(),
    }
  });
  return dims;
}

/**
 * Update a coin change table cell step.
 * i: coin index (0..n-1)
 * j: amount (0..monster_power)
 * value: number (min coins) OR null (visit/highlight only)
 */
export function updateCoinChangeCellVisual(i, j, value, meta = {}) {
  const iVal = Number(i);
  const jVal = Number(j);
  if (!Number.isFinite(iVal) || !Number.isFinite(jVal)) return;

  const { n, amount } = ensureCoinChangeTableState();
  const row = Math.max(0, Math.min(Math.max(1, n) - 1, iVal));
  const col = Math.max(0, Math.min(Math.max(1, amount + 1) - 1, jVal));

  const step = {
    i: row,
    j: col,
    value: (value === null || typeof value === 'undefined') ? null : Number(value),
    meta,
    t: Date.now(),
  };

  stepBuffer.push(step);
  scheduleFlush();

  const currentState = getCurrentGameState();
  setCurrentGameState({
    coinChangeState: {
      ...currentState.coinChangeState,
      lastProduced: step,
      updatedAt: Date.now(),
    }
  });
}


