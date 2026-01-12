/**
 * Test Mocks Utilities
 * สำหรับสร้าง Mock Functions ที่ใช้ในการทดสอบ
 */

/**
 * Create test game functions with mock implementations for visual helpers
 * @param {Object} gameFunctions - Original game functions
 * @param {Array} edgesParam - Edges from test case input
 * @param {number} ropeLengthParam - Rope length for Rope Partition tests
 * @param {Array} cutsSafe - Safe cuts array for Rope Partition tests
 * @returns {Object} - Game functions with overrides for testing
 */
export function createTestGameFunctions(gameFunctions, edgesParam, ropeLengthParam, cutsSafe) {
    // Basic mock implementations for visual helpers to prevent errors
    const baseMocks = {
        // Add mock implementations for all visual helpers to prevent errors
        updateDijkstraVisited: (node) => { console.log('[TEST] updateDijkstraVisited:', node); },
        updateDijkstraPQ: (list) => { console.log('[TEST] updateDijkstraPQ, size:', list?.length); },
        resetDijkstraState: () => { console.log('[TEST] resetDijkstraState'); },
        // Emei visual no-ops
        highlightPeak: (node) => { console.log('[TEST] highlightPeak:', node); },
        highlightCableCar: (u, v) => { console.log('[TEST] highlightCableCar:', u, v); },
        showEmeiFinalResult: (res) => { console.log('[TEST] showEmeiFinalResult:', res); },

        // Rope Partition Helpers (Critical for Ghost Execution Safety)
        getRopeTarget: () => ropeLengthParam,
        getRopeCuts: () => (Array.isArray(cutsSafe) ? cutsSafe : [2, 3, 5]),

        // Rope Partition Mock Overrides (Prevent real visual logic execution)
        addRopeNode: async () => { return 0; },
        updateRopeNodeStatus: async () => { },
        pushRopeNode: async () => { return 0; },
        popRopeNode: async () => { },
        addCut: async () => { },
        removeCut: async () => { },
        initRopeTree: async () => { },
        reportRopeResult: () => { }
    };

    // Advanced overrides (e.g. for Max Capacity which needs logic, not just logging)
    const advancedOverrides = {
        // Override with parameter-aware version
        getGraphNeighborsWithWeightWithVisualSync: async function (edgesParamInner, node) {
            // Use edgesParam from closure if inner param is missing/invalid, 
            // but usually the injected code calls this with 'edgesParam' variable which comes from test args
            const edgesToUse = (edgesParamInner && Array.isArray(edgesParamInner)) ? edgesParamInner : edgesParam;

            console.log('[TEST] getGraphNeighborsWithWeightWithVisualSync called:', { edgesParam: typeof edgesToUse, node });
            if (!edgesToUse || !Array.isArray(edgesToUse)) {
                console.warn('[TEST] Invalid edges param:', edgesToUse);
                return [];
            }

            // edges format: [[u, v, weight], [u, v, weight], ...]
            // Convert to [[neighbor, weight], ...] for the given node
            const neighbors = [];
            for (const edge of edgesToUse) {
                if (!Array.isArray(edge) || edge.length < 3) continue;
                const u = Number(edge[0]);
                const v = Number(edge[1]);
                const weight = Number(edge[2]);

                if (isNaN(u) || isNaN(v) || isNaN(weight)) continue;

                // Check if this edge connects to our node (undirected graph)
                if (u === node) {
                    neighbors.push([v, weight]);
                } else if (v === node) {
                    neighbors.push([u, weight]);
                }
            }

            console.log('[TEST] Parsed neighbors for node', node, ':', JSON.stringify(neighbors));
            console.log('[TEST] Neighbors count:', neighbors.length);
            return neighbors;
        },
        findMinIndex: async function (list, exclusionList = null) {
            if (!Array.isArray(list) || list.length === 0) return -1;
            let minIndex = -1, minValue = 1e18;
            for (let i = 0; i < list.length; i++) {
                if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) continue;
                const item = list[i];
                let value = Array.isArray(item) ? Number(item[0]) : (typeof item === 'number' ? item : Number(item?.value || item?.distance || 0));
                if (isNaN(value)) continue;
                if (minIndex === -1 || value < minValue) { minValue = value; minIndex = i; }
            }
            return minIndex;
        },
        findMaxIndex: async function (list, exclusionList = null) {
            console.log('[TEST] findMaxIndex called with PQ:', JSON.stringify(list), 'Exclusion:', JSON.stringify(exclusionList));
            if (!Array.isArray(list) || list.length === 0) {
                console.log('[TEST] findMaxIndex: empty list, returning -1');
                return -1;
            }
            let maxIndex = -1;
            let maxValue = -1e18; // Use very small number for max finding
            for (let i = 0; i < list.length; i++) {
                // Skip if in exclusion list
                if (exclusionList && Array.isArray(exclusionList) && exclusionList[i] === true) {
                    continue;
                }

                const item = list[i];
                let value;
                if (Array.isArray(item) && item.length > 0) {
                    value = Number(item[0]);
                } else if (typeof item === 'number') {
                    value = item;
                } else if (item && typeof item === 'object') {
                    value = Number(item.value || item.capacity || 0);
                } else {
                    continue;
                }
                if (isNaN(value)) continue;
                if (maxIndex === -1 || value > maxValue) {
                    maxValue = value;
                    maxIndex = i;
                }
            }
            console.log('[TEST] findMaxIndex: selected index', maxIndex, 'with value', maxValue, 'item:', JSON.stringify(list[maxIndex]));
            return maxIndex;
        }
    };

    return {
        ...gameFunctions,
        ...baseMocks,
        ...advancedOverrides
    };
}
