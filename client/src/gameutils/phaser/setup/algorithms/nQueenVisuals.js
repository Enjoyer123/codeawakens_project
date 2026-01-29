/**
 * Setup N-Queen board and queens
 * @param {Phaser.Scene} scene - Phaser scene
 */
import Phaser from "phaser";

// N-Queen algorithm visualization setup
// Function to setup N-Queen problem display
export function setupNQueen(scene) {
  console.log('ðŸ” setupNQueen called');
  console.log('ðŸ” scene.levelData:', scene.levelData);
  console.log('ðŸ” scene.levelData.nqueenData:', scene.levelData?.nqueenData);

  if (!scene.levelData || !scene.levelData.nqueenData) {
    console.log('âš ï¸ No nqueenData found, skipping setup');
    return;
  }

  const nqueenData = scene.levelData.nqueenData;
  console.log('âœ… N-Queen data found:', nqueenData);

  const n = nqueenData.n || 4; // Board size (nÃ—n)

  scene.nqueen = {
    n: n,
    board: null,
    queens: [],
    cellSize: 60, // Size of each cell in pixels
    boardStartX: 400, // Center of the board
    boardStartY: 300, // Center of the board
    labels: []
  };

  const cellSize = scene.nqueen.cellSize;
  const boardStartX = scene.nqueen.boardStartX;
  const boardStartY = scene.nqueen.boardStartY;
  const boardWidth = n * cellSize;
  const boardHeight = n * cellSize;
  const labelOffset = 25; // Offset for row/column labels

  // Create board graphics container
  const boardGraphics = scene.add.graphics();
  boardGraphics.setDepth(5);

  // Draw grid lines
  boardGraphics.lineStyle(2, 0x000000, 1);

  // Draw vertical lines
  for (let i = 0; i <= n; i++) {
    const x = boardStartX - boardWidth / 2 + (i * cellSize);
    const y1 = boardStartY - boardHeight / 2;
    const y2 = boardStartY + boardHeight / 2;
    boardGraphics.moveTo(x, y1);
    boardGraphics.lineTo(x, y2);
  }

  // Draw horizontal lines
  for (let i = 0; i <= n; i++) {
    const y = boardStartY - boardHeight / 2 + (i * cellSize);
    const x1 = boardStartX - boardWidth / 2;
    const x2 = boardStartX + boardWidth / 2;
    boardGraphics.moveTo(x1, y);
    boardGraphics.lineTo(x2, y);
  }

  boardGraphics.strokePath();

  // Draw column labels (0, 1, 2, 3, ...)
  for (let col = 0; col < n; col++) {
    const x = boardStartX - boardWidth / 2 + (col * cellSize) + cellSize / 2;
    const y = boardStartY - boardHeight / 2 - labelOffset;

    const label = scene.add.text(x, y, col.toString(), {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(6);

    scene.nqueen.labels.push(label);
  }

  // Draw row labels (0, 1, 2, 3, ...)
  for (let row = 0; row < n; row++) {
    const x = boardStartX - boardWidth / 2 - labelOffset;
    const y = boardStartY - boardHeight / 2 + (row * cellSize) + cellSize / 2;

    const label = scene.add.text(x, y, row.toString(), {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(6);

    scene.nqueen.labels.push(label);
  }

  scene.nqueen.board = boardGraphics;

  // Initialize overlays Map for highlights and previews
  scene.nqueen.overlays = {}; // key: `${row}_${col}` -> { rectGraphics, previewGraphics }

  // Helper to compute cell bounds and center
  const cellBounds = (row, col) => {
    const x1 = boardStartX - boardWidth / 2 + (col * cellSize);
    const y1 = boardStartY - boardHeight / 2 + (row * cellSize);
    const x2 = x1 + cellSize;
    const y2 = y1 + cellSize;
    const cx = x1 + cellSize / 2;
    const cy = y1 + cellSize / 2;
    return { x1, y1, x2, y2, cx, cy };
  };

  // Create or update overlay for a cell (color: hex, alpha: number)
  scene.nqueen.setCellOverlay = (row, col, color = 0xffff00, alpha = 0.35) => {
    const key = `${row}_${col}`;
    try {
      if (!scene.nqueen.overlays[key]) scene.nqueen.overlays[key] = {};

      // Create rectangle if not exists
      if (!scene.nqueen.overlays[key].rectGraphics) {
        const g = scene.add.graphics();
        g.setDepth(8);
        scene.nqueen.overlays[key].rectGraphics = g;
      }
      const g = scene.nqueen.overlays[key].rectGraphics;
      const b = cellBounds(row, col);
      g.clear();
      g.fillStyle(color, alpha);
      g.fillRect(b.x1 + 1, b.y1 + 1, cellSize - 2, cellSize - 2);

    } catch (e) {
      console.warn('Error setting cell overlay', e);
    }
  };

  scene.nqueen.clearCellOverlay = (row, col) => {
    const key = `${row}_${col}`;
    const entry = scene.nqueen.overlays[key];
    if (entry && entry.rectGraphics) {
      try { entry.rectGraphics.destroy(); } catch (e) { }
      delete scene.nqueen.overlays[key];
    }
  };

  scene.nqueen.clearAllOverlays = () => {
    Object.keys(scene.nqueen.overlays).forEach(k => {
      const e = scene.nqueen.overlays[k];
      try { if (e.rectGraphics) e.rectGraphics.destroy(); } catch (er) { }
    });
    scene.nqueen.overlays = {};
  };

  // Visual API exposed to sandboxed solver/runtime
  const registerVisualApi = () => {
    // Ensure configurable flash duration for placed cell (ms)
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_placeFlashDuration === 'undefined') globalThis.__nqueenVisual_placeFlashDuration = 140; } catch (e) { }
    // Default: do NOT accumulate overlays (keeps board clean). We still flash rejected cells briefly.
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_accumulate === 'undefined') globalThis.__nqueenVisual_accumulate = false; } catch (e) { }
    // If not accumulating, keep rejected cell visible for a bit (ms)
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_rejectFlashMs === 'undefined') globalThis.__nqueenVisual_rejectFlashMs = 650; } catch (e) { }
    // Optional: keep rejected cells persistent (debugging). Default false.
    try { if (typeof globalThis !== 'undefined' && typeof globalThis.__nqueenVisual_persistReject === 'undefined') globalThis.__nqueenVisual_persistReject = false; } catch (e) { }

    // Attach helpers to globalThis so injected user code can call them via capture shim
    try {
      globalThis.__nqueenVisual_api = {
        onConsider: (r, c, canPlace) => {
          try {
            console.log('ðŸ” [nqueenVisual] onConsider called:', { r, c, canPlace });
            // Be tolerant: solver/runtime may pass numeric strings
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;

            // Mark that we have real-time consider events (used to avoid "replay from output" overwriting the run)
            try { if (typeof globalThis !== 'undefined') globalThis.__nqueenVisual_seenConsider = true; } catch (e) { }

            const accumulate = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_accumulate);
            const persistReject = !!(typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_persistReject);
            // Clear previous overlays ONLY for "focus mode" and only on safe/thinking.
            // If unsafe (red), keep it visible (flash) even in focus mode.
            try {
              if (!accumulate && canPlace && scene.nqueen && typeof scene.nqueen.clearAllOverlays === 'function') {
                scene.nqueen.clearAllOverlays();
              }
            } catch (e) { }

            // Visual Logic:
            // canPlace = true  -> "Thinking" / "Safe-so-far" -> ORANGE (0xFFA500)
            // canPlace = false -> "Unsafe" / "Rejected"      -> RED (0xFF0000)

            const color = canPlace ? 0xFFA500 : 0xFF0000;
            const alpha = 0.7; // High visibility

            scene.nqueen.setCellOverlay(rr, cc, color, alpha);

            // Auto-clear rejected cells after a short delay so the board doesn't stay fully red.
            try {
              if (!persistReject && !canPlace) {
                const ms = (typeof globalThis !== 'undefined' && Number.isFinite(Number(globalThis.__nqueenVisual_rejectFlashMs)))
                  ? Number(globalThis.__nqueenVisual_rejectFlashMs)
                  : 650;
                setTimeout(() => {
                  try { scene.nqueen.clearCellOverlay(rr, cc); } catch (e) { }
                }, Math.max(0, ms));
              }
            } catch (e) { }

          } catch (e) { console.warn('nqueenVisual onConsider error', e); }
        },

        onPlace: (r, c) => {
          try {
            console.log('ðŸ” [nqueenVisual] onPlace called:', { r, c });
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;

            // Placement -> GREEN flash before Queen
            const color = 0x00FF00;
            const alpha = 0.8;

            try { scene.nqueen.setCellOverlay(rr, cc, color, alpha); } catch (e) { }
            try {
              setTimeout(() => {
                try { scene.nqueen.clearCellOverlay(rr, cc); } catch (e) { }
                try { drawQueenOnBoard(scene, rr, cc); } catch (e) { }
              }, Math.max(0, (globalThis.__nqueenVisual_placeFlashDuration || 140)));
            } catch (e) { /* swallow */ }
          } catch (e) { console.warn('nqueenVisual onPlace error', e); }
        },
        onRemove: (r, c) => {
          try {
            console.log('ðŸ” [nqueenVisual] onRemove called:', { r, c });
            const rr = typeof r === 'number' ? r : Number(r);
            const cc = typeof c === 'number' ? c : Number(c);
            if (!Number.isFinite(rr) || !Number.isFinite(cc)) return;
            // Remove queen graphics if present
            const qIndex = scene.nqueen.queens.findIndex(q => q.row === rr && q.col === cc);
            if (qIndex !== -1) {
              try { scene.nqueen.queens[qIndex].graphics.destroy(); } catch (e) { }
              scene.nqueen.queens.splice(qIndex, 1);
            }
            // Add a transient red flash to indicate removal
            const b = cellBounds(rr, cc);
            const flash = scene.add.rectangle(b.cx, b.cy, cellSize - 6, cellSize - 6, 0xff0000, 0.5);
            flash.setDepth(9);
            scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => { try { flash.destroy(); } catch (e) { } } });
          } catch (e) { console.warn('nqueenVisual onRemove error', e); }
        },
        clear: () => { try { scene.nqueen.clearAllOverlays(); } catch (e) { } }
      };
    } catch (e) {
      console.warn('Could not register nqueen visual api:', e);
    }

    // Cleanup on scene shutdown
    try {
      scene.events.once('shutdown', () => { try { delete globalThis.__nqueenVisual_api; } catch (e) { } });
    } catch (e) { }
  };

  registerVisualApi();

  console.log(`Setup N-Queen: ${n}Ã—${n} board`);
}

