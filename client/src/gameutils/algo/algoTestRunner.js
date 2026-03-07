/**
 * algoTestRunner.js — Record & Playback System
 *
 * ตรวจผลลัพธ์ที่ได้จาก algoExecutor กับ Test Cases
 * ใช้ compareOutput จาก testcase เดิมเพื่อ reuse logic เปรียบเทียบ
 */

import { compareOutput, isValidNQueenSolution } from './resultComparator';
import { executeAlgoCode } from './algoExecutor';

/**
 * ตรวจ test cases ทั้งหมดสำหรับ algo level
 *
 * @param {*} primaryResult - ผลจากการรัน primary test case (visual run)
 * @param {Array} testCases - test cases จาก DB
 * @param {string} functionName - ชื่อ function (เช่น "DFS", "NQUEEN")
 * @param {string} code - Blockly generated code
 * @param {Object} levelData - ข้อมูล level ทั้งหมด
 * @returns {{ passed, passedTests, failedTests, message, totalTests }}
 */
export async function checkAlgoTestCases(primaryResult, testCases, functionName, code, levelData) {
    if (!testCases?.length) {
        return { passed: true, passedTests: [], failedTests: [], totalTests: 0, message: 'ไม่มี test cases สำหรับตรวจสอบ' };
    }

    let relevant = testCases.filter(tc =>
        tc.function_name?.toUpperCase() === functionName?.toUpperCase()
    );

    const isEmeiMountain = levelData.applied_data?.type?.includes('EMEI') ||
        levelData.applied_data?.type?.includes('MAX_CAPACITY') ||
        levelData.game_type === 'emei_mountain' ||
        levelData.level_name?.includes('ง้อไบ๊') ||
        functionName?.toUpperCase() === 'EMEI' ||
        functionName?.toUpperCase() === 'MAXCAPACITY' ||
        code.includes('showEmeiFinalResult');

    // Fallback if user renamed function but it's Emei Mountain
    if (!relevant.length && isEmeiMountain) {
        relevant = testCases.filter(tc => tc.function_name?.toUpperCase() === 'MAXCAPACITY');
    }

    if (!relevant.length) {
        return { passed: true, passedTests: [], failedTests: [], totalTests: 0, message: `ไม่มี test cases สำหรับ function: ${functionName}` };
    }

    const passedTests = [];
    const failedTests = [];

    const isNQueen = functionName?.toUpperCase() === 'NQUEEN'
        || (code.includes('board') && code.includes('safe(') && code.includes('place('));

    for (const tc of relevant) {
        let actual;
        let input = tc.input_params || {};
        if (typeof input === 'string') try { input = JSON.parse(input); } catch { input = {}; }

        // Primary test case: use the result from the visual run
        if (tc.is_primary && primaryResult !== undefined && primaryResult !== null) {
            actual = primaryResult;
        } else {
            // Secondary test cases: re-execute with test-specific inputs
            // Build a modified levelData with the test inputs
            const testLevelData = buildTestLevelData(levelData, input, functionName);
            const { result, error } = await executeAlgoCode(code, testLevelData);

            if (error) {
                console.error('🔴 [algoTestRunner] TC Error:', { message: error.message, stack: error.stack, tc: tc.test_case_name });
                actual = undefined;
            } else {
                actual = result;
            }
        }

        // Compare
        const expected = tc.expected_output;
        const comparisonType = tc.comparison_type || 'exact';
        let passed;

        if (isNQueen) {
            if (Array.isArray(actual) && actual.length > 0) {
                const n = (typeof input.n === 'number' ? input.n : undefined) || actual.length;
                passed = isValidNQueenSolution(actual, n);
            } else {
                const noSolution = actual === null || actual === undefined || (Array.isArray(actual) && actual.length === 0);
                const expectedNoSolution = expected === null || expected === undefined || (Array.isArray(expected) && expected.length === 0);
                passed = noSolution && expectedNoSolution;
            }
        } else {
            passed = compareOutput(actual, expected, comparisonType);
        }

        const result = {
            test_case_id: tc.test_case_id,
            test_case_name: tc.test_case_name,
            is_primary: tc.is_primary,
            input: tc.input_params,
            expected,
            actual
        };

        (passed ? passedTests : failedTests).push(result);
    }

    // Summary
    const primaryTest = relevant.find(tc => tc.is_primary);
    const primaryPassed = primaryTest
        ? passedTests.some(t => t.test_case_id === primaryTest.test_case_id)
        : (failedTests.length === 0);

    const totalTests = relevant.length;
    const secondaryPassed = passedTests.filter(t => {
        const tc = relevant.find(r => r.test_case_id === t.test_case_id);
        return tc && !tc.is_primary;
    }).length;
    const secondaryTotal = relevant.filter(tc => !tc.is_primary).length;

    let message;
    if (primaryTest) {
        if (!primaryPassed) message = '❌ ไม่ผ่าน test case หลัก';
        else if (secondaryPassed === secondaryTotal && secondaryTotal > 0)
            message = `✅ ผ่าน test cases ทั้งหมด (${passedTests.length}/${totalTests})`;
        else if (secondaryTotal > 0)
            message = `❌ ไม่ผ่าน test case ลับ (${secondaryPassed}/${secondaryTotal} ผ่าน)`;
        else message = '✅ ผ่าน test case หลัก';
    } else {
        message = primaryPassed && failedTests.length === 0
            ? `✅ ผ่าน test cases ทั้งหมด (${passedTests.length}/${totalTests})`
            : `❌ ไม่ผ่าน test cases (${passedTests.length}/${totalTests})`;
    }

    const allPassed = primaryPassed && failedTests.length === 0;
    return { passed: allPassed, passedTests, failedTests, message, totalTests, primaryPassed };
}

/**
 * สร้าง levelData แบบสำหรับ test case (override input params)
 */
function buildTestLevelData(baseLevelData, inputParams, functionName) {
    const testLevel = { ...baseLevelData };
    // IMPORTANT: Deep-copy appliedData to prevent mutation of the original level data
    if (testLevel.applied_data) {
        testLevel.applied_data = {
            ...testLevel.applied_data,
            payload: testLevel.applied_data.payload ? { ...testLevel.applied_data.payload } : {}
        };
    }

    // Override start/goal from test params
    if (inputParams.start !== undefined) testLevel.start_node_id = inputParams.start;
    if (inputParams.goal !== undefined) testLevel.goal_node_id = inputParams.goal;

    // Graph-based: override map/edges
    const customGraph = inputParams.map || inputParams.graph || inputParams.edges;
    if (customGraph && typeof customGraph !== 'string') {
        // customGraph is edge list like [[0,1],[1,2]] or [{from:0,to:1}]
        if (Array.isArray(customGraph)) {
            testLevel.edges = customGraph.map(e => {
                if (Array.isArray(e)) return { from: e[0], to: e[1], value: e[2] || 1 };
                return e;
            });

            // Auto-generate nodes from edges
            const nodeSet = new Set();
            testLevel.edges.forEach(e => {
                if (e.from !== undefined) nodeSet.add(e.from);
                if (e.to !== undefined) nodeSet.add(e.to);
            });
            testLevel.nodes = Array.from(nodeSet).map(id => ({ id, x: 0, y: 0 }));
        }
    }
    // If graph is "map" string → keep baseLevelData edges, just use new start/goal
    // (Already handled: we spread baseLevelData and only overrode start/goal above)

    // N-Queen: override n
    if (inputParams.n !== undefined && testLevel.nqueen_data) {
        testLevel.nqueen_data = { ...testLevel.nqueen_data, n: inputParams.n };
    }

    // CoinChange: override warriors/monster_power (also accept amount/coins aliases)
    if (testLevel.coin_change_data) {
        const mp = inputParams.monster_power ?? inputParams.amount;
        const wa = inputParams.warriors ?? inputParams.coins;
        if (mp !== undefined) {
            testLevel.coin_change_data = { ...testLevel.coin_change_data, monster_power: mp };
        }
        if (wa !== undefined) {
            testLevel.coin_change_data = { ...testLevel.coin_change_data, warriors: wa };
        }
    }

    // Knapsack: override items/capacity/weights/values
    if (testLevel.knapsack_data) {
        const testKnapsackData = { ...testLevel.knapsack_data };
        if (inputParams.capacity !== undefined) testKnapsackData.capacity = inputParams.capacity;
        else if (inputParams.j !== undefined) testKnapsackData.capacity = inputParams.j; // fallback for DP test cases

        if (inputParams.items !== undefined) testKnapsackData.items = inputParams.items;
        else if (inputParams.weights !== undefined && inputParams.values !== undefined) {
            testKnapsackData.items = inputParams.weights.map((w, i) => ({ weight: w, price: inputParams.values[i] }));
        } else if (inputParams.w !== undefined && inputParams.v !== undefined) {
            testKnapsackData.items = inputParams.w.map((weight, idx) => ({ weight: weight, price: inputParams.v[idx] }));
        }

        if (testKnapsackData.items) {
            testKnapsackData.n = testKnapsackData.items.length;
        }

        testLevel.knapsack_data = testKnapsackData;
    }

    // SubsetSum: override warriors/target_sum
    if (testLevel.subset_sum_data) {
        const testSubsetSumData = { ...testLevel.subset_sum_data };
        if (inputParams.target_sum !== undefined) testSubsetSumData.target_sum = inputParams.target_sum;
        else if (inputParams.target !== undefined) testSubsetSumData.target_sum = inputParams.target;

        if (inputParams.warriors !== undefined) testSubsetSumData.warriors = inputParams.warriors;
        else if (inputParams.arr !== undefined) testSubsetSumData.warriors = inputParams.arr;

        testLevel.subset_sum_data = testSubsetSumData;
    }

    // Emei Mountain: override n, edges, start, end, tourists
    const isEmeiMountain = testLevel.applied_data?.type?.includes('EMEI') ||
        testLevel.applied_data?.type?.includes('MAX_CAPACITY') ||
        testLevel.game_type === 'emei_mountain' ||
        testLevel.level_name?.includes('ง้อไบ๊') ||
        functionName?.toUpperCase() === 'EMEI' ||
        functionName?.toUpperCase() === 'MAXCAPACITY';

    if (isEmeiMountain) {
        // Inject test inputs as FLAT properties on testLevel
        // because the real level's appliedData.payload does not have these fields.
        if (inputParams.n !== undefined) testLevel.emeiN = inputParams.n;
        if (inputParams.edges !== undefined) testLevel.emeiEdges = inputParams.edges;
        if (inputParams.start !== undefined) testLevel.emeiStart = inputParams.start;
        if (inputParams.end !== undefined) testLevel.emeiEnd = inputParams.end;
        if (inputParams.tourists !== undefined) testLevel.emeiTourists = inputParams.tourists;
        else if (inputParams.tourist !== undefined) testLevel.emeiTourists = inputParams.tourist;
        // Also set on appliedData.payload as before (for levels that do store this there)
        if (!testLevel.applied_data) testLevel.applied_data = { type: 'EMEI_MOUNTAIN', payload: {} };
        if (!testLevel.applied_data.payload) testLevel.applied_data.payload = {};
        const p = testLevel.applied_data.payload;
        if (inputParams.n !== undefined) p.n = inputParams.n;
        if (inputParams.edges !== undefined) p.edges = inputParams.edges;
        if (inputParams.start !== undefined) p.start = inputParams.start;
        if (inputParams.end !== undefined) p.end = inputParams.end;
        if (inputParams.tourists !== undefined) p.tourists = inputParams.tourists;
        else if (inputParams.tourist !== undefined) p.tourists = inputParams.tourist;
    }

    return testLevel;
}
