import Phaser from 'phaser';
import { getCurrentGameState } from '../shared/game/gameState';

/**
 * Pure logic for hitting an enemy.
 * Calculates if an enemy is in range and returns the action details.
 */
export function calculateHit(scene) {
    const currentState = getCurrentGameState();

    if (!scene || !scene.player) {
        return { success: false, reason: 'no_scene' };
    }

    let nearestMonster = null;
    let nearestDistance = Infinity;

    const monsters = scene.levelData?.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
    // หาศัตรูที่อยู่ใกล้ที่สุด
    if (scene.monsters && monsters.length > 0) {
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
        return { success: false, reason: 'no_enemy_in_range' };
    }


    const weaponKey = currentState.weaponKey || 'stick';
    const damage = currentState.weaponData?.combat_power || 50;

    return {
        success: true,
        action: 'hit',
        targetEnemy: nearestMonster,
        damage: damage,
        weaponKey: weaponKey
    };
}
