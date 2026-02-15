/**
 * mstVisual.js
 *
 * MST/Kruskal-specific visual feedback functions.
 * Handles: MST edge display, Kruskal edge highlighting, root info, cleanup.
 */

import {
    clearScanningHighlights,
    highlightNode,
    highlightEdge
} from './drawing';

/**
 * Show MST edges from parent dictionary (for Prim's algorithm)
 */
export function showMSTEdges(scene, parent, color = 0x00ffff) {
    if (!scene || !scene.levelData || !parent) return;

    if (!scene.mstGraphics) {
        scene.mstGraphics = scene.add.graphics();
        scene.mstGraphics.setDepth(3.0);
    }

    const graphics = scene.mstGraphics;
    graphics.clear();

    graphics.lineStyle(6, color, 1.0);

    Object.keys(parent).forEach(nodeId => {
        const parentNodeId = parent[nodeId];
        if (parentNodeId !== undefined && parentNodeId !== null) {
            const fromNode = scene.levelData.nodes.find(n => n.id === Number(parentNodeId));
            const toNode = scene.levelData.nodes.find(n => n.id === Number(nodeId));

            if (fromNode && toNode) {
                graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

                // Direction arrow at midpoint
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                const arrowLength = 15;
                const arrowX = midX - Math.cos(angle) * arrowLength;
                const arrowY = midY - Math.sin(angle) * arrowLength;

                graphics.fillStyle(color, 1.0);
                graphics.fillTriangle(
                    midX, midY,
                    arrowX + Math.sin(angle) * 8, arrowY - Math.cos(angle) * 8,
                    arrowX - Math.sin(angle) * 8, arrowY + Math.cos(angle) * 8
                );
            }
        }
    });
}



/**
 * Show root information for Kruskal's algorithm
 */
export function showKruskalRoot(scene, nodeId, rootId) {
    if (!scene || !scene.levelData) return;

    const node = scene.levelData.nodes.find(n => n.id === Number(nodeId));
    if (!node) return;

    if (!scene.kruskalRootTexts) {
        scene.kruskalRootTexts = {};
    }

    const textKey = `root_${nodeId}`;
    if (!scene.kruskalRootTexts[textKey]) {
        scene.kruskalRootTexts[textKey] = scene.add.text(node.x, node.y - 50, `Root: ${rootId}`, {
            fontSize: '14px',
            color: '#ffff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        scene.kruskalRootTexts[textKey].setDepth(4.0);
    } else {
        scene.kruskalRootTexts[textKey].setText(`Root: ${rootId}`);
        scene.kruskalRootTexts[textKey].setVisible(true);
    }
}

/**
 * Clear Kruskal visual feedback
 */
export function clearKruskalVisuals(scene) {
    if (!scene) return;

    if (scene.kruskalWeightText) {
        scene.kruskalWeightText.setVisible(false);
    }

    if (scene.kruskalRootTexts) {
        Object.values(scene.kruskalRootTexts).forEach(text => {
            if (text && text.setVisible) text.setVisible(false);
        });
    }
}

/**
 * Show MST edges from a list of edges (for Kruskal's algorithm)
 */
export function showMSTEdgesFromList(scene, mstEdges, color = 0x00ffff) {
    if (!scene || !scene.levelData || !Array.isArray(mstEdges)) return;

    if (!scene.mstGraphics) {
        scene.mstGraphics = scene.add.graphics();
        scene.mstGraphics.setDepth(3.0);
    }

    const graphics = scene.mstGraphics;
    graphics.clear();

    graphics.lineStyle(6, color, 1.0);

    mstEdges.forEach(edge => {
        if (!Array.isArray(edge) || edge.length < 2) return;

        const u = Number(edge[0]);
        const v = Number(edge[1]);

        const fromNode = scene.levelData.nodes.find(n => n.id === u);
        const toNode = scene.levelData.nodes.find(n => n.id === v);

        if (fromNode && toNode) {
            graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

            // Direction arrow at midpoint
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const arrowLength = 15;
            const arrowX = midX - Math.cos(angle) * arrowLength;
            const arrowY = midY - Math.sin(angle) * arrowLength;

            graphics.fillStyle(color, 1.0);
            graphics.fillTriangle(
                midX, midY,
                arrowX + Math.sin(angle) * 8, arrowY - Math.cos(angle) * 8,
                arrowX - Math.sin(angle) * 8, arrowY + Math.cos(angle) * 8
            );
        }
    });
}
