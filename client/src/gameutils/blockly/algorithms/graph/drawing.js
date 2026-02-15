/**
 * dfsDrawing.js
 *
 * Low-level Phaser drawing primitives for DFS/graph visual feedback.
 * Handles: magic circle effects, node/edge highlights, path drawing, cleanup.
 */

import Phaser from "phaser";
import { clearKruskalVisuals } from './mst_visual';

// Visual feedback state
let dfsVisualState = {
    currentScanningNode: null,
    visitedNodes: new Set(),
    currentPath: [],
    container: [],
    isActive: false
};

/** Get mutable reference to visual state (for use by graphVisualApi) */
export function getDfsVisualState() {
    return dfsVisualState;
}

/** Reset visual state to initial values */
export function resetDfsVisualState() {
    dfsVisualState = {
        currentScanningNode: null,
        visitedNodes: new Set(),
        currentPath: [],
        container: [],
        isActive: false
    };
}

/**
 * Draw magic circle effect (วงแหวนเวท)
 */
function drawMagicCircle(graphics, x, y, radius, color, alpha, starRotation = 0) {
    // Glow effect layer
    graphics.fillStyle(color, alpha * 0.25);
    graphics.fillCircle(x, y, radius * 1.2);
    graphics.fillStyle(color, alpha * 0.15);
    graphics.fillCircle(x, y, radius * 1.4);

    // Outer thick ring
    graphics.lineStyle(5, color, alpha);
    graphics.strokeCircle(x, y, radius);

    // Inner ring
    graphics.lineStyle(3, color, alpha * 0.9);
    graphics.strokeCircle(x, y, radius * 0.75);

    // 7-pointed star (heptagram)
    const starPoints = 7;
    const starRadius = radius * 0.5;
    const starPointsArray = [];

    for (let i = 0; i < starPoints; i++) {
        const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
        const px = x + Math.cos(angle) * starRadius;
        const py = y + Math.sin(angle) * starRadius;
        starPointsArray.push({ x: px, y: py });
    }

    // Connect every 3rd point
    graphics.lineStyle(3, color, alpha);
    for (let i = 0; i < starPoints; i++) {
        const nextIndex = (i + 3) % starPoints;
        graphics.lineBetween(
            starPointsArray[i].x,
            starPointsArray[i].y,
            starPointsArray[nextIndex].x,
            starPointsArray[nextIndex].y
        );
    }

    // Rune symbols around the circle
    const symbolCount = 7;
    const symbolRadius = radius * 0.9;

    for (let i = 0; i < symbolCount; i++) {
        const angle = (i / symbolCount) * Math.PI * 2 - Math.PI / 2 + starRotation;
        const symbolX = x + Math.cos(angle) * symbolRadius;
        const symbolY = y + Math.sin(angle) * symbolRadius;

        graphics.lineStyle(2, color, alpha * 0.9);
        graphics.lineBetween(symbolX, symbolY - 6, symbolX, symbolY + 6);
        graphics.lineBetween(symbolX - 4, symbolY, symbolX + 4, symbolY);
        graphics.lineBetween(symbolX - 3, symbolY - 3, symbolX + 3, symbolY + 3);
        graphics.lineBetween(symbolX - 3, symbolY + 3, symbolX + 3, symbolY - 3);
    }

    // Additional glow lines
    graphics.lineStyle(1, color, alpha * 0.3);
    for (let i = 0; i < starPoints; i++) {
        const angle = (i / starPoints) * Math.PI * 2 - Math.PI / 2 + starRotation;
        const outerX = x + Math.cos(angle) * radius;
        const outerY = y + Math.sin(angle) * radius;
        const innerX = x + Math.cos(angle) * starRadius;
        const innerY = y + Math.sin(angle) * starRadius;
        graphics.lineBetween(outerX, outerY, innerX, innerY);
    }
}

/**
 * Highlight a node with magic circle effect
 */
export function highlightNode(scene, nodeId, color = 0x00ff00, duration = 800) {
    if (!scene || !scene.levelData) return;

    const node = scene.levelData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!scene.dfsHighlightGraphics) {
        scene.dfsHighlightGraphics = scene.add.graphics();
        scene.dfsHighlightGraphics.setDepth(3);
    }

    const graphics = scene.dfsHighlightGraphics;
    graphics.clear();

    const baseRadius = 30;
    const animationObj = { starRotation: 0, alpha: 1 };

    const pulseTween = scene.tweens.add({
        targets: animationObj,
        alpha: { from: 1, to: 0.4 },
        starRotation: { from: 0, to: Math.PI * 2 },
        duration: duration * 2,
        yoyo: false,
        repeat: -1,
        ease: 'Linear',
        onUpdate: function () {
            if (!graphics || !node) return;
            graphics.clear();
            drawMagicCircle(graphics, node.x, node.y, baseRadius, color, animationObj.alpha, animationObj.starRotation);
        }
    });

    if (!scene.dfsHighlightTweens) {
        scene.dfsHighlightTweens = [];
    }
    scene.dfsHighlightTweens.push(pulseTween);
}

/**
 * Highlight an edge between two nodes with animation
 */
export function highlightEdge(scene, fromNodeId, toNodeId, color = 0xff0000, duration = 600) {
    if (!scene || !scene.levelData) return;

    const fromNode = scene.levelData.nodes.find(n => n.id === fromNodeId);
    const toNode = scene.levelData.nodes.find(n => n.id === toNodeId);

    if (!fromNode || !toNode) return;

    if (!scene.dfsEdgeHighlightGraphics) {
        scene.dfsEdgeHighlightGraphics = scene.add.graphics();
        scene.dfsEdgeHighlightGraphics.setDepth(2.5);
    }

    const edgeGraphics = scene.add.graphics();
    edgeGraphics.setDepth(2.5);

    const progressObj = { progress: 0 };
    const angle = Phaser.Math.Angle.Between(fromNode.x, fromNode.y, toNode.x, toNode.y);
    const distance = Phaser.Math.Distance.Between(fromNode.x, fromNode.y, toNode.x, toNode.y);

    scene.tweens.add({
        targets: progressObj,
        progress: 1,
        duration: duration,
        ease: 'Power2.easeOut',
        onUpdate: function () {
            edgeGraphics.clear();
            const currentDistance = distance * progressObj.progress;
            const currentEndX = fromNode.x + Math.cos(angle) * currentDistance;
            const currentEndY = fromNode.y + Math.sin(angle) * currentDistance;

            edgeGraphics.lineStyle(5, color, 0.8);
            edgeGraphics.lineBetween(fromNode.x, fromNode.y, currentEndX, currentEndY);

            if (progressObj.progress > 0.1) {
                const arrowLength = 15;
                const arrowX = currentEndX - Math.cos(angle) * arrowLength;
                const arrowY = currentEndY - Math.sin(angle) * arrowLength;

                edgeGraphics.fillStyle(color, 0.8);
                edgeGraphics.fillTriangle(
                    currentEndX, currentEndY,
                    arrowX + Math.sin(angle) * 8, arrowY - Math.cos(angle) * 8,
                    arrowX - Math.sin(angle) * 8, arrowY + Math.cos(angle) * 8
                );
            }
        },
        onComplete: function () {
            // Edge remains visible until cleared
        }
    });

    if (!scene.dfsEdgeGraphicsList) {
        scene.dfsEdgeGraphicsList = [];
    }
    scene.dfsEdgeGraphicsList.push(edgeGraphics);
}

/**
 * Mark a node as visited
 */
export function markNodeAsVisited(scene, nodeId) {
    if (!scene || !scene.levelData) return;

    const node = scene.levelData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!scene.dfsVisitedGraphics) {
        scene.dfsVisitedGraphics = scene.add.graphics();
        scene.dfsVisitedGraphics.setDepth(2);
    }

    const graphics = scene.dfsVisitedGraphics;
    graphics.fillStyle(0x888888, 0.5);
    graphics.fillCircle(node.x, node.y, 15);

    dfsVisualState.visitedNodes.add(nodeId);
}

/**
 * Show current path being explored
 */
export function showCurrentPath(scene, path) {
    if (!scene || !scene.levelData) return;

    if (!scene.dfsPathGraphics) {
        scene.dfsPathGraphics = scene.add.graphics();
        scene.dfsPathGraphics.setDepth(2.8);
    }

    const graphics = scene.dfsPathGraphics;
    graphics.clear();

    if (path && Array.isArray(path) && path.length >= 2) {
        graphics.lineStyle(4, 0x00ffff, 0.9);

        for (let i = 0; i < path.length - 1; i++) {
            const fromNode = scene.levelData.nodes.find(n => n.id === path[i]);
            const toNode = scene.levelData.nodes.find(n => n.id === path[i + 1]);
            if (fromNode && toNode) {
                graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
            }
        }

        path.forEach(nodeId => {
            const node = scene.levelData.nodes.find(n => n.id === nodeId);
            if (node) {
                graphics.fillStyle(0x00ffff, 0.3);
                graphics.fillCircle(node.x, node.y, 20);
            }
        });
    }

    dfsVisualState.currentPath = path;
}

/**
 * Clear scanning highlights (node, neighbors, edges) but keep path
 */
export function clearScanningHighlights(scene) {
    if (!scene) return;

    if (scene.dfsHighlightTweens) {
        scene.dfsHighlightTweens.forEach(tween => {
            if (tween && tween.isActive) tween.stop();
        });
        scene.dfsHighlightTweens = [];
    }

    if (scene.dfsHighlightGraphics) scene.dfsHighlightGraphics.clear();
    if (scene.dfsNeighborHighlightGraphics) scene.dfsNeighborHighlightGraphics.clear();
    if (scene.dfsEdgeHighlightGraphics) scene.dfsEdgeHighlightGraphics.clear();

    if (scene.dfsEdgeGraphicsList) {
        scene.dfsEdgeGraphicsList.forEach(graphics => {
            if (graphics && graphics.destroy) graphics.destroy();
        });
        scene.dfsEdgeGraphicsList = [];
    }

    clearKruskalVisuals(scene);

    dfsVisualState.currentScanningNode = null;
}

/**
 * Clear all DFS visual feedback
 */
export function clearDfsVisuals(scene) {
    if (!scene) return;

    if (scene.dfsHighlightTweens) {
        scene.dfsHighlightTweens.forEach(tween => {
            if (tween && tween.isActive) tween.stop();
        });
        scene.dfsHighlightTweens = [];
    }

    if (scene.dfsHighlightGraphics) scene.dfsHighlightGraphics.clear();
    if (scene.dfsNeighborHighlightGraphics) scene.dfsNeighborHighlightGraphics.clear();
    if (scene.dfsEdgeHighlightGraphics) scene.dfsEdgeHighlightGraphics.clear();

    if (scene.dfsEdgeGraphicsList) {
        scene.dfsEdgeGraphicsList.forEach(graphics => {
            if (graphics && graphics.destroy) graphics.destroy();
        });
        scene.dfsEdgeGraphicsList = [];
    }

    if (scene.dfsPathGraphics) scene.dfsPathGraphics.clear();
    if (scene.dfsVisitedGraphics) scene.dfsVisitedGraphics.clear();
    if (scene.mstGraphics) scene.mstGraphics.clear();

    resetDfsVisualState();
}

/**
 * Highlight multiple nodes at once (for neighbors)
 */
export function highlightNeighborNodes(scene, nodeIds, color = 0xff0000, duration = 600) {
    if (!scene || !scene.levelData) return;

    if (!scene.dfsNeighborHighlightGraphics) {
        scene.dfsNeighborHighlightGraphics = scene.add.graphics();
        scene.dfsNeighborHighlightGraphics.setDepth(2.8);
    }

    const graphics = scene.dfsNeighborHighlightGraphics;
    graphics.clear();

    nodeIds.forEach(nodeId => {
        const node = scene.levelData.nodes.find(n => n.id === nodeId);
        if (node) {
            graphics.lineStyle(4, color, 0.9);
            graphics.strokeCircle(node.x, node.y, 25);
            graphics.fillStyle(color, 0.3);
            graphics.fillCircle(node.x, node.y, 25);
        }
    });
}
