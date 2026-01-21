import Phaser from "phaser";
import { getCurrentGameState } from '../../shared/game';


/**
 * Setup Emei Mountain visualization
 * @param {Phaser.Scene} scene 
 */
export function setupEmeiMountain(scene) {
    if (!scene.levelData || scene.levelData.appliedData?.type !== "GRAPH_MAX_CAPACITY") {
        return;
    }

    console.log("🏙️ Setting up Emei Mountain visualization...");

    // Override drawLevel logic or add specialized elements
    // We'll keep the standard graph but add thematic icons

    const nodes = scene.levelData.nodes || [];
    const edges = scene.levelData.edges || [];

    // Create a container for Emei UI
    if (!scene.emeiUI) {
        scene.emeiUI = scene.add.container(0, 0).setDepth(100);

        // Background for info box
        const infoBox = scene.add.rectangle(1000, 100, 350, 150, 0x000000, 0.7);
        infoBox.setStrokeStyle(2, 0x8b4513);
        scene.emeiUI.add(infoBox);

        // Title
        const titleText = scene.add.text(850, 40, "🏔️ ยอดเขาง้อไบ๊ (Emei)", {
            fontSize: '24px',
            color: '#ffd700',
            fontStyle: 'bold'
        });
        scene.emeiUI.add(titleText);

        // Tourists count
        const tourists = scene.levelData.appliedData?.tourists || 0;
        const touristsText = scene.add.text(850, 80, `👥 จำนวนนักท่องเที่ยว: ${tourists} คน`, {
            fontSize: '18px',
            color: '#ffffff'
        });
        scene.emeiUI.add(touristsText);

        // Result fields (will be updated by API)
        scene.emeiResultText = scene.add.text(850, 110, "⚡ เส้นทางคอขวด: -", {
            fontSize: '18px',
            color: '#00ff00'
        });
        scene.emeiUI.add(scene.emeiResultText);

        scene.emeiRoundsText = scene.add.text(850, 140, "🚠 จำนวนรอบขั้นต่ำ: -", {
            fontSize: '22px',
            color: '#ffd700',
            fontStyle: 'bold'
        });
        scene.emeiUI.add(scene.emeiRoundsText);
    }

    // Add mountain peaks (visual only, standard nodes still handle logic)
    nodes.forEach(node => {
        // Optional: Add a mountain peak icon behind the node
        const mountain = scene.add.triangle(node.x, node.y - 10, 0, -30, 25, 10, -25, 10, 0x4a4a4a);
        mountain.setDepth(1);
        mountain.setStrokeStyle(1, 0xcccccc);
    });
}

/**
 * Highlight a peak in Emei Mountain
 */
export function highlightPeak(scene, nodeId) {
    if (!scene) scene = getCurrentGameState().currentScene;
    if (!scene || !scene.levelData || !scene.levelData.nodes) {
        console.warn('highlightPeak: Missing scene or nodes');
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        // Use weak equality for string vs number ID safety
        const node = scene.levelData.nodes.find(n => n.id == nodeId);
        if (node) {
            console.log(`[Emei] Highlighting Peak: ${nodeId} at (${node.x}, ${node.y})`);
            const circle = scene.add.circle(node.x, node.y, 25, 0x00ff00, 0.3);
            circle.setDepth(2);
            scene.tweens.add({
                targets: circle,
                scale: 1.5,
                alpha: 0,
                duration: 500, // Faster peak highlight
                onComplete: () => {
                    circle.destroy();
                    resolve();
                }
            });
        } else {
            console.warn(`[Emei] Peak node ${nodeId} not found in visual nodes.`);
            resolve();
        }
    });
}

/**
 * Highlight a cable car route
 */
export function highlightCableCar(scene, u, v, capacity) {
    if (!scene) scene = getCurrentGameState().currentScene;
    if (typeof scene?.add?.graphics !== 'function') {
        // Fallback: Check if we can get scene from global game state
        scene = getCurrentGameState().currentScene;
    }

    if (!scene || !scene.levelData || !scene.levelData.nodes) {
        console.warn(`[Emei] HighlightCableCar FAILED: Invalid scene. u=${u} v=${v}`);
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        // Robust ID finding using weak equality (1 == "1")
        const fromNode = scene.levelData.nodes.find(n => n.id == u);
        const toNode = scene.levelData.nodes.find(n => n.id == v);

        console.log(`[Emei] HighlightCableCar: ${u} -> ${v} (Cap: ${capacity})`, {
            fromFound: !!fromNode,
            toFound: !!toNode
        });

        if (fromNode && toNode) {
            const graphics = scene.add.graphics();
            graphics.setDepth(100); // Higher depth to be above lines
            graphics.lineStyle(8, 0x00ffff, 1); // Thicker Cyan
            graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

            // Visual "cable car" moving along the line
            const cableCar = scene.add.rectangle(fromNode.x, fromNode.y, 24, 16, 0xff00ff); // Magenta car
            cableCar.setDepth(101); // Above line
            cableCar.setStrokeStyle(2, 0xffffff);

            scene.tweens.add({
                targets: cableCar,
                x: toNode.x,
                y: toNode.y,
                duration: 800,
                ease: 'Power1',
                onComplete: () => {
                    // Keep the path highlight visible!
                    resolve();
                }
            });

            // Update UI with current bottleneck if this is the chosen path
            if (scene.emeiResultText) {
                scene.emeiResultText.setText(`⚡ เส้นทางคอขวด: ${capacity}`);
            }
        } else {
            console.warn(`[Emei] Nodes not found for edge ${u}->${v}. Level Nodes:`, scene.levelData.nodes.map(n => n.id));
            resolve();
        }
    });
}

/**
 * Show final calculation for rounds
 */
export function showEmeiFinalResult(scene, bottleneck, rounds) {
    if (!scene) scene = getCurrentGameState().currentScene;
    if (!scene) return;

    // 1. Update side panel text (existing)
    if (scene.emeiResultText) {
        scene.emeiResultText.setText(`⚡ ความจุกอขวดที่ได้: ${bottleneck}`);
    }
    if (scene.emeiRoundsText) {
        scene.emeiRoundsText.setText(`🚠 จำนวนรอบขั้นต่ำ: ${rounds} รอบ`);

        // Celebration effect on numbers
        scene.tweens.add({
            targets: scene.emeiRoundsText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 2
        });
    }

    // 2. Create a COMPACT Popup located lower (to avoid Victory screen overlap)
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    const popupContainer = scene.add.container(centerX, centerY + 150).setDepth(200); // Moved down +150
    popupContainer.setScale(0); // Start small for pop effect

    const bg = scene.add.rectangle(0, 0, 300, 120, 0x000000, 0.9); // Smaller box
    bg.setStrokeStyle(3, 0x00ffff);

    const title = scene.add.text(0, -30, "✨ ผลลัพธ์ ✨", {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    const resultText = scene.add.text(0, 15, `คอขวด: ${bottleneck}\nต้องขนส่ง: ${rounds} รอบ`, {
        fontSize: '24px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);

    popupContainer.add([bg, title, resultText]);
    scene.add.existing(popupContainer);

    // Pop in animation
    scene.tweens.add({
        targets: popupContainer,
        scale: 1,
        ease: 'Back.out',
        duration: 500,
        onComplete: () => {
            // Fade out after 3 seconds so it doesn't block view forever
            scene.tweens.add({
                targets: popupContainer,
                alpha: 0,
                delay: 3000,
                duration: 1000,
                onComplete: () => popupContainer.destroy()
            });
        }
    });
}
