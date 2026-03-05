/**
 * algoExecutor.js — Record & Playback System
 *
 * รันโค้ด Blockly ที่ gen มาแบบ "Pure Logic" (ไม่มี Phaser/Visual)
 * คืน: { result, trace, error }
 *
 * trace คือ Array ของ step ที่อัลกอเดินเพื่อเอาไปเล่น Animation ทีหลัง
 */

// Removed logic.js imports for simplification

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * ตรวจว่า level นี้เป็น Emei Mountain / Max Capacity หรือไม่
 */
function isEmeiLevel(levelData, code = '') {
    return levelData.appliedData?.type?.includes('EMEI') ||
        levelData.appliedData?.type?.includes('MAX_CAPACITY') ||
        levelData.gameType === 'emei_mountain' ||
        levelData.level_name?.includes('ง้อไบ๊') ||
        code.includes('Emei(') ||
        code.includes('showEmeiFinalResult') ||
        code.includes('highlightPeak');
}

/**
 * สร้าง context สำหรับรัน algo code (ไม่มี visual)
 * แต่ละ algo type จะมี trace recorder ที่เก็บ step log
 */
function buildAlgoContext(levelData, trace, code = "") {
    const map = buildGraphMap(levelData.nodes || [], levelData.edges || []);
    const all_nodes = (levelData.nodes || []).map(n => n.id);

    // Graph level start/goal from level data
    const startNode = levelData.startNodeId !== undefined ? levelData.startNodeId : 0;
    const goalNode = levelData.goalNodeId !== undefined ? levelData.goalNodeId : (all_nodes.length > 0 ? all_nodes[all_nodes.length - 1] : 0);

    // --- N-Queen State ---
    const nSize = levelData.nqueenData ? levelData.nqueenData.n : 4;
    const nqueenBoard = Array(nSize).fill(null).map(() => Array(nSize).fill(0));


    // --- Base context: pure graph functions ---
    const context = {
        trace, // Expose trace array to Blockly generated code
        map,
        garph: map,    // Alias (DFS example uses "garph" typo as param name)
        all_nodes,
        start: startNode,
        goal: goalNode,
        getGraphNeighbors: (nodeKey) => {
            const key = String(nodeKey);
            const neighbors = map[key] || [];
            // Unwrap from [neighbor, weight] tuples built by buildGraphMap
            if (neighbors.length > 0 && Array.isArray(neighbors[0])) {
                return neighbors.map(n => n[0]);
            }
            return neighbors;
        },
        getGraphNeighborsWithWeight: (n) => {
            const key = String(n);
            return map[key] || [];
        },
        getGraphNeighborsWithVisualSync: (n) => {
            const key = String(n);
            const rawNeighbors = map[key] || [];
            let cleanNeighbors = rawNeighbors;
            if (rawNeighbors.length > 0 && Array.isArray(rawNeighbors[0])) {
                cleanNeighbors = rawNeighbors.map(nw => nw[0]);
            }
            trace.push({ action: 'visit', node: n, neighbors: [...cleanNeighbors] });
            return cleanNeighbors;
        },
        getGraphNeighborsWithVisual: async (n) => {
            const key = String(n);
            const rawNeighbors = map[key] || [];
            let cleanNeighbors = rawNeighbors;
            if (rawNeighbors.length > 0 && Array.isArray(rawNeighbors[0])) {
                cleanNeighbors = rawNeighbors.map(nw => nw[0]);
            }
            trace.push({ action: 'visit', node: n, neighbors: [...cleanNeighbors] });
            return cleanNeighbors;
        },
        showPathUpdateWithVisual: async (path) => {
            if (Array.isArray(path)) {
                trace.push({ action: 'show_path', path: [...path] });
            }
        },
        getGraphNeighborsWithWeightWithVisualSync: async (g, n) => {
            const nodeKey = String(n);
            let neighborsWithWeight = [];
            // If g is an array of edges, build neighbors dynamically
            if (Array.isArray(g)) {
                for (const edge of g) {
                    const u = edge.from !== undefined ? edge.from : (edge.u !== undefined ? edge.u : edge[0]);
                    const v = edge.to !== undefined ? edge.to : (edge.v !== undefined ? edge.v : edge[1]);
                    const weight = edge.weight ?? edge.value ?? edge.w ?? edge[2] ?? 1;
                    if (String(u) === nodeKey && v !== undefined) neighborsWithWeight.push([v, weight]);
                    else if (String(v) === nodeKey && u !== undefined) neighborsWithWeight.push([u, weight]);
                }
            } else {
                neighborsWithWeight = map[nodeKey] || [];
            }

            const neighborIds = neighborsWithWeight.map(nw => Array.isArray(nw) ? nw[0] : nw);
            trace.push({ action: 'visit', node: n, neighbors: [...neighborIds] });
            return neighborsWithWeight;
        },
        getAllEdges: (graph) => {
            // First treat graph as explicit edge list if provided
            if (Array.isArray(graph)) {
                return graph.map(edge => {
                    if (Array.isArray(edge)) return [edge[0], edge[1], edge.length > 2 ? Number(edge[2]) : 1];
                    const from = edge.from !== undefined ? edge.from : edge.u;
                    const to = edge.to !== undefined ? edge.to : edge.v;
                    const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
                    return [from, to, weight];
                });
            }
            // Fallback to testLevelData edges instead of live game state
            const edges = levelData.edges || [];
            return edges.map(edge => {
                const from = edge.from !== undefined ? edge.from : edge.u;
                const to = edge.to !== undefined ? edge.to : edge.v;
                const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
                return [from, to, weight];
            });
        },
        sortEdgesByWeight: (edges) => {
            if (!Array.isArray(edges)) return [];
            return [...edges].sort((a, b) => {
                const wa = Array.isArray(a) && a.length > 2 ? Number(a[2]) : 0;
                const wb = Array.isArray(b) && b.length > 2 ? Number(b[2]) : 0;
                return wa - wb;
            });
        },
        getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,

        // --- N-Queen Functions ---
        safe: (r, c) => {
            const row = parseInt(r);
            const col = parseInt(c);
            trace.push({ action: 'consider', row, col });

            // Check row and column
            for (let i = 0; i < nSize; i++) {
                if (nqueenBoard[row][i] === 1) {
                    return false;
                }
                if (nqueenBoard[i][col] === 1) {
                    return false;
                }
            }

            // Check diagonals
            for (let i = 0; i < nSize; i++) {
                for (let j = 0; j < nSize; j++) {
                    if (nqueenBoard[i][j] === 1) {
                        if (Math.abs(row - i) === Math.abs(col - j)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        place: (r, c) => {
            const row = parseInt(r);
            const col = parseInt(c);
            trace.push({ action: 'place', row, col });
            if (row >= 0 && row < nSize && col >= 0 && col < nSize) {
                nqueenBoard[row][col] = 1;
            }
        },
        remove: (r, c) => {
            const row = parseInt(r);
            const col = parseInt(c);
            trace.push({ action: 'remove', row, col });
            if (row >= 0 && row < nSize && col >= 0 && col < nSize) {
                nqueenBoard[row][col] = 0;
            }
        },
        // N-Queen variables accessible to generated code
        board: nqueenBoard,
        n: nSize,

        // --- Visual no-ops (ป้องกัน ReferenceError) ---
        moveForward: async () => { },
        turnLeft: async () => { },
        turnRight: async () => { },
        hit: async () => { },
        foundMonster: () => false,
        canMoveForward: () => true,
        nearPit: () => false,
        atGoal: () => false,
        moveToNode: async () => { },
        moveAlongPath: async (path) => {
            // Record the final path for playback
            trace.push({ action: 'move_along_path', path: Array.isArray(path) ? [...path] : [] });
        },
        playExploreEffect: async () => { },

        // --- Visual stubs for graph blocks ---
        markVisitedWithVisual: async (node) => {
            trace.push({ action: 'visit', node });
        },
        showPathUpdateWithVisual: async (path) => {
            trace.push({ action: 'show_path', path: Array.isArray(path) ? [...path] : [] });
        },
        clearDfsVisuals: () => { },
        showMSTEdges: () => { },
        showMSTEdgesFromList: () => { },

        // --- DFS/Dijkstra visual stubs ---
        updateDijkstraVisited: () => { },
        updateDijkstraPQ: () => { },
        updateMSTWeight: () => { },
        resetDijkstraState: () => { },

        // --- Knapsack stubs ---
        trackKnapsackDecision: (type, itemIndex) => {
            trace.push({ action: type, index: itemIndex });
        },
        trackKnapsackDpUpdate: (itemIndex, capacity, value) => {
            trace.push({ action: 'dp_update', index: itemIndex, capacity, value });
        },

        // --- CoinChange stubs ---
        addWarriorToSelectionVisual: async (warrior) => {
            trace.push({ action: 'select_coin', coin: warrior });
        },
        removeWarriorFromSelectionVisual: async () => {
            trace.push({ action: 'remove_coin' });
        },
        considerCoinVisual: async (coinIndex) => {
            trace.push({ action: 'consider_coin', coin: coinIndex });
        },
        trackCoinChangeDecision: (amount, index, include, exclude) => {
            if (exclude === -2) {
                // dp_update trick
                // AMOUNT passes current amount
                // INDEX passes new minCoins (prev_coins + 1)
                // INCLUDE passes coin used
                // EXCLUDE passes -2 (flag)
                trace.push({
                    action: 'dp_update',
                    amount: amount,
                    minCoins: index,
                    coinUsed: include
                });
            } else {
                trace.push({ action: 'coin_decision', amount, index, include, exclude });
            }
        },
        memoHitVisual: async (amount) => {
            trace.push({ action: 'memo_hit', amount });
        },
        highlightCoin: async () => { },
        showResult: async () => { },

        // --- SubsetSum stubs ---
        addWarriorToSide1Visual: async () => { },
        addWarriorToSide2Visual: async () => { },
        resetSubsetSumWarriorsVisual: () => { },
        startSubsetSumTrackingVisual: () => { },
        resetSubsetSumTrackingVisual: () => { },
        // Removed updateSubsetSumCellVisual stub

        // --- MST stubs ---
        findMinIndex: async (list, ex) => {
            if (!Array.isArray(list) || list.length === 0) return -1;
            let mi = -1, mv = 1e18;
            for (let i = 0; i < list.length; i++) {
                if (ex && Array.isArray(ex) && ex[i] === true) continue;
                const item = list[i];
                let v = Array.isArray(item) ? Number(item[0]) : (typeof item === 'number' ? item : 0);
                if (isNaN(v)) continue;
                if (mi === -1 || v < mv) { mv = v; mi = i; }
            }
            return mi;
        },
        findMaxIndex: async (list, ex) => {
            if (!Array.isArray(list) || list.length === 0) return -1;
            let mi = -1, mv = -1e18;
            for (let i = 0; i < list.length; i++) {
                if (ex && Array.isArray(ex) && ex[i] === true) continue;
                const item = list[i];
                let v = Array.isArray(item) ? Number(item[0]) : (typeof item === 'number' ? item : 0);
                if (isNaN(v)) continue;
                if (mi === -1 || v > mv) { mv = v; mi = i; }
            }
            return mi;
        },
        dsuFind: (parent, i) => {
            if (parent[i] === undefined) parent[i] = i;
            while (parent[i] !== i) {
                if (parent[parent[i]] === undefined) parent[parent[i]] = parent[i];
                parent[i] = parent[parent[i]]; // path compression
                i = parent[i];
            }
            return i;
        },
        dsuUnion: (parent, rank, x, y) => {
            const xr = context.dsuFind(parent, x);
            const yr = context.dsuFind(parent, y);
            if (xr === yr) return false;
            if ((rank[xr] || 0) < (rank[yr] || 0)) parent[xr] = yr;
            else if ((rank[xr] || 0) > (rank[yr] || 0)) parent[yr] = xr;
            else { parent[yr] = xr; rank[xr] = (rank[xr] || 0) + 1; }
            return true;
        },
        showKruskalRoot: () => { },
        clearKruskalVisuals: () => { },

        // --- List helpers ---
        listPush: (list, item) => { if (Array.isArray(list)) list.push(item); },
        listSet: (list, idx, val) => { if (Array.isArray(list)) list[idx] = val; },
        dictSet: (dict, key, val) => { if (dict && typeof dict === 'object') dict[key] = val; },

        // --- Game state stubs ---
        getCurrentGameState: () => ({ levelData, currentNodeId: 0 }),
        setCurrentGameState: () => { },

        // --- Collection stubs ---
        collectCoin: () => { },
        haveCoin: () => false,
        getCoinCount: () => 0,
        getCoinValue: () => 0,
        swapCoins: () => { },
        compareCoins: () => 0,
        isSorted: () => true,
        getPlayerCoins: () => [],
        addCoinToPlayer: () => { },
        clearPlayerCoins: () => { },
        swapPlayerCoins: () => { },
        comparePlayerCoins: () => 0,
        getPlayerCoinValue: () => 0,
        getPlayerCoinCount: () => 0,
        arePlayerCoinsSorted: () => true,
        rescuePersonAtNode: () => { },
        hasPerson: () => false,
        personRescued: () => false,
        getPersonCount: () => 0,
        allPeopleRescued: () => true,
        getStack: () => [],
        pushToStack: () => { },
        popFromStack: () => undefined,
        isStackEmpty: () => true,
        getStackCount: () => 0,
        hasTreasureAtNode: () => false,
        collectTreasure: () => { },
        isTreasureCollected: () => false,
        clearStack: () => { },


        // Emei stubs
        highlightPeak: (node) => { trace.push({ action: 'emei_peak', node }); },
        highlightCableCar: (u, v, capacity) => { trace.push({ action: 'emei_cable', u, v, capacity }); },
        showEmeiFinalResult: (bottleneck, rounds) => { trace.push({ action: 'emei_result', bottleneck, rounds }); },
        highlightEmeiPath: (parent, end, bottleneck) => {
            // Filter: only highlight path if end === context.end (the actual goal node)
            // context.end is set later in the Emei inject block, but since this is a
            // closure over `context`, we can lazy-read it here at call time.
            const goalEnd = context.end;
            if (goalEnd !== undefined && goalEnd !== null) {
                // Use weak equality to handle string/number mismatch
                if (end != goalEnd) {
                    return;
                }
            }

            // Reconstruct path from end back to start
            const path = [];
            let curr = end;
            const visited = new Set();
            const n = Array.isArray(parent) ? parent.length : 20;
            let valid = false;

            while (curr !== undefined && curr !== null) {
                if (visited.has(curr)) break; // cycle → invalid path
                visited.add(curr);
                path.unshift(curr); // prepend → builds forward path
                const p = Array.isArray(parent) ? parent[curr] : undefined;
                if (p === undefined || p === null || p === -1) {
                    valid = true; // reached start successfully
                    break;
                }
                if (path.length > n) break; // safety: too long → invalid
                curr = p;
            }


            if (!valid) {
                return;
            }

            trace.push({
                action: 'emei_path',
                path, // forward path: [start, ..., end]
                bottleneck,
                goalEnd: context.end // store goal so playback can identify correct path
            });
        },
    };

    // --- Inject algorithm-specific data ---

    // N-Queen
    if (levelData.nqueenData) {
        const n = levelData.nqueenData.n || 4;
        const board = [];
        for (let i = 0; i < n; i++) { board[i] = []; for (let j = 0; j < n; j++) board[i][j] = 0; }
        context.n = n;
        context.board = board;
        context.solution = [];
        context.safe = (row, col) => {
            let isSafe = true;
            for (let i = 0; i < row; i++) if (context.board[i][col] === 1) isSafe = false;
            for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) if (context.board[i][j] === 1) isSafe = false;
            for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) if (context.board[i][j] === 1) isSafe = false;
            trace.push({ action: 'consider', row, col, safe: isSafe });
            return isSafe;
        };
        context.place = (row, col) => {
            context.board[row][col] = 1;
            trace.push({ action: 'place', row, col });
        };
        context.remove = (row, col) => {
            context.board[row][col] = 0;
            trace.push({ action: 'remove', row, col });
        };
    }

    // Knapsack
    if (levelData.knapsackData) {
        const { items = [], capacity = 0 } = levelData.knapsackData;
        context.weights = items.map(i => i.weight);
        context.values = items.map(i => i.price);
        context.n = items.length;
        context.capacity = capacity;
    }

    // SubsetSum
    if (levelData.subsetSumData) {
        context.warriors = levelData.subsetSumData.warriors || [];
        context.target_sum = levelData.subsetSumData.target_sum || 0;
    }

    // CoinChange
    if (levelData.coinChangeData) {
        context.monster_power = Math.round(Number(levelData.coinChangeData.monster_power || 0));
        context.warriors = (levelData.coinChangeData.warriors || []).map(w => Math.round(Number(w)));
    }

    // Rope Partition
    if (levelData.gameType === 'rope_partition') {
        context.cuts = [];
        context.addCut = async (len) => { context.cuts.push(len); trace.push({ action: 'cut', length: len }); };
        context.removeCut = async () => { const r = context.cuts.pop(); trace.push({ action: 'uncut', length: r }); };
        context.getRopeCuts = () => levelData.appliedData?.payload?.cuts || [2, 3, 5];
        context.getRopeTarget = () => levelData.appliedData?.payload?.ropeLength || 10;
        context.initRopeTree = async () => { };
        context.pushRopeNode = async () => 0;
        context.popRopeNode = async () => { };
        context.addRopeNode = async () => 0;
        context.updateRopeNodeStatus = async () => { };
        context.reportRopeResult = () => { };
    }

    // Emei Mountain
    const isEmeiMountain = isEmeiLevel(levelData, code);

    if (isEmeiMountain) {
        const payload = levelData.appliedData?.payload || {};
        context.n = levelData.emeiN ?? payload.n ?? (levelData.nodes ? levelData.nodes.length : 6);

        let extractedEdges = levelData.emeiEdges ?? payload.edges;
        if (!extractedEdges || extractedEdges.length === 0) {
            extractedEdges = (levelData.edges || []).map(edge => {
                const f = edge.from !== undefined ? edge.from : edge.u;
                const t = edge.to !== undefined ? edge.to : edge.v;
                const w = edge.weight ?? edge.value ?? edge.w ?? 1;
                return [f, t, w];
            });
        }
        if (extractedEdges.length === 0) {
            extractedEdges = [
                [0, 1, 10], [0, 2, 8], [1, 3, 5],
                [2, 3, 12], [2, 4, 15], [3, 5, 20], [4, 5, 7]
            ];
        }

        context.edges = extractedEdges;
        context.start = levelData.emeiStart ?? payload.start ?? levelData.startNodeId ?? levelData.startNode ?? 0;
        context.end = levelData.emeiEnd ?? payload.end ?? levelData.goalNodeId ?? levelData.goalNode ?? 5;
        context.tourists = levelData.emeiTourists ?? payload.tourists ?? payload.tourist ?? 20;
    }

    return context;
}

/**
 * สร้าง Graph Map จาก nodes/edges ของ level
 */
function buildGraphMap(nodes, edges) {
    const map = {};
    nodes.forEach(node => { map[node.id] = []; });
    edges.forEach(edge => {
        const from = edge.from !== undefined ? edge.from : edge.u;
        const to = edge.to !== undefined ? edge.to : edge.v;
        const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
        if (from !== undefined && to !== undefined) {
            if (!map[from]) map[from] = [];
            if (!map[to]) map[to] = [];
            // Store [neighborId, weight] tuples so getGraphNeighborsWithWeight works
            const alreadyFrom = map[from].some(e => Array.isArray(e) ? e[0] === to : e === to);
            const alreadyTo = map[to].some(e => Array.isArray(e) ? e[0] === from : e === from);
            if (!alreadyFrom) map[from].push([to, weight]);
            if (!alreadyTo) map[to].push([from, weight]);
        }
    });
    return map;
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

        let finalResult = result;

        return { result: finalResult, trace, error: null };

    } catch (error) {
        return { result: undefined, trace, error };
    }
}
