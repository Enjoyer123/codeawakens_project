// Player and cinematic monster setup
// Handles main player character and cinematic monster display
import Phaser from "phaser";
import { playIdle } from '../movement/playerAnimation';
import { updatePlayerArrow } from '../effects/arrow';
import { showGameOver } from '../effects/gameEffects';
import { getCurrentGameState, setCurrentGameState, getPlayerHp } from '../shared/game/gameState';
import { applyPlayerDamage } from '../combat/combatLogic';

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
        const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.start_node_id) : null;

        // ถ้าไม่มี nodes หรือไม่มี startNode ให้แสดงตัวละครที่มุมล่างซ้าย
        let playerX, playerY;
        if (!hasNodes || !startNode) {
            // ตำแหน่งมุมล่างซ้าย (ห่างจากขอบ 100px, 100px)
            playerX = 100;
            playerY = (scene.scale && scene.scale.height) ? scene.scale.height - 75 : 600;
        } else {
            playerX = startNode.x;
            playerY = startNode.y;
        }

        // Determine character texture and animation properties
        // Legacy 'player' maps to 'main_1', otherwise use characterType directly
        const charKey = (scene.levelData.character === 'player' || !scene.levelData.character)
            ? 'main_1'
            : scene.levelData.character;
        const textureKey = charKey;
        const animPrefix = charKey;
        const hasDirectionalAnims = true;

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
        scene.player.currentNodeIndex = hasNodes && startNode ? scene.levelData.start_node_id : null;
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
        updatePlayerArrow(scene, playerX, playerY, 0);

        // ✅ Add takeDamage method to player sprite for combat handling
        scene.player.takeDamage = (damage, forceKill = false) => {
            applyPlayerDamage(scene, damage, forceKill);
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
    const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.start_node_id) : null;

    const isCinematic = !hasNodes || !startNode;

    if (!isCinematic) return; // Skip for normal node-based levels

    const PADDING_BOTTOM = 100;
    const PADDING_RIGHT = 100;

    const width = scene.scale.width;
    const height = scene.scale.height;
    
    // Match the specific height used in drawPlayer fallback (bottom-left)
    const monsterY = height - PADDING_BOTTOM;
    const monsterX = width - PADDING_RIGHT;


    try {
        // Lookup map: monsterType -> { textureKey, idleAnim }
        const MONSTER_CONFIG = {
            vampire_1: { textureKey: 'Vampire_1', idleAnim: 'vampire_1-idle_left' },
            vampire_2: { textureKey: 'Vampire_2', idleAnim: 'vampire_2-idle_left' },
            vampire_3: { textureKey: 'Vampire_3', idleAnim: 'vampire_3-idle_left' },
        };

        let textureKey = 'Vampire_1';
        let idleAnim = 'vampire_1-idle_left';
        // Define properties from monsters via map_entities
        const monsters = scene.levelData.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
        if (monsters.length > 0) {
            const monsterType = monsters[0].type || 'vampire_1';
            const config = MONSTER_CONFIG[monsterType];
            if (config) {
                textureKey = config.textureKey;
                idleAnim = config.idleAnim;
            }
        }

        const CINEMATIC_MONSTER_SCALE = 2.2;
        const monster = scene.add.sprite(monsterX, monsterY, textureKey);
        monster.setScale(CINEMATIC_MONSTER_SCALE); // Matching combat animation scale
        monster.setData('defaultScale', CINEMATIC_MONSTER_SCALE);
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
