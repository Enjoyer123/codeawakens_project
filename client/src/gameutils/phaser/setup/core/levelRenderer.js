// Core level rendering functions
// Handles background, nodes, edges, and obstacles
import Phaser from "phaser";

/**
 * Draw level background, nodes, and edges
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function drawLevel(scene) {
    if (!scene || !scene.levelData) {
        console.warn('⚠️ Scene or levelData is null, cannot draw level');
        return;
    }

    // ตรวจสอบว่า scene.add มีอยู่จริง
    if (!scene.add) {
        console.error('❌ Scene.add is null, scene may not be ready yet');
        return;
    }

    // 🎨 วาด Background Image ก่อน
    console.log('🎨 Drawing background image...');
    if (scene.textures && scene.textures.exists('bg')) {
        try {
            const bg = scene.add.image(600, 450, 'bg');
            bg.setDisplaySize(scene.scale.width, scene.scale.height);
            bg.setPosition(scene.scale.width / 2, scene.scale.height / 2);
            console.log('✅ Background image drawn successfully');
        } catch (error) {
            console.error('❌ Error creating background image:', error);
        }
    } else {
        console.warn('⚠️ Background texture "bg" not found!');
    }

    let graphics;
    try {
        graphics = scene.add.graphics();
    } catch (error) {
        console.error('❌ Error creating graphics:', error);
        return;
    }
    graphics.setDepth(1);

    // Initialize node labels array if it doesn't exist
    if (!scene.nodeLabels) {
        scene.nodeLabels = [];
    } else {
        // Clean up existing labels
        scene.nodeLabels.forEach(label => {
            if (label && label.destroy) {
                label.destroy();
            }
        });
        scene.nodeLabels = [];
    }

    // Initialize edge weight labels array if it doesn't exist
    if (!scene.edgeWeightLabels) {
        scene.edgeWeightLabels = [];
    } else {
        // Clean up existing edge weight labels
        scene.edgeWeightLabels.forEach(label => {
            if (label && label.destroy) {
                label.destroy();
            }
        });
        scene.edgeWeightLabels = [];
    }

    // Draw edges FIRST (behind nodes)
    if (!scene.levelData.edges || !Array.isArray(scene.levelData.edges)) {
        console.warn('⚠️ Edges is not an array:', scene.levelData.edges);
    } else {
        console.log(`🎨 Drawing ${scene.levelData.edges.length} edges...`);
    }

    graphics.lineStyle(3, 0xF5E6D3, 0.6); // Soft cream color with reduced opacity
    if (scene.levelData.edges && Array.isArray(scene.levelData.edges)) {
        scene.levelData.edges.forEach((edge, index) => {
            try {
                const fromNode = scene.levelData.nodes.find((n) => n.id === edge.from);
                const toNode = scene.levelData.nodes.find((n) => n.id === edge.to);

                if (!fromNode || !toNode) {
                    console.warn(`⚠️ Edge ${index}: Cannot find nodes for edge from ${edge.from} to ${edge.to}`);
                    return;
                }

                graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

                // แสดง edge weight ถ้ามี
                if (edge.value !== undefined && edge.value !== null && !isNaN(Number(edge.value))) {
                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    const weightText = scene.add.text(midX, midY, edge.value.toString(), {
                        fontSize: '14px',
                        color: '#000000',
                        fontStyle: 'bold',
                        backgroundColor: '#FFD700',
                        padding: { x: 6, y: 3 },
                    });
                    weightText.setOrigin(0.5, 0.5);
                    weightText.setDepth(2); // Above graphics but below player/monsters
                    scene.edgeWeightLabels.push(weightText);
                }
            } catch (error) {
                console.error(`❌ Error drawing edge ${index}:`, error, edge);
            }
        });
        console.log(`✅ Drawn ${scene.levelData.edges.length} edges successfully`);
    }

    // Draw nodes AFTER edges (on top)
    scene.levelData.nodes.forEach((node) => {
        const isStart = node.id === scene.levelData.startNodeId;
        const isGoal = node.id === scene.levelData.goalNodeId;

        // Node color based on type
        let nodeColor = 0x667eea; // Blue default
        if (isStart) nodeColor = 0x10b981; // Green start
        else if (isGoal) nodeColor = 0xf59e0b; // Yellow/Orange goal

        graphics.fillStyle(nodeColor, 1);
        graphics.fillCircle(node.x, node.y, 18);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(node.x, node.y, 18);

        // Add node ID label
        const nodeLabel = scene.add.text(node.x, node.y, node.id.toString(), {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        nodeLabel.setOrigin(0.5, 0.5);
        nodeLabel.setDepth(2); // Above graphics but below player/monsters
        scene.nodeLabels.push(nodeLabel);
    });

    // Store graphics reference
    scene.levelGraphics = graphics;
}

/**
 * Setup obstacle sprites (pits)
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function setupObstacles(scene) {
    // เริ่มต้น obstacles array เสมอ
    scene.obstacles = [];

    if (!scene.levelData.obstacles || scene.levelData.obstacles.length === 0) {
        return;
    }

    scene.levelData.obstacles.forEach((obstacle, index) => {
        // ตรวจสอบว่า obstacle และ points มีอยู่จริง
        if (!obstacle || !obstacle.points || obstacle.points.length < 3) {
            console.warn(`Skipping obstacle ${index} - missing data or insufficient points:`, obstacle);
            return;
        }

        if (obstacle.type === "pit") {
            // ตรวจสอบว่า points[0] มีอยู่จริง
            if (!obstacle.points[0] || typeof obstacle.points[0].x === 'undefined' || typeof obstacle.points[0].y === 'undefined') {
                console.warn(`Skipping pit obstacle ${index} - invalid first point:`, obstacle.points[0]);
                return;
            }

            // Draw pit
            scene.levelGraphics.fillStyle(0x000000, 0.2); // Reduced from 0.8 to 0.2 for fainter look
            scene.levelGraphics.beginPath();
            scene.levelGraphics.moveTo(obstacle.points[0].x, obstacle.points[0].y);

            for (let i = 1; i < obstacle.points.length; i++) {
                // ตรวจสอบว่า point มีอยู่จริง
                if (obstacle.points[i] && typeof obstacle.points[i].x !== 'undefined' && typeof obstacle.points[i].y !== 'undefined') {
                    scene.levelGraphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
                }
            }
            scene.levelGraphics.closePath();
            scene.levelGraphics.fillPath();

            // Border
            scene.levelGraphics.lineStyle(2, 0x8b4513, 0.3); // Thinner and semi-transparent (was 3, 1.0)
            scene.levelGraphics.strokePath();

            scene.obstacles.push({
                type: "pit",
                points: obstacle.points,
            });
        }
    });
}
