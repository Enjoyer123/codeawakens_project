// =========================================================================
// Config: ฟิลด์ที่ต้องกรอกสำหรับแต่ละ Algorithm type
// key ใน fields ต้องตรงกับที่ buildTestLevelData ใน algoTestRunner.js ใช้
// =========================================================================
export const ALGO_INPUT_CONFIG = {
    // Graph Algorithms
    DFS: {
        label: 'Graph Traversal', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1],[0,2],[1,3]]', hint: 'Array of [from, to] or [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    BFS: {
        label: 'Graph Traversal', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1],[0,2],[1,3]]', hint: 'Array of [from, to] or [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    DIJ: {
        label: 'Dijkstra', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
            { key: 'goal', label: 'Goal Node', type: 'number', placeholder: '3' },
        ]
    },
    PRIM: {
        label: 'Prim MST', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
            { key: 'start', label: 'Start Node', type: 'number', placeholder: '0' },
        ]
    },
    KRUSKAL: {
        label: 'Kruskal MST', fields: [
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,4],[0,2,1],[2,1,2]]', hint: 'Array of [from, to, weight]' },
        ]
    },
    // Dynamic Programming
    KNAPSACK: {
        label: 'Knapsack', fields: [
            { key: 'items', label: 'Items', type: 'knapsack_items', placeholder: '', hint: 'กำหนดสมบัติของ Knapsack' },
            { key: 'capacity', label: 'Capacity', type: 'number', placeholder: '5' },
        ]
    },
    COINCHANGE: {
        label: 'Coin Change', fields: [
            { key: 'warriors', label: 'Coins', type: 'number_array', placeholder: '', hint: 'กำหนดประเภทเหรียญทั้งหมด' },
            { key: 'monster_power', label: 'Target Amount', type: 'number', placeholder: '7' },
        ]
    },
    SUBSETSUM: {
        label: 'Subset Sum', fields: [
            { key: 'warriors', label: 'Warriors (weights)', type: 'number_array', placeholder: '', hint: 'กำหนดพลังของนักรบแต่ละตัว' },
            { key: 'target_sum', label: 'Target Sum', type: 'number', placeholder: '5' },
        ]
    },
    // Other Algorithms
    SOLVE: {
        label: 'N-Queen', fields: [
            { key: 'n', label: 'Board Size (N)', type: 'number', placeholder: '4' },
        ]
    },
    MAXCAPACITY: {
        label: 'Max Flow (Emei)', fields: [
            { key: 'n', label: 'number of nodes', type: 'number', placeholder: '4' },
            { key: 'edges', label: 'Edges', type: 'json_array', placeholder: '[[0,1,10],[0,2,5],[1,3,8]]', hint: 'Array of [from, to, capacity]' },
            { key: 'start', label: 'Source Node', type: 'number', placeholder: '0' },
            { key: 'end', label: 'Sink Node', type: 'number', placeholder: '3' },
            { key: 'tourists', label: 'Tourists Count', type: 'number', placeholder: '20' },
        ]
    },
    // Fibonacci
    FIBONACCI: {
        label: 'Fibonacci', fields: [
            { key: 'n', label: 'n (หาค่า Fibonacci ลำดับที่)', type: 'number', placeholder: '5', hint: 'e.g. 5 ๾ fib(5) = 5' },
        ]
    },
};

// =========================================================================
// Helper: สร้าง input_fields object ว่างๆ ตาม function_name
// =========================================================================
export function buildEmptyFields(functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config) return {};
    return Object.fromEntries(config.fields.map(f => [f.key, f.type === 'number' ? '0' : '']));
}

// =========================================================================
// Helper: แปลง input_params object (จาก DB) → input_fields สำหรับ Form
// =========================================================================
export function paramsToFields(inputParams, functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config || !inputParams) return buildEmptyFields(functionName);
    return Object.fromEntries(
        config.fields.map(f => {
            const val = inputParams[f.key];
            if (val === undefined || val === null) return [f.key, f.type === 'number' ? '0' : f.type === 'knapsack_items' || f.type === 'number_array' || f.type === 'json_array' ? '[]' : ''];
            if (f.type === 'json_array' || f.type === 'knapsack_items' || f.type === 'number_array') return [f.key, JSON.stringify(val)];
            return [f.key, String(val)];
        })
    );
}

// =========================================================================
// Helper: แปลง input_fields (จาก Form) → input_params JSON สำหรับ save
// =========================================================================
export function fieldsToParams(inputFields, functionName) {
    const config = ALGO_INPUT_CONFIG[functionName];
    if (!config) return {};
    const result = {};
    for (const f of config.fields) {
        const raw = inputFields[f.key];
        if (raw === undefined || raw === '' || raw === null) continue;
        if (f.type === 'number') {
            result[f.key] = parseFloat(raw) || 0;
        } else if (f.type === 'json_array' || f.type === 'knapsack_items' || f.type === 'number_array') {
            result[f.key] = JSON.parse(raw); // will throw if invalid JSON — caught in handleSave
        }
    }
    return result;
}
