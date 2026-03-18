/**
 * algoExecutor.js — Record & Playback System
 *
 * รันโค้ด Blockly ที่ gen มาแบบ "Pure Logic" (ไม่มี Phaser/Visual)
 * คืน: { result, trace, error }
 *
 * trace คือ Array ของ step ที่อัลกอเดินเพื่อเอาไปเล่น Animation ทีหลัง
 */

import { buildGraphContext } from './contexts/graphContext';
import { injectNQueenStubs } from './contexts/nqueenContext';
import { injectKnapsackStubs } from './contexts/knapsackContext';
import { injectSubsetSumStubs } from './contexts/subsetSumContext';
import { injectCoinChangeStubs } from './contexts/coinChangeContext';
import { injectEmeiMountainStubs } from './contexts/emeiMountainContext';
import { detectAlgoType } from '../shared/levelType';

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * สร้าง context สำหรับรัน algo code (ไม่มี visual)
 * แต่ละ algo type จะมี trace recorder ที่เก็บ step log
 */
function buildAlgoContext(levelData, trace, code = "") {
    // 1. Build base context (Graph utilities & general helpers)
    const context = buildGraphContext(levelData, trace);

    // 2. Inject algorithm-specific stubs based on detected type (avoid unnecessary setup)
    const algoType = detectAlgoType(levelData);
    switch (algoType) {
        case 'NQUEEN':      injectNQueenStubs(context, levelData, trace); break;
        case 'KNAPSACK':    injectKnapsackStubs(context, levelData, trace); break;
        case 'SUBSETSUM':   injectSubsetSumStubs(context, levelData, trace); break;
        case 'COINCHANGE':  injectCoinChangeStubs(context, levelData, trace); break;
        case 'EMEI':        injectEmeiMountainStubs(context, levelData, trace, code); break;
        // DFS/BFS/DIJKSTRA/PRIM/KRUSKAL use graphContext only — no extra stubs needed
    }

    return context;
}

/**
 * รัน Blockly code ที่ gen มา (pure logic, no visual)
 * @param {string} code - JavaScript code ที่ Blockly gen ออกมา
 * @param {Object} levelData - ข้อมูล level (nodes, edges, nqueenData, etc.)
 * @param {number} timeoutMs - timeout ป้องกัน infinite loop (default 5s)
 * @returns {{ result: *, trace: Array, error: Error|null }}
 */
export async function executeAlgoCode(code, levelData, timeoutMs = 5000) {
    const trace = [];

    try {
        const context = buildAlgoContext(levelData, trace, code);

        // Inject step counter + return capture
        const guardedCode = `
            let __stepCount = 0;
            const __maxSteps = 50000;
            function __guard() { if (++__stepCount > __maxSteps) throw new Error('Too many executions (infinite loop?)'); }
        ` + code + `\n try { return result; } catch(e) { return undefined; }`;

        const argNames = Object.keys(context);
        const argValues = argNames.map(k => context[k]);

        const fn = new AsyncFunction(...argNames, '"use strict";\n' + guardedCode);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
        );

        const result = await Promise.race([fn(...argValues), timeoutPromise]);

        return { result, trace, error: null };

    } catch (error) {
        return { result: undefined, trace, error };
    }
}
