// Knapsack State Manager
// Manages DP/Memo table state for Knapsack to display in a real-time table UI (similar to DijkstraStateManager)

import { getCurrentGameState, setCurrentGameState } from '../../../shared/game';

function createEmptyTable(rows, cols, fillValue = null) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fillValue));
}

// Streaming buffer to avoid calling setCurrentGameState on every single DP cell update
let stepBuffer = [];
let flushTimer = null;
let resetCounter = 0;

function getKnapsackDimsFromSceneOrLevel() {
  const state = getCurrentGameState();
  const level = state?.currentScene?.levelData || state?.levelData || null;
  const knapsackData = level?.knapsackData || null;

  const capacity = Number(knapsackData?.capacity ?? 0) || 0;
  const items = Array.isArray(knapsackData?.items) ? knapsackData.items : [];
  const n = items.length;

  return { n, capacity };
}

/**
 * Reset knapsack table state (clears table + last cell)
 */
export function resetKnapsackTableState() {
  const currentState = getCurrentGameState();
  resetCounter += 1;
  stepBuffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  setCurrentGameState({
    knapsackState: {
      ...currentState.knapsackState,
      dims: getKnapsackDimsFromSceneOrLevel(),
      steps: [],
      resetId: resetCounter,
      lastProduced: null,
      updatedAt: Date.now(),
    }
  });
}

/**
 * Ensure knapsack table exists in state with correct dimensions.
 * @returns {{table: any[][], n: number, capacity: number}}
 */
export function ensureKnapsackTableState() {
  const currentState = getCurrentGameState();
  const { n, capacity } = getKnapsackDimsFromSceneOrLevel();
  const rows = Math.max(1, n); // rows represent item indices 0..n-1
  const cols = Math.max(1, capacity + 1); // capacity 0..C

  // For step-playback UI we don't store the full table in game state (too many updates).
  // We only store dims + steps, and the React component applies steps progressively.
  setCurrentGameState({
    knapsackState: {
      ...currentState.knapsackState,
      dims: { n, capacity },
      steps: Array.isArray(currentState.knapsackState?.steps) ? currentState.knapsackState.steps : [],
      resetId: currentState.knapsackState?.resetId ?? resetCounter,
      lastProduced: currentState.knapsackState?.lastProduced ?? null,
      updatedAt: Date.now(),
    }
  });

  return { table: createEmptyTable(rows, cols, null), n, capacity };
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushSteps();
  }, 50); // flush at most every 50ms
}

function flushSteps() {
  if (stepBuffer.length === 0) return;
  const currentState = getCurrentGameState();
  const existingSteps = Array.isArray(currentState.knapsackState?.steps) ? currentState.knapsackState.steps : [];
  const merged = existingSteps.concat(stepBuffer);
  stepBuffer = [];

  // Cap steps to avoid unbounded memory growth
  const MAX_STEPS = 5000;
  const capped = merged.length > MAX_STEPS ? merged.slice(merged.length - MAX_STEPS) : merged;

  setCurrentGameState({
    knapsackState: {
      ...currentState.knapsackState,
      steps: capped,
      updatedAt: Date.now(),
    }
  });
}

export function flushKnapsackStepsNow() {
  // Force-flush any pending buffered steps immediately
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushSteps();
}

export async function waitForKnapsackPlaybackDone({ timeoutMs = 15000, pollMs = 50 } = {}) {
  const start = Date.now();
  // Ensure all produced steps are flushed before waiting on playback cursor
  try { flushKnapsackStepsNow(); } catch (e) { }

  while (Date.now() - start < timeoutMs) {
    try { flushKnapsackStepsNow(); } catch (e) { }
    const state = getCurrentGameState();
    const ks = state?.knapsackState;
    const total = Array.isArray(ks?.steps) ? ks.steps.length : 0;
    if (total <= 0) return true;

    const pb = ks?.playback;
    const cursor = Number(pb?.cursor ?? 0);
    // Don't treat "paused" as "done" when waiting for completion; Victory/visuals should still wait.
    if (cursor >= total) return true;
    await new Promise(r => setTimeout(r, pollMs));
  }
  return false;
}

/**
 * Update a single knapsack DP cell and store debug metadata for UI.
 * @param {number} i - item index (0-based)
 * @param {number} j - capacity (0..C)
 * @param {number} value - chosen value at (i,j)
 * @param {object} meta - optional meta {valWithout, valWith, chosen}
 */
export function updateKnapsackCell(i, j, value, meta = {}) {
  const iVal = Number(i);
  const jVal = Number(j);
  if (!Number.isFinite(iVal) || !Number.isFinite(jVal)) return;

  const currentState = getCurrentGameState();
  const { n, capacity } = ensureKnapsackTableState();
  const row = Math.max(0, Math.min(Math.max(1, n) - 1, iVal));
  const col = Math.max(0, Math.min(Math.max(1, capacity + 1) - 1, jVal));

  // Store as a step (buffered), UI will play it back at a controlled speed
  const step = {
    i: row,
    j: col,
    value: Number(value),
    valWithout: meta.valWithout,
    valWith: meta.valWith,
    chosen: meta.chosen,
    t: Date.now(),
  };
  stepBuffer.push(step);
  scheduleFlush();

  // Also keep the latest produced step for debug purposes
  setCurrentGameState({
    knapsackState: {
      ...currentState.knapsackState,
      lastProduced: step,
      updatedAt: Date.now(),
    }
  });
}


