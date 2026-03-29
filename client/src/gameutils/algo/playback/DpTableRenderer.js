// Reusable DP Table Renderer for Phaser Game
// Handles Drawing 1D and 2D Grids, Highlighting Cells, and Updating Values
// Functional factory — ใช้แทน class DpTableRenderer

/**
 * สร้าง DP Table Renderer instance
 * @param {Phaser.Scene} scene
 * @param {number} startX
 * @param {number} startY
 * @param {number} numRows
 * @param {number} numCols
 * @param {number} [cellW=50]
 * @param {number} [cellH=40]
 * @returns {object} public API
 */
export function createDpTableRenderer(scene, startX, startY, numRows, numCols, cellW = 50, cellH = 40) {
    // ── Private state ────────────────────────────────────────────────────────
    const cells     = []; // cells[r][c] = { bg, text, cx, cy, val }
    let   pointer   = null;

    // ── Init ─────────────────────────────────────────────────────────────────
    function _createTable() {
        for (let r = 0; r < numRows; r++) {
            cells[r] = [];
            for (let c = 0; c < numCols; c++) {
                const cx = startX + c * cellW;
                const cy = startY + r * cellH;

                const bg = scene.add.rectangle(cx, cy, cellW, cellH, 0x111111, 0.9)
                    .setStrokeStyle(1, 0x555555).setDepth(10);

                const text = scene.add.text(cx, cy, '', {
                    fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold',
                }).setOrigin(0.5).setDepth(11);

                cells[r][c] = { bg, text, cx, cy, val: null };
            }
        }
    }

    function _createPointer() {
        pointer = scene.add.rectangle(0, 0, cellW + 4, cellH + 4, 0x000000, 0)
            .setStrokeStyle(3, 0xFFFF00).setDepth(15).setVisible(false);
    }

    _createTable();
    _createPointer();

    // ── Helpers ───────────────────────────────────────────────────────────────
    function isValid(r, c) {
        return r >= 0 && r < numRows && c >= 0 && c < numCols;
    }

    // ── Labeling ──────────────────────────────────────────────────────────────
    function setColHeaders(texts, offsetY = -30) {
        for (let c = 0; c < Math.min(texts.length, numCols); c++) {
            scene.add.text(startX + c * cellW, startY + offsetY, texts[c], {
                fontSize: '16px', color: '#DDDDDD', fontStyle: 'bold',
            }).setOrigin(0.5).setDepth(11);
        }
    }

    function setRowHeaders(texts, offsetX = -60) {
        for (let r = 0; r < Math.min(texts.length, numRows); r++) {
            scene.add.text(startX + offsetX, startY + r * cellH, texts[r], {
                fontSize: '14px', color: '#FFFFFF', fontStyle: 'bold',
            }).setOrigin(0.5).setDepth(11);
        }
    }

    // ── Base-case init ────────────────────────────────────────────────────────
    function initCell(r, c, val, color = '#00FF00', textDisplay = null) {
        if (!isValid(r, c)) return;
        const cell = cells[r][c];
        cell.val = val;
        cell.text.setText(textDisplay !== null ? textDisplay.toString() : val.toString());
        cell.text.setColor(color);
    }

    function initRow(r, val, color = '#00FF00', textDisplay = null) {
        for (let c = 0; c < numCols; c++) initCell(r, c, val, color, textDisplay);
    }

    function initCol(c, val, color = '#00FF00', textDisplay = null) {
        for (let r = 0; r < numRows; r++) initCell(r, c, val, color, textDisplay);
    }

    // ── Runtime actions ───────────────────────────────────────────────────────
    function setPointer(r, c, color = 0xFFFF00) {
        if (!isValid(r, c)) return;
        const { cx, cy } = cells[r][c];
        pointer.setPosition(cx, cy).setVisible(true).setStrokeStyle(3, color);
    }

    function hidePointer() {
        pointer.setVisible(false);
    }

    function highlightCell(r, c, color = 0x555500, alpha = 0.8) {
        if (!isValid(r, c)) return;
        cells[r][c].bg.setFillStyle(color, alpha);
    }

    function clearHighlights() {
        for (let r = 0; r < numRows; r++)
            for (let c = 0; c < numCols; c++)
                cells[r][c].bg.setFillStyle(0x111111, 0.9);
    }

    function updateCell(r, c, val, textDisplay = null) {
        if (!isValid(r, c)) return;
        const cell = cells[r][c];
        cell.val = val;
        cell.text.setText(textDisplay !== null ? textDisplay.toString() : val.toString());
        cell.text.setColor('#FFFF00');

        scene.tweens.add({
            targets: cell.bg,
            fillColor: 0x333300,
            duration: 200,
            yoyo: true,
            onComplete: () => { cell.text.setColor('#FFFFFF'); },
        });
    }

    function getCellValue(r, c) {
        return isValid(r, c) ? cells[r][c].val : null;
    }

    function getCell(r, c) {
        return isValid(r, c) ? cells[r][c] : null;
    }

    // ── Public API ────────────────────────────────────────────────────────────
    return {
        isValid,
        setColHeaders,
        setRowHeaders,
        initCell,
        initRow,
        initCol,
        setPointer,
        hidePointer,
        highlightCell,
        clearHighlights,
        updateCell,
        getCellValue,
        getCell,
        // expose raw cells array for edge cases
        get cells() { return cells; },
    };
}

