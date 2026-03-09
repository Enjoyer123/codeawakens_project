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

    // 2. Blocks — ยึดจาก block definitions ปัจจุบัน (ไม่มี legacy names)
    const blocks = [
        // ═══════════════════════════════════════════
        // Movement
        // ═══════════════════════════════════════════
        { block_key: 'move_forward', block_name: 'Move Forward', description: 'เดินไปข้างหน้า', category: 'movement', blockly_type: 'move_forward', syntax_example: 'await moveForward();' },
        { block_key: 'turn_left', block_name: 'Turn Left', description: 'เลี้ยวซ้าย', category: 'movement', blockly_type: 'turn_left', syntax_example: 'await turnLeft();' },
        { block_key: 'turn_right', block_name: 'Turn Right', description: 'เลี้ยวขวา', category: 'movement', blockly_type: 'turn_right', syntax_example: 'await turnRight();' },
        { block_key: 'hit', block_name: 'Hit', description: 'โจมตีศัตรู', category: 'movement', blockly_type: 'hit', syntax_example: 'await hit();' },
        { block_key: 'move_to_node', block_name: 'Move to Node', description: 'เดินไปยัง node ที่กำหนด', category: 'movement', blockly_type: 'move_to_node', syntax_example: 'await moveToNode(nodeId);' },
        { block_key: 'move_along_path', block_name: 'Move Along Path', description: 'เดินตาม path', category: 'movement', blockly_type: 'move_along_path', syntax_example: 'await moveAlongPath(path);' },
        { block_key: 'moveforward_with_explor', block_name: 'Move Forward (Explore)', description: 'เดินไปข้างหน้า (แบบสำรวจ)', category: 'movement', blockly_type: 'moveforward_with_explor', syntax_example: 'await moveForwardExplore();' },
        { block_key: 'nqueen_place', block_name: 'Place Queen', description: 'วางควีนลงบนกระดาน', category: 'movement', blockly_type: 'nqueen_place', syntax_example: 'place(row, col)' },
        { block_key: 'nqueen_remove', block_name: 'Remove Queen', description: 'ยกควีนออกจากกระดาน (Backtracking)', category: 'movement', blockly_type: 'nqueen_remove', syntax_example: 'remove(row, col)' },

        // ═══════════════════════════════════════════
        // Logic (Blockly Built-in)
        // ═══════════════════════════════════════════
        { block_key: 'controls_if', block_name: 'If / If-Else', description: 'เงื่อนไข if / if-else', category: 'logic', blockly_type: 'controls_if', syntax_example: 'if (condition) { } else { }' },
        { block_key: 'logic_compare', block_name: 'Compare', description: 'เปรียบเทียบค่า (=, ≠, <, >, ≤, ≥)', category: 'logic', blockly_type: 'logic_compare', syntax_example: '(a === b), (a < b), etc.' },
        { block_key: 'logic_operation', block_name: 'And/Or', description: 'ตรรกะ AND / OR', category: 'logic', blockly_type: 'logic_operation', syntax_example: '(a && b), (a || b)' },
        { block_key: 'logic_negate', block_name: 'Not', description: 'ปฏิเสธ (NOT)', category: 'logic', blockly_type: 'logic_negate', syntax_example: '!condition' },
        { block_key: 'logic_boolean', block_name: 'True/False', description: 'ค่าความจริง', category: 'logic', blockly_type: 'logic_boolean', syntax_example: 'true, false' },
        { block_key: 'logic_null', block_name: 'Null', description: 'ค่า null', category: 'logic', blockly_type: 'logic_null', syntax_example: 'null' },
        { block_key: 'logic_not_in', block_name: 'Not In List', description: 'เช็คว่า item ไม่อยู่ใน list', category: 'logic', blockly_type: 'logic_not_in', syntax_example: '!list.includes(item)' },
        { block_key: 'nqueen_is_safe', block_name: 'Is Safe (N-Queen)', description: 'ตรวจสอบว่าตำแหน่งปลอดภัย', category: 'logic', blockly_type: 'nqueen_is_safe', syntax_example: 'safe(row, col)' },

        // ═══════════════════════════════════════════
        // Conditions (Custom)
        // ═══════════════════════════════════════════
        { block_key: 'found_monster', block_name: 'Found Monster', description: 'ตรวจสอบว่ามีศัตรู', category: 'conditions', blockly_type: 'found_monster', syntax_example: 'foundMonster()' },
        { block_key: 'can_move_forward', block_name: 'Can Move Forward', description: 'ตรวจสอบว่าเดินได้', category: 'conditions', blockly_type: 'can_move_forward', syntax_example: 'canMoveForward()' },
        { block_key: 'near_pit', block_name: 'Near Pit', description: 'ตรวจสอบว่าอยู่ใกล้หลุม', category: 'conditions', blockly_type: 'near_pit', syntax_example: 'nearPit()' },
        { block_key: 'at_goal', block_name: 'At Goal', description: 'ตรวจสอบว่าถึงเป้าหมาย', category: 'conditions', blockly_type: 'at_goal', syntax_example: 'atGoal()' },

        // ═══════════════════════════════════════════
        // Loops
        // ═══════════════════════════════════════════
        { block_key: 'controls_repeat_ext', block_name: 'Repeat', description: 'ลูป repeat N ครั้ง', category: 'loops', blockly_type: 'controls_repeat_ext', syntax_example: 'for (let i = 0; i < n; i++) { }' },
        { block_key: 'controls_whileUntil', block_name: 'While Loop', description: 'ลูป while', category: 'loops', blockly_type: 'controls_whileUntil', syntax_example: 'while (condition) { }' },
        { block_key: 'controls_for', block_name: 'For Loop', description: 'ลูป for (from, to, step)', category: 'loops', blockly_type: 'controls_for', syntax_example: 'for (let i = from; i <= to; i++) { }' },
        { block_key: 'controls_forEach', block_name: 'For Each', description: 'ลูปสำหรับแต่ละ item', category: 'loops', blockly_type: 'controls_forEach', syntax_example: 'for (let item of list) { }' },
        { block_key: 'controls_flow_statements', block_name: 'Break / Continue', description: 'หยุดหรือข้ามรอบลูป', category: 'loops', blockly_type: 'controls_flow_statements', syntax_example: 'break; continue;' },
        { block_key: 'for_loop_dynamic', block_name: 'For Loop (Dynamic)', description: 'ลูป for แบบ dynamic start/end', category: 'loops', blockly_type: 'for_loop_dynamic', syntax_example: 'for (let i = from; i <= to; i++) { }' },
        { block_key: 'for_each_in_list', block_name: 'For Each In List', description: 'ลูปสำหรับแต่ละ item ใน list', category: 'loops', blockly_type: 'for_each_in_list', syntax_example: 'for (let item of list) { }' },
        { block_key: 'for_each_coin', block_name: 'For Each Coin', description: 'ลูปสำหรับแต่ละเหรียญ', category: 'loops', blockly_type: 'for_each_coin', syntax_example: 'for (let i = 0; i < coins.length; i++) { }' },
        { block_key: 'for_each_person', block_name: 'For Each Person', description: 'ลูปสำหรับแต่ละคน', category: 'loops', blockly_type: 'for_each_person', syntax_example: 'for (let i = 0; i < people.length; i++) { }' },

        // ═══════════════════════════════════════════
        // Variables
        // ═══════════════════════════════════════════
        { block_key: 'variables_get', block_name: 'Get Variable', description: 'อ่านค่าตัวแปร', category: 'variables', blockly_type: 'variables_get', syntax_example: 'variableName' },
        { block_key: 'variables_set', block_name: 'Set Variable', description: 'ตั้งค่าตัวแปร', category: 'variables', blockly_type: 'variables_set', syntax_example: 'variableName = value;' },
        { block_key: 'var_math', block_name: 'Variable Math', description: 'คำนวณกับตัวแปร (+=, -=, *=, /=)', category: 'variables', blockly_type: 'var_math', syntax_example: 'variable += value;' },
        { block_key: 'get_var_value', block_name: 'Get Variable Value', description: 'ดึงค่าตัวแปร', category: 'variables', blockly_type: 'get_var_value', syntax_example: 'variable' },

        // ═══════════════════════════════════════════
        // Functions / Procedures
        // ═══════════════════════════════════════════
        { block_key: 'procedures_defreturn', block_name: 'Function (Return)', description: 'สร้างฟังก์ชันที่ return ค่า', category: 'functions', blockly_type: 'procedures_defreturn', syntax_example: 'function name(params) { return value; }' },
        { block_key: 'procedures_defnoreturn', block_name: 'Function (No Return)', description: 'สร้างฟังก์ชันที่ไม่ return ค่า', category: 'functions', blockly_type: 'procedures_defnoreturn', syntax_example: 'function name(params) { }' },
        { block_key: 'procedures_callreturn', block_name: 'Call Function (Return)', description: 'เรียกฟังก์ชันที่มี return', category: 'functions', blockly_type: 'procedures_callreturn', syntax_example: 'result = functionName(args)' },
        { block_key: 'procedures_callnoreturn', block_name: 'Call Function (No Return)', description: 'เรียกฟังก์ชันที่ไม่มี return', category: 'functions', blockly_type: 'procedures_callnoreturn', syntax_example: 'functionName(args);' },
        { block_key: 'procedures_ifreturn', block_name: 'If Return', description: 'เงื่อนไข if return ภายใน function', category: 'functions', blockly_type: 'procedures_ifreturn', syntax_example: 'if (condition) { return value; }' },
        { block_key: 'procedures_return', block_name: 'Return', description: 'คืนค่าจากฟังก์ชัน', category: 'functions', blockly_type: 'procedures_return', syntax_example: 'return value;' },

        // ═══════════════════════════════════════════
        // Operators / Math
        // ═══════════════════════════════════════════
        { block_key: 'math_number', block_name: 'Number', description: 'ตัวเลข', category: 'math', blockly_type: 'math_number', syntax_example: '123' },
        { block_key: 'math_arithmetic', block_name: 'Arithmetic', description: 'การคำนวณ (+, -, *, /, ^)', category: 'math', blockly_type: 'math_arithmetic', syntax_example: '(a + b), (a - b), etc.' },
        { block_key: 'math_on_list', block_name: 'Min / Max', description: 'หาค่าต่ำสุด/สูงสุดจาก list', category: 'math', blockly_type: 'math_on_list', syntax_example: 'Math.min(...list), Math.max(...list)' },
        { block_key: 'math_single', block_name: 'Math Function', description: 'ฟังก์ชันคณิตศาสตร์ (sqrt, abs, etc.)', category: 'math', blockly_type: 'math_single', syntax_example: 'Math.sqrt(x), Math.abs(x)' },
        { block_key: 'text', block_name: 'Text', description: 'ข้อความ', category: 'math', blockly_type: 'text', syntax_example: '"hello"' },

        // ═══════════════════════════════════════════
        // Lists
        // ═══════════════════════════════════════════
        { block_key: 'lists_create_with', block_name: 'Create List', description: 'สร้าง list จาก items', category: 'lists', blockly_type: 'lists_create_with', syntax_example: '[item1, item2, ...]' },
        { block_key: 'lists_create_empty', block_name: 'Create Empty List', description: 'สร้าง list ว่าง', category: 'lists', blockly_type: 'lists_create_empty', syntax_example: '[]' },
        { block_key: 'lists_add_item', block_name: 'List Push', description: 'เพิ่ม item เข้า list', category: 'lists', blockly_type: 'lists_add_item', syntax_example: 'list.push(item)' },
        { block_key: 'lists_remove_last', block_name: 'List Remove Last', description: 'ลบตัวสุดท้ายจาก list', category: 'lists', blockly_type: 'lists_remove_last', syntax_example: 'list.pop()' },
        { block_key: 'lists_remove_last_return', block_name: 'List Pop Last', description: 'ดึงและลบตัวสุดท้าย', category: 'lists', blockly_type: 'lists_remove_last_return', syntax_example: 'list.pop()' },
        { block_key: 'lists_remove_first_return', block_name: 'List Shift', description: 'ดึงและลบตัวแรก', category: 'lists', blockly_type: 'lists_remove_first_return', syntax_example: 'list.shift()' },
        { block_key: 'lists_get_last', block_name: 'List Get Last', description: 'ดูตัวสุดท้าย', category: 'lists', blockly_type: 'lists_get_last', syntax_example: 'list[list.length - 1]' },
        { block_key: 'lists_get_first', block_name: 'List Get First', description: 'ดูตัวแรก', category: 'lists', blockly_type: 'lists_get_first', syntax_example: 'list[0]' },
        { block_key: 'lists_get_at_index', block_name: 'List Get At Index', description: 'ดึง item ตาม index', category: 'lists', blockly_type: 'lists_get_at_index', syntax_example: 'list[index]' },
        { block_key: 'lists_setIndex', block_name: 'List Set At Index', description: 'ตั้งค่า item ตาม index', category: 'lists', blockly_type: 'lists_setIndex', syntax_example: 'list[index] = value;' },
        { block_key: 'lists_remove_at_index', block_name: 'List Remove At Index', description: 'ลบ item ตาม index', category: 'lists', blockly_type: 'lists_remove_at_index', syntax_example: 'list.splice(index, 1)' },
        { block_key: 'lists_contains', block_name: 'List Contains', description: 'เช็คว่า item อยู่ใน list', category: 'lists', blockly_type: 'lists_contains', syntax_example: 'list.includes(item)' },
        { block_key: 'lists_concat', block_name: 'List Concat', description: 'รวม 2 lists', category: 'lists', blockly_type: 'lists_concat', syntax_example: 'list1.concat(list2)' },
        { block_key: 'lists_length', block_name: 'List Length', description: 'นับจำนวน item', category: 'lists', blockly_type: 'lists_length', syntax_example: 'list.length' },
        { block_key: 'lists_isEmpty', block_name: 'List Is Empty', description: 'เช็คว่า list ว่าง', category: 'lists', blockly_type: 'lists_isEmpty', syntax_example: 'list.length === 0' },
        { block_key: 'lists_indexOf', block_name: 'List Index Of', description: 'หา index ของ item', category: 'lists', blockly_type: 'lists_indexOf', syntax_example: 'list.indexOf(item)' },
        { block_key: 'lists_find_min_index', block_name: 'List Find Min Index', description: 'หา index ของค่าน้อยที่สุด', category: 'lists', blockly_type: 'lists_find_min_index', syntax_example: 'findMinIndex(list)' },
        { block_key: 'lists_find_max_index', block_name: 'List Find Max Index', description: 'หา index ของค่ามากที่สุด', category: 'lists', blockly_type: 'lists_find_max_index', syntax_example: 'findMaxIndex(list)' },
        { block_key: 'lists_sort_by_weight', block_name: 'Sort By Weight', description: 'เรียง edges ตาม weight', category: 'lists', blockly_type: 'lists_sort_by_weight', syntax_example: 'sortEdgesByWeight(edges)' },

        // ═══════════════════════════════════════════
        // Dictionaries / DSU
        // ═══════════════════════════════════════════
        { block_key: 'dict_create', block_name: 'Create Dictionary', description: 'สร้าง dictionary', category: 'dictionary', blockly_type: 'dict_create', syntax_example: '{}' },
        { block_key: 'dict_set', block_name: 'Dict Set', description: 'ตั้งค่าใน dictionary', category: 'dictionary', blockly_type: 'dict_set', syntax_example: 'dict[key] = value;' },
        { block_key: 'dict_get', block_name: 'Dict Get', description: 'ดึงค่าจาก dictionary', category: 'dictionary', blockly_type: 'dict_get', syntax_example: 'dict[key]' },
        { block_key: 'dict_has_key', block_name: 'Dict Has Key', description: 'เช็คว่ามี key', category: 'dictionary', blockly_type: 'dict_has_key', syntax_example: 'dict.hasOwnProperty(key)' },
        { block_key: 'dsu_find', block_name: 'DSU Find', description: 'หา root ใน Disjoint Set', category: 'dictionary', blockly_type: 'dsu_find', syntax_example: 'dsuFind(parent, node)' },
        { block_key: 'dsu_union', block_name: 'DSU Union', description: 'รวม sets ใน Disjoint Set', category: 'dictionary', blockly_type: 'dsu_union', syntax_example: 'dsuUnion(parent, rank, u, v)' },

        // ═══════════════════════════════════════════
        // Entities — Coins
        // ═══════════════════════════════════════════
        { block_key: 'collect_coin', block_name: 'Collect Coin', description: 'เก็บเหรียญ', category: 'coins', blockly_type: 'collect_coin', syntax_example: 'await collectCoin();' },
        { block_key: 'has_coin', block_name: 'Has Coin', description: 'ตรวจสอบว่ามีเหรียญ', category: 'conditions', blockly_type: 'has_coin', syntax_example: 'hasCoin()' },
        { block_key: 'swap_coins', block_name: 'Swap Coins', description: 'สลับเหรียญ', category: 'coins', blockly_type: 'swap_coins', syntax_example: 'swapCoins(i, j)' },
        { block_key: 'compare_coins', block_name: 'Compare Coins', description: 'เปรียบเทียบค่าเหรียญ', category: 'coins', blockly_type: 'compare_coins', syntax_example: 'compareCoins(i, j, op)' },
        { block_key: 'get_coin_value', block_name: 'Get Coin Value', description: 'ดึงค่าเหรียญ', category: 'coins', blockly_type: 'get_coin_value', syntax_example: 'getCoinValue(index)' },
        { block_key: 'coin_count', block_name: 'Coin Count', description: 'นับจำนวนเหรียญ', category: 'coins', blockly_type: 'coin_count', syntax_example: 'getCoinCount()' },
        { block_key: 'is_sorted', block_name: 'Is Sorted', description: 'เช็คว่าเหรียญเรียงลำดับ', category: 'coins', blockly_type: 'is_sorted', syntax_example: 'isSorted()' },

        // ═══════════════════════════════════════════
        // Entities — Persons
        // ═══════════════════════════════════════════
        { block_key: 'rescue_person', block_name: 'Rescue Person', description: 'ช่วยคน', category: 'rescue', blockly_type: 'rescue_person', syntax_example: 'await rescuePersonAtNode(nodeId);' },
        { block_key: 'rescue_person_at_node', block_name: 'Rescue At Node', description: 'ช่วยคนที่ node กำหนด', category: 'rescue', blockly_type: 'rescue_person_at_node', syntax_example: 'await rescuePersonAtNode(nodeId);' },
        { block_key: 'has_person', block_name: 'Has Person', description: 'ตรวจสอบว่ามีคน', category: 'conditions', blockly_type: 'has_person', syntax_example: 'hasPerson()' },
        { block_key: 'person_rescued', block_name: 'Person Rescued', description: 'ตรวจสอบว่าช่วยคนแล้ว', category: 'rescue', blockly_type: 'person_rescued', syntax_example: 'personRescued()' },
        { block_key: 'person_count', block_name: 'Person Count', description: 'นับจำนวนคนที่ช่วยแล้ว', category: 'rescue', blockly_type: 'person_count', syntax_example: 'getPersonCount()' },
        { block_key: 'all_people_rescued', block_name: 'All People Rescued', description: 'เช็คว่าช่วยคนครบ', category: 'rescue', blockly_type: 'all_people_rescued', syntax_example: 'allPeopleRescued()' },

        // ═══════════════════════════════════════════
        // Graph Algorithms
        // ═══════════════════════════════════════════
        { block_key: 'graph_get_neighbors', block_name: 'Get Neighbors', description: 'ดึง neighbors ของ node', category: 'graph', blockly_type: 'graph_get_neighbors', syntax_example: 'getNeighbors(graph, node)' },
        { block_key: 'graph_get_node_value', block_name: 'Get Node Value', description: 'อ่านค่า node', category: 'graph', blockly_type: 'graph_get_node_value', syntax_example: 'getNodeValue(node)' },
        { block_key: 'graph_get_current_node', block_name: 'Get Current Node', description: 'เลข node ปัจจุบัน', category: 'graph', blockly_type: 'graph_get_current_node', syntax_example: 'getCurrentNode()' },
        { block_key: 'graph_get_neighbors_with_weight', block_name: 'Get Neighbors With Weight', description: 'ดึง neighbors พร้อม weight', category: 'graph', blockly_type: 'graph_get_neighbors_with_weight', syntax_example: 'getNeighborsWithWeight(graph, node)' },
        { block_key: 'graph_get_all_edges', block_name: 'Get All Edges', description: 'ดึง edges ทั้งหมด', category: 'graph', blockly_type: 'graph_get_all_edges', syntax_example: 'getAllEdges(graph)' },

        // ═══════════════════════════════════════════
        // Visuals — Graph Algorithms
        // ═══════════════════════════════════════════
        { block_key: 'dijkstra_visit', block_name: 'Dijkstra Visit', description: 'บันทึกการเยี่ยม node (Dijkstra)', category: 'visuals', blockly_type: 'dijkstra_visit', syntax_example: 'dijkstraVisit(node)' },
        { block_key: 'dijkstra_relax', block_name: 'Dijkstra Relax', description: 'บันทึก relax edge (Dijkstra)', category: 'visuals', blockly_type: 'dijkstra_relax', syntax_example: 'dijkstraRelax(from, to, dist)' },
        { block_key: 'prim_visit', block_name: 'Prim Visit', description: 'บันทึกการเยี่ยม node (Prim)', category: 'visuals', blockly_type: 'prim_visit', syntax_example: 'primVisit(node)' },
        { block_key: 'prim_relax', block_name: 'Prim Relax', description: 'บันทึก relax edge (Prim)', category: 'visuals', blockly_type: 'prim_relax', syntax_example: 'primRelax(from, to, weight)' },
        { block_key: 'kruskal_visit', block_name: 'Kruskal Visit', description: 'บันทึกการพิจารณา edge (Kruskal)', category: 'visuals', blockly_type: 'kruskal_visit', syntax_example: 'kruskalVisit(from, to)' },
        { block_key: 'kruskal_add_edge', block_name: 'Kruskal Add Edge', description: 'เพิ่ม edge เข้า MST (Kruskal)', category: 'visuals', blockly_type: 'kruskal_add_edge', syntax_example: 'kruskalAddEdge(from, to, weight)' },

        // ═══════════════════════════════════════════
        // Visuals — Knapsack
        // ═══════════════════════════════════════════
        { block_key: 'knapsack_pick_item', block_name: 'Knapsack Pick', description: 'เลือกหยิบ item', category: 'visuals', blockly_type: 'knapsack_pick_item', syntax_example: 'knapsackPick(index)' },
        { block_key: 'knapsack_remove_item', block_name: 'Knapsack Remove', description: 'วาง item กลับ', category: 'visuals', blockly_type: 'knapsack_remove_item', syntax_example: 'knapsackRemove(index)' },
        { block_key: 'knapsack_consider_item', block_name: 'Knapsack Consider', description: 'พิจารณา item', category: 'visuals', blockly_type: 'knapsack_consider_item', syntax_example: 'knapsackConsider(index)' },
        { block_key: 'knapsack_dp_update', block_name: 'Knapsack DP Update', description: 'อัปเดตตาราง DP', category: 'visuals', blockly_type: 'knapsack_dp_update', syntax_example: 'knapsackDpUpdate(i, w, val)' },

        // ═══════════════════════════════════════════
        // Visuals — Subset Sum
        // ═══════════════════════════════════════════
        { block_key: 'subset_sum_consider', block_name: 'Subset Sum Consider', description: 'พิจารณา item', category: 'visuals', blockly_type: 'subset_sum_consider', syntax_example: 'subsetSumConsider(index)' },
        { block_key: 'subset_sum_include', block_name: 'Subset Sum Include', description: 'รวม item เข้า subset', category: 'visuals', blockly_type: 'subset_sum_include', syntax_example: 'subsetSumInclude(index)' },
        { block_key: 'subset_sum_exclude', block_name: 'Subset Sum Exclude', description: 'ไม่รวม item', category: 'visuals', blockly_type: 'subset_sum_exclude', syntax_example: 'subsetSumExclude(index)' },
        { block_key: 'subset_sum_reset', block_name: 'Subset Sum Reset', description: 'รีเซ็ตสถานะ', category: 'visuals', blockly_type: 'subset_sum_reset', syntax_example: 'subsetSumReset()' },
        { block_key: 'subset_sum_dp_update', block_name: 'Subset Sum DP Update', description: 'อัปเดตตาราง DP', category: 'visuals', blockly_type: 'subset_sum_dp_update', syntax_example: 'subsetSumDpUpdate(i, s, val)' },

        // ═══════════════════════════════════════════
        // Visuals — Coin Change
        // ═══════════════════════════════════════════
        { block_key: 'coin_change_add_warrior_to_selection', block_name: 'Add Warrior', description: 'เพิ่มนักรบลงในรายการที่เลือก', category: 'visuals', blockly_type: 'coin_change_add_warrior_to_selection', syntax_example: 'addWarrior(index)' },
        { block_key: 'coin_change_track_decision', block_name: 'Track Decision', description: 'บันทึกการตัดสินใจ DP', category: 'visuals', blockly_type: 'coin_change_track_decision', syntax_example: 'trackDecision(target, coinIndex, result)' },
        { block_key: 'coin_change_remove_warrior', block_name: 'Remove Warrior', description: 'ลบนักรบออก', category: 'visuals', blockly_type: 'coin_change_remove_warrior', syntax_example: 'removeWarrior(index)' },
        { block_key: 'coin_change_consider', block_name: 'Consider Coin', description: 'พิจารณาเหรียญ', category: 'visuals', blockly_type: 'coin_change_consider', syntax_example: 'considerCoin(index)' },
        { block_key: 'coin_change_memo_hit', block_name: 'Memo Hit', description: 'พบค่าใน memo แล้ว', category: 'visuals', blockly_type: 'coin_change_memo_hit', syntax_example: 'memoHit(amount)' },

        // ═══════════════════════════════════════════
        // Visuals — Emei Mountain
        // ═══════════════════════════════════════════
        { block_key: 'emei_highlight_peak', block_name: 'Highlight Peak', description: 'ไฮไลท์ยอดเขา', category: 'visuals', blockly_type: 'emei_highlight_peak', syntax_example: 'highlightPeak(node)' },
        { block_key: 'emei_highlight_path', block_name: 'Highlight Path', description: 'แสดงเส้นทาง', category: 'visuals', blockly_type: 'emei_highlight_path', syntax_example: 'highlightPath(parent, end, bottleneck)' },
        { block_key: 'emei_show_final_result', block_name: 'Show Result', description: 'แสดงผลลัพธ์สุดท้าย', category: 'visuals', blockly_type: 'emei_show_final_result', syntax_example: 'showFinalResult(bottleneck, rounds)' },
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
