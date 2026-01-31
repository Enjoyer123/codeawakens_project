// Player and cinematic monster setup
// Handles main player character and cinematic monster display
import Phaser from "phaser";
import { playIdle } from '../../player/playerAnimation';
import { updatePlayerArrow } from '../../effects/phaserGameArrow';
import { showGameOver } from '../../effects/phaserGameEffects';
import { getCurrentGameState, setCurrentGameState, getPlayerHp } from '../../../shared/game';
import { getWeaponData } from '../../../shared/items';

/**
 * Draw player character sprite
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function drawPlayer(scene) {
    if (!scene || !scene.levelData) {
        console.warn('⚠️ Scene or levelData is null, cannot draw player');
        return;
    }

    if (!scene.add) {
        console.error('❌ Scene.add is null, scene may not be ready yet');
        return;
    }

    try {
        // ตรวจสอบว่ามี nodes หรือไม่
        const hasNodes = scene.levelData.nodes && scene.levelData.nodes.length > 0;
        const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId) : null;

        // ถ้าไม่มี nodes หรือไม่มี startNode ให้แสดงตัวละครที่มุมล่างซ้าย
        let playerX, playerY;
        if (!hasNodes || !startNode) {
            // ตำแหน่งมุมล่างซ้าย (ห่างจากขอบ 100px, 100px)
            playerX = 100;
            playerY = (scene.scale && scene.scale.height) ? scene.scale.height - 75 : 600;
            console.log('⚠️ No nodes found, displaying player at bottom-left corner:', playerX, playerY);
        } else {
            playerX = startNode.x;
            playerY = startNode.y;
        }

        // Determine character texture and animation properties
        // DEFAULT TO MAIN_1 if undefined or 'player' (legacy)
        const characterType = scene.levelData.character || 'main_1';
        let textureKey = 'main_1';
        let animPrefix = 'main_1';
        let hasDirectionalAnims = true;

        if (characterType === 'player') {
            // Legacy mapping
            textureKey = 'main_1';
            animPrefix = 'main_1';
            hasDirectionalAnims = true;
        } else if (characterType === 'main_1') {
            textureKey = 'main_1';
            animPrefix = 'main_1';
            hasDirectionalAnims = true;
        } else if (characterType === 'main_2') {
            textureKey = 'main_2';
            animPrefix = 'main_2';
            hasDirectionalAnims = true;
        } else if (characterType === 'main_3') {
            textureKey = 'main_3';
            animPrefix = 'main_3';
            hasDirectionalAnims = true;
        }

        // Create player sprite
        scene.player = scene.add.sprite(playerX, playerY, textureKey);
        const playerScale = 2.2; // Restored to standard size
        scene.player.setScale(playerScale);
        scene.player.setData('defaultScale', 2.2);
        scene.player.setOrigin(0.5, 0.75); // Move visual up so feet align with node
        scene.player.setDepth(8);

        // Set player properties for new utility functions
        scene.player.directions = ['right', 'down', 'left', 'up'];
        scene.player.directionIndex = 0;
        scene.player.currentNodeIndex = hasNodes && startNode ? scene.levelData.startNodeId : null;
        scene.player.mapConfig = { tileSize: 32 }; // Default tile size
        scene.player.mapImage = null; // Will be set if needed
        scene.player.hasNodes = hasNodes; // เพิ่ม flag เพื่อระบุว่ามี nodes หรือไม่

        // Custom properties for animation handling
        scene.player.animPrefix = animPrefix;
        scene.player.hasDirectionalAnims = hasDirectionalAnims;

        // Create player arrow for direction indication - larger to match bigger sprite
        scene.playerArrow = scene.add.triangle(
            playerX + 30,
            playerY,
            0,
            15,
            12,
            -8,
            -12,
            -8,
            0x00ff00
        );
        scene.playerArrow.setDepth(15);

        // Play idle animation using playIdle function
        if (scene.player.anims) {
            playIdle(scene.player);
        }

        // Update arrow position to match initial direction (direction 0 = right)
        // Use setTimeout to ensure game state is ready
        setTimeout(() => {
            updatePlayerArrow(scene, playerX, playerY, 0);
        }, 100);

        // ✅ Add takeDamage method to player sprite for combat handling
        scene.player.takeDamage = (damage, forceKill = false) => {
            const currentState = getCurrentGameState();
            if (currentState.isGameOver || currentState.goalReached) return;

            const currentHP = getPlayerHp();

            // Calculate minimum HP allowed based on weapon defense
            // If forceKill is true (e.g. falling in pit, fleeing battle), allow dropping to 0
            let minHP = 0;
            if (!forceKill) {
                const weapon = getWeaponData(currentState.weaponKey);
                // Use combat_power or power or default to 10. Stick usually has power: 10, combat_power: 0.
                // We want Stick to give 10 minHP.
                minHP = weapon ? (weapon.combat_power || weapon.power || 10) : 10;
            }

            // Calculate newHP: It reduces by damage, but cannot go below minHP (unless forceKill)
            let newHP = currentHP - damage;

            if (!forceKill) {
                newHP = Math.max(minHP, newHP);
            } else {
                newHP = Math.max(0, newHP);
            }

            console.log(`💥 Player takes ${damage} damage. HP: ${currentHP} -> ${newHP} (MinHP: ${minHP}, ForceKill: ${forceKill})`);

            // Update global state
            setCurrentGameState({ playerHP: newHP });

            // Update UI (if React setters/callbacks are available)
            if (typeof scene.externalHandlers.setPlayerHp === 'function') {
                scene.externalHandlers.setPlayerHp(newHP);
            }
            if (window.setPlayerHp) {
                window.setPlayerHp(newHP);
            }

            // Visual feedback
            scene.tweens.add({
                targets: [scene.player],
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    if (scene.player) scene.player.clearTint();
                }
            });

            // Check Game Over
            if (newHP <= 0) {
                console.log("💀 Player HP reached 0. Triggering Game Over.");
                setCurrentGameState({ isGameOver: true });
                if (typeof scene.externalHandlers.setIsGameOver === 'function') {
                    scene.externalHandlers.setIsGameOver(true);
                }
                if (window.setIsGameOver) {
                    window.setIsGameOver(true);
                }

                showGameOver(scene);
            }
        };
    } catch (error) {
        console.error('❌ Error creating player:', error);
    }
}

/**
 * Draw cinematic monster (idle state) for no-node levels
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function drawCinematicMonster(scene) {
    if (!scene || !scene.levelData) return;
    if (!scene.add) return;

    // Check condition: Only draw if level has no nodes (same logic as drawPlayer for cinematic placement)
    // FIX: Also check startNode. If nodes exist but no startNode, drawPlayer falls back to cinematic, so we should too.
    const hasNodes = scene.levelData.nodes && scene.levelData.nodes.length > 0;
    const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId) : null;

    const isCinematic = !hasNodes || !startNode;
    console.log('DEBUG: drawCinematicMonster checking:', { hasNodes, hasStartNode: !!startNode, isCinematic });

    if (!isCinematic) return; // Skip for normal node-based levels

    const width = scene.scale.width;
    const height = scene.scale.height;
    // Match the specific height used in drawPlayer fallback (bottom-left)
    // drawPlayer uses: scene.scale.height - 100
    // So we use same Y for alignment
    const monsterY = height - 100;
    const monsterX = width - 100;

    console.log('🎬 Drawing Cinematic Monster at', monsterX, monsterY);

    try {
        // Determine texture and animation based on the first monster in levelData if available
        let textureKey = 'Vampire_1';
        let idleAnim = 'vampire_1-idle_left';

        if (scene.levelData.monsters && scene.levelData.monsters.length > 0) {
            const monsterData = scene.levelData.monsters[0];
            const monsterType = monsterData.type || 'vampire_1';

            if (monsterType === 'vampire_1') {
                textureKey = 'Vampire_1';
                idleAnim = 'vampire_1-idle_left';
            } else if (monsterType === 'vampire_2') {
                textureKey = 'Vampire_2';
                idleAnim = 'vampire_2-idle_left';
            } else if (monsterType === 'vampire_3') {
                textureKey = 'Vampire_3';
                idleAnim = 'vampire_3-idle_left';
            } else if (monsterType === 'slime_1') {
                textureKey = 'slime_1';
                idleAnim = 'slime_1-idle_left';
            }
        }

        const monster = scene.add.sprite(monsterX, monsterY, textureKey);
        monster.setScale(2.2); // Matching combat animation scale
        monster.setData('defaultScale', 2.2);
        monster.setOrigin(0.5, 0.5);
        monster.setData('idleAnim', idleAnim);
        monster.setDepth(8);
        monster.setFlipX(false); // Do not flip, use Left anims directly

        // Play idle animation
        if (monster.anims && scene.anims.exists(idleAnim)) {
            monster.play(idleAnim);
        }

        // Add to scene.monsters so it gets cleaned up properly
        if (!scene.monsters) scene.monsters = [];

        // Wrap it in a structure compatible with updateMonsters loop to avoid crashes
        // but mark it as 'cinematic' so it doesn't try to patrol/chase
        scene.monsters.push({
            sprite: monster,
            isCinematic: true,
            data: { hp: 100, maxHp: 100, defeated: false }
        });

    } catch (err) {
        console.error('❌ Error drawing cinematic monster:', err);
    }
}
