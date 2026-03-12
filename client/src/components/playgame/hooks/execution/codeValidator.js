/**
 * Validates the Blockly workspace for common errors before execution.
 * @param {object} workspace - The Blockly workspace instance
 * @param {object} levelData - Optional level data containing constraints (maxBlocks, restrictedBlocks)
 * @returns {object} { isValid: boolean, error: string | null }
 */
export const validateWorkspace = (workspace, levelData = {}) => {
    if (!workspace) return { isValid: true, error: null };

    const topBlocks = workspace.getTopBlocks(false);

    // 1. Check if workspace is empty
    if (topBlocks.length === 0) {
        return {
            isValid: false,
            error: "พื้นที่การทำงานว่างเปล่า กรุณาวางบล็อกเพื่อเริ่มเขียนโปรแกรม"
        };
    }

    // 2. Check for orphaned (disconnected) blocks
    // Top blocks that are NOT function definitions should be connected in a single stack.
    // If there are multiple, the user has floating blocks that would generate unintended code.
    const orphanBlocks = topBlocks.filter(b =>
        !b.type.startsWith('procedures_def') &&
        !b.type.startsWith('function_def')
    );
    if (orphanBlocks.length > 1) {
        return {
            isValid: false,
            error: "มีบล็อกที่ไม่ได้เชื่อมต่อกัน! กรุณาต่อบล็อกทั้งหมดเข้าด้วยกัน หรือลบบล็อกที่ไม่ใช้ออก"
        };
    }

    // 3. Check for Block Constraints (Max Blocks)
    const allBlocks = workspace.getAllBlocks(false);

    if (levelData && levelData.maxBlocks && typeof levelData.maxBlocks === 'number' && levelData.maxBlocks > 0) {
        // Exclude system/setup blocks like start_game if applicable, but for simplicity we count all generated blocks
        if (allBlocks.length > levelData.maxBlocks) {
            return {
                isValid: false,
                error: `ใช้บล็อกเกินโควต้า! (ใช้จำกัด ${levelData.maxBlocks} บล็อก)`
            };
        }
    }

    // 4. Iterate all blocks to check for restricted blocks
    for (const block of allBlocks) {
        // Check for Restricted Blocks
        if (levelData && levelData.restrictedBlocks && Array.isArray(levelData.restrictedBlocks)) {
            if (levelData.restrictedBlocks.includes(block.type)) {
                return {
                    isValid: false,
                    error: `ด่านนี้ไม่อนุญาตให้ใช้งานบล็อก: ${block.type}`
                };
            }
        }
    }

    return { isValid: true, error: null };
};

/**
 * Maps system error messages to user-friendly Thai messages.
 * @param {Error} error - The error object
 * @returns {string} User friendly message
 */
export const mapRuntimeErrorToMessage = (error) => {
    const msg = error?.message || "";

    if (msg.includes("Maximum call stack size exceeded") || msg.includes("infinitely")) {
        return "เกิด Loop หรือการเรียกฟังก์ชันซ้ำซ้อนไม่สิ้นสุด (Infinite Loop/Recursion)";
    }

    if (msg.includes("LoopTrap")) {
        return "โปรแกรมทำงานนานเกินไป อาจเกิดจาก Infinite Loop";
    }

    if (msg.includes("is not defined")) {
        return `ตัวแปร ${msg} ไม่ได้ถูกประกาศ (Variable not defined)`;
    }

    if (msg.includes("Script execution timed out")) {
        return "โปรแกรมทำงานนานผิดปกติ (Timeout)";
    }

    // Common JS Idioms -> Thai
    if (msg.includes("Cannot read properties of undefined") || msg.includes("Cannot read property")) {
        return "เกิดข้อผิดพลาด: พยายามใช้งานค่าที่ไม่มีอยู่จริง (Undefined/Null)";
    }

    if (msg.includes("is not a function")) {
        return "เกิดข้อผิดพลาด: เรียกใช้งานสิ่งที่ไม่ใช่ฟังก์ชัน";
    }

    if (msg.includes("Assignment to constant variable")) {
        return "เกิดข้อผิดพลาด: พยายามแก้ไขค่าตัวแปรที่ห้ามแก้ไข (Constant)";
    }

    if (msg.includes("invalid assignment")) {
        return "เกิดข้อผิดพลาด: การกำหนดค่าไม่ถูกต้อง";
    }

    // Default: pass through but clean up a bit if needed
    return `ข้อผิดพลาดของระบบ: ${msg}`;
};
