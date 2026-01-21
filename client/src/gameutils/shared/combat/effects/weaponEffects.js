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
    console.log(`🔍 showEffectWeaponFixed called with weaponKey: ${weaponKey}`);

    if (!weaponSprite) {
        console.warn("No weapon sprite, cannot show effect:", weaponKey);
        return;
    }

    const scene = getCurrentGameState().currentScene;
    if (!scene || !enemy?.sprite) return;

    const currentWeaponKey = getCurrentGameState().weaponKey || 'stick';
    const actualWeaponKey = weaponKey === currentWeaponKey ? weaponKey : currentWeaponKey;

    console.log("🎯 Effect path decision for weapon:", actualWeaponKey);

    const texturePrefix = `effect_${actualWeaponKey}${effectType ? `_${effectType}` : ''}`;
    const firstFrameKey = `${texturePrefix}-1`;
    console.log(`🔍 Checking first frame: ${firstFrameKey} - exists: ${scene.textures.exists(firstFrameKey)}`);

    if (!scene.textures.exists(firstFrameKey)) {
        console.log(`⚠️  No multi-frame textures found, using fallback`);
        showFallbackEffect(scene, weaponSprite);
        return;
    }

    console.log(`✅ Using MULTI-FRAME path`);

    // ใช้วิธีเก่า (multiple frames) ถ้ามี
    console.log(`Using legacy multi-frame effect for ${actualWeaponKey}`);
    const spawnEffect = () => {
        const validFrames = [];
        let consecutiveFailures = 0;

        for (let i = 1; i <= 10; i++) {
            const frameKey = `${texturePrefix}-${i}`;

            if (!scene.textures.exists(frameKey)) {
                break;
            }

            const texture = scene.textures.get(frameKey);
            const source = texture?.source[0];

            const isValid = source &&
                source.image &&
                source.image.complete &&
                source.image.naturalWidth > 0 &&
                source.image.naturalHeight > 0 &&
                source.width > 0 &&
                source.height > 0 &&
                source.isLoaded !== false;

            if (isValid) {
                validFrames.push(frameKey);
                consecutiveFailures = 0;
                console.log(`✓ Valid: ${frameKey} (${source.width}x${source.height})`);
            } else {
                consecutiveFailures++;
                if (consecutiveFailures >= 2) {
                    break;
                }
            }
        }

        if (validFrames.length === 0) {
            console.warn("❌ No valid texture frames found, using fallback");
            showFallbackEffect(scene, weaponSprite);
            return;
        }

        createCanvasBasedEffect(scene, weaponSprite, validFrames, actualWeaponKey);
    };

    spawnEffect();
}
