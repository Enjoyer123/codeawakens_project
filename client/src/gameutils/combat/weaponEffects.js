// Combat Weapon Attack Effects
import { getCurrentGameState } from '../shared/game/gameState';

import { createCanvasBasedEffect, showFallbackEffect } from './animationUtils';

/**
 * โจมตีศัตรู
 */
export function attackEnemy(enemy, damage, weaponKey) {
    const scene = getCurrentGameState().currentScene;
    if (!scene || !enemy.sprite) return false;

    const player = scene.player;
    if (!player) return false;

    const weaponSprite = getPlayerWeaponSprite();
    const currentWeaponKey = getCurrentGameState().weaponKey || 'stick';

    // ใช้ฟังก์ชันที่แก้ไขแล้ว
    showEffectWeaponFixed(enemy, damage, currentWeaponKey, weaponSprite);

    // ส่วนที่เหลือเหมือนเดิม
    enemy.data.hp = Math.max(0, (enemy.data.hp || 3) - damage);
    if (enemy.data.hp <= 0) {
        enemy.data.defeated = true;
        return true;
    }
    return false;
}


export function showEffectWeaponFixed(enemy, damage, weaponKey = 'stick', weaponSprite, effectType = '') {
    // Note: weaponSprite argument is essentially unused if we use ring logic, but kept for compatibility.
    // If we have a ring container (e.g. from getPlayerWeaponSprite() which returns container now!), we can use it.

    // We'll get the container again to be sure (since 'weaponSprite' passed in might be stale or weirdly passed)
    // Actually getPlayerWeaponSprite() returns the container.
    const container = getPlayerWeaponSprite();

    // If no container, fallback to old logic? No, create global effect around player.
    const scene = getCurrentGameState().currentScene;
    if (!scene || !enemy?.sprite) return;

    const count = 6; // Match ring count
    const radius = 45; // Match ring radius

    // Position base: Source center (passed in, e.g. cinematic actor or weapon ring container)
    // Fallback to scene.player if no valid source with x,y provided
    const sourceObj = (weaponSprite && typeof weaponSprite.x === 'number') ? weaponSprite : scene.player;
    const px = sourceObj.x;
    const py = sourceObj.y;

    const texturePrefix = `effect_${weaponKey}${effectType ? `_${effectType}` : ''}`;
    const firstFrameKey = `${texturePrefix}-1`;

    if (!scene.textures.exists(firstFrameKey)) {
        // Check for SINGLE frame texture (effect_weaponKey)
        const singleFrameKey = texturePrefix;
        if (scene.textures.exists(singleFrameKey)) {
            // Use single frame
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                // Increase radius significantly to be outside weapon ring (radius 45) + buffer
                // If effect is scaled 4x (huge), we need more space. Try 80.
                const ex = px + Math.cos(angle) * (radius + 60);
                const ey = py + Math.sin(angle) * (radius + 60);

                createCanvasBasedEffect(scene, {
                    x: ex,
                    y: ey,
                    depth: scene.player.depth + 10,
                    angle: angle + Math.PI / 2,
                    moveOutward: true
                }, [singleFrameKey], weaponKey); // Pass single frame as array
            }
            return;
        }

        // Use fallback radial
        console.warn(`⚠️ No effect texture found for ${weaponKey} (checked ${firstFrameKey} and ${singleFrameKey})`);
        // showRadialFallback(scene, px, py, count, radius); // DISABLED: No star fallback
        return;
    }

    // Spawn multiple effects (Multi-frame)
    const validFrames = [];

    // SPECIAL CASE: 'circle' weapon using 'Circle_N' format (underscore)
    // User requested: "shows picture like aura but name circle", "I added Circle_1, 2", "increase size"
    let customScale = undefined;

    if (weaponKey.toLowerCase() === 'circle') {
        // Try looking for Circle_1, Circle_2
        for (let i = 1; i <= 10; i++) {
            const frameKey = `Circle_${i}`;
            if (scene.textures.exists(frameKey)) {
                validFrames.push(frameKey);
            } else {
                break;
            }
        }
        if (validFrames.length > 0) {
            console.log("✨ Found custom Circle frames:", validFrames);
            customScale = 8.0; // Increase size as requested (default is 4.0)
        }
    }

    // Standard detection if custom detection failed
    if (validFrames.length === 0) {
        // ... (Validation logic same as before to find frames) ...
        for (let i = 1; i <= 10; i++) {
            const frameKey = `${texturePrefix}-${i}`;
            if (scene.textures.exists(frameKey)) validFrames.push(frameKey);
            else break;
        }
    }

    if (validFrames.length === 0) {
        // showRadialFallback(scene, px, py, count, radius); // DISABLED: No star fallback
        return;
    }

    // Determine facing angle
    let baseAngle = 0;
    const angleSource = sourceObj; // Use the same source object selected above

    if (angleSource.directions && angleSource.directionIndex !== undefined) {
        const dir = angleSource.directions[angleSource.directionIndex];
        switch (dir) {
            case 'down': baseAngle = Math.PI / 2; break;
            case 'left': baseAngle = Math.PI; break;
            case 'up': baseAngle = -Math.PI / 2; break;
            case 'right': default: baseAngle = 0; break;
        }
    } else {
        // Fallback to FlipX
        baseAngle = angleSource.flipX ? Math.PI : 0;
    }

    // Cone configuration: 3 projectiles in a 60 degree arc
    const coneCount = 3;
    const coneSpread = Math.PI / 3; // 60 degrees
    const startAngle = baseAngle - (coneSpread / 2);

    for (let i = 0; i < coneCount; i++) {
        // Distribute evenly within the cone
        const angle = startAngle + (i / (coneCount - 1)) * coneSpread; // -30, 0, +30 relative to base

        const ex = px + Math.cos(angle) * (radius + 60);
        const ey = py + Math.sin(angle) * (radius + 60);

        createCanvasBasedEffect(scene, {
            x: ex,
            y: ey,
            depth: sourceObj.depth + 10,
            angle: angle + Math.PI / 2, // Rotate sprite to face outward
            moveOutward: true,
            scale: customScale // Pass custom scale if defined
        }, validFrames, weaponKey);
    }
}



// Global weapon variables for visual effects
let playerWeaponContainer = null; // Container for the weapon ring
let playerEffectGraphics = null; // สำหรับวาด circle (legacy/fallback)
let circleEffectSprite = null;   // สำหรับแสดง Circle effect
let auraEffectSprite = null;     // สำหรับแสดง Aura effect

/**
 * Creates a ring of weapons around a target.
 * @param {Phaser.Scene} scene 
 * @param {number} x Center X
 * @param {number} y Center Y
 * @param {string} weaponKey 
 * @param {object} options { count, radius, scale }
 */
export function createWeaponRing(scene, x, y, weaponKey, options = {}) {
    const count = options.count || 6; // Number of weapons
    const radius = options.radius || 45;
    const scale = options.scale || 0.4;
    const textureKey = `weapon_${weaponKey}`;

    if (!scene.textures.exists(textureKey)) {
        console.warn(`Weapon texture '${textureKey}' missing for ring.`);
        return null;
    }

    const container = scene.add.container(x, y);
    const weapons = [];

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const wx = Math.cos(angle) * radius;
        const wy = Math.sin(angle) * radius;

        // Create sprite relative to container center (0,0)
        const sprite = scene.add.image(wx, wy, textureKey);
        sprite.setScale(scale);

        // Point outward by default
        sprite.setRotation(angle + Math.PI / 2);

        container.add(sprite);
        weapons.push(sprite);
    }

    container.setData('weapons', weapons);
    container.setData('radius', radius);

    // Add continuous rotation to the container
    scene.tweens.add({
        targets: container,
        angle: 360,
        duration: 8000,
        repeat: -1,
        ease: 'Linear'
    });

    return container;
}

export function displayPlayerWeapon(weaponKey, scene) {
    console.log("displayPlayerWeapon called", weaponKey);

    // Initial scene validation
    if (!scene || !scene.player) {
        console.warn("Scene or player not ready");
        return;
    }

    // Hide default weapon (stick) or empty key
    if (!weaponKey || weaponKey === 'stick') {
        if (playerWeaponContainer) {
            playerWeaponContainer.destroy();
            playerWeaponContainer = null;
        }
        return;
    }

    const textureKey = `weapon_${weaponKey}`;

    const createAndAttach = () => {
        if (!scene || !scene.player || !scene.add) {
            console.warn("Scene not ready for sprite creation");
            return;
        }

        try {
            // ลบ sprite/container เก่าก่อน
            if (playerWeaponContainer) {
                playerWeaponContainer.destroy();
                playerWeaponContainer = null;
            }

            // Create new Weapon Ring
            playerWeaponContainer = createWeaponRing(scene, scene.player.x, scene.player.y, weaponKey);

            if (playerWeaponContainer) {
                playerWeaponContainer.setDepth(scene.player.depth - 1);
                updateWeaponPosition(scene); // Sync position immediately
                console.log(`✅ Weapon Ring created: ${weaponKey}`);
            }

            // โหลด effect ของอาวุธนี้ด้วย
            if (scene.sys && !scene.sys.isDestroyed) {
                // Need preloadWeaponEffect
                import('./combatPreload').then(m => {
                    m.preloadWeaponEffectSafe(scene, weaponKey);
                });
            }
        } catch (error) {
            console.warn("Error creating weapon sprite:", error);
        }
    };

    // Main texture loading logic
    if (!scene.textures.exists(textureKey)) {
        console.log(`🔍 Loading weapon texture: ${textureKey}`);
        // Need API config
        import('../../config/apiConfig').then(m => {
            const weaponImageUrl = `${m.API_BASE_URL}/uploads/weapons/${weaponKey}_idle_1.png`;

            if (scene.load && typeof scene.load.image === 'function') {
                if (!scene.load.list) return; // Scene not ready

                scene.load.image(textureKey, weaponImageUrl);
                scene.load.once(`filecomplete-image-${textureKey}`, () => {
                    setTimeout(() => {
                        if (scene.textures.exists(textureKey)) createAndAttach();
                    }, 50);
                });
                scene.load.start();
            }
        });

    } else {
        createAndAttach();
    }
}

/**
 * Triggers the attack animation for the weapon ring.
 * @param {Phaser.Scene} scene 
 * @param {string} weaponType 'melee' or 'magic'
 * @param {Phaser.GameObjects.Container} targetContainer Optional container to animate (defaults to player's)
 */
export function animateWeaponAttack(scene, weaponType, targetContainer = null) {
    const container = targetContainer || playerWeaponContainer;
    if (!container || !container.active) return;

    const weapons = container.getData('weapons');
    if (!weapons) return;

    if (weaponType === 'magic') {
        // MAGIC ATTACK: Expand and Pulse
        const originalRadius = container.getData('radius') || 45;
        const expandRadius = originalRadius * 1.5;

        // Expand
        scene.tweens.add({
            targets: weapons,
            x: (target, key, value, index, total) => {
                const angle = (index / total) * Math.PI * 2;
                return Math.cos(angle) * expandRadius;
            },
            y: (target, key, value, index, total) => {
                const angle = (index / total) * Math.PI * 2;
                return Math.sin(angle) * expandRadius;
            },
            scaleX: 0.6,
            scaleY: 0.6,
            duration: 300,
            yoyo: true,
            ease: 'Back.out',
            onComplete: () => {
                // Reset positions explicitly to be safe
            }
        });

        // Spin faster during cast
        scene.tweens.add({
            targets: container,
            angle: container.angle + 180,
            duration: 600,
            ease: 'Cubic.out'
        });

    } else {
        // MELEE ATTACK: Slash/Point Inward
        // All swords point their tips towards the center
        scene.tweens.add({
            targets: weapons,
            angle: '+=100', // Slash rotation
            duration: 150,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
                // Return to normal orbit
            }
        });

        // Slight radius contraction for impact
        const originalRadius = container.getData('radius') || 45;
        const contractRadius = originalRadius * 0.8;

        scene.tweens.add({
            targets: weapons,
            x: (target, key, value, index, total) => {
                const angle = (index / total) * Math.PI * 2;
                return Math.cos(angle) * contractRadius;
            },
            y: (target, key, value, index, total) => {
                const angle = (index / total) * Math.PI * 2;
                return Math.sin(angle) * contractRadius;
            },
            duration: 100,
            yoyo: true
        });
    }
}

/**
 * แสดงเอฟเฟกต์พิเศษสำหรับแต่ละ Part (เช่น circle_1, aura_1)
 */
export function displayPlayerEffect(effectKey, scene, keepExisting = false) {
    if (!scene || !scene.player) return;

    if (!keepExisting) {
        clearPlayerEffects();
    }

    if (!effectKey) return;

    console.log(`✨ Displaying effect: ${effectKey} (keep: ${keepExisting})`);

    if (effectKey.startsWith('circle_')) {
        // วาดวงเวทย์ (Magic Circle)
        const index = parseInt(effectKey.split('_')[1]) || 1;
        drawMagicCircle(scene, index);
    } else if (effectKey.startsWith('aura_')) {
        // แสดง Aura
        const index = parseInt(effectKey.split('_')[1]) || 1;
        showPlayerAura(scene, index);
    }
}

function clearPlayerEffects() {
    if (playerEffectGraphics) {
        playerEffectGraphics.destroy();
        playerEffectGraphics = null;
    }
    if (circleEffectSprite) {
        circleEffectSprite.destroy();
        circleEffectSprite = null;
    }
    if (auraEffectSprite) {
        auraEffectSprite.destroy();
        auraEffectSprite = null;
    }
}

function drawMagicCircle(scene, index) {
    const player = scene.player;

    const animKey = `circle_${index}`;
    const firstFrameKey = `circle_${index}_1`;

    console.log(`🔥 [weaponEffects] drawMagicCircle trying anim: ${animKey}`);

    if (circleEffectSprite) {
        circleEffectSprite.destroy();
        circleEffectSprite = null;
    }
    if (playerEffectGraphics) {
        playerEffectGraphics.destroy();
        playerEffectGraphics = null;
    }

    if (scene.anims.exists(animKey) || scene.textures.exists(firstFrameKey)) {
        const startTexture = scene.textures.exists(firstFrameKey) ? firstFrameKey : animKey;

        if (!scene.textures.exists(startTexture) && !scene.anims.exists(animKey)) {
            console.warn(`⚠️ Cannot create circle sprite: texture ${startTexture} not found.`);
            return;
        }

        const circle = scene.add.sprite(player.x, player.y, startTexture);
        circle.setDepth(player.depth - 1);
        circle.setScale(4.5);
        circle.setAlpha(0.8);

        if (scene.anims.exists(animKey)) {
            circle.play(animKey);
        } else {
            scene.tweens.add({
                targets: circle,
                angle: 360,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
        }

        circleEffectSprite = circle;

        const updatePos = () => {
            if (circleEffectSprite && !circleEffectSprite.isDestroyed && player) {
                circleEffectSprite.setPosition(player.x, player.y);
            }
        };
        scene.events.on('update', updatePos);

        circle.once('destroy', () => {
            scene.events.off('update', updatePos);
        });
    } else {
        console.warn(`⚠️ Circle animation/texture ${animKey} or ${firstFrameKey} not found!`);
    }
}

function showPlayerAura(scene, index) {
    const player = scene.player;
    const animKey = `aura_${index}`;

    console.log(`🔥 [weaponEffects] showPlayerAura using sprite: ${animKey}`);

    if (auraEffectSprite) {
        auraEffectSprite.destroy();
        auraEffectSprite = null;
    }

    const startTexture = `${animKey}_1`;

    if (!scene.textures.exists(startTexture) && !scene.anims.exists(animKey)) {
        console.warn(`⚠️ Aura texture/anim ${animKey} not found`);
        return;
    }

    const aura = scene.add.sprite(player.x, player.y, startTexture);
    aura.setDepth(player.depth - 1);
    aura.setScale(1.5);
    aura.setAlpha(0.8);

    if (scene.anims.exists(animKey)) {
        aura.play(animKey);
    } else {
        if (scene.textures.exists(startTexture)) {
            // Just static
        } else {
            console.warn(`⚠️ Animation ${animKey} failed to play`);
        }
    }

    auraEffectSprite = aura;

    const updatePos = () => {
        if (auraEffectSprite && !auraEffectSprite.isDestroyed && player) {
            auraEffectSprite.setPosition(player.x, player.y);
        }
    };
    scene.events.on('update', updatePos);

    aura.once('destroy', () => {
        scene.events.off('update', updatePos);
    });
}

export function updateWeaponPosition(scene) {
    if (!playerWeaponContainer || !scene.player) return;

    const player = scene.player;
    playerWeaponContainer.setPosition(player.x, player.y);
}

export function getPlayerWeaponSprite() {
    return playerWeaponContainer;
}

export function getPlayerAuraSprite() {
    return auraEffectSprite;
}

export function getPlayerCircleSprite() {
    return circleEffectSprite;
}

export function updatePlayerWeaponDisplay() {
    console.log("updatePlayerWeaponDisplay called");
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;

    if (scene && playerWeaponContainer) {
        try {
            updateWeaponPosition(scene);
        } catch (err) {
            console.warn('Error updating weapon position:', err);
        }
        return;
    }

    if (scene && currentState.weaponKey) {
        try {
            displayPlayerWeapon(currentState.weaponKey, scene);
        } catch (err) {
            console.warn('Error displaying player weapon during update:', err);
        }
    }
}
