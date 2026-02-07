/**
 * Setup Applied Dynamic (Ant) DP board in Phaser (grid with sugar + dp value)
 * This is the "main visual" for the applied dynamic Ant level, similar to N-Queen.
 * @param {Phaser.Scene} scene
 */
// Ant DP algorithm visualization setup
import Phaser from "phaser";

// Function to setup Ant DP problem display
export function setupAntDp(scene) {
  try {
    const level = scene?.levelData;
    const applied = level?.appliedData || null;
    if (!applied) {
      try { console.warn('setupAntDp: no appliedData on levelData', { hasLevel: !!level, levelId: level?.level_id, keys: level ? Object.keys(level) : null }); } catch (e) { }
      return;
    }

    const appliedType = String(applied.type || '').toUpperCase();
    const isAnt = appliedType === 'APPLIED_DYNAMIC_ANT'
      || appliedType === 'ANT_SUGAR_PATH'
      || appliedType === 'APPLIED_ANT'
      || appliedType.includes('ANT');
    if (!isAnt) {
      try { console.warn('setupAntDp: appliedData.type not ANT', { appliedType, applied }); } catch (e) { }
      return;
    }

    const payload = applied.payload || {};
    const sugarGrid = Array.isArray(payload.sugarGrid) ? payload.sugarGrid : [];
    const rows = Number(payload.rows ?? sugarGrid.length ?? 0) || (Array.isArray(sugarGrid) ? sugarGrid.length : 0) || 1;
    const cols = Number(payload.cols ?? (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) ?? 0) || (Array.isArray(sugarGrid?.[0]) ? sugarGrid[0].length : 0) || 1;
    const start = payload.start || { r: 0, c: 0 };
    const goal = payload.goal || { r: rows - 1, c: cols - 1 };

    // Clean up previous ant dp visuals if reloading
    if (scene.antDp && scene.antDp.destroy) {
      try { scene.antDp.destroy(); } catch (e) { }
    }

    // Match N-Queen look & placement (fixed cell size like a board)
    const cellSize = 60;
    const boardWidth = cols * cellSize;
    const boardHeight = rows * cellSize;

    // Same anchor as N-Queen
    const boardStartX = 400;
    const boardStartY = 300;
    const labelOffset = 25;

    const boardGraphics = scene.add.graphics();
    boardGraphics.setDepth(5);

    // Visible debug badge (helps confirm the board is active even if the grid is offscreen or background is dark)
    const debugBadge = scene.add.text(12, 10, `ANT DP (${rows}x${cols})`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#111827',
      padding: { x: 8, y: 6 },
      stroke: '#000000',
      strokeThickness: 3,
    });
    debugBadge.setDepth(10000);
    debugBadge.setScrollFactor(0);

    // No panel / alternating background â€” keep it identical to N-Queen grid style

    // Grid lines
    // Use white lines so the board is visible on dark backgrounds too.
    boardGraphics.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i <= cols; i++) {
      const x = boardStartX - boardWidth / 2 + (i * cellSize);
      const y1 = boardStartY - boardHeight / 2;
      const y2 = boardStartY + boardHeight / 2;
      boardGraphics.moveTo(x, y1);
      boardGraphics.lineTo(x, y2);
    }
    for (let i = 0; i <= rows; i++) {
      const y = boardStartY - boardHeight / 2 + (i * cellSize);
      const x1 = boardStartX - boardWidth / 2;
      const x2 = boardStartX + boardWidth / 2;
      boardGraphics.moveTo(x1, y);
      boardGraphics.lineTo(x2, y);
    }
    boardGraphics.strokePath();

    const labels = [];
    // Column labels
    for (let c = 0; c < cols; c++) {
      const x = boardStartX - boardWidth / 2 + (c * cellSize) + cellSize / 2;
      const y = boardStartY - boardHeight / 2 - labelOffset;
      const t = scene.add.text(x, y, c.toString(), { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
      t.setOrigin(0.5, 0.5);
      t.setDepth(6);
      labels.push(t);
    }
    // Row labels
    for (let r = 0; r < rows; r++) {
      const x = boardStartX - boardWidth / 2 - labelOffset;
      const y = boardStartY - boardHeight / 2 + (r * cellSize) + cellSize / 2;
      const t = scene.add.text(x, y, r.toString(), { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
      t.setOrigin(0.5, 0.5);
      t.setDepth(6);
      labels.push(t);
    }

    const overlays = {}; // key -> graphics
    const dpTexts = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    const sugarTexts = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

    const cellBounds = (r, c) => {
      const x1 = boardStartX - boardWidth / 2 + (c * cellSize);
      const y1 = boardStartY - boardHeight / 2 + (r * cellSize);
      const cx = x1 + cellSize / 2;
      const cy = y1 + cellSize / 2;
      return { x1, y1, cx, cy };
    };

    // Color Start/Goal cells (instead of showing S/G text)
    const startGoalBg = scene.add.graphics();
    startGoalBg.setDepth(4.5); // behind grid lines, above background
    try {
      const sr = Math.max(0, Math.min(rows - 1, Number(start?.r ?? 0)));
      const sc = Math.max(0, Math.min(cols - 1, Number(start?.c ?? 0)));
      const sB = cellBounds(sr, sc);
      startGoalBg.fillStyle(0x10B981, 0.35); // green
      startGoalBg.fillRect(sB.x1 + 1, sB.y1 + 1, cellSize - 2, cellSize - 2);
    } catch (e) { }
    try {
      const gr = Math.max(0, Math.min(rows - 1, Number(goal?.r ?? (rows - 1))));
      const gc = Math.max(0, Math.min(cols - 1, Number(goal?.c ?? (cols - 1))));
      const gB = cellBounds(gr, gc);
      startGoalBg.fillStyle(0xEF4444, 0.35); // red
      startGoalBg.fillRect(gB.x1 + 1, gB.y1 + 1, cellSize - 2, cellSize - 2);
    } catch (e) { }

    // Create per-cell texts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const b = cellBounds(r, c);
        const sugar = (sugarGrid?.[r] && typeof sugarGrid[r][c] !== 'undefined') ? sugarGrid[r][c] : null;

        const st = scene.add.text(
          b.cx,
          b.cy - 12,
          sugar === null ? '' : `s:${sugar}`,
          { fontSize: '12px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }
        );
        st.setOrigin(0.5, 0.5);
        st.setDepth(6);
        sugarTexts[r][c] = st;

        const dt = scene.add.text(b.cx, b.cy + 10, 'Â·', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
        dt.setOrigin(0.5, 0.5);
        dt.setDepth(6);
        dpTexts[r][c] = dt;
      }
    }

    // Ant placeholder (square) at Start cell (future: swap to pixel ant sprite)
    const clampCell = (r, c) => ({
      r: Math.max(0, Math.min(rows - 1, Number(r))),
      c: Math.max(0, Math.min(cols - 1, Number(c))),
    });
    const startCell = clampCell(start?.r ?? 0, start?.c ?? 0);
    const startB = cellBounds(startCell.r, startCell.c);
    // Smaller than the cell so it reads as an "ant" placeholder (future sprite)
    const antSize = Math.max(14, Math.floor(cellSize * 0.42));
    const antRect = scene.add.rectangle(startB.cx, startB.cy, antSize, antSize, 0x111827, 0.95);
    antRect.setDepth(9);
    antRect.setStrokeStyle(2, 0xFBBF24, 1); // yellow outline

    // Sequential animation queue so visuals can be awaited before Victory.
    let pendingAnimations = 0;
    let queue = Promise.resolve();
    const enqueue = (fn) => {
      queue = queue.then(() => fn()).catch(() => { /* swallow */ });
      return queue;
    };

    const tweenMoveAntToCell = (r, c, durationMs = 180) => {
      return new Promise((resolve) => {
        try {
          const cc = clampCell(r, c);
          const b = cellBounds(cc.r, cc.c);
          pendingAnimations += 1;
          scene.tweens.add({
            targets: antRect,
            x: b.cx,
            y: b.cy,
            duration: Math.max(0, Number(durationMs) || 0),
            ease: 'Sine.easeInOut',
            onComplete: () => {
              pendingAnimations = Math.max(0, pendingAnimations - 1);
              resolve(true);
            }
          });
        } catch (e) {
          pendingAnimations = Math.max(0, pendingAnimations - 1);
          resolve(false);
        }
      });
    };

    const moveAntToCell = (r, c) => {
      try {
        const cc = clampCell(r, c);
        const b = cellBounds(cc.r, cc.c);
        antRect.setPosition(b.cx, b.cy);
      } catch (e) { /* ignore */ }
    };

    const setCellOverlay = (r, c, color = 0xfbbf24, alpha = 0.35) => {
      const key = `${r}_${c}`;
      if (!overlays[key]) {
        overlays[key] = scene.add.graphics();
        overlays[key].setDepth(8);
      }
      const g = overlays[key];
      const b = cellBounds(r, c);
      g.clear();
      g.fillStyle(color, alpha);
      g.fillRect(b.x1 + 1, b.y1 + 1, cellSize - 2, cellSize - 2);
    };

    const clearAllOverlays = () => {
      Object.keys(overlays).forEach(k => {
        try { overlays[k].destroy(); } catch (e) { }
        delete overlays[k];
      });
    };

    scene.antDp = {
      rows,
      cols,
      cellSize,
      boardStartX,
      boardStartY,
      boardWidth,
      boardHeight,
      startGoalBg,
      ant: {
        rect: antRect,
        moveToCell: moveAntToCell,
        tweenToCell: tweenMoveAntToCell
      },
      board: boardGraphics,
      debugBadge,
      labels,
      overlays,
      dpTexts,
      sugarTexts,
      setCellOverlay,
      clearAllOverlays,
      getPendingAnimations: () => pendingAnimations,
      waitForIdle: async ({ timeoutMs = 600000, pollMs = 40 } = {}) => {
        const start = Date.now();
        // Wait for queue chain and pending tweens
        while (Date.now() - start < timeoutMs) {
          try { await Promise.race([queue, new Promise(r => setTimeout(r, pollMs))]); } catch (e) { }
          if ((pendingAnimations || 0) <= 0) return true;
          await new Promise(r => setTimeout(r, pollMs));
        }
        return false;
      },
      destroy: () => {
        try { clearAllOverlays(); } catch (e) { }
        try { debugBadge.destroy(); } catch (e) { }
        try { startGoalBg.destroy(); } catch (e) { }
        try { antRect.destroy(); } catch (e) { }
        try { boardGraphics.destroy(); } catch (e) { }
        try { labels.forEach(t => t && t.destroy && t.destroy()); } catch (e) { }
        try {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              try { if (dpTexts[r][c]) dpTexts[r][c].destroy(); } catch (e) { }
              try { if (sugarTexts[r][c]) sugarTexts[r][c].destroy(); } catch (e) { }
            }
          }
        } catch (e) { }
      }
    };

    // Expose visual API to runtime (useCodeExecution / state manager)
    try {
      globalThis.__antDpVisual_api = {
        onUpdate: (i, j, value, meta) => {
          // Queue everything so we can await completion before Victory.
          return enqueue(async () => {
            try {
              const rr = Math.max(0, Math.min(rows - 1, Number(i)));
              const cc = Math.max(0, Math.min(cols - 1, Number(j)));
              const kind = String(meta?.kind ?? meta?.type ?? '').toLowerCase();
              const isChosen = !!meta?.chosen || kind === 'chosen' || kind === 'choose' || kind === 'path' || !!meta?.moveAnt;
              const keepTrail = !!meta?.keepTrail || kind === 'path' || kind === 'chosen' || kind === 'choose';

              // Colors: considered = yellow, chosen/path = green
              const color = isChosen ? 0x10B981 : 0xFBBF24;
              const alpha = (kind === 'path' || kind === 'chosen') ? 0.8 : (isChosen ? 0.4 : 0.35);

              // Highlight cell
              if (!keepTrail) {
                try { scene.antDp.clearAllOverlays(); } catch (e) { }
              }
              setCellOverlay(rr, cc, color, alpha);

              // Update dp text if value is concrete
              if (value !== null && typeof value !== 'undefined' && scene.antDp.dpTexts?.[rr]?.[cc]) {
                scene.antDp.dpTexts[rr][cc].setText(String(value));
              }

              // Optional: animate ant movement
              if (meta?.moveAnt) {
                const dur = Number(meta?.moveMs ?? meta?.durationMs ?? 180);
                await tweenMoveAntToCell(rr, cc, dur);
              }
            } catch (e) { /* ignore */ }
          });
        },
        moveAnt: (r, c, opts = {}) => {
          try {
            return globalThis.__antDpVisual_api.onUpdate(r, c, null, { moveAnt: true, kind: 'path', keepTrail: true, ...(opts || {}) });
          } catch (e) { }
        },
        getPending: () => {
          try { return scene?.antDp?.getPendingAnimations?.() ?? 0; } catch (e) { return 0; }
        },
        waitForIdle: (opts = {}) => {
          try { return scene?.antDp?.waitForIdle?.(opts) ?? Promise.resolve(true); } catch (e) { return Promise.resolve(true); }
        },
        clear: () => { try { clearAllOverlays(); } catch (e) { } }
      };
    } catch (e) {
      console.warn('Could not register antDp visual api:', e);
    }

    // Cleanup on scene shutdown
    try {
      scene.events.once('shutdown', () => { try { delete globalThis.__antDpVisual_api; } catch (e) { } });
    } catch (e) { }

    console.log('âœ… setupAntDp complete:', { rows, cols, cellSize });
  } catch (e) {
    console.warn('setupAntDp error:', e);
  }
}

