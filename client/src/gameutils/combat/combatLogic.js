import Phaser from 'phaser';
import { getCurrentGameState, setCurrentGameState, getPlayerHp, setPlayerHp as setGlobalPlayerHp } from '../shared/game/gameState';
import { getWeaponData } from '../entities/weaponUtils';
import { showGameOver } from '../effects/gameEffects';

/**
 * Applies damage to the player, calculates minimum HP thresholds based on the equipped weapon,
 * syncs with the React UI, shows a visual hit effect, and checks for Game Over conditions.
 */
export function applyPlayerDamage(scene, damage, forceKill = false) {
    const currentState = getCurrentGameState();
    if (currentState.isGameOver || currentState.goalReached) return;

    const currentHP = getPlayerHp();

    let minHP = 0;
    if (!forceKill) {
        const weapon = getWeaponData(currentState.weaponKey);
        minHP = weapon ? (weapon.combat_power || weapon.power || 10) : 10;
    }

    let newHP = currentHP - damage;

    if (!forceKill) {
        newHP = Math.max(minHP, newHP);
    } else {
        newHP = Math.max(0, newHP);
    }

    setCurrentGameState({ playerHP: newHP });
    setGlobalPlayerHp(newHP); // ← อัปเดตฝั่ง Data ของเกมด้วย!

    if (scene && scene.externalHandlers && typeof scene.externalHandlers.setPlayerHp === 'function') {
        scene.externalHandlers.setPlayerHp(newHP);
    }

    if (scene && scene.player) {
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
    }

    if (newHP <= 0) {
        setCurrentGameState({ isGameOver: true });
        if (scene && scene.externalHandlers && typeof scene.externalHandlers.setIsGameOver === 'function') {
            scene.externalHandlers.setIsGameOver(true);
        }

        showGameOver(scene);
    }
}

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
