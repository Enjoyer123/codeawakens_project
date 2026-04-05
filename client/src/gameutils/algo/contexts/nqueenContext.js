/**
 * Context สำหรับเกม N-Queen (ปัญหาจัดวางราชินี)
 */
import { getAlgoPayload } from '../../shared/levelType';

export function injectNQueenStubs(context, levelData, trace) {
    const payload = getAlgoPayload(levelData, 'NQUEEN');
    if (!payload) return;

    /* ==========================================
       1. GAME VARIABLES
       ========================================== */
    const n = payload.n || 4;

    // สร้างตาราง 2 มิติขนาด NxN เริ่มต้นด้วย 0 (ว่างเปล่า)
    const board = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            row.push(0);
        }
        board.push(row);
    }

    context.n = n;
    context.board = board;
    context.solution = [];

    /* ==========================================
       2. CHECKER & ACTION STUBS
       ========================================== */
    /**
     * ตรวจสอบว่าสามารถวางราชินีที่ตำแหน่งนี้ได้หรือไม่
     */
    context.safe = (row, col) => {
        let isSafe = true;

        // เช็คแนวตั้ง (คอลัมน์เดียวกัน แต่แถวบนกว่า)
        for (let i = 0; i < row; i++) {
            if (context.board[i][col] === 1) isSafe = false;
        }

        // เช็คแนวทแยงมุมซ้ายบน
        for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
            if (context.board[i][j] === 1) isSafe = false;
        }

        // เช็คแนวทแยงมุมขวาบน
        for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
            if (context.board[i][j] === 1) isSafe = false;
        }

        // บันทึกการตัดสินใจลง Trace
        trace.push({ action: 'consider', row, col, safe: isSafe });
        return isSafe;
    };

    /**
     * วางราชินีลงบนกระดาน
     */
    context.place = (row, col) => {
        context.board[row][col] = 1;
        trace.push({ action: 'place', row, col });
    };

    /**
     * หยิบราชินีออกจากกระดาน (Backtrack)
     */
    context.remove = (row, col) => {
        context.board[row][col] = 0;
        trace.push({ action: 'remove', row, col });
    };


    context.say = (text) => {
        trace.push({ action: 'say', text });
    }
}
