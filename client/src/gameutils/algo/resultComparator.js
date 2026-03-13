/**
 * ระบบตรวจคำตอบ (Result Comparator)
 * ทำหน้าที่เปรียบเทียบคำตอบที่ Blockly คำนวณได้ (Actual) กับคำตอบที่คาดหวังจาก DB (Expected)
 */

/**
 * เปรียบเทียบผลลัพธ์ตามประเภทของการทดสอบที่กำหนดไว้
 * @param {*} actual - คำตอบที่โปรแกรมรันออกมาได้
 * @param {*} expected - คำตอบเฉลย
 * @param {string} comparisonType - โหมดการตรวจคำตอบ (เช่น 'exact', 'array_equals', 'number_equals')
 * @returns {boolean} - true ถ้าตรงกัน, false ถ้าผิด
 */
export function compareOutput(actual, expected, comparisonType = 'exact') {
    switch (comparisonType) {

        // ---------------------------------------------------------
        // 1. โหมดตรวจเทียบค่าความจริง (Boolean)
        // ---------------------------------------------------------
        case 'boolean_equals': {
            // แปลง string 'true' / 'false' ให้กลายเป็น boolean จริงๆ เผื่อ DB ส่งมาเป็น string
            const normalizeBoolean = (val) => {
                if (val === 'true' || val === true) return true;
                if (val === 'false' || val === false) return false;
                return val;
            };

            return normalizeBoolean(actual) === normalizeBoolean(expected);
        }

        // ---------------------------------------------------------
        // 2. โหมดตรวจเทียบความเป๊ะ (Exact)
        // ---------------------------------------------------------
        case 'exact': {
            // ใช้ JSON.stringify ทำให้เทียบ Object และ Array เชิงลึกได้ง่ายที่สุด
            return JSON.stringify(actual) === JSON.stringify(expected);
        }

        // ---------------------------------------------------------
        // 3. โหมดตรวจเทียบอาร์เรย์ (Array Equals)
        // ---------------------------------------------------------
        case 'array_equals': {
            // ถ้าไม่ใช่ Array ทั้งคู่ ให้ถือว่าผิด
            if (!Array.isArray(actual) || !Array.isArray(expected)) return false;

            // ขนาดไม่เท่ากัน แปลว่าเก็บมาไม่ครบ ถือว่าผิด
            if (actual.length !== expected.length) return false;

            // ตรวจว่ามันคือ "อาร์เรย์ของคู่พิกัด" หรือไม่ (เช่น [[0,1], [1,2]])
            // ถ้าใช่ เราจะอนุญาตให้สลับที่กันได้ (ขอบอกแค่ว่าในถุงมีคู่พิกัดครบก็พอ)
            let isActualPairs = true;
            for (let i = 0; i < actual.length; i++) {
                const item = actual[i];
                if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'number') {
                    isActualPairs = false;
                    break;
                }
            }

            let isExpectedPairs = true;
            for (let i = 0; i < expected.length; i++) {
                const item = expected[i];
                if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'number') {
                    isExpectedPairs = false;
                    break;
                }
            }

            // ถ้าเป็นอาร์เรย์พิกัดทั้งคู่ ให้ใช้วิธีเช็คแบบ "ไม่สนลำดับ" (Unordered Set)
            if (isActualPairs && isExpectedPairs) {
                // แปลงคำตอบให้เป็น String ก้อนๆ จะได้เทียบง่ายๆ เช่น "0,1"
                const createHashKey = (pair) => pair[0] + "," + pair[1];

                // โยนลง Set เพื่อค้นหาไวๆ
                const actualSet = new Set();
                for (const pair of actual) {
                    actualSet.add(createHashKey(pair));
                }

                // เช็คว่าเฉลยทุกคู่ มีอยู่ในคำตอบที่ส่งมาหรือไม่
                for (const pair of expected) {
                    if (!actualSet.has(createHashKey(pair))) {
                        return false;
                    }
                }
                return true;
            }

            // ถ้าไม่ใช่อาร์เรย์พิกัด ให้ไล่เช็คทีละตัวตามลำดับ (Sequential Check)
            for (let i = 0; i < actual.length; i++) {
                if (!deepEqual(actual[i], expected[i])) {
                    return false;
                }
            }
            return true;
        }

        // ---------------------------------------------------------
        // 4. โหมดตรวจเทียบตัวเลข (Number Equals)
        // ---------------------------------------------------------
        case 'number_equals': {
            const numActual = Number(actual);
            const numExpected = Number(expected);

            // ตรวจสอบว่าแปลงเป็นตัวเลขได้จริงทั้งคู่ และค่าต้องเท่ากัน
            if (!isNaN(numActual) && !isNaN(numExpected)) {
                return numActual === numExpected;
            }
            return false;
        }

        // ---------------------------------------------------------
        // Default (ถ้าไม่ระบุ หรือหลุดเคส ให้ใช้สูตร Exact)
        // ---------------------------------------------------------
        default: {
            return JSON.stringify(actual) === JSON.stringify(expected);
        }
    }
}

// =========================================================================
// ตัวช่วยเทียบความเหมือนเจาะลึกแบบทะลุ Array/Object (Deep Equality)
// =========================================================================
function deepEqual(valA, valB) {
    // ถ้าตัวเดียวกันเป๊ะ (เช่น 1 === 1 หรือ "A" === "A")
    if (valA === valB) return true;

    // ถ้าเป็นเบอร์ตอง Array ทั้งคู่ ต้องเทียบไส้ในทีละตัว
    if (Array.isArray(valA) && Array.isArray(valB)) {
        if (valA.length !== valB.length) return false;

        for (let i = 0; i < valA.length; i++) {
            if (!deepEqual(valA[i], valB[i])) {
                return false;
            }
        }
        return true;
    }

    // ถ้าเป็น Object ทั้งคู่ (และต้องไม่ใช่ null)
    if (valA && typeof valA === 'object' && valB && typeof valB === 'object') {
        const keysA = Object.keys(valA).sort();
        const keysB = Object.keys(valB).sort();

        // เช็คว่าจำนวน Key เท่ากันมั้ย
        if (keysA.length !== keysB.length) return false;

        // ไล่เช็ค Value ของทุกๆ Key ว่าเหมือนกันหรือไม่
        for (let i = 0; i < keysA.length; i++) {
            const keyName = keysA[i];

            // เช็คว่าชื่อ Key ตรงกัน และไส้ในตรงกันหรือไม่
            if (keyName !== keysB[i] || !deepEqual(valA[keyName], valB[keyName])) {
                return false;
            }
        }
        return true;
    }

    // ถ้าหลุดมาถึงนี่ แปลว่าหน้าตาไม่เหมือนกันแล้วล่ะ
    return false;
}


