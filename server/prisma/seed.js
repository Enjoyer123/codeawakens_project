import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // 1. Victory Conditions
    const victoryConditions = [
        { type: 'reach_goal', description: 'ไปถึง Node เป้าหมาย' },
        { type: 'coins_sorted', description: 'เรียงเหรียญจากน้อยไปมาก' },
        { type: 'all_people_rescued', description: 'ช่วยคนทั้งหมด' },
        { type: 'back_to_start', description: 'กลับมาที่จุดเริ่มต้น' },
        { type: 'function_return_test', description: 'ตรวจสอบ return value ของ function กับ test cases' }
    ];

    for (const vc of victoryConditions) {
        // Attempt to find existing by type first
        const existing = await prisma.victoryCondition.findUnique({
            where: { type: vc.type }
        });

        if (existing) {
            await prisma.victoryCondition.update({
                where: { type: vc.type },
                data: vc
            });
        } else {
            await prisma.victoryCondition.create({
                data: vc
            });
        }
    }
    console.log('✅ Victory Conditions seeded.');

    // 2. Blocks
    const blocks = [
        // Movement
        { block_key: 'move_forward', block_name: 'move_forward', description: 'เดินไปข้างหน้า', category: 'movement' },
        { block_key: 'turn_left', block_name: 'turn_left', description: 'เลี้ยวซ้าย', category: 'movement' },
        { block_key: 'turn_right', block_name: 'turn_right', description: 'เลี้ยวขวา', category: 'movement' },
        { block_key: 'hit', block_name: 'hit', description: 'โจมตีศัตรู', category: 'movement' },
        { block_key: 'move_to_node', block_name: 'move_to_node', description: 'เดินไปยัง node ที่กำหนด', category: 'movement' },
        { block_key: 'move_along_path', block_name: 'move_along_path', description: 'เดินตาม path', category: 'movement' },
        { block_key: 'nqueen_place', block_name: 'nqueen_place', description: 'วางควีน (N-Queen)', category: 'movement' },
        { block_key: 'nqueen_remove', block_name: 'nqueen_remove', description: 'ยกควีนออก (N-Queen)', category: 'movement' },

        // Logic
        { block_key: 'controls_if', block_name: 'controls_if', description: 'เงื่อนไข if / if-else', category: 'logic' },
        { block_key: 'procedures_ifreturn', block_name: 'procedures_ifreturn', description: 'เงื่อนไข if return', category: 'logic' },
        { block_key: 'logic_compare', block_name: 'logic_compare', description: 'เปรียบเทียบค่า (==, !=, <, >)', category: 'logic' },
        { block_key: 'logic_boolean', block_name: 'logic_boolean', description: 'ค่าความจริง (true/false)', category: 'logic' },
        { block_key: 'logic_negate', block_name: 'logic_negate', description: 'ปฏิเสธ (NOT)', category: 'logic' },
        { block_key: 'logic_operation', block_name: 'logic_operation', description: 'การดำเนินการตรรกะ (AND/OR)', category: 'logic' },
        { block_key: 'logic_not_in', block_name: 'logic_not_in', description: 'ตรวจสอบว่าไม่อยู่ใน', category: 'logic' },
        { block_key: 'logic_null', block_name: 'logic_null', description: 'ค่า null', category: 'logic' },
        { block_key: 'nqueen_is_safe', block_name: 'nqueen_is_safe', description: 'ตรวจสอบความปลอดภัย (N-Queen)', category: 'logic' },

        // Conditions
        { block_key: 'found_monster', block_name: 'found_monster', description: 'ตรวจสอบว่ามีศัตรู', category: 'conditions' },
        { block_key: 'can_move_forward', block_name: 'can_move_forward', description: 'ตรวจสอบว่าสามารถไปต่อได้', category: 'conditions' },
        { block_key: 'near_pit', block_name: 'near_pit', description: 'ตรวจสอบว่าอยู่ใกล้หลุม', category: 'conditions' },
        { block_key: 'at_goal', block_name: 'at_goal', description: 'ตรวจสอบว่าถึงเป้าหมาย', category: 'conditions' },
        { block_key: 'has_coin', block_name: 'has_coin', description: 'ตรวจสอบว่ามีเหรียญ', category: 'conditions' },
        { block_key: 'has_person', block_name: 'has_person', description: 'ตรวจสอบว่ามีคน', category: 'conditions' },

        // Loops
        { block_key: 'controls_repeat_ext', block_name: 'controls_repeat_ext', description: 'ลูป repeat (ทำซ้ำ N รอบ)', category: 'loops' },
        { block_key: 'controls_whileUntil', block_name: 'controls_whileUntil', description: 'ลูป while (ทำซ้ำจนกว่า)', category: 'loops' },
        { block_key: 'controls_for', block_name: 'controls_for', description: 'ลูป for (นับค่า)', category: 'loops' },
        { block_key: 'controls_forEach', block_name: 'controls_forEach', description: 'ลูป for-each (วนใน list)', category: 'loops' },
        { block_key: 'controls_flow_statements', block_name: 'controls_flow_statements', description: 'คำสั่งควบคุมลูป (break/continue)', category: 'loops' },
        { block_key: 'for_each_in_list', block_name: 'for_each_in_list', description: 'ลูปสำหรับแต่ละไอเท็มใน list', category: 'loops' },

        // Operators
        { block_key: 'math_number', block_name: 'math_number', description: 'ตัวเลข', category: 'operators' },
        { block_key: 'math_arithmetic', block_name: 'math_arithmetic', description: 'การคำนวณ (+, -, *, /)', category: 'operators' },
        { block_key: 'math_on_list', block_name: 'math_on_list', description: 'การคำนวณบน list', category: 'operators' },
        { block_key: 'math_single', block_name: 'math_single', description: 'คณิตศาสตร์ (sqrt, abs)', category: 'operators' },
        { block_key: 'math_min', block_name: 'math_min', description: 'คณิตศาสตร์ (min)', category: 'operators' },
        { block_key: 'var_math', block_name: 'var_math', description: 'คำนวณกับตัวแปร', category: 'operators' },
        { block_key: 'get_var_value', block_name: 'get_var_value', description: 'ดึงค่าตัวแปร (legacy)', category: 'operators' },
        { block_key: 'lists_create_empty', block_name: 'lists_create_empty', description: 'สร้าง list ว่าง', category: 'operators' },
        { block_key: 'lists_create_with', block_name: 'lists_create_with', description: 'สร้าง list พร้อมไอเท็ม', category: 'operators' },
        { block_key: 'lists_length', block_name: 'lists_length', description: 'ความยาวของ list', category: 'operators' },
        { block_key: 'lists_isEmpty', block_name: 'lists_isEmpty', description: 'เช็คว่า list ว่างไหม', category: 'operators' },
        { block_key: 'lists_indexOf', block_name: 'lists_indexOf', description: 'หาตำแหน่ง (index) ใน list', category: 'operators' },
        { block_key: 'lists_add_item', block_name: 'lists_add_item', description: 'เพิ่มไอเท็ม (list.push)', category: 'operators' },
        { block_key: 'lists_remove_last', block_name: 'lists_remove_last', description: 'ลบตัวสุดท้าย', category: 'operators' },
        { block_key: 'lists_remove_last_return', block_name: 'lists_remove_last_return', description: 'ดึงและลบตัวสุดท้าย (pop)', category: 'operators' },
        { block_key: 'lists_get_last', block_name: 'lists_get_last', description: 'ดึงตัวสุดท้าย', category: 'operators' },
        { block_key: 'lists_get_first', block_name: 'lists_get_first', description: 'ดึงตัวแรก', category: 'operators' },
        { block_key: 'lists_remove_first_return', block_name: 'lists_remove_first_return', description: 'ดึงและลบตัวแรก (shift)', category: 'operators' },
        { block_key: 'lists_get_at_index', block_name: 'lists_get_at_index', description: 'ดึงค่าด้วย index', category: 'operators' },
        { block_key: 'lists_setIndex', block_name: 'lists_setIndex', description: 'ตั้งค่าด้วย index', category: 'operators' },
        { block_key: 'lists_remove_at_index', block_name: 'lists_remove_at_index', description: 'ลบค่าด้วย index', category: 'operators' },
        { block_key: 'lists_contains', block_name: 'lists_contains', description: 'เช็คว่าลิสต์มีไอเท็ม', category: 'operators' },
        { block_key: 'lists_concat', block_name: 'lists_concat', description: 'รวม list เข้าด้วยกัน', category: 'operators' },
        { block_key: 'lists_find_min_index', block_name: 'lists_find_min_index', description: 'หา index ของค่าน้อยสุด', category: 'operators' },
        { block_key: 'lists_find_max_index', block_name: 'lists_find_max_index', description: 'หา index ของค่ามากสุด', category: 'operators' },
        { block_key: 'lists_sort_by_weight', block_name: 'lists_sort_by_weight', description: 'เรียง (Edge List) ตามน้ำหนัก', category: 'operators' },
        { block_key: 'lists_getSublist', block_name: 'lists_getSublist', description: 'ดึง Sub-list (Slice/Clone list)', category: 'operators' },
        { block_key: 'collect_coin', block_name: 'collect_coin', description: 'เก็บเหรียญ', category: 'operators' },
        { block_key: 'swap_coins', block_name: 'swap_coins', description: 'สลับเหรียญ', category: 'operators' },
        { block_key: 'compare_coins', block_name: 'compare_coins', description: 'เปรียบเทียบเหรียญ', category: 'operators' },
        { block_key: 'get_coin_value', block_name: 'get_coin_value', description: 'ดึงมูลค่าเหรียญ', category: 'operators' },
        { block_key: 'coin_count', block_name: 'coin_count', description: 'จำนวนเหรียญทั้งหมด', category: 'operators' },
        { block_key: 'is_sorted', block_name: 'is_sorted', description: 'ตรวจสอบว่าเหรียญเรียงลำดับ', category: 'operators' },
        { block_key: 'rescue_person', block_name: 'rescue_person', description: 'ช่วยคน', category: 'operators' },
        { block_key: 'rescue_person_at_node', block_name: 'rescue_person_at_node', description: 'ช่วยคนที่โหนดระบุ', category: 'operators' },
        { block_key: 'person_rescued', block_name: 'person_rescued', description: 'คนถูกช่วยแล้ว?', category: 'operators' },
        { block_key: 'person_count', block_name: 'person_count', description: 'จำนวนคนที่ช่วยแล้ว', category: 'operators' },
        { block_key: 'all_people_rescued', block_name: 'all_people_rescued', description: 'ช่วยทุกคนสำเร็จ?', category: 'operators' },
        { block_key: 'graph_get_neighbors', block_name: 'graph_get_neighbors', description: 'ดึง Node เพื่อนบ้าน (Neighbors)', category: 'operators' },
        { block_key: 'graph_get_neighbors_with_weight', block_name: 'graph_get_neighbors_with_weight', description: 'ดึงเพื่อนบ้านพร้อม Weight', category: 'operators' },
        { block_key: 'graph_get_all_edges', block_name: 'graph_get_all_edges', description: 'ดึง Edges ทั้งหมดในกราฟ', category: 'operators' },
        { block_key: 'graph_get_node_value', block_name: 'graph_get_node_value', description: 'อ่านค่าประจำ Node', category: 'operators' },
        { block_key: 'graph_get_current_node', block_name: 'graph_get_current_node', description: 'Node ปัจจุบันที่ตัวละครยืน', category: 'operators' },
        { block_key: 'dict_create', block_name: 'dict_create', description: 'สร้าง Dictionary ({})', category: 'operators' },
        { block_key: 'dict_set', block_name: 'dict_set', description: 'เซ็ตค่าให้ Dictionary', category: 'operators' },
        { block_key: 'dict_get', block_name: 'dict_get', description: 'ดึงค่าจาก Dictionary', category: 'operators' },
        { block_key: 'dict_has_key', block_name: 'dict_has_key', description: 'ตรวจว่า Dictionary มี Key นี้', category: 'operators' },
        { block_key: 'dsu_find', block_name: 'dsu_find', description: 'DSU: หารากของชุด (Find)', category: 'operators' },
        { block_key: 'dsu_union', block_name: 'dsu_union', description: 'DSU: รวมชุด (Union)', category: 'operators' },

        // Visuals
        { block_key: 'dijkstra_visit', block_name: 'dijkstra_visit', description: 'Dijkstra: เยือนโหนด', category: 'visuals' },
        { block_key: 'dijkstra_relax', block_name: 'dijkstra_relax', description: 'Dijkstra: อัปเดตตาราง', category: 'visuals' },
        { block_key: 'prim_visit', block_name: 'prim_visit', description: 'Prim: เยือนโหนด', category: 'visuals' },
        { block_key: 'prim_relax', block_name: 'prim_relax', description: 'Prim: อัปเดตตาราง', category: 'visuals' },
        { block_key: 'kruskal_visit', block_name: 'kruskal_visit', description: 'Kruskal: พิจารณาเส้นทาง', category: 'visuals' },
        { block_key: 'kruskal_add_edge', block_name: 'kruskal_add_edge', description: 'Kruskal: เลือกเส้นเข้าต้นไม้', category: 'visuals' },
        { block_key: 'knapsack_pick_item', block_name: 'knapsack_pick_item', description: 'Knapsack: ยกไอเท็ม', category: 'visuals' },
        { block_key: 'knapsack_skip_item', block_name: 'knapsack_skip_item', description: 'Knapsack: ข้ามไอเท็ม (ไม่เลือก)', category: 'visuals' },
        { block_key: 'knapsack_remove_item', block_name: 'knapsack_remove_item', description: 'Knapsack: วางไอเท็ม', category: 'visuals' },
        { block_key: 'knapsack_consider_item', block_name: 'knapsack_consider_item', description: 'Knapsack: พิจารณาไอเท็ม', category: 'visuals' },
        { block_key: 'knapsack_dp_update', block_name: 'knapsack_dp_update', description: 'Knapsack: อัปเดตตาราง', category: 'visuals' },
        { block_key: 'knapsack_prune_skip_item', block_name: 'knapsack_prune_skip_item', description: 'Knapsack: ตัดกิ่งไอเท็ม (Pruning)', category: 'visuals' },
        { block_key: 'subset_sum_consider', block_name: 'subset_sum_consider', description: 'Subset Sum: พิจารณา', category: 'visuals' },
        { block_key: 'subset_sum_include', block_name: 'subset_sum_include', description: 'Subset Sum: รวมลงสัพเซ็ต', category: 'visuals' },
        { block_key: 'subset_sum_exclude', block_name: 'subset_sum_exclude', description: 'Subset Sum: ไม่รวม', category: 'visuals' },
        { block_key: 'subset_sum_reset', block_name: 'subset_sum_reset', description: 'Subset Sum: ยกเลิก/รีเซ็ต', category: 'visuals' },
        { block_key: 'subset_sum_dp_update', block_name: 'subset_sum_dp_update', description: 'Subset Sum: อัปเดต DP', category: 'visuals' },
        { block_key: 'subset_sum_prune_exclude', block_name: 'subset_sum_prune_exclude', description: 'Subset Sum: ตัดกิ่ง (Prune Exclude)', category: 'visuals' },
        { block_key: 'coin_change_add_warrior_to_selection', block_name: 'coin_change_add_warrior_to_selection', description: 'Coin Change: เพิ่มตัว', category: 'visuals' },
        { block_key: 'coin_change_track_decision', block_name: 'coin_change_track_decision', description: 'Coin Change: บันทึกข้อมูล DP', category: 'visuals' },
        { block_key: 'coin_change_remove_warrior', block_name: 'coin_change_remove_warrior', description: 'Coin Change: เอาตัวออก', category: 'visuals' },
        { block_key: 'coin_change_consider', block_name: 'coin_change_consider', description: 'Coin Change: พิจารณา', category: 'visuals' },
        { block_key: 'coin_change_memo_hit', block_name: 'coin_change_memo_hit', description: 'Coin Change: เจอค่า Memo', category: 'visuals' },
        { block_key: 'coin_change_pick_coin', block_name: 'coin_change_pick_coin', description: 'Coin Change: เลือกเหรียญ', category: 'visuals' },
        { block_key: 'coin_change_skip_coin', block_name: 'coin_change_skip_coin', description: 'Coin Change: ข้ามเหรียญ', category: 'visuals' },
        { block_key: 'coin_change_remove_coin', block_name: 'coin_change_remove_coin', description: 'Coin Change: เอาเหรียญออก', category: 'visuals' },
        { block_key: 'coin_change_prune_skip', block_name: 'coin_change_prune_skip', description: 'Coin Change: ตัดกิ่งเหรียญ (Pruning)', category: 'visuals' },
        { block_key: 'emei_highlight_peak', block_name: 'emei_highlight_peak', description: 'Emei: ส่องยอดเขา', category: 'visuals' },
        { block_key: 'emei_highlight_path', block_name: 'emei_highlight_path', description: 'Emei: ส่องเส้นทางผ่าน', category: 'visuals' },
        { block_key: 'emei_show_final_result', block_name: 'emei_show_final_result', description: 'Emei: แสดงผลทางที่ง่ายสุด', category: 'visuals' },
        { block_key: 'graph_get_neighbors_visual', block_name: 'graph_get_neighbors_visual', description: 'ดึงเพื่อนบ้านพร้อม Visual (DFS)', category: 'visuals' },
        { block_key: 'mark_visited_visual', block_name: 'mark_visited_visual', description: 'Mark โหนด Visited (Visual)', category: 'visuals' },
        { block_key: 'show_path_visual', block_name: 'show_path_visual', description: 'แสดงเส้นทาง Show Path (Visual)', category: 'visuals' },

        // Functions
        { block_key: 'procedures_defreturn', block_name: 'procedures_defreturn', description: 'ประกาศฟังก์ชันมี Return', category: 'functions' },
        { block_key: 'procedures_defnoreturn', block_name: 'procedures_defnoreturn', description: 'ประกาศฟังก์ชันไม่มี Return', category: 'functions' },
        { block_key: 'procedures_callreturn', block_name: 'procedures_callreturn', description: 'เรียกฟังก์ชันมี Return', category: 'functions' },
        { block_key: 'procedures_callnoreturn', block_name: 'procedures_callnoreturn', description: 'เรียกฟังก์ชันไม่มี Return', category: 'functions' },
        { block_key: 'procedures_return', block_name: 'procedures_return', description: 'คืนค่า (Return) โดดๆ', category: 'functions' },

        // Variables
        { block_key: 'variables_get', block_name: 'variables_get', description: 'ดึงค่าตัวแปร', category: 'variables' },
        { block_key: 'variables_set', block_name: 'variables_set', description: 'ตั้งค่าตัวแปร', category: 'variables' },
        { block_key: 'math_change', block_name: 'math_change', description: 'เพิ่ม/ลดค่าให้กับตัวแปร', category: 'variables' },
        { block_key: 'local_variable_set', block_name: 'local_variable_set', description: 'ประกาศ/ตั้งค่าตัวแปร Local', category: 'variables' },
        { block_key: 'variables_game_input', block_name: 'variables_game_input', description: 'รับข้อมูลจากด่านใส่ตัวแปร', category: 'variables' }
    ];

    for (const block of blocks) {
        await prisma.block.upsert({
            where: { block_key: block.block_key },
            update: {
                block_name: block.block_name,
                description: block.description,
                category: block.category,
            },
            create: {
                block_key: block.block_key,
                block_name: block.block_name,
                description: block.description,
                category: block.category,
            },
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