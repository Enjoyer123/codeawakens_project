/**
 * Validates the Blockly workspace for common errors before execution.
 * @param {object} workspace - The Blockly workspace instance
 * @returns {object} { isValid: boolean, error: string | null }
 */
export const validateWorkspace = (workspace) => {
    if (!workspace) return { isValid: true, error: null };

    const topBlocks = workspace.getTopBlocks(false);

    // 1. Check if workspace is empty
    if (topBlocks.length === 0) {
        return {
            isValid: false,
            error: "พื้นที่การทำงานว่างเปล่า กรุณาวางบล็อกเพื่อเริ่มเขียนโปรแกรม"
        };
    }

    // 2. Check for unconnected blocks (orphaned blocks)
    // A block is orphaned if it's not the 'start_block' (if exists) and not connected to anything relevant.
    // However, usually we can just check if there are multiple top blocks that are not Function definitions.
    // Note: Some levels might allow multiple stacks, but usually we want one main flow.
    // For now, let's skip strict orphaned check as it might be annoying, 
    // but we SHOULD check if the main `start_game` block exists if required.

    // 3. Iterate all blocks to check for empty inputs/fields
    const allBlocks = workspace.getAllBlocks(false);

    for (const block of allBlocks) {
        // Skip disabled blocks
        if (!block.isEnabled()) continue;

        // Check loops (while_loop)
        if (block.type === 'while_loop') {
            const condition = block.getInputTargetBlock('CONDITION');
            if (!condition) {
                console.warn("Validation failed: Loop missing condition");
                return {
                    isValid: false,
                    error: "พบ Loop ที่ไม่มีเงื่อนไข! กรุณาใส่เงื่อนไขในบล็อก Loop"
                };
            }
        }

        // Check If-Only and If-Else
        if (block.type === 'if_only' || block.type === 'if_else') {
            // Check 'CONDITION' input
            const condition = block.getInputTargetBlock('CONDITION');
            if (!condition) {
                console.warn("Validation failed: IF missing condition");
                return {
                    isValid: false,
                    error: "พบเงื่อนไข IF ที่ว่างเปล่า! กรุณาใส่เงื่อนไขให้ครบถ้วน"
                };
            }
        }

        // Check If-Return
        if (block.type === 'if_return') {
            const condition = block.getInputTargetBlock('CONDITION');
            if (!condition) {
                return {
                    isValid: false,
                    error: "พบเงื่อนไข If Return ที่ว่างเปล่า! กรุณาใส่เงื่อนไข"
                };
            }
        }

        // Note: 'repeat' block uses FieldNumber, so it always has a value. No check needed.

        // Check missing values in logic_compare, math_arithmetic, math_compare, logic_operation
        if (block.type === 'logic_compare' || block.type === 'math_arithmetic' || block.type === 'math_compare' || block.type === 'logic_operation') {
            const inputA = block.getInputTargetBlock('A');
            const inputB = block.getInputTargetBlock('B');
            if (!inputA || !inputB) {
                return {
                    isValid: false,
                    error: "พบการเปรียบเทียบหรือคำนวณที่ค่าไม่ครบ! กรุณาใส่ค่าให้ครบทั้งสองช่อง"
                };
            }
        }

        // Check logic_negate
        if (block.type === 'logic_negate') {
            const inputBool = block.getInputTargetBlock('BOOL');
            if (!inputBool) {
                return {
                    isValid: false,
                    error: "พบเงื่อนไข 'ไม่ใช่' (Not) ที่ว่างเปล่า"
                };
            }
        }
        // Check Variable Set
        if (block.type === 'variables_set') {
            const value = block.getInputTargetBlock('VALUE');
            if (!value) {
                return {
                    isValid: false,
                    error: "พบการกำหนดค่าตัวแปรที่ว่างเปล่า! กรุณาใส่ค่าที่ต้องการกำหนด"
                };
            }
        }


        // Check List Add
        if (block.type === 'lists_add_item') {
            const item = block.getInputTargetBlock('ITEM');
            if (!item) {
                return {
                    isValid: false,
                    error: "พบการเพิ่มข้อมูลลง List ที่ว่างเปล่า! กรุณาใส่ค่าที่ต้องการเพิ่ม"
                };
            }
        }

        // --- NEW: List Operations (Index Of, Get Index, Set Index) ---
        if (block.type === 'lists_indexOf') {
            const value = block.getInputTargetBlock('VALUE');
            if (!value) {
                return {
                    isValid: false,
                    error: "พบการค้นหาใน List ที่ว่างเปล่า! กรุณาใส่ค่าที่ต้องการค้นหา"
                };
            }
        }

        if (block.type === 'lists_getIndex' || block.type === 'lists_setIndex') {
            // Usually has 'AT' input for index
            const at = block.getInputTargetBlock('AT');
            if (!at) {
                return {
                    isValid: false,
                    error: "พบการเข้าถึง List โดยไม่ระบุตำแหน่ง (Index)! กรุณาใส่ตำแหน่งที่ต้องการ"
                };
            }
        }

        // --- NEW: Dictionary Operations ---
        if (block.type === 'dict_set') {
            const key = block.getInputTargetBlock('KEY');
            const value = block.getInputTargetBlock('VALUE');
            if (!key || !value) {
                return {
                    isValid: false,
                    error: "การกำหนดค่า Dictionary ไม่ครบ! กรุณาใส่ทั้ง Key และ Value"
                };
            }
        }

        if (block.type === 'dict_get') {
            const key = block.getInputTargetBlock('KEY');
            if (!key) {
                return {
                    isValid: false,
                    error: "การดึงค่าจาก Dictionary ขาด Key! กรุณาใส่ Key ที่ต้องการค้นหา"
                };
            }
        }

        // --- NEW: Loops (For Each) ---
        if (block.type === 'for_each_in_list' || block.type === 'lists_for_each') {
            const list = block.getInputTargetBlock('LIST');
            if (!list) {
                return {
                    isValid: false,
                    error: "พบ Loop ลิสต์ที่ไม่มีลิสต์ให้วน! กรุณาเชื่อมต่อ List ใส่ใน Loop"
                };
            }
        }

        if (block.type === 'for_loop_dynamic') {
            const from = block.getInputTargetBlock('FROM');
            const to = block.getInputTargetBlock('TO');
            if (!from || !to) {
                return {
                    isValid: false,
                    error: "พบ For Loop ที่กำหนดช่วงไม่ครบ! กรุณาใส่ค่าเริ่มต้นและค่าสิ้นสุด"
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
