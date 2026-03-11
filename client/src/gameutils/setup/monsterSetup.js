// Monster/enemy setup
// Handles enemy sprite initialization with health bars and patrol logic
import Phaser from "phaser";

/**
 * Setup monster/enemy sprites with health bars
 * @param {Phaser.Scene} scene - Phaser scene instance
 */
export function setupMonsters(scene) {
    if (!scene || !scene.levelData || !scene.levelData.monsters) {
        return;
    }

    if (!scene.monsters) scene.monsters = [];

    scene.levelData.monsters.forEach((monsterData, index) => {
        try {

            const startPos = monsterData.patrol && monsterData.patrol.length > 0
                ? monsterData.patrol[0]
                : scene.levelData.nodes.find(n => n.id === monsterData.startNode);

            if (!startPos) return;

            // Lookup map for monster configurations
            const MONSTER_CONFIG = {
                vampire_1: { textureKey: 'Vampire_1', animPrefix: 'vampire_1' },
                vampire_2: { textureKey: 'Vampire_2', animPrefix: 'vampire_2' },
                vampire_3: { textureKey: 'Vampire_3', animPrefix: 'vampire_3' },
                slime_1: { textureKey: 'slime_1', animPrefix: 'slime' }
            };

            const monsterType = monsterData.type || 'vampire_1';
            const config = MONSTER_CONFIG[monsterType] || MONSTER_CONFIG['vampire_1'];

            // Setup variables using config
            const textureKey = config.textureKey;
            const animPrefix = config.animPrefix;
            const idleAnim = `${animPrefix}-idle_down`;
            const moveAnim = `${animPrefix}-walk_down`;
            const attackAnim = `${animPrefix}-attack-down`;
            const hasDirectionalAnims = true;

            // Create monster sprite with correct texture
            const monsterSprite = scene.add.sprite(startPos.x, startPos.y, textureKey);
            monsterSprite.setScale(2.2);
            monsterSprite.setData('defaultScale', 2.2);
            monsterSprite.setOrigin(0.5, 0.75); // Raise sprite visually
            monsterSprite.setData('idleAnim', idleAnim);
            monsterSprite.setData('moveAnim', moveAnim);
            monsterSprite.setData('attackAnim', attackAnim);
            monsterSprite.setData('animPrefix', animPrefix);
            monsterSprite.setData('hasDirectionalAnims', hasDirectionalAnims);
            monsterSprite.setDepth(8);

            // Create glow effect - larger to match bigger sprite
            const glowCircle = scene.add.circle(startPos.x, startPos.y, 35, 0xff0000, 0.2);
            glowCircle.setDepth(7);

            // Set monster properties for new utility functions
            monsterSprite.isDefeated = false;
            monsterSprite.currentHealth = monsterData.hp || 50;
            monsterSprite.maxHealth = monsterData.hp || 50;
            monsterSprite.detectionRange = monsterData.detectionRange || 60;
            monsterSprite.attackRange = monsterData.attackRange || 30;
            monsterSprite.attackDamage = monsterData.damage || 60;
            monsterSprite.attackCooldownTime = 2000; // 2 seconds
            monsterSprite.lastAttackTime = 0;

            // Create health bar - larger to match bigger sprite
            const healthBarBg = scene.add.rectangle(startPos.x, startPos.y - 70, 50, 6, 0x000000, 0.8);
            healthBarBg.setDepth(9);
            const healthBar = scene.add.rectangle(startPos.x, startPos.y - 70, 50, 6, 0x00ff00, 1);
            healthBar.setDepth(10);
            healthBar.setOrigin(0, 0.5);

            monsterSprite.setData('healthBar', healthBar);
            monsterSprite.setData('healthBarBg', healthBarBg);
            monsterSprite.setData('health', monsterSprite.currentHealth);
            monsterSprite.setData('defeated', false);

            const monster = {
                id: monsterData.id,
                sprite: monsterSprite,
                glow: glowCircle,
                data: {
                    ...monsterData,
                    currentPatrolIndex: 0,
                    isChasing: false,
                    name: monsterData.name || 'Vampire',
                    maxHp: monsterData.hp || 50,
                    hp: monsterData.hp || 50,
                    defeated: monsterData.defeated || false,
                    inBattle: false
                },
            };

            // Play idle animation (with safety check)
            if (monsterSprite.anims) {
                if (scene.anims.exists(idleAnim)) {
                    monsterSprite.anims.play(idleAnim, true);
                } else {
                    console.warn(`Animation ${idleAnim} not found, skipping playback`);
                }
            }

            scene.monsters.push(monster);
        } catch (error) {
            console.error(`Error creating monster ${index}:`, error);
        }
    });
}
