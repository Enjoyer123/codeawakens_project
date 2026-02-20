import { checkTestCases } from '../../../../../gameutils/shared/testcase';
import {
    trackCoinChangeDecision,
    showKnapsackFinalSelection,
    showSubsetSumFinalSolutionVisual,
    showCoinChangeFinalSolution,
    knapsackMaxWithVisual,
    findMinIndex, findMaxIndex,
    getAllEdges,
    sortEdgesByWeight,
    dsuFind,
    dsuUnion,
    listPush, listSet, dictSet,
    getGraphNeighbors, getGraphNeighborsWithWeight
} from '@/gameutils/blockly';
import { getCurrentGameState, setCurrentGameState } from '../../../../../gameutils/shared/game';
import { buildExecutionContext } from './executionContextBuilder';

/**
 * Creates a test-safe execution context by taking the real context
 * and replacing all visual/movement functions with no-ops.
 * Only pure-logic functions (graph, DSU, sorting) are kept.
 */
const buildTestContext = (map, all_nodes, currentLevel) => {
    // Build a real context to get all the keys
    const noOp = () => Promise.resolve();
    const noOpSync = () => { };

    // Start with a real context (with dummy game actions)
    const realContext = buildExecutionContext({
        map,
        all_nodes,
        gameActions: {
            moveForward: noOp, turnLeft: noOp, turnRight: noOp,
            hit: noOp, foundMonster: () => false,
            canMoveForward: () => true, nearPit: () => false, atGoal: () => false
        },
        wrappers: { wrappedMoveToNode: noOp, wrappedMoveAlongPath: noOp },
        currentLevel,
        emeiParams: undefined
    });

    // Replace ALL functions with no-ops
    const testContext = {};
    for (const [key, value] of Object.entries(realContext)) {
        if (typeof value === 'function') {
            testContext[key] = noOp;
        }
        // Skip non-function values (map, all_nodes, trains, etc.)
        // because testRunner.js injects these separately as AsyncFunction params.
        // Including them here would shadow the test case's custom values.
    }

    // Override: keep functions that MUST work for test logic (pure computation, no visuals)
    Object.assign(testContext, {
        getGraphNeighbors,
        getGraphNeighborsWithWeight,
        getGraphNeighborsWithVisual: getGraphNeighbors,
        getGraphNeighborsWithVisualSync: getGraphNeighbors,
        getGraphNeighborsWithWeightWithVisualSync: getGraphNeighborsWithWeight,
        findMinIndex, findMaxIndex,
        getAllEdges, sortEdgesByWeight,
        dsuFind, dsuUnion,
        knapsackMaxWithVisual,
        trackCoinChangeDecision,
        listPush, listSet, dictSet,
        getCurrentGameState, setCurrentGameState,
        getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,
    });

    return testContext;
};

/**
 * Handles the execution and verification of test cases.
 * @param {Object} params - Parameters
 * @returns {Promise<Object|null>} The test case result object or null if skipped
 */
export const executeTestCases = async ({
    functionReturnValue,
    currentLevel,
    functionName,
    code,
    map,
    all_nodes,
    setTestCaseResult,
    setCurrentHint,
    setHintData,
    isTrainSchedule
}) => {
    // Train Schedule visualization update
    if (isTrainSchedule && typeof setHintData === 'function') {
        const assignments = globalThis.assignments || [];
        setHintData(prev => ({
            ...prev,
            assignments: assignments,
            result: { platforms: functionReturnValue },
            animationStep: assignments.length
        }));
    }

    if (currentLevel?.test_cases && currentLevel.test_cases.length > 0 && functionName) {
        // Build test context: real logic functions + no-op visuals
        const gameFunctionsForTest = buildTestContext(map, all_nodes, currentLevel);

        // Wait for any running N-Queen visual animation to finish
        try { if (typeof globalThis !== 'undefined' && globalThis.__nqueenVisual_lastAnimationPromise) await globalThis.__nqueenVisual_lastAnimationPromise; } catch (e) { }

        const testCaseResult = await checkTestCases(
            functionReturnValue,
            currentLevel.test_cases,
            functionName,
            code,
            gameFunctionsForTest,
            map,
            all_nodes
        );

        // Show algorithm final selections after code execution
        if (currentLevel?.knapsackData) {
            await showKnapsackFinalSelection();
        }
        if (currentLevel?.subsetSumData) {
            const targetSum = currentLevel.subsetSumData.target_sum || 0;
            await showSubsetSumFinalSolutionVisual(targetSum);
        }
        if (currentLevel?.coinChangeData) {
            await showCoinChangeFinalSolution();
        }

        // Store test case result in game state
        setCurrentGameState({ testCaseResult });

        if (setTestCaseResult) {
            setTestCaseResult(testCaseResult);
        }
        setCurrentHint(testCaseResult.message);

        return testCaseResult;
    } else {
        return null;
    }
};
