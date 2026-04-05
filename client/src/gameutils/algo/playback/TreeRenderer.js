/**
 * TreeRenderer — Reusable State Space Tree visualizer for Phaser (Functional style)
 * ใช้วาด Recursion Tree แบบ Reingold-Tilford layout
 *
 * Usage:
 *   const tree = createTreeRenderer(scene, canvasW, canvasH);
 *   tree.addNode(null, -1, 10);       // root
 *   tree.addNode(0, coinIdx, 5);      // child of root
 *   tree.setState(1, 'dead');
 *   tree.relayout();
 *   tree.redraw();
 */

/**
 * สร้าง TreeRenderer instance
 * @param {Phaser.Scene} scene
 * @param {number} canvasW
 * @param {number} canvasH
 * @returns {object} public API
 */
export function createTreeRenderer(scene, canvasW, canvasH) {
    // ── Private state ─────────────────────────────────────────────────────────
    const nodes = [];        // array of node data objects
    const children = {};        // parentId → [childId, ...]

    // Layout constants
    const NODE_R = 20;
    const H_GAP = 14;
    const V_STEP = 70;

    // Phaser containers: lines behind, nodes in front
    const container = scene.add.container(0, 0).setDepth(15);
    const linesLayer = scene.add.container(0, 0);
    const nodesLayer = scene.add.container(0, 0);
    container.add([linesLayer, nodesLayer]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    function _getColor(state) {
        const map = { active: 0x1155DD, solved: 0x00AA44, dead: 0x444444, backtrack: 0xBB4400, pruned: 0xDD2222 };
        return map[state] ?? 0x334466;
    }

    function _subtreeWidth(id) {
        const ch = children[id] || [];
        if (!ch.length) return NODE_R * 2 + H_GAP;
        return ch.reduce((sum, cid) => sum + _subtreeWidth(cid), 0);
    }

    function _placeSubtree(id, left, depth) {
        const ch = children[id] || [];
        nodes[id].y = 80 + depth * V_STEP;

        if (!ch.length) {
            nodes[id].x = left + NODE_R;
            return;
        }
        let cx = left;
        for (const cid of ch) {
            _placeSubtree(cid, cx, depth + 1);
            cx += _subtreeWidth(cid);
        }
        const first = nodes[ch[0]];
        const last = nodes[ch[ch.length - 1]];
        nodes[id].x = (first.x + last.x) / 2;
    }

    function _drawNode(n) {
        if (n.circle) { n.circle.destroy(); n.text.destroy(); }

        const isDead = n.state === 'dead';
        const isPruned = n.state === 'pruned';
        const alpha = (isDead || isPruned) ? 0.35 : 1.0;
        const r = n.state === 'active' ? NODE_R + 2 : NODE_R;

        n.circle = scene.add.circle(n.sx, n.sy, r, _getColor(n.state)).setAlpha(alpha);
        n.circle.setStrokeStyle(n.state === 'active' ? 3 : 1.5, 0xFFFFFF, alpha);

        const nodeText = isPruned ? '❌' : n.amount.toString();
        
        n.text = scene.add.text(n.sx, n.sy, nodeText, {
            fontSize: isPruned ? '20px' : '15px', color: '#FFF', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(alpha);

        nodesLayer.add([n.circle, n.text]);
    }

    function _drawEdge(n) {
        if (n.parentId === null) return;
        const p = nodes[n.parentId];

        if (n.line) n.line.destroy();
        if (n.edgeLabel) n.edgeLabel.destroy();

        const isDead = n.state === 'dead' || n.state === 'pruned';
        const alpha = isDead ? 0.2 : 0.7;
        const color = isDead ? 0x555555 : 0xAABBCC;

        n.line = scene.add.line(0, 0,
            p.sx, p.sy + NODE_R,
            n.sx, n.sy - NODE_R,
            color, alpha,
        ).setOrigin(0, 0).setLineWidth(isDead ? 1 : 1.5);
        linesLayer.add(n.line);

        if (n.edgeLabelText) {
            const mx = (p.sx + n.sx) / 2;
            const my = (p.sy + n.sy) / 2 - 8;
            n.edgeLabel = scene.add.text(mx, my, n.edgeLabelText, {
                fontSize: '11px', color: '#FFDD88', stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5).setAlpha(alpha);
            linesLayer.add(n.edgeLabel);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** เพิ่ม node ใหม่ (return id) */
    function addNode(parentId, coinIdx, amount, edgeLabelText = '') {
        const id = nodes.length;
        const depth = parentId === null ? 0 : nodes[parentId].depth + 1;
        nodes.push({
            id, parentId, coinIdx, amount, depth,
            x: 0, y: 0, sx: 0, sy: 0,
            state: 'pending', edgeLabelText,
            circle: null, text: null, line: null, edgeLabel: null,
        });
        if (parentId !== null) {
            if (!children[parentId]) children[parentId] = [];
            children[parentId].push(id);
        }
        return id;
    }

    /** เปลี่ยน state ของ node */
    function setState(id, state) {
        nodes[id].state = state;
    }

    /** จัด layout ทั้ง tree ใหม่ (Reingold-Tilford) */
    function relayout() {
        if (!nodes.length) return;
        _placeSubtree(0, 0, 0);

        const xs = nodes.map(n => n.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const treeW = maxX - minX + NODE_R * 2 + H_GAP;

        const availW = canvasW - 20;
        const scale = Math.min(1.0, availW / treeW);
        const offsetX = (availW - treeW * scale) / 2 - minX * scale;

        for (const n of nodes) {
            n.sx = n.x * scale + offsetX;
            n.sy = n.y * scale;
        }
    }

    /** วาด node + edge ทั้งหมดใหม่ */
    function redraw() {
        for (const n of nodes) {
            _drawEdge(n);
            _drawNode(n);
        }
    }

    return {
        addNode,
        setState,
        relayout,
        redraw,
        // expose internals ที่ playback files เข้าถึงโดยตรง
        get nodes() { return nodes; },
        get children() { return children; },
        get container() { return container; },
        get graphics() { return linesLayer; }, // compat: tree.graphics → linesLayer
    };
}

