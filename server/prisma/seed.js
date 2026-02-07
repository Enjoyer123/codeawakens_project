const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // 1. Victory Conditions
    const victoryConditions = [
        { type: 'reach_goal', description: 'ไปถึง Node เป้าหมาย', check: 'goalReached' },
        { type: 'coins_sorted', description: 'เรียงเหรียญจากน้อยไปมาก', check: 'coinsSorted' },
        { type: 'all_people_rescued', description: 'ช่วยคนทั้งหมด', check: 'allPeopleRescued' },
        { type: 'treasure_collected', description: 'เก็บสมบัติสำเร็จ', check: 'treasureCollected' },
        { type: 'all_coins_collected', description: 'เก็บเหรียญทั้งหมด', check: 'allCoinsCollected' },
        { type: 'back_to_start', description: 'กลับมาที่จุดเริ่มต้น', check: 'backToStart' },
        { type: 'mst_connected', description: 'เชื่อมต่อทุก node ได้', check: 'mstConnected' },
        { type: 'function_return_test', description: 'ตรวจสอบ return value ของ function กับ test cases', check: 'functionReturnTest' }
    ];

    for (const vc of victoryConditions) {
        await prisma.victoryCondition.upsert({
            where: { type: vc.type },
            update: vc,
            create: vc,
        });
    }
    console.log('✅ Victory Conditions seeded.');

    // 2. Blocks
    const blocks = [
        // Movement
        { block_key: 'move_forward', block_name: 'Move Forward', description: 'เดินไปข้างหน้า', category: 'movement', blockly_type: 'move_forward', syntax_example: 'await moveForward();' },
        { block_key: 'turn_left', block_name: 'Turn Left', description: 'เลี้ยวซ้าย', category: 'movement', blockly_type: 'turn_left', syntax_example: 'await turnLeft();' },
        { block_key: 'turn_right', block_name: 'Turn Right', description: 'เลี้ยวขวา', category: 'movement', blockly_type: 'turn_right', syntax_example: 'await turnRight();' },
        { block_key: 'move_to_node', block_name: 'Move to Node', description: 'เดินไปยัง node ที่กำหนด', category: 'movement', blockly_type: 'move_to_node', syntax_example: 'await moveToNode(nodeId);' },
        { block_key: 'move_along_path', block_name: 'Move Along Path', description: 'เดินตาม path', category: 'movement', blockly_type: 'move_along_path', syntax_example: 'await moveAlongPath(path);' },
        { block_key: 'place', block_name: 'Place Queen', description: 'วางควีน', category: 'movement', blockly_type: 'place', syntax_example: 'await place(row, col)' },
        { block_key: 'delete', block_name: 'Remove Queen', description: 'ยกควีนออก', category: 'movement', blockly_type: 'delete', syntax_example: 'await remove(row, col)' },
        { block_key: 'nqueen_place', block_name: 'Place Queen (N-Queen)', description: 'วางควีน (N-Queen)', category: 'movement', blockly_type: 'nqueen_place', syntax_example: 'await place(row, col)' },
        { block_key: 'nqueen_remove', block_name: 'Remove Queen (N-Queen)', description: 'ยกควีนออก (N-Queen)', category: 'movement', blockly_type: 'nqueen_remove', syntax_example: 'await remove(row, col)' },

        // Logic
        { block_key: 'hit', block_name: 'Hit', description: 'โจมตีศัตรู', category: 'logic', blockly_type: 'hit', syntax_example: 'await hit();' },
        { block_key: 'collect_coin', block_name: 'Collect Coin', description: 'เก็บเหรียญ', category: 'logic', blockly_type: 'collect_coin', syntax_example: 'await collectCoin();' },
        { block_key: 'keep_item', block_name: 'Keep Item', description: 'เก็บสมบัติ', category: 'logic', blockly_type: 'keep_item', syntax_example: 'keepItem()' },
        { block_key: 'rescue_person', block_name: 'Rescue Person', description: 'ช่วยคน', category: 'logic', blockly_type: 'rescue_person', syntax_example: 'await rescuePersonAtNode(nodeId);' },
        { block_key: 'rescue_person_at_node', block_name: 'Rescue Person At Node', description: 'ช่วยคนที่ node ที่กำหนด', category: 'logic', blockly_type: 'rescue_person_at_node', syntax_example: 'await rescuePersonAtNode(nodeId);' },
        { block_key: 'if_only', block_name: 'If', description: 'เงื่อนไข if', category: 'logic', blockly_type: 'controls_if', syntax_example: 'if (condition) { }' },
        { block_key: 'if_else', block_name: 'If-Else', description: 'เงื่อนไข if-else', category: 'logic', blockly_type: 'controls_if', syntax_example: 'if (condition) { } else { }' },
        { block_key: 'if_return', block_name: 'If Return', description: 'เงื่อนไข if return', category: 'logic', blockly_type: 'if_return', syntax_example: 'if (condition) { return; }' },
        { block_key: 'logic_compare', block_name: 'Compare', description: 'เปรียบเทียบค่า', category: 'logic', blockly_type: 'logic_compare', syntax_example: '(a === b), (a !== b), (a < b), etc.' },
        { block_key: 'logic_operation', block_name: 'And/Or', description: 'การดำเนินการตรรกะ (AND/OR)', category: 'logic', blockly_type: 'logic_operation', syntax_example: '(a && b), (a || b)' },
        { block_key: 'logic_negate', block_name: 'Not', description: 'ปฏิเสธ (NOT)', category: 'logic', blockly_type: 'logic_negate', syntax_example: '!condition' },
        { block_key: 'logic_boolean', block_name: 'True/False', description: 'ค่าความจริง (true/false)', category: 'logic', blockly_type: 'logic_boolean', syntax_example: 'true, false' },
        { block_key: 'logic_null', block_name: 'Null', description: 'ค่า null (ไม่มีค่า)', category: 'logic', blockly_type: 'logic_null', syntax_example: 'null' },
        { block_key: 'is_safe', block_name: 'Is Safe', description: 'ตรวจสอบความปลอดภัย', category: 'logic', blockly_type: 'is_safe', syntax_example: 'await safe(row, col)' },
        { block_key: 'nqueen_is_safe', block_name: 'Is Safe (N-Queen)', description: 'ตรวจสอบความปลอดภัย (N-Queen)', category: 'logic', blockly_type: 'nqueen_is_safe', syntax_example: 'await safe(row, col)' },
        { block_key: 'treasure_collected', block_name: 'Treasure Collected', description: 'ตรวจสอบว่าสมบัติถูกเก็บแล้ว', category: 'logic', blockly_type: 'treasure_collected', syntax_example: 'treasureCollected()' },
        { block_key: 'person_rescued', block_name: 'Person Rescued', description: 'ตรวจสอบว่าคนถูกช่วยแล้ว', category: 'logic', blockly_type: 'person_rescued', syntax_example: 'personRescued()' },
        { block_key: 'all_people_rescued', block_name: 'All People Rescued', description: 'ตรวจสอบว่าช่วยคนทั้งหมดแล้ว', category: 'logic', blockly_type: 'all_people_rescued', syntax_example: 'allPeopleRescued()' },
        { block_key: 'stack_empty', block_name: 'Stack Empty', description: 'ตรวจสอบว่า stack ว่าง', category: 'logic', blockly_type: 'stack_empty', syntax_example: 'stackEmpty()' },
        { block_key: 'stack_count', block_name: 'Stack Count', description: 'นับจำนวน node ใน stack', category: 'logic', blockly_type: 'stack_count', syntax_example: 'stackCount()' },
        { block_key: 'person_count', block_name: 'Person Count', description: 'นับจำนวนคนที่ช่วยแล้ว', category: 'logic', blockly_type: 'person_count', syntax_example: 'getPersonCount()' },
        { block_key: 'coin_count', block_name: 'Coin Count', description: 'นับจำนวนเหรียญ', category: 'logic', blockly_type: 'coin_count', syntax_example: 'getCoinCount()' },
        { block_key: 'is_sorted', block_name: 'Is Sorted', description: 'ตรวจสอบว่าเหรียญเรียงลำดับ', category: 'logic', blockly_type: 'is_sorted', syntax_example: 'isSorted(order)' },
        { block_key: 'swap_coins', block_name: 'Swap Coins', description: 'สลับตำแหน่งเหรียญ', category: 'logic', blockly_type: 'swap_coins', syntax_example: 'swapCoins(index1, index2)' },
        { block_key: 'compare_coins', block_name: 'Compare Coins', description: 'เปรียบเทียบค่าเหรียญ', category: 'logic', blockly_type: 'compare_coins', syntax_example: 'compareCoins(index1, index2, operator)' },
        { block_key: 'push_node', block_name: 'Push Node', description: 'เพิ่ม node เข้า stack', category: 'logic', blockly_type: 'push_node', syntax_example: 'await pushNode();' },
        { block_key: 'pop_node', block_name: 'Pop Node', description: 'ดึง node ออกจาก stack', category: 'logic', blockly_type: 'pop_node', syntax_example: 'await popNode();' },

        // Loops
        { block_key: 'repeat', block_name: 'Repeat', description: 'ลูป repeat', category: 'loops', blockly_type: 'controls_repeat_ext', syntax_example: 'for (let i = 0; i < times; i++) { }' },
        { block_key: 'while_loop', block_name: 'While Loop', description: 'ลูป while', category: 'loops', blockly_type: 'controls_whileUntil', syntax_example: 'while (condition) { }' },
        { block_key: 'for_index', block_name: 'For Index', description: 'ลูป for', category: 'loops', blockly_type: 'for (let i = from; i <= to; i++) { }', syntax_example: 'for (let i = from; i <= to; i++) { }' },
        { block_key: 'for_each_person', block_name: 'For Each Person', description: 'ลูปสำหรับแต่ละคน', category: 'loops', blockly_type: 'for_each_person', syntax_example: 'for (let i = 0; i < 10; i++) { }' },
        { block_key: 'for_each_coin', block_name: 'For Each Coin', description: 'ลูปสำหรับแต่ละเหรียญ', category: 'loops', blockly_type: 'for_each_coin', syntax_example: 'for (let i = 0; i < coins.length; i++) { }' },
        { block_key: 'for_loop_dynamic', block_name: 'For Each Dynamic', description: 'ลูป for แบบ dynamic', category: 'loops', blockly_type: 'for_loop_dynamic', syntax_example: 'for (let i = from; i <= to; i++) { }' },
        { block_key: 'for_each_in_list', block_name: 'For Each In List', description: 'ลูปสำหรับแต่ละ item ใน list', category: 'loops', blockly_type: 'for_each_in_list', syntax_example: 'for (let item of list) { }' },

        // Conditions
        { block_key: 'found_monster', block_name: 'Found Monster', description: 'ตรวจสอบว่ามีศัตรู', category: 'conditions', blockly_type: 'found_monster', syntax_example: 'foundMonster()' },
        { block_key: 'can_move_forward', block_name: 'Can Move Forward', description: 'ตรวจสอบว่าสามารถเดินได้', category: 'conditions', blockly_type: 'can_move_forward', syntax_example: 'canMoveForward()' },
        { block_key: 'near_pit', block_name: 'Near Pit', description: 'ตรวจสอบว่าอยู่ใกล้หลุม', category: 'conditions', blockly_type: 'near_pit', syntax_example: 'nearPit()' },
        { block_key: 'at_goal', block_name: 'At Goal', description: 'ตรวจสอบว่าถึงเป้าหมาย', category: 'conditions', blockly_type: 'at_goal', syntax_example: 'atGoal()' },
        { block_key: 'has_person', block_name: 'Has Person', description: 'ตรวจสอบว่ามีคน', category: 'conditions', blockly_type: 'has_person', syntax_example: 'hasPerson()' },
        { block_key: 'has_treasure', block_name: 'Has Treasure', description: 'ตรวจสอบว่ามีสมบัติ', category: 'conditions', blockly_type: 'has_treasure', syntax_example: 'hasTreasure()' },
        { block_key: 'has_coin', block_name: 'Has Coin', description: 'ตรวจสอบว่ามีเหรียญ', category: 'conditions', blockly_type: 'has_coin', syntax_example: 'hasCoin()' },
        { block_key: 'have_coin', block_name: 'Have Coin (Legacy)', description: 'ตรวจสอบว่ามีเหรียญ (Legacy)', category: 'conditions', blockly_type: 'have_coin', syntax_example: 'haveCoin()' },

        // Variables
        { block_key: 'variables_get', block_name: 'Get Variable', description: 'อ่านค่าตัวแปร', category: 'variables', blockly_type: 'variables_get', syntax_example: 'variableName' },
        { block_key: 'variables_set', block_name: 'Set Variable', description: 'ตั้งค่าตัวแปร', category: 'variables', blockly_type: 'variables_set', syntax_example: 'variableName = value' },
        { block_key: 'var_math', block_name: 'Variable Math', description: 'คำนวณกับตัวแปร', category: 'variables', blockly_type: 'var_math', syntax_example: 'variable + value' },
        { block_key: 'get_var_value', block_name: 'Get Variable Value', description: 'ดึงค่าตัวแปร', category: 'variables', blockly_type: 'get_var_value', syntax_example: 'variable' },

        // Functions
        { block_key: 'procedures_defreturn', block_name: 'Function (Return)', description: 'ฟังก์ชันที่ return ค่า', category: 'functions', blockly_type: 'procedures_defreturn', syntax_example: 'function name(params) { return value; }' },
        { block_key: 'procedures_defnoreturn', block_name: 'Function (No Return)', description: 'ฟังก์ชันที่ไม่ return ค่า', category: 'functions', blockly_type: 'procedures_defnoreturn', syntax_example: 'function name(params) { }' },
        { block_key: 'function_definition', block_name: 'Define Function', description: 'สร้างฟังก์ชันใหม่', category: 'functions', blockly_type: 'function_definition', syntax_example: 'function name(arg) { }' },
        { block_key: 'function_call', block_name: 'Call Function', description: 'เรียกใช้ฟังก์ชัน', category: 'functions', blockly_type: 'function_call', syntax_example: 'name(arg)' },
        { block_key: 'procedures_return', block_name: 'Return', description: 'คืนค่าจากฟังก์ชันที่ return ค่า', category: 'functions', blockly_type: 'procedures_return', syntax_example: 'return path;' },
        { block_key: 'procedures_callreturn', block_name: 'Call Function (Return)', description: 'เรียกฟังก์ชันที่มี return value', category: 'functions', blockly_type: 'procedures_callreturn', syntax_example: 'functionName(args)' },

        // Operators & Algorithms
        { block_key: 'math_number', block_name: 'Number', description: 'ตัวเลข', category: 'operators', blockly_type: 'math_number', syntax_example: '123' },
        { block_key: 'math_arithmetic', block_name: 'Arithmetic', description: 'การคำนวณ (+, -, *, /, %)', category: 'operators', blockly_type: 'math_arithmetic', syntax_example: '(a + b), (a - b), etc.' },
        { block_key: 'math_compare', block_name: 'Math Compare', description: 'เปรียบเทียบตัวเลข', category: 'operators', blockly_type: 'math_compare', syntax_example: '(a === b), (a < b), etc.' },
        { block_key: 'math_max', block_name: 'Max', description: 'หาค่าสูงสุดระหว่าง 2 จำนวน', category: 'operators', blockly_type: 'math_max', syntax_example: 'Math.max(a, b)' },
        { block_key: 'math_min', block_name: 'Min', description: 'หาค่าต่ำสุดระหว่าง 2 จำนวน', category: 'operators', blockly_type: 'math_min', syntax_example: 'Math.min(a, b)' },
        { block_key: 'math_single', block_name: 'Math Single', description: 'การคำนวณทางคณิตศาสตร์ (square root, absolute, etc.)', category: 'operators', blockly_type: 'math_single', syntax_example: 'Math.sqrt(x), etc.' },
        { block_key: 'math_min_max', block_name: 'Min/Max Dropdown', description: 'หาค่าต่ำสุด/สูงสุดจาก Dropdown', category: 'operators', blockly_type: 'math_min_max', syntax_example: 'Math.min or Math.max' },

        { block_key: 'lists_create_with', block_name: 'Create List', description: 'สร้างลิสต์', category: 'operators', blockly_type: 'lists_create_with', syntax_example: '[item1, item2, ...]' },
        { block_key: 'lists_create_empty', block_name: 'Create Empty List', description: 'สร้างลิสต์ว่าง (ไม่มี items)', category: 'operators', blockly_type: 'lists_create_empty', syntax_example: '[]' },
        { block_key: 'lists_add_item', block_name: 'List Add', description: 'เพิ่ม item เข้า list', category: 'operators', blockly_type: 'lists_add_item', syntax_example: 'list.push(item)' },
        { block_key: 'lists_remove_last', block_name: 'List Remove Last', description: 'ลบตัวสุดท้ายจาก list', category: 'operators', blockly_type: 'lists_remove_last', syntax_example: 'list.pop()' },
        { block_key: 'lists_remove_last_return', block_name: 'List Pop Last', description: 'ดึงและลบตัวสุดท้ายจาก list', category: 'operators', blockly_type: 'lists_remove_last_return', syntax_example: 'list.pop()' },
        { block_key: 'lists_remove_first_return', block_name: 'List Pop First', description: 'ดึง item แรกออกจาก list และลบออก', category: 'operators', blockly_type: 'lists_remove_first_return', syntax_example: 'list.shift()' },
        { block_key: 'lists_get_last', block_name: 'List Get Last', description: 'ดึงตัวสุดท้ายจาก list', category: 'operators', blockly_type: 'lists_get_last', syntax_example: 'list[list.length - 1]' },
        { block_key: 'lists_get_first', block_name: 'List Get First', description: 'ดึง item แรกจาก list', category: 'operators', blockly_type: 'lists_get_first', syntax_example: 'list[0]' },
        { block_key: 'lists_get_at_index', block_name: 'List Get At Index', description: 'ดึง item จาก list ที่ตำแหน่ง index ที่ระบุ', category: 'operators', blockly_type: 'lists_get_at_index', syntax_example: 'list[index]' },
        { block_key: 'lists_set_index', block_name: 'List Set Index', description: 'ตั้งค่า item ใน list ตาม index', category: 'operators', blockly_type: 'lists_setIndex', syntax_example: 'list[index] = value' },
        { block_key: 'lists_remove_at_index', block_name: 'List Remove At Index', description: 'ลบ item จาก list ที่ตำแหน่ง index ที่ระบุ', category: 'operators', blockly_type: 'lists_remove_at_index', syntax_example: 'list.splice(index, 1)' },
        { block_key: 'lists_contains', block_name: 'List Contains', description: 'เช็คว่า item อยู่ใน list หรือไม่', category: 'operators', blockly_type: 'lists_contains', syntax_example: 'list.includes(item)' },
        { block_key: 'lists_concat', block_name: 'List Concat', description: 'รวม list สองตัวเข้าด้วยกัน', category: 'operators', blockly_type: 'lists_concat', syntax_example: 'list1.concat(list2)' },
        { block_key: 'lists_length', block_name: 'List Length', description: 'นับจำนวน item ใน list', category: 'operators', blockly_type: 'lists_length', syntax_example: 'list.length' },
        { block_key: 'lists_isEmpty', block_name: 'List Is Empty', description: 'เช็คว่า list ว่างหรือไม่', category: 'operators', blockly_type: 'lists_isEmpty', syntax_example: 'list.length === 0' },
        { block_key: 'lists_indexOf', block_name: 'List Index Of', description: 'หา index ของ item ใน list', category: 'operators', blockly_type: 'lists_indexOf', syntax_example: 'list.indexOf(item)' },
        { block_key: 'lists_find_min_index', block_name: 'List Find Min Index', description: 'หา index ของ item ที่มีค่าน้อยที่สุดใน list', category: 'operators', blockly_type: 'lists_find_min_index', syntax_example: 'findMinIndex(list)' },
        { block_key: 'lists_find_max_index', block_name: 'List Find Max Index', description: 'หา index ของ itemที่มีค่ามากที่สุดใน list', category: 'operators', blockly_type: 'lists_find_max_index', syntax_example: 'findMaxIndex(list)' },
        { block_key: 'lists_sort_by_weight', block_name: 'Sort Edges By Weight', description: 'เรียง list ของ edges ตาม weight จากน้อยไปมาก', category: 'operators', blockly_type: 'lists_sort_by_weight', syntax_example: 'sortEdgesByWeight(edges)' },

        { block_key: 'logic_not_in', block_name: 'Logic Not In', description: 'เช็คว่า item ไม่อยู่ใน list', category: 'operators', blockly_type: 'logic_not_in', syntax_example: '!list.includes(item)' },
        { block_key: 'get_coin_value', block_name: 'Get Coin Value', description: 'ดึงค่าเหรียญ', category: 'operators', blockly_type: 'get_coin_value', syntax_example: 'getCoinValue(index)' },
        { block_key: 'graph_get_neighbors', block_name: 'Get Neighbors', description: 'ดึง neighbors ของ node จาก graph', category: 'operators', blockly_type: 'graph_get_neighbors', syntax_example: 'getGraphNeighbors(graph, node)' },
        { block_key: 'graph_get_node_value', block_name: 'Get Node Value', description: 'อ่านค่า node', category: 'operators', blockly_type: 'graph_get_node_value', syntax_example: 'getNodeValue(node)' },
        { block_key: 'graph_get_current_node', block_name: 'Get Current Node', description: 'เลข node ปัจจุบัน', category: 'operators', blockly_type: 'graph_get_current_node', syntax_example: 'getCurrentNode()' },
        { block_key: 'graph_get_neighbors_with_weight', block_name: 'Get Neighbors With Weight', description: 'ดึง neighbors พร้อม weight', category: 'operators', blockly_type: 'graph_get_neighbors_with_weight', syntax_example: 'getGraphNeighborsWithWeight(graph, node)' },
        { block_key: 'graph_get_all_edges', block_name: 'Get All Edges', description: 'ดึง edges ทั้งหมดจาก graph', category: 'operators', blockly_type: 'graph_get_all_edges', syntax_example: 'getAllEdges(graph)' },

        { block_key: 'dict_create', block_name: 'Create Dictionary', description: 'สร้าง dictionary ใหม่', category: 'operators', blockly_type: 'dict_create', syntax_example: '{}' },
        { block_key: 'dict_set', block_name: 'Set Dictionary Value', description: 'ตั้งค่า value ใน dictionary', category: 'operators', blockly_type: 'dict_set', syntax_example: 'dict[key] = value;' },
        { block_key: 'dict_get', block_name: 'Get Dictionary Value', description: 'ดึง value จาก dictionary', category: 'operators', blockly_type: 'dict_get', syntax_example: 'dict[key]' },
        { block_key: 'dict_has_key', block_name: 'Dictionary Has Key', description: 'เช็คว่า dictionary มี key หรือไม่', category: 'operators', blockly_type: 'dict_has_key', syntax_example: 'dict.hasOwnProperty(key)' },

        { block_key: 'dsu_find', block_name: 'DSU Find', description: 'หา root ใน DSU', category: 'operators', blockly_type: 'dsu_find', syntax_example: 'dsuFind(parent, node)' },
        { block_key: 'dsu_union', block_name: 'DSU Union', description: 'รวม sets ใน DSU', category: 'operators', blockly_type: 'dsu_union', syntax_example: 'dsuUnion(parent, rank, rootU, rootV)' },

        { block_key: 'emei_highlight_peak', block_name: 'Highlight Peak', description: 'ไฮไลท์ยอดเขาที่กำลังพิจารณา', category: 'visuals', blockly_type: 'emei_highlight_peak', syntax_example: 'await highlightPeak(node)' },
        { block_key: 'emei_highlight_path', block_name: 'Highlight Path', description: 'แสดงเส้นทางที่เลือก', category: 'visuals', blockly_type: 'emei_highlight_path', syntax_example: 'await highlightPath(parent, end, bottleneck)' },
        { block_key: 'emei_show_final_result', block_name: 'Show Result', description: 'แสดงผลลัพธ์สุดท้าย', category: 'visuals', blockly_type: 'emei_show_final_result', syntax_example: 'await showFinalResult(bottleneck, rounds)' },

        { block_key: 'coin_change_add_warrior_to_selection', block_name: 'Add Warrior To Selection', description: 'เพิ่มนักรบลงในรายการที่เลือก', category: 'visuals', blockly_type: 'coin_change_add_warrior_to_selection', syntax_example: 'addWarriorToSelection(index)' },
        { block_key: 'coin_change_track_decision', block_name: 'Track Decision', description: 'บันทึกการตัดสินใจในตาราง DP', category: 'visuals', blockly_type: 'coin_change_track_decision', syntax_example: 'trackDecision(target, coinIndex, result)' },

        { block_key: 'subset_sum_add_warrior_to_side1', block_name: 'Add Warrior To Side 1', description: 'เพิ่มนักรบไปข้างที่ 1', category: 'visuals', blockly_type: 'subset_sum_add_warrior_to_side1', syntax_example: 'addWarriorToSide1(index)' },
        { block_key: 'subset_sum_add_warrior_to_side2', block_name: 'Add Warrior To Side 2', description: 'เพิ่มนักรบไปข้างที่ 2', category: 'visuals', blockly_type: 'subset_sum_add_warrior_to_side2', syntax_example: 'addWarriorToSide2(index)' },

        { block_key: 'rope_visual_init', block_name: 'Init Rope', description: 'เตรียมการตัดเชือก', category: 'visuals', blockly_type: 'rope_visual_init', syntax_example: 'await initRopeTree()' },
        { block_key: 'rope_vis_enter', block_name: 'Rope Vis Enter', description: 'เริ่มคำนวณช่วงเชือก', category: 'visuals', blockly_type: 'rope_vis_enter', syntax_example: 'ropeVisEnter(i, j)' },
        { block_key: 'rope_vis_exit', block_name: 'Rope Vis Exit', description: 'จบการคำนวณช่วงเชือก', category: 'visuals', blockly_type: 'rope_vis_exit', syntax_example: 'ropeVisExit(i, j, result)' },
        { block_key: 'rope_vis_status', block_name: 'Rope Status', description: 'อัปเดตสถานะการตัด', category: 'visuals', blockly_type: 'rope_vis_status', syntax_example: 'await updateStatus(status);' },
        { block_key: 'rope_target_len', block_name: 'Rope Target Length', description: 'กำหนดเป้าหมายความยาว', category: 'visuals', blockly_type: 'rope_target_len', syntax_example: 'getTarget()' },
        { block_key: 'rope_get_cuts', block_name: 'Rope Get Cuts', description: 'ดึงรายการรอยตัด', category: 'visuals', blockly_type: 'rope_get_cuts', syntax_example: 'getCuts()' },

        { block_key: 'assign_train_visual', block_name: 'Assign Train', description: 'มอบสถานะรถไฟ', category: 'visuals', blockly_type: 'assign_train_visual', syntax_example: 'assignTrainVisual(train, platform)' },
        { block_key: 'get_train_value', block_name: 'Get Train Value', description: 'ดึงข้อมูลรถไฟ', category: 'visuals', blockly_type: 'get_train_value', syntax_example: 'train.key (เช่น train.arrive หรือ train.depart)' },
        { block_key: 'sort_trains', block_name: 'Sort Trains', description: 'เรียงลำดับรถไฟ', category: 'visuals', blockly_type: 'sort_trains', syntax_example: 'sortTrains(trains)' }
    ];

    for (const block of blocks) {
        await prisma.block.upsert({
            where: { block_key: block.block_key },
            update: block,
            create: block,
        });
    }
    console.log('✅ Blocks seeded.');

    console.log('🌱 Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
