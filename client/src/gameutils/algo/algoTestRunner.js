/**
 * algoTestRunner.js — Record & Playback System
 *
 * ตรวจผลลัพธ์ที่ได้จาก algoExecutor กับ Test Cases
 * ใช้ compareOutput จาก testcase เดิมเพื่อ reuse logic เปรียบเทียบ
 */

import { compareOutput } from './resultComparator';
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



    if (!relevant.length) {
        return { passed: true, passedTests: [], failedTests: [], totalTests: 0, message: `ไม่มี test cases สำหรับ function: ${functionName}` };
    }

    const passedTests = [];
    const failedTests = [];
    for (const tc of relevant) {
        let actual;
        let input = tc.input_params || {};
        if (typeof input === 'string') try { input = JSON.parse(input); } catch { input = {}; }

        console.groupCollapsed(`🧪 Testing: ${tc.test_case_name} (${tc.is_primary ? 'Primary - ใช้ข้อมูลด่าน' : 'Secondary - แยกข้อมูล'})`);

        // Primary test case: use the result from the visual run
        if (tc.is_primary && primaryResult !== undefined && primaryResult !== null) {
            console.log('📌 Input data: [ดึงผลลัพธ์จาก Primary Run โดยตรง]');
            actual = primaryResult;
        } else {
            // Secondary test cases: re-execute with test-specific inputs
            const testLevelData = buildTestLevelData(levelData, input, functionName);
            console.log('📦 Built Test Level Data (Strict Isolation):', testLevelData);

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

        passed = compareOutput(actual, expected, comparisonType);

        console.log(`✅ Expected:`, expected);
        console.log(`🔄 Actual:`, actual);
        console.log(`⚖️ Comparison (${comparisonType}):`, passed ? 'PASSED 🟢' : 'FAILED 🔴');
        console.groupEnd();

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
 * สร้าง Object levelData จำลองสำหรับรัน Secondary Test Case
 * 
 * ⚠️ STRICT: ใช้เฉพาะข้อมูลจาก inputParams เท่านั้น
 * ห้ามดึงข้อมูลจากด่านเด็ดขาด (ป้องกัน data leak)
 */

// แมป function_name → algo_data.type ของ Context ที่ใช้
const FUNCTION_TO_ALGO_TYPE = {
    DFS: 'GRAPH', BFS: 'GRAPH', DIJ: 'GRAPH', PRIM: 'GRAPH', KRUSKAL: 'GRAPH',
    KNAPSACK: 'KNAPSACK',
    COINCHANGE: 'COINCHANGE',
    SUBSETSUM: 'SUBSETSUM',
    SOLVE: 'NQUEEN',
    SOLVEROPE: 'SOLVEROPE',
    MAXCAPACITY: 'EMEI',
};

function buildTestLevelData(baseLevelData, inputParams, functionName) {
    const fn = functionName?.toUpperCase() || '';
    const algoType = FUNCTION_TO_ALGO_TYPE[fn];

    // สร้าง shell ว่างเปล่า — ไม่ clone จากด่าน
    const testLevel = {};

    // === Graph-based algorithms (DFS/BFS/DIJ/PRIM/KRUSKAL) ===
    // graphContext อ่าน: nodes, edges, start_node_id, goal_node_id
    const rawEdges = inputParams.edges || inputParams.map;
    if (Array.isArray(rawEdges)) {
        testLevel.edges = rawEdges.map(e => {
            if (Array.isArray(e)) return { from: e[0], to: e[1], value: e[2] || 1 };
            return e;
        });
        const nodeSet = new Set();
        testLevel.edges.forEach(e => {
            if (e.from !== undefined) nodeSet.add(e.from);
            if (e.to !== undefined) nodeSet.add(e.to);
        });
        testLevel.nodes = Array.from(nodeSet).map(id => ({ id, x: 0, y: 0 }));
    } else {
        testLevel.edges = [];
        testLevel.nodes = [];
    }

    testLevel.start_node_id = inputParams.start ?? 0;
    testLevel.goal_node_id = inputParams.goal ?? 0;

    // === Non-graph algorithms → ใช้ algo_data ===
    // getAlgoPayload() ต้องเห็น algo_data.type ตรงกันถึงจะ inject context
    if (algoType && algoType !== 'GRAPH') {
        testLevel.algo_data = {
            type: algoType,
            payload: { ...inputParams },
        };
    }

    // === Emei special fields ===
    if (algoType === 'EMEI') {
        testLevel.emeiN = inputParams.n ?? 0;
        testLevel.emeiEdges = inputParams.edges ?? [];
        testLevel.emeiStart = inputParams.start ?? 0;
        testLevel.emeiEnd = inputParams.end ?? 0;
        testLevel.emeiTourists = inputParams.tourists ?? 0;
        testLevel.algo_data = {
            type: 'EMEI',
            payload: { ...inputParams },
        };
    }

    return testLevel;
}

