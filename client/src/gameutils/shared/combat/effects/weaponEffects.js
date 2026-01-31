// Combat Weapon Attack Effects
import { getCurrentGameState } from '../../game';
import { getPlayerWeaponSprite } from '../../items';
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

    // Position base: Player center
    const px = scene.player.x;
    const py = scene.player.y;

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
    // ... (Validation logic same as before to find frames) ...
    for (let i = 1; i <= 10; i++) {
        const frameKey = `${texturePrefix}-${i}`;
        if (scene.textures.exists(frameKey)) validFrames.push(frameKey);
        else break;
    }

    if (validFrames.length === 0) {
        // showRadialFallback(scene, px, py, count, radius); // DISABLED: No star fallback
        return;
    }

    // Determine facing angle
    let baseAngle = 0;
    const player = scene.player;

    if (player.directions && player.directionIndex !== undefined) {
        const dir = player.directions[player.directionIndex];
        switch (dir) {
            case 'down': baseAngle = Math.PI / 2; break;
            case 'left': baseAngle = Math.PI; break;
            case 'up': baseAngle = -Math.PI / 2; break;
            case 'right': default: baseAngle = 0; break;
        }
    } else {
        // Fallback to FlipX
        baseAngle = player.flipX ? Math.PI : 0;
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
            depth: scene.player.depth + 10,
            angle: angle + Math.PI / 2, // Rotate sprite to face outward
            moveOutward: true
        }, validFrames, weaponKey);
    }
}

function showRadialFallback(scene, px, py, count, radius) {
    // Disabled: User requested NO star effect when texture is missing.
}
