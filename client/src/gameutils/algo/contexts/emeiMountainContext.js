import { isEmeiLevel } from '../../shared/levelType';

/**
 * Context สำหรับเกม ง้อไบ๊ (Emei Mountain / Max Capacity Graph)
 */
export function injectEmeiMountainStubs(context, levelData, trace, code = "") {
    if (!isEmeiLevel(levelData)) return;

    /* ==========================================
       1. EXTRACT GAME VARIABLES
       ========================================== */
    const payload = levelData.algo_data?.payload || {};
    
    context._state = context._state || {};
    // ดึงจำนวนโหนด
    context._state.n = levelData.emeiN ?? payload.n ?? (levelData.nodes ? levelData.nodes.length : 6);

    // ดึงสถานีเริ่มต้น และเป้าหมาย
    context._state.start = levelData.emeiStart ?? payload.start ?? levelData.start_node_id ?? levelData.startNode ?? 0;
    context._state.end = levelData.emeiEnd ?? payload.end ?? levelData.goal_node_id ?? levelData.goalNode ?? 5;
    
    // ดึงจำนวนนักท่องเที่ยว
    context._state.tourists = levelData.emeiTourists ?? payload.tourists ?? payload.tourist ?? 20;

    // ดึงเส้นเชื่อมกระเช้าลอยฟ้า
    let extractedEdges = levelData.emeiEdges ?? payload.edges;
    if (!extractedEdges || extractedEdges.length === 0) {
        extractedEdges = (levelData.edges || []).map(edge => {
            const from = edge.from !== undefined ? edge.from : edge.u;
            const to = edge.to !== undefined ? edge.to : edge.v;
            const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
            return [from, to, weight];
        });
    }
    
    // ถ้าไม่มีข้อมูลเลย ให้เตือนแทนที่จะใช้ข้อมูลปลอม
    if (extractedEdges.length === 0) {
        console.warn('⚠️ [EmeiContext] ไม่พบข้อมูล edges จาก DB — ด่านอาจไม่ถูกตั้งค่า');
    }
    context._state.edges = extractedEdges;

    /* ==========================================
       2. VISUAL STUBS (Trace Recorders)
       ========================================== */
    context.highlightPeak = (node) => { 
        trace.push({ action: 'emei_peak', node }); 
    };
    
    context.highlightCableCar = (u, v, capacity) => { 
        trace.push({ action: 'emei_cable', u, v, capacity }); 
    };
    
    context.showEmeiFinalResult = (bottleneck, rounds) => { 
        trace.push({ action: 'emei_result', bottleneck, rounds }); 
    };
    
    /* ==========================================
       3. PATH RECONSTRUCTION LOGIC
       ========================================== */
    /**
     * ไล่เส้นทางย้อนกลับจากเป้าหมายไปหาจุดเริ่มต้น และบันทึกลง Trace
     */
    context.highlightEmeiPath = (parent, end, bottleneck) => {
        // ถ้าพยายามไปปลายทางที่ไม่ใช่เป้าหมายจริงๆ อาละวาด
        const goalEnd = context._state.end;
        if (goalEnd !== undefined && goalEnd !== null) {
            if (end != goalEnd) {
                return;
            }
        }

        const path = [];
        let curr = end;
        const visited = new Set();
        const nNodes = Array.isArray(parent) ? parent.length : 20;
        let validPathFound = false;

        // แกะรอยย้อนหลังจาก end ไปตาม parent array
        while (curr !== undefined && curr !== null) {
            // ป้องกันลูปไม่รู้จบ (เช่น เส้นทางเป็นวงกลม)
            if (visited.has(curr)) break; 
            
            visited.add(curr);
            path.unshift(curr); // ดันไปไว้หัวแถว เพื่อให้พาทเรียงจากต้นไปปลาย
            
            // หาพ่อแม่ของโหนดปัจจุบัน
            const parentNode = Array.isArray(parent) ? parent[curr] : undefined;
            
            // ถ้าไปถึงจุดเริ่มต้น (ไม่มีพ่อแม่แล้ว) แปลว่าเส้นทางสมบูรณ์
            if (parentNode === undefined || parentNode === null || parentNode === -1) {
                validPathFound = true; 
                break;
            }
            
            // ป้องกันพาทพังๆ ที่ยาวเกินจำนวนโหนด
            if (path.length > nNodes) break; 
            
            curr = parentNode;
        }

        if (!validPathFound) {
            return;
        }

        // บันทึกพาทที่ถูกต้องลง Trace
        trace.push({
            action: 'emei_path',
            path: path, 
            bottleneck: bottleneck,
            goalEnd: context._state.end 
        });
    };
}
