import { playAttack } from '../movement/playerAnimation.js';
import { getDirectionFromAngle } from './combatHelpers';
import { cleanupMonsterUI } from './battleUI';
import { showMonsterDeathEffect } from './deathEffects';
import { playSound } from '../sound/soundManager';
import { getCurrentGameState } from '../shared/game/gameState';
import { getWeaponData } from '../entities/weaponUtils';
import { showFloatingText } from './combatHelpers';

export function haveEnemy(player) {
    return findNearbyEnemy(player) !== null;
}

export function findNearbyEnemy(player) {
    // ใช้ scene.monsters แทน player.enemies
    const scene = player.scene;
    const monsters = scene.levelData?.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
    if (!scene || !scene.monsters || monsters.length === 0) return null;

    for (const monster of scene.monsters) {
        // ตรวจสอบว่า monster ตายแล้วหรือไม่
        if (monster.data?.defeated || monster.isDefeated ||
            monster.sprite?.getData('defeated') || monster.sprite?.isDefeated) {
            continue;
        }

        // ตรวจสอบว่า monster sprite ยังมองเห็นอยู่หรือไม่
        if (!monster.sprite || !monster.sprite.visible) {
            continue;
        }

        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            monster.sprite.x, monster.sprite.y
        );

        if (distance < 80) { // Increased range for bigger sprites
            return monster;
        }
    }
    return null;
}

export function hitEnemyWithDamage(player, targetMonster = null, damage = 50) {
    if (!targetMonster) {
        targetMonster = findNearbyEnemy(player);
    }

    if (!targetMonster) {
        return false;
    }

    // ใช้ monster object ที่ถูกต้อง
    const enemySprite = targetMonster.sprite;
    if (!enemySprite) return false;

    // ศัตรูตายใน 1 hit
    const newHP = 0; // ตายทันที

    targetMonster.data.hp = newHP;
    targetMonster.data.defeated = true;
    targetMonster.isDefeated = true;
    enemySprite.setData('health', newHP);
    enemySprite.setData('defeated', true);
    enemySprite.isDefeated = true;

    updateEnemyHealthBar(enemySprite, newHP);

    // ศัตรูตาย
    killEnemy(player, enemySprite);

    playAttack(player);

    // Weapon Specific Sound
    const state = getCurrentGameState();
    const weaponKey = state?.weaponKey || 'stick';
    const wData = getWeaponData(weaponKey);
    const wType = wData?.weaponType || 'melee';
    const sfxKey = (weaponKey === 'stick')
        ? 'hit'
        : (wType === 'magic' ? 'weapon_magic' : 'weapon_melee');
    playSound(sfxKey);

    return true;
}


function updateEnemyHealthBar(enemySprite, currentHealth) {
    const healthBar = enemySprite.getData('healthBar');
    const maxHealth = enemySprite.getData('maxHealth') || 3;

    if (healthBar) {
        const healthPercentage = Math.max(0, currentHealth / maxHealth);
        const barWidth = 30 * healthPercentage;
        healthBar.width = barWidth;

        if (healthPercentage > 0.6) {
            healthBar.setFillStyle(0x00ff00);
        } else if (healthPercentage > 0.3) {
            healthBar.setFillStyle(0xffaa00);
        } else {
            healthBar.setFillStyle(0xff0000);
        }
    }
}




async function killEnemy(player, enemySprite) {
    playSound('enemy_defeat');
    enemySprite.setData('defeated', true);
    // Stop input/interaction on enemy
    if (enemySprite.body) enemySprite.body.checkCollision.none = true;

    // Try to play Death Animation
    let playedDeathAnim = false;
    if (enemySprite.getData('hasDirectionalAnims')) {
        const dir = getDirectionFromAngle(Phaser.Math.Angle.Between(enemySprite.x, enemySprite.y, player.x, player.y));
        const prefix = enemySprite.getData('animPrefix');
        const deathAnimKey = `${prefix}-death-${dir}`;

        if (player.scene.anims.exists(deathAnimKey)) {
            if (enemySprite) {
                showFloatingText(player.scene, enemySprite.x, enemySprite.y - 50, '-100', '#fbff00ff');
            }
            enemySprite.anims.play(deathAnimKey, true);
            playedDeathAnim = true;

            // Wait for animation
            await new Promise(resolve => {
                enemySprite.once('animationcomplete', () => resolve());
                // Backup timeout
                player.scene.time.delayedCall(1500, resolve);
            });
        }
    }

    // Show death effect and WAIT (Only if no death anim played, or as extra effect)
    if (!playedDeathAnim && showMonsterDeathEffect) {
        // Hide health bars immediately so they don't float over the death anim
        cleanupMonsterUI(player.scene, { sprite: enemySprite, glow: enemySprite.getData('glow') });

        await showMonsterDeathEffect(player.scene, enemySprite.x, enemySprite.y);
    } else if (!playedDeathAnim) {
        createDeathExplosion(player, enemySprite.x, enemySprite.y);
    }

    // Fade out if we played animation to smoother removal
    if (playedDeathAnim) {
        await new Promise(resolve => {
            player.scene.tweens.add({
                targets: enemySprite,
                alpha: 0,
                duration: 500,
                onComplete: resolve
            });
        });
    }

    // Now fade out/destroy the sprite
    enemySprite.setVisible(false);
    player.scene.events.emit('enemyDefeated', enemySprite);
}

function createDeathExplosion(player, x, y) {
    const colors = [0xff0000, 0xffa500, 0xffff00]; // Red, orange, yellow for regular player

    for (let i = 0; i < 8; i++) {
        const particle = player.scene.add.circle(x, y, 5, Phaser.Utils.Array.GetRandom(colors)); // Larger particles for bigger sprites
        particle.setDepth(25);

        const angle = (i / 8) * Math.PI * 2;
        const distance = Phaser.Math.Between(30, 60);

        player.scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 600,
            onComplete: () => particle.destroy()
        });
    }

    // Fragments
    for (let i = 0; i < 5; i++) {
        const shardColor = 0x8b4513; // Brown color for regular player
        const shard = player.scene.add.rectangle(x, y, 6, 6, shardColor); // Larger fragments for bigger sprites
        shard.setDepth(24);

        const angle = Math.random() * Math.PI * 2;
        const distance = Phaser.Math.Between(20, 40);

        player.scene.tweens.add({
            targets: shard,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance + Phaser.Math.Between(10, 30),
            rotation: Math.random() * Math.PI * 2,
            alpha: 0,
            duration: 1000,
            onComplete: () => shard.destroy()
        });
    }
}
