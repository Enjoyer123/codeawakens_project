import Phaser from "phaser";

/**
 * Setup Rope Partition Loading/State (Now Tree Visualization)
 */
export function setupRopePartition(scene) {
    try {
        const level = scene?.levelData;
        const gameType = level?.gameType;
        const appliedType = level?.appliedData?.type;

        if (gameType !== 'rope_partition' && appliedType !== 'BACKTRACKING_ROPE_PARTITION') return;

        console.log('🌳 Setting up Rope Partition Tree in Phaser');

        // Clean up previous visuals
        if (scene.ropePartition) {
            if (scene.ropePartition.container) scene.ropePartition.container.destroy();
        }

        const container = scene.add.container(0, 0);

        // Background for tree area (optional)
        // const bg = scene.add.rectangle(scene.scale.width/2, scene.scale.height/2, scene.scale.width, scene.scale.height, 0x111827);
        // container.add(bg);

        // Header
        const headerText = scene.add.text(scene.scale.width / 2, 30, level?.level_name || "Rope Partition", {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(headerText);

        // Store references
        scene.ropePartition = {
            container,
            width: scene.scale.width,
            height: scene.scale.height,
            drawnNodes: new Map(), // Map<id, {circle, text, edge}>
            nodesData: []
        };

        // Render initial state
        updateRopePartitionVisuals(scene, {
            nodes: [],
            result: null
        });

    } catch (e) {
        console.warn('setupRopePartition error:', e);
    }
}

/**
 * Update Rope Partition Visuals (Tree)
 * @param {Phaser.Scene} scene 
 * @param {Object} state - { nodes: Array, result: any }
 */
export function updateRopePartitionVisuals(scene, state) {
    if (!scene || !scene.ropePartition) return;
    const { container, width, height, drawnNodes } = scene.ropePartition;

    // Check if state has nodes
    const nodes = state.nodes || [];
    if (nodes.length === 0 && drawnNodes.size > 0) {
        // Clear all if empty
        container.removeAll(true);
        drawnNodes.clear();
        return;
    }

    // --- Tree Layout Algorithm (BFS Layering) ---
    const startY = 80;
    const levelHeight = 80;

    const levelNodes = new Map(); // depth -> nodes[]
    const positions = new Map();  // id -> {x, y}

    nodes.forEach(node => {
        // Default depth to 0 if missing
        const d = node.depth || 0;
        if (!levelNodes.has(d)) {
            levelNodes.set(d, []);
        }
        levelNodes.get(d).push(node);
    });

    // Calculate Positions
    levelNodes.forEach((layerNodes, depth) => {
        const levelWidth = width - 100;
        const spacing = levelWidth / (layerNodes.length + 1);
        layerNodes.forEach((node, idx) => {
            positions.set(node.id, {
                x: 50 + spacing * (idx + 1),
                y: startY + depth * levelHeight
            });
        });
    });

    // --- Drawing ---

    // Helper to get color (Updated for better visibility)
    const getNodeColor = (status) => {
        if (status === 'success') return { fill: 0x32CD32, stroke: 0x006400 }; // Lime Green / Dark Green
        if (status === 'pruned') return { fill: 0xFF4500, stroke: 0x8B0000 };  // Orange Red / Dark Red
        if (status === 'visiting') return { fill: 0xFFD700, stroke: 0xB8860B }; // Gold / Dark Goldenrod
        return { fill: 0xffffff, stroke: 0x4ecdc4 }; // White/Teal
    };

    // Draw Edges first (so they are behind nodes)
    nodes.forEach(node => {
        if (node.parentId !== undefined && node.parentId !== -1 && positions.has(node.parentId) && positions.has(node.id)) {
            const parentPos = positions.get(node.parentId);
            const nodePos = positions.get(node.id);
            const edgeKey = `edge_${node.parentId}_${node.id}`;

            let edge = drawnNodes.get(edgeKey);
            let label = drawnNodes.get(edgeKey + '_label');

            if (!edge) {
                edge = scene.add.graphics();
                container.addAt(edge, 0); // Add at bottom
                drawnNodes.set(edgeKey, edge);

                // Add label for cut value
                label = scene.add.text(0, 0, `${node.cut || '?'}`, {
                    fontSize: '12px', color: '#ffff00', fontStyle: 'bold', backgroundColor: '#000000'
                }).setOrigin(0.5);
                container.add(label);
                drawnNodes.set(edgeKey + '_label', label);
            }

            // Always update edge position as parent/child might have moved
            edge.clear();

            // Edge style based on child status
            if (node.status === 'success') edge.lineStyle(4, 0x32CD32);
            else if (node.status === 'pruned') edge.lineStyle(2, 0xFF4500);
            else edge.lineStyle(2, 0x4ecdc4);

            edge.beginPath();
            edge.moveTo(parentPos.x, parentPos.y + 20); // Just below parent
            edge.lineTo(nodePos.x, nodePos.y - 20); // Just above child
            edge.strokePath();

            // Update label position
            const midX = (parentPos.x + nodePos.x) / 2;
            const midY = (parentPos.y + nodePos.y) / 2;
            if (label) {
                label.setPosition(midX, midY);
                label.setText(`${node.cut || '?'}`);
            }
        }
    });

    // Draw Nodes
    nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        let visuals = drawnNodes.get(node.id);
        const color = getNodeColor(node.status);

        if (!visuals) {
            // Create new node visual
            const circle = scene.add.circle(pos.x, pos.y, 20, color.fill);
            circle.setStrokeStyle(3, color.stroke);

            const text = scene.add.text(pos.x, pos.y, `${node.sum}`, {
                fontSize: '16px', color: '#000000', fontStyle: 'bold'
            }).setOrigin(0.5);

            // Optional: Pruned text
            let prunedText = null;
            if (node.status === 'pruned') {
                prunedText = scene.add.text(pos.x, pos.y + 30, '> L', {
                    fontSize: '10px', color: '#ff0000'
                }).setOrigin(0.5);
                container.add(prunedText);
            }

            container.add(circle);
            container.add(text);

            visuals = { circle, text, prunedText, targetX: pos.x, targetY: pos.y };
            drawnNodes.set(node.id, visuals);
        } else {
            // Optimization: Only tween if position CHANGED significantly (> 1px)
            const dist = Phaser.Math.Distance.Between(visuals.targetX, visuals.targetY, pos.x, pos.y);

            if (dist > 1) {
                // Stop existing tweens if any
                if (visuals.moveTween) {
                    visuals.moveTween.stop();
                    visuals.moveTween = null;
                }

                visuals.targetX = pos.x;
                visuals.targetY = pos.y;

                visuals.moveTween = scene.tweens.add({
                    targets: [visuals.circle, visuals.text],
                    x: pos.x,
                    y: pos.y,
                    duration: 200, // Slightly faster
                    ease: 'Power2',
                    onComplete: () => {
                        visuals.moveTween = null;
                    }
                });

                if (visuals.prunedText) {
                    scene.tweens.add({
                        targets: visuals.prunedText,
                        x: pos.x,
                        y: pos.y + 30,
                        duration: 200
                    });
                }
            }

            // Update color instantly
            visuals.circle.setFillStyle(color.fill);
            visuals.circle.setStrokeStyle(3, color.stroke);
            visuals.text.setText(`${node.sum}`);

            // Handle Pruned Text appearing dynamically
            if (node.status === 'pruned' && !visuals.prunedText) {
                visuals.prunedText = scene.add.text(pos.x, pos.y + 30, '> L', {
                    fontSize: '10px', color: '#ff0000'
                }).setOrigin(0.5);
                container.add(visuals.prunedText);
            }
        }
    });

    // Show Result Overlay if finished
    if (state.result !== undefined && state.result !== null) {
        let resText = drawnNodes.get('result_overlay');
        const resY = height - 50;
        const msg = state.result === -1 ? 'Cannot find answer (-1)' : `Answer: ${state.result}`;
        const color = state.result === -1 ? '#ff6b6b' : '#00ff00';

        if (!resText) {
            resText = scene.add.text(width / 2, resY, msg, {
                fontSize: '24px',
                color: color,
                fontStyle: 'bold',
                backgroundColor: '#000000aa',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            container.add(resText);
            drawnNodes.set('result_overlay', resText);
        } else {
            resText.setText(msg);
            resText.setColor(color);
        }
    }
}
