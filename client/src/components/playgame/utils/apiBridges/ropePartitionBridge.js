/**
 * Rope Partition API Bridge
 * 
 * This module sets up the global API for Rope Partition visualization.
 * It provides functions that user code can call to visualize the backtracking tree.
 * 
 * Extracted from GameCore.jsx for better organization.
 */

/**
 * Setup Rope Partition API Bridge
 * Creates global functions for rope partition visualization
 * 
 * @param {Object} currentLevel - Current level data
 * @param {Function} setHintData - Function to update hint data state
 * @returns {Function} Cleanup function to remove global API
 */
export const setupRopePartitionBridge = (currentLevel, setHintData) => {
    if (typeof globalThis === 'undefined') return () => { };

    console.log('[Rope Bridge] Initializing Rope Partition API (Tree)');

    // Setup shared state for the run
    let treeNodes = [];
    globalThis.ropeStack = []; // Stack to track recursion path ids

    // Helper to update React State safely
    const updateTreeState = () => {
        setHintData(prev => ({
            ...prev,
            nodes: [...treeNodes]
        }));
    };

    // Stack Helper
    const getRopeParent = () => {
        if (globalThis.ropeStack.length === 0) return -1;
        return globalThis.ropeStack[globalThis.ropeStack.length - 1];
    };

    // 1. Init
    globalThis.initRopeTree = async () => {
        try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests
            console.log('[Rope API] Init Tree');
            treeNodes = [];
            globalThis.ropeStack = [];
            setHintData(prev => ({ ...prev, nodes: [], result: null }));
            // Wait a bit for clear to happen
            await new Promise(r => setTimeout(r, 50));
        } catch (e) {
            console.error('[Rope API] Init Error:', e);
        }
    };

    // 1.5 Stack Operations (Wrappers)
    globalThis.pushRopeNode = async (cut, sum) => {
        const parentId = getRopeParent();
        const depth = globalThis.ropeStack.length;

        if (depth > 50) {
            console.warn('[Rope API] Depth Limit Exceeded (50)');
            return -1;
        }

        // Force Number types for visual consistency
        const numCut = Number(cut);
        const numSum = Number(sum);
        console.log('[Rope API] Push Node:', { parentId, cut: numCut, sum: numSum, depth });

        const id = await globalThis.addRopeNode(parentId, numCut, numSum, depth);
        globalThis.ropeStack.push(id);
        return id;
    };

    globalThis.popRopeNode = async () => {
        try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests
            if (globalThis.ropeStack.length > 0) globalThis.ropeStack.pop();
            await new Promise(r => setTimeout(r, 20));
        } catch (e) {
            console.error('[Rope API] Pop Error:', e);
        }
    };

    // 2. Add Node
    globalThis.addRopeNode = async (parentId, cut, sum, depth) => {
        try {
            if (globalThis.__isVisualRun === false) return 9999; // Skip for background tests

            const id = treeNodes.length;
            const newNode = {
                id,
                parentId,
                cut,
                sum,
                depth,
                status: 'visiting' // visiting, success, pruned, normal
            };
            treeNodes.push(newNode);
            updateTreeState();

            await new Promise(r => setTimeout(r, 100)); // Animation delay
            return id;
        } catch (e) {
            console.error('[Rope API] Add Node Error:', e);
            return -1;
        }
    };

    // 3. Update Status
    globalThis.updateRopeNodeStatus = async (nodeId, status, sum) => {
        try {
            if (globalThis.__isVisualRun === false) return; // Skip for background tests

            const node = treeNodes.find(n => n.id === nodeId);
            if (node) {
                node.status = status;
                updateTreeState();
                await new Promise(r => setTimeout(r, 50));
            }
        } catch (e) {
            console.error('[Rope API] Update Status Error:', e);
        }
    };

    // 4. Report Result
    globalThis.reportRopeResult = (ans, path) => {
        console.log('[Rope API] Result:', ans, path);
        setHintData(prev => ({
            ...prev,
            result: ans,
            minSolution: path
        }));
    };

    // 5. Getters
    globalThis.getRopeCuts = () => {
        // Look in payload first (standard), then direct properties (fallback)
        const data = currentLevel?.appliedData?.payload || currentLevel?.customData || currentLevel?.appliedData || {};
        const cuts = data.cuts || data.lengths || [2, 3, 5];
        console.log('[Rope DEBUG] getRopeCuts raw:', cuts);
        if (Array.isArray(cuts) && cuts.length > 0) {
            const validCuts = cuts.map(c => Number(c));
            if (validCuts.every(c => !Number.isNaN(c))) return validCuts;
        }
        return [2, 3, 5];
    };

    globalThis.getRopeTarget = () => {
        const data = currentLevel?.appliedData?.payload || currentLevel?.customData || currentLevel?.appliedData || {};
        // Support both ropeLength (new) and total (old)
        let target = Number(data.ropeLength || data.total);
        if (Number.isNaN(target) || target <= 0) {
            // Fallback if NaN or invalid
            console.warn('[Rope API] Invalid target, using default 10. Data:', data);
            target = 10;
        }
        console.log('[Rope DEBUG] getRopeTarget:', target);
        return target;
    };

    // Return cleanup function
    return () => {
        const apiMethods = [
            'initRopeTree',
            'addRopeNode',
            'updateRopeNodeStatus',
            'reportRopeResult',
            'getRopeCuts',
            'getRopeTarget',
            'pushRopeNode',
            'popRopeNode'
        ];

        apiMethods.forEach(fn => {
            if (globalThis[fn]) delete globalThis[fn];
        });

        if (globalThis.ropeStack) delete globalThis.ropeStack;
    };
};
