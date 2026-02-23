import Phaser from 'phaser';
import { getCurrentGameState } from '../shared/game/gameState';

/**
 * Pure logic for hitting an enemy.
 * Calculates if an enemy is in range and returns the action details.
 */
export function calculateHit(scene) {
    console.log("🧠 [combatCore] calculateHit เรียลรัน! - กำลังคำนวณการโจมตี");
    const currentState = getCurrentGameState();

    if (!scene || !scene.player) {
        return { success: false, reason: 'no_scene' };
    }

    let nearestMonster = null;
    let nearestDistance = Infinity;

    // หาศัตรูที่อยู่ใกล้ที่สุด
    if (scene.monsters && scene.monsters.length > 0) {
        scene.monsters.forEach((monster) => {
            if (monster.data?.defeated || monster.sprite?.getData('defeated') || monster.isDefeated) return;

            const distance = Phaser.Math.Distance.Between(
                scene.player.x, scene.player.y,
                monster.sprite.x, monster.sprite.y
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestMonster = monster;
            }
        });
    }

    // ระยะที่โจมตีได้ (80 pixels)
    if (!nearestMonster || nearestDistance > 80) {
        console.log("🧠 [combatCore] ไม่พบศัตรูในระยะโจมตี");
        return { success: false, reason: 'no_enemy_in_range' };
    }

    console.log(`🧠 [combatCore] คำนวณเสร็จสิ้น! พบเป้าหมายที่ระยะ ${nearestDistance.toFixed(2)}`);

    return {
        success: true,
        action: 'hit',
        targetEnemy: nearestMonster,
        damage: 50,
        weaponKey: currentState.weaponKey || 'stick'
    };
}
