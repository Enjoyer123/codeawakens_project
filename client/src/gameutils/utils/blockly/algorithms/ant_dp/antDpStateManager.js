// Ant DP State Manager
// Manages DP table steps for applied dynamic levels like Ant Sugar Path (grid DP).

import { getCurrentGameState, setCurrentGameState } from '../../../gameUtils';

let stepBuffer = [];
let flushTimer = null;
let resetCounter = 0;

function getAntDpDimsFromSceneOrLevel() {
  const state = getCurrentGameState();
  const level = state?.currentScene?.levelData || state?.levelData || null;
  const applied = level?.appliedData || level?.applied_data || null;

  const payload = applied?.payload || applied?.data || applied || null;
  const rows = Number(payload?.rows ?? payload?.n ?? 0) || 0;
  const cols = Number(payload?.cols ?? payload?.m ?? 0) || 0;
  const sugarGrid = Array.isArray(payload?.sugarGrid) ? payload.sugarGrid : null;

  // fallback from grid itself
  const r = rows || (Array.isArray(sugarGrid) ? sugarGrid.length : 0);
  const c = cols || (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0);

  return { rows: Math.max(1, r || 1), cols: Math.max(1, c || 1) };
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
  const existingSteps = Array.isArray(currentState.antDpState?.steps) ? currentState.antDpState.steps : [];
  const merged = existingSteps.concat(stepBuffer);
  stepBuffer = [];

  const MAX_STEPS = 8000;
  const capped = merged.length > MAX_STEPS ? merged.slice(merged.length - MAX_STEPS) : merged;

  setCurrentGameState({
    antDpState: {
      ...currentState.antDpState,
      steps: capped,
      updatedAt: Date.now(),
    }
  });
}

export function flushAntDpStepsNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushSteps();
}

export async function waitForAntDpPlaybackDone({ timeoutMs = 600000, pollMs = 50 } = {}) {
  const start = Date.now();
  try { flushAntDpStepsNow(); } catch (e) { }

  while (Date.now() - start < timeoutMs) {
    try { flushAntDpStepsNow(); } catch (e) { }
    const state = getCurrentGameState();
    const ds = state?.antDpState;
    const total = Array.isArray(ds?.steps) ? ds.steps.length : 0;
    if (total <= 0) return true;

    const pb = ds?.playback;
    const cursor = Number(pb?.cursor ?? 0);
    if (cursor >= total) return true;
    await new Promise(r => setTimeout(r, pollMs));
  }
  return false;
}

// Wait for Phaser visual queue (ant movement / queued highlights) to finish.
export async function waitForAntDpVisualIdle({ timeoutMs = 600000, pollMs = 40 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.__antDpVisual_api) {
        const api = globalThis.__antDpVisual_api;
        if (typeof api.waitForIdle === 'function') {
          const ok = await api.waitForIdle({ timeoutMs: Math.max(1000, timeoutMs - (Date.now() - start)), pollMs });
          return !!ok;
        }
        if (typeof api.getPending === 'function') {
          const pending = Number(api.getPending() || 0);
          if (pending <= 0) return true;
        }
      }
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, pollMs));
  }
  return false;
}

export function resetAntDpTableState() {
  const currentState = getCurrentGameState();
  resetCounter += 1;
  stepBuffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  setCurrentGameState({
    antDpState: {
      ...currentState.antDpState,
      dims: getAntDpDimsFromSceneOrLevel(),
      steps: [],
      resetId: resetCounter,
      lastProduced: null,
      updatedAt: Date.now(),
    }
  });
}

export function ensureAntDpTableState() {
  const currentState = getCurrentGameState();
  const dims = getAntDpDimsFromSceneOrLevel();
  setCurrentGameState({
    antDpState: {
      ...currentState.antDpState,
      dims,
      steps: Array.isArray(currentState.antDpState?.steps) ? currentState.antDpState.steps : [],
      resetId: currentState.antDpState?.resetId ?? resetCounter,
      lastProduced: currentState.antDpState?.lastProduced ?? null,
      updatedAt: Date.now(),
    }
  });
  return dims;
}

/**
 * Update a DP cell step.
 * i: row (0..rows-1), j: col (0..cols-1)
 * value: number (dp value) OR null (highlight/visit only)
 */
export function updateAntDpCellVisual(i, j, value, meta = {}) {
  const iVal = Number(i);
  const jVal = Number(j);
  if (!Number.isFinite(iVal) || !Number.isFinite(jVal)) return;

  const { rows, cols } = ensureAntDpTableState();
  const row = Math.max(0, Math.min(rows - 1, iVal));
  const col = Math.max(0, Math.min(cols - 1, jVal));

  const step = {
    i: row,
    j: col,
    value: (value === null || typeof value === 'undefined') ? null : Number(value),
    meta,
    t: Date.now(),
  };

  // If the Phaser Ant board is present, update it immediately (main visual, like N-Queen).
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__antDpVisual_api && typeof globalThis.__antDpVisual_api.onUpdate === 'function') {
      globalThis.__antDpVisual_api.onUpdate(row, col, step.value, meta);
    }
  } catch (e) { /* ignore */ }

  stepBuffer.push(step);
  scheduleFlush();

  const currentState = getCurrentGameState();
  setCurrentGameState({
    antDpState: {
      ...currentState.antDpState,
      lastProduced: step,
      updatedAt: Date.now(),
    }
  });
}


