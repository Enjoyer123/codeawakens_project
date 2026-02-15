import { checkTestCases } from '../../../../../gameutils/shared/testcase';
import {
    trackCoinChangeDecision,
    showKnapsackFinalSelection,
    showSubsetSumFinalSolutionVisual,
    showCoinChangeFinalSolution,
    knapsackMaxWithVisual,
    getGraphNeighbors,
    getGraphNeighborsWithWeight,
    findMinIndex, findMaxIndex, getAllEdges, sortEdgesByWeight, dsuFind, dsuUnion,
    listPush, listSet, dictSet,
} from '../../../../../gameutils/blockly';
import { getGraphNeighbors as getGraphNeighborsNoVisual, getGraphNeighborsWithWeight as getGraphNeighborsWithWeightNoVisual } from '@/gameutils/blockly';
import { getCurrentGameState, setCurrentGameState } from '../../../../../gameutils/shared/game'
/**
 * Builds the game functions context specifically for test case execution.
 * Most visual functions are replaced with no-ops.
 */
const buildTestContext = (overrides = {}) => {
    const noOpVisual = () => Promise.resolve();
    const noOpVisualSync = () => { };
    const noOpMove = () => Promise.resolve(true);

    return {
        // Movement functions - all no-op for test cases (no visual feedback)
        moveForward: noOpMove,
        turnLeft: noOpVisual,
        turnRight: noOpVisual,
        hit: noOpMove,
        foundMonster: () => false,
        canMoveForward: () => true,
        nearPit: () => false,
        atGoal: () => false,
        // Coin functions - no-op
        collectCoin: noOpMove,
        haveCoin: () => false,
        getCoinCount: () => 0,
        getCoinValue: () => 0,
        swapCoins: noOpMove,
        compareCoins: () => 0,
        isSorted: () => true,
        getPlayerCoins: () => [],
        addCoinToPlayer: noOpMove,
        clearPlayerCoins: noOpVisualSync,
        swapPlayerCoins: noOpMove,
        comparePlayerCoins: () => 0,
        getPlayerCoinValue: () => 0,
        getPlayerCoinCount: () => 0,
        arePlayerCoinsSorted: () => true,
        // Person rescue functions - no-op
        rescuePersonAtNode: noOpMove,
        hasPerson: () => false,
        personRescued: () => false,
        getPersonCount: () => 0,
        // Coin Change tracking function - needs to work for test cases
        trackCoinChangeDecision: trackCoinChangeDecision,
        allPeopleRescued: () => true,
        // Stack functions - no-op
        getStack: () => [],
        pushToStack: noOpMove,
        popFromStack: () => null,
        isStackEmpty: () => true,
        getStackCount: () => 0,
        hasTreasureAtNode: () => false,
        collectTreasure: noOpMove,
        isTreasureCollected: () => false,
        clearStack: noOpVisualSync,
        pushNode: noOpMove,
        popNode: noOpMove,
        keepItem: noOpMove,
        hasTreasure: () => false,
        treasureCollected: () => false,
        stackEmpty: () => true,
        stackCount: () => 0,
        // Movement functions - all no-op for test cases
        moveToNode: noOpMove,
        moveAlongPath: noOpVisual,
        getCurrentNode: () => 0, // Return default node
        // Graph functions - use non-visual versions
        getGraphNeighbors: getGraphNeighborsNoVisual || getGraphNeighbors,
        getGraphNeighborsWithWeight: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
        getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,
        // Visual functions - all no-op for test cases
        getGraphNeighborsWithVisual: getGraphNeighborsNoVisual || getGraphNeighbors,
        getGraphNeighborsWithVisualSync: getGraphNeighborsNoVisual || getGraphNeighbors,
        getGraphNeighborsWithWeightWithVisualSync: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
        markVisitedWithVisual: noOpVisual,
        showPathUpdateWithVisual: noOpVisual,
        clearDfsVisuals: noOpVisualSync,
        showMSTEdges: noOpVisualSync,
        findMinIndex, findMaxIndex, // Keep this as it's needed for algorithms
        getAllEdges, // Keep this as it's needed for algorithms
        sortEdgesByWeight, // Keep this as it's needed for algorithms
        dsuFind, // Keep this as it's needed for algorithms
        dsuUnion, // Keep this as it's needed for algorithms
        showMSTEdgesFromList: noOpVisualSync,
        showKruskalRoot: noOpVisualSync,
        clearKruskalVisuals: noOpVisualSync,
        updateDijkstraVisited: noOpVisualSync,
        updateDijkstraPQ: noOpVisualSync,
        updateMSTWeight: noOpVisualSync,
        resetDijkstraState: noOpVisualSync,
        selectKnapsackItemVisual: noOpVisualSync,
        unselectKnapsackItemVisual: noOpVisualSync,
        resetKnapsackItemsVisual: noOpVisualSync,
        knapsackMaxWithVisual: knapsackMaxWithVisual, // Need this for knapsack test cases
        addWarriorToSide1Visual: noOpVisualSync,
        addWarriorToSide2Visual: noOpVisualSync,
        resetSubsetSumWarriorsVisual: noOpVisualSync,
        updateSubsetSumCellVisual: noOpVisualSync,
        updateCoinChangeCellVisual: noOpVisualSync,
        // Coin Change tracking function - needs to work for test cases
        trackCoinChangeDecision: trackCoinChangeDecision,
        listPush, listSet, dictSet,
        highlightEmeiPath: noOpVisual,
        getCurrentGameState,
        setCurrentGameState,
        ...overrides
    };
};

/**
 * Handles the execution and verification of test cases.
 * @param {Object} params - Parameters
 * @param {any} params.functionReturnValue - The return value from the user's main function execution
 * @param {Object} params.currentLevel - The current level data
 * @param {string} params.functionName - The name of the user's function
 * @param {string} params.code - The instrumented user code
 * @param {Object} params.map - Graph map
 * @param {Array} params.all_nodes - All nodes array
 * @param {Function} params.setTestCaseResult - State setter for test results
 * @param {Function} params.setCurrentHint - State setter for hints
 * @param {Function} params.setHintData - State setter for specialized hint data (visuals)
 * @param {boolean} params.isTrainSchedule - Flag for Train Schedule level type
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
    // === VISUALIZATION UPDATE FOR TRAIN SCHEDULE ===
    if (isTrainSchedule && typeof setHintData === 'function') {
        const assignments = globalThis.assignments || [];
        // Capture platform count if available (for "Used X platforms" feedback)
        const resultPlatforms = functionReturnValue;

        console.log('🔍 [Train Schedule] Updating visualization with assignments:', assignments);

        setHintData(prev => ({
            ...prev,
            assignments: assignments,
            result: { platforms: resultPlatforms },
            animationStep: assignments.length
        }));
    }

    if (currentLevel?.test_cases && currentLevel.test_cases.length > 0 && functionName) {

        console.log("🔍 ✅ Condition passed! Checking test cases for function:", functionName);

        // Prepare game functions for test case execution (without visual feedback)
        // No-op functions for visual feedback (test cases run in background)
        const noOpVisual = () => Promise.resolve();
        const noOpVisualSync = () => { };
        const noOpMove = () => Promise.resolve(true); // No-op for movement

        const gameFunctionsForTest = {
            // Movement functions - all no-op for test cases (no visual feedback)
            moveForward: noOpMove,
            turnLeft: noOpVisual,
            turnRight: noOpVisual,
            hit: noOpMove,
            foundMonster: () => false,
            canMoveForward: () => true,
            nearPit: () => false,
            atGoal: () => false,
            // Coin functions - no-op
            collectCoin: noOpMove,
            haveCoin: () => false,
            getCoinCount: () => 0,
            getCoinValue: () => 0,
            swapCoins: noOpMove,
            compareCoins: () => 0,
            isSorted: () => true,
            getPlayerCoins: () => [],
            addCoinToPlayer: noOpMove,
            clearPlayerCoins: noOpVisualSync,
            swapPlayerCoins: noOpMove,
            comparePlayerCoins: () => 0,
            getPlayerCoinValue: () => 0,
            getPlayerCoinCount: () => 0,
            arePlayerCoinsSorted: () => true,
            // Person rescue functions - no-op
            rescuePersonAtNode: noOpMove,
            hasPerson: () => false,
            personRescued: () => false,
            getPersonCount: () => 0,
            // Coin Change tracking function - needs to work for test cases
            trackCoinChangeDecision: trackCoinChangeDecision,
            allPeopleRescued: () => true,
            // Stack functions - no-op
            getStack: () => [],
            pushToStack: noOpMove,
            popFromStack: () => null,
            isStackEmpty: () => true,
            getStackCount: () => 0,
            hasTreasureAtNode: () => false,
            collectTreasure: noOpMove,
            isTreasureCollected: () => false,
            clearStack: noOpVisualSync,
            pushNode: noOpMove,
            popNode: noOpMove,
            keepItem: noOpMove,
            hasTreasure: () => false,
            treasureCollected: () => false,
            stackEmpty: () => true,
            stackCount: () => 0,
            // Movement functions - all no-op for test cases
            moveToNode: noOpMove,
            moveAlongPath: noOpVisual,
            getCurrentNode: () => 0, // Return default node
            // Graph functions - use non-visual versions
            getGraphNeighbors: getGraphNeighborsNoVisual || getGraphNeighbors,
            getGraphNeighborsWithWeight: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
            getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,
            // Visual functions - all no-op for test cases
            getGraphNeighborsWithVisual: getGraphNeighborsNoVisual || getGraphNeighbors,
            getGraphNeighborsWithVisualSync: getGraphNeighborsNoVisual || getGraphNeighbors,
            getGraphNeighborsWithWeightWithVisualSync: getGraphNeighborsWithWeightNoVisual || getGraphNeighborsWithWeight,
            markVisitedWithVisual: noOpVisual,
            showPathUpdateWithVisual: noOpVisual,
            clearDfsVisuals: noOpVisualSync,
            showMSTEdges: noOpVisualSync,
            findMinIndex, findMaxIndex, // Keep this as it's needed for algorithms
            getAllEdges, // Keep this as it's needed for algorithms
            sortEdgesByWeight, // Keep this as it's needed for algorithms
            dsuFind, // Keep this as it's needed for algorithms
            dsuUnion, // Keep this as it's needed for algorithms
            showMSTEdgesFromList: noOpVisualSync,
            showKruskalRoot: noOpVisualSync,
            clearKruskalVisuals: noOpVisualSync,
            updateDijkstraVisited: noOpVisualSync,
            updateDijkstraPQ: noOpVisualSync,
            updateMSTWeight: noOpVisualSync,
            resetDijkstraState: noOpVisualSync,
            selectKnapsackItemVisual: noOpVisualSync,
            unselectKnapsackItemVisual: noOpVisualSync,
            resetKnapsackItemsVisual: noOpVisualSync,
            knapsackMaxWithVisual: knapsackMaxWithVisual, // Need this for knapsack test cases
            addWarriorToSide1Visual: noOpVisualSync,
            addWarriorToSide2Visual: noOpVisualSync,
            resetSubsetSumWarriorsVisual: noOpVisualSync,
            updateSubsetSumCellVisual: noOpVisualSync,
            updateCoinChangeCellVisual: noOpVisualSync,
            // Coin Change tracking function - needs to work for test cases
            trackCoinChangeDecision: trackCoinChangeDecision,
            listPush, listSet, dictSet,
            highlightEmeiPath: noOpVisual,
            getCurrentGameState,
            setCurrentGameState
        };

        // Wait for any running N-Queen visual animation to finish so victory isn't declared prematurely
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
        console.log("\n🔍 ===== TEST CASE RESULT SUMMARY =====");
        console.log("🔍 Passed:", testCaseResult.passed);
        console.log("🔍 Total tests:", testCaseResult.totalTests);
        console.log("🔍 Passed tests:", testCaseResult.passedTests.length, testCaseResult.passedTests);
        console.log("🔍 Failed tests:", testCaseResult.failedTests.length, testCaseResult.failedTests);
        console.log("🔍 Message:", testCaseResult.message);
        console.log("🔍 ======================================\n");

        // Show knapsack final selection after code execution completes
        if (currentLevel?.knapsackData) {
            await showKnapsackFinalSelection();
        }

        // Show subset sum final solution after code execution completes
        // This ensures all warriors are placed correctly even if algorithm stops early
        if (currentLevel?.subsetSumData) {
            const targetSum = currentLevel.subsetSumData.target_sum || 0;
            await showSubsetSumFinalSolutionVisual(targetSum);
        }

        // Show coin change final solution after code execution completes
        // This displays warriors that were selected during execution
        if (currentLevel?.coinChangeData) {
            await showCoinChangeFinalSolution();
        }

        // Store test case result in game state for victory condition check
        setCurrentGameState({
            testCaseResult: testCaseResult
        });
        console.log("🔍 Stored testCaseResult in game state");

        // Update UI with test results
        if (setTestCaseResult) {
            setTestCaseResult(testCaseResult);
        }

        if (!testCaseResult.passed) {
            setCurrentHint(testCaseResult.message);
        } else {
            setCurrentHint(testCaseResult.message);
        }

        return testCaseResult;
    } else {
        console.log("🔍 ❌ Condition NOT passed - test cases check skipped");
        console.log("🔍 Reasons:", {
            noTestCases: !currentLevel?.test_cases,
            emptyTestCases: currentLevel?.test_cases?.length === 0,
            noFunctionName: !functionName
        });
        return null;
    }
};
