import { hitEnemyWithDamage } from './playerCombat';
import { showEffectWeaponFixed } from './combatEffects';

/**
 * Visual playback for the hit action.
 * Animates the attack, shows weapon effects, and handles enemy death animations.
 */
export async function playHitAnimation(scene, hitResult) {
    if (!hitResult.success) {
        return { status: 'missed' };
    }

    const { targetEnemy, damage, weaponKey } = hitResult;
    const playerSprite = scene.player;


    // โจมตีศัตรูโดยตรงพร้อมส่ง targetEnemy ให้ไม่ต้องคำนวณระยะซ้ำ
    const success = hitEnemyWithDamage(playerSprite, targetEnemy, damage);

    if (success) {
        // แสดง weapon effect
        showEffectWeaponFixed(targetEnemy, damage, weaponKey, playerSprite);

        // รอให้ animation เสร็จก่อนเดินต่อ (killEnemy ใช้อนิเมชันประมาณ 800ms)
        await new Promise((resolve) => setTimeout(resolve, 900));

        // ตรวจสอบว่า monster ตายแล้วหรือไม่
        if (targetEnemy.data?.defeated || targetEnemy.sprite?.getData('defeated')) {
            return { status: 'enemy_defeated' };
        }

        return { status: 'hit_success' };
    }

    return { status: 'missed' };
}
