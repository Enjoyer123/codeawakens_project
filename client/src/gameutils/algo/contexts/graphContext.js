export function buildGraphContext(levelData, trace) {
    const map = buildGraphMap(levelData.nodes || [], levelData.edges || []);
    const all_nodes = (levelData.nodes || []).map(n => n.id);

    // Graph level start/goal from level data
    const startNode = levelData.start_node_id !== undefined ? levelData.start_node_id : 0;
    const goalNode = levelData.goal_node_id !== undefined ? levelData.goal_node_id : (all_nodes.length > 0 ? all_nodes[all_nodes.length - 1] : 0);

    const context = {
        /* ==========================================
           1. BASE GRAPH CONTEXT (Core Variables)
           ========================================== */
        trace, // Expose trace array to Blockly generated code
        map,
        graph: map,    // Alias สำหรับ Blockly example ที่ใช้ "graph" เป็นชื่อ parameter
        all_nodes,
        start: startNode,
        goal: goalNode,
        
        /* ==========================================
           2. NEIGHBOR & TRAVERSAL HELPERS (DFS / BFS)
           ========================================== */
        getGraphNeighborsWithWeight: (n) => {
            const key = String(n);
            return map[key] || [];
        },
        getGraphNeighborsWithVisualSync: (n) => {
            const key = String(n);
            const rawNeighbors = map[key] || [];
            let cleanNeighbors = rawNeighbors;
            if (rawNeighbors.length > 0 && Array.isArray(rawNeighbors[0])) {
                cleanNeighbors = rawNeighbors.map(nw => nw[0]);
            }
            trace.push({ action: 'visit', node: n, neighbors: [...cleanNeighbors] });
            return cleanNeighbors;
        },
        showPathUpdateWithVisual: async (path) => {
            if (Array.isArray(path)) {
                trace.push({ action: 'show_path', path: [...path] });
            }
        },
        /**
         * หาเพื่อนบ้าน (Neighbors) พร้อมค่าน้ำหนักเส้นเชื่อม
         * เพื่อให้บันทึกลง Trace สำหรับทำ Animation Visited ของโหนดนั้นๆ
         */
        getGraphNeighborsWithWeightWithVisualSync: async (graphData, currentNode) => {
            const nodeKey = String(currentNode);
            let neighborsWithWeight = [];

            // ถ้ารับกราฟมาตรงๆ (เป็น Array)
            if (Array.isArray(graphData)) {
                for (const edge of graphData) {
                    const u = edge.from !== undefined ? edge.from : (edge.u !== undefined ? edge.u : edge[0]);
                    const v = edge.to !== undefined ? edge.to : (edge.v !== undefined ? edge.v : edge[1]);
                    const weight = edge.weight ?? edge.value ?? edge.w ?? edge[2] ?? 1;
                    
                    if (String(u) === nodeKey && v !== undefined) {
                        neighborsWithWeight.push([v, weight]);
                    } else if (String(v) === nodeKey && u !== undefined) {
                        neighborsWithWeight.push([u, weight]);
                    }
                }
            } else {
                // ถ้าดึงจาก Map ที่เตรียมไว้ตอนสร้าง Context
                neighborsWithWeight = map[nodeKey] || [];
            }

            // สกัดเฉพาะ ID ของโหนดเป้าหมาย (เพื่อบันทึกลง Trace ว่ากำลังดมกลิ่นโหนดไหน)
            const neighborIds = [];
            for (const neighbor of neighborsWithWeight) {
                if (Array.isArray(neighbor)) {
                    neighborIds.push(neighbor[0]);
                } else {
                    neighborIds.push(neighbor);
                }
            }
            
            trace.push({ action: 'visit', node: currentNode, neighbors: neighborIds });
            return neighborsWithWeight;
        },

        /**
         * ดึงเส้นเชื่อม (Edges) ทั้งหมดจากกราฟ
         * (รองรับข้อมูลหลายรูปแบบทั้ง Array และ Object)
         */
        getAllEdges: (graph) => {
            const source = Array.isArray(graph) ? graph : (levelData.edges || []);
            
            return source.map(edge => {
                // กรณีที่เป็น Array เช่น [0, 1, 10]
                if (Array.isArray(edge)) {
                    const from = edge[0];
                    const to = edge[1];
                    const weight = Number(edge[2] ?? 1);
                    return [from, to, weight];
                }
                
                // กรณีที่เป็น Object เช่น { from: 0, to: 1, weight: 10 }
                const from = edge.from ?? edge.u;
                const to = edge.to ?? edge.v;
                const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
                return [from, to, weight];
            });
        },
        sortEdgesByWeight: (edges) => {
            if (!Array.isArray(edges)) return [];
            return [...edges].sort((a, b) => {
                const wa = Array.isArray(a) ? Number(a[2] ?? 0) : 0;
                const wb = Array.isArray(b) ? Number(b[2] ?? 0) : 0;
                return wa - wb;
            });
        },
        getNodeValue: (node) => typeof node === 'number' ? node : parseInt(node) || 0,

        /* ==========================================
           4. VISUAL STUBS (For Graph Generators)
           ========================================== */
        markVisitedWithVisual: async (node) => {
            trace.push({ action: 'visit', node });
        },

        /* ==========================================
           4b. ALGORITHM TRACE RECORDERS
           (Generators เรียกฟังก์ชันพวกนี้แทนการเขียน trace.push ตรงๆ)
           ========================================== */
        // --- Dijkstra ---
        recordDijkstraVisit: (node, dist) => {
            trace.push({ action: 'dijkstra_visit', node, dist });
        },
        recordDijkstraRelax: (from, to, newDist) => {
            trace.push({ action: 'dijkstra_relax', from, to, newDist });
        },
        // --- Prim ---
        recordPrimVisit: (node, parent, dist) => {
            trace.push({ action: 'prim_visit', node, parent, dist });
        },
        recordPrimRelax: (from, to, newDist) => {
            trace.push({ action: 'prim_relax', from, to, newDist });
        },
        // --- Kruskal ---
        recordKruskalVisit: (from, to, weight) => {
            trace.push({ action: 'kruskal_visit', from, to, weight });
        },
        recordKruskalAddEdge: (from, to, weight) => {
            trace.push({ action: 'kruskal_add_edge', from, to, weight });
        },

        /* ==========================================
           5. KRUSKAL STUBS (Disjoint Set Union)
           ========================================== */
        dsuFind: (parent, i) => {
            if (parent[i] === undefined) parent[i] = i;
            while (parent[i] !== i) {
                if (parent[parent[i]] === undefined) parent[parent[i]] = parent[i];
                parent[i] = parent[parent[i]];
                i = parent[i];
            }
            return i;
        },
        dsuUnion: (parent, rank, x, y) => {
            const xr = context.dsuFind(parent, x);
            const yr = context.dsuFind(parent, y);
            if (xr === yr) return false;
            if ((rank[xr] || 0) < (rank[yr] || 0)) parent[xr] = yr;
            else if ((rank[xr] || 0) > (rank[yr] || 0)) parent[yr] = xr;
            else { parent[yr] = xr; rank[xr] = (rank[xr] || 0) + 1; }
            return true;
        },

        /* ==========================================
           6. PRIM / DIJKSTRA STUBS (Min/Max finding)
           ========================================== */
        /**
         * หาตำแหน่ง (Index) ของค่าที่น้อยที่สุดใน List
         * @param {Array} list - ลิสต์ของตัวเลข หรือคู่ [ตัวเลข, ห้อยท้าย]
         * @param {Array} ex - ลิสต์จำของที่ถูก Exclude ไปแล้ว (เช่น visited ใน Dijkstra)
         */
        findMinIndex: async (list, ex) => {
            if (!Array.isArray(list) || list.length === 0) return -1;
            
            let minIndex = -1;
            let minValue = Infinity;

            for (let i = 0; i < list.length; i++) {
                // ข้ามถ้าถูก mark ว่า exclude (visited)
                if (ex && ex[i] === true) continue;

                const item = list[i];
                const value = Array.isArray(item) ? Number(item[0]) : Number(item);
                
                // ข้ามถ้าไม่ใช่ตัวเลข
                if (isNaN(value)) continue;

                if (value < minValue) {
                    minValue = value;
                    minIndex = i;
                }
            }
            return minIndex;
        },

        /**
         * หาตำแหน่ง (Index) ของค่าที่มากที่สุดใน List
         */
        findMaxIndex: async (list, ex) => {
            if (!Array.isArray(list) || list.length === 0) return -1;
            
            let maxIndex = -1;
            let maxValue = -Infinity;

            for (let i = 0; i < list.length; i++) {
                // ข้ามถ้าถูก mark ว่า exclude (visited)
                if (ex && ex[i] === true) continue;

                const item = list[i];
                const value = Array.isArray(item) ? Number(item[0]) : Number(item);
                
                // ข้ามถ้าไม่ใช่ตัวเลข
                if (isNaN(value)) continue;

                if (value > maxValue) {
                    maxValue = value;
                    maxIndex = i;
                }
            }
            return maxIndex;
        },

        /* ==========================================
           7. MISC LIST HELPERS & STATE GETTERS
           ========================================== */
        listPush: (list, item) => { if (Array.isArray(list)) list.push(item); },
        listSet: (list, idx, val) => { if (Array.isArray(list)) list[idx] = val; },
        dictSet: (dict, key, val) => { if (dict && typeof dict === 'object') dict[key] = val; },
        
        // Expose state getters for generated code if needed
        getCurrentGameState: () => ({ levelData, currentNodeId: 0 }),
    };

    return context;
}

/* ==========================================
   8. INTERNAL HELPER FUNCTIONS
   ========================================== */
/**
 * สร้าง Adjacency List (Map) เพื่อให้ค้นหา Neighbor ได้ไวๆ
 */
function buildGraphMap(nodes, edges) {
    const map = {};
    
    // ตั้งต้นให้ทุก Node มี Array ว่างๆ เตรียมเก็บเพื่อนบ้าน
    for (const node of nodes) {
        map[node.id] = [];
    }
    
    // วนลูปเชื่อมเส้น (รองรับรูปแบบ Object แปลกๆ จาก DB)
    for (const edge of edges) {
        const from = edge.from ?? edge.u;
        const to = edge.to ?? edge.v;
        const weight = edge.weight ?? edge.value ?? edge.w ?? 1;
        
        if (from !== undefined && to !== undefined) {
            // ป้องกัน undefined ถ้า database ข้อมูลหลุด
            if (!map[from]) map[from] = [];
            if (!map[to]) map[to] = [];
            
            // ป้องกันเส้นเชื่อมซ้ำ
            const isAlreadyConnectedFrom = map[from].some(e => (Array.isArray(e) ? e[0] : e) === to);
            if (!isAlreadyConnectedFrom) {
                map[from].push([to, weight]);
            }

            const isAlreadyConnectedTo = map[to].some(e => (Array.isArray(e) ? e[0] : e) === from);
            if (!isAlreadyConnectedTo) {
                map[to].push([from, weight]);
            }
        }
    }
    
    return map;
}
