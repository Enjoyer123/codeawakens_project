import { playAttack } from './playerAnimation.js';

export function haveEnemy(player) {
    return findNearbyEnemy(player) !== null;
}

export function findNearbyEnemy(player) {
    // ใช้ scene.monsters แทน player.enemies
    const scene = player.scene;
    if (!scene || !scene.monsters) return null;

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
            console.log("Found nearby enemy at distance:", distance);
            return monster;
        }
    }
    return null;
}

export function hitEnemyWithDamage(player, damage = 50) {
    const targetMonster = findNearbyEnemy(player);

    if (!targetMonster) {
        return false;
    }

    // ใช้ monster object ที่ถูกต้อง
    const enemySprite = targetMonster.sprite;
    if (!enemySprite) return false;

    // ศัตรูตายใน 1 hit
    const currentHP = targetMonster.data?.hp || 3;
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
    return true;
}

// ฟังก์ชันใหม่สำหรับการป้องกันความเสียหายจากศัตรู
export function defendFromEnemy(player, enemyDamage) {
    // ตรวจสอบว่าผู้เล่นมีอาวุธหรือไม่
    const currentState = player.scene?.game?.registry?.get('currentGameState');
    if (!currentState || !currentState.weaponData) {
        return enemyDamage; // ไม่มีอาวุธ โดนความเสียหายเต็ม
    }

    const weaponData = currentState.weaponData;
    const defense = weaponData.defense || 0;

    if (defense >= enemyDamage) {
        // ป้องกันได้ทั้งหมด
        showDefenseEffect(player, enemyDamage, true);
        return 0;
    } else {
        // ป้องกันได้บางส่วน
        const actualDamage = enemyDamage - defense;
        showDefenseEffect(player, defense, false);
        return actualDamage;
    }
}

function showDefenseEffect(player, defenseAmount, fullDefense) {
    const effectEmoji = fullDefense ? '🛡️' : '⚔️';
    const effectColor = fullDefense ? '#00ff00' : '#ffaa00';

    const effect = player.scene.add.text(player.x, player.y - 40, effectEmoji, {
        fontSize: '24px'
    });
    effect.setDepth(30);

    const defenseText = player.scene.add.text(player.x + 15, player.y - 25,
        fullDefense ? 'BLOCKED!' : `-${defenseAmount}`, {
        fontSize: '16px',
        color: effectColor,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1
    });
    defenseText.setDepth(30);

    // Animations
    player.scene.tweens.add({
        targets: effect,
        alpha: 0,
        y: player.y - 60,
        duration: 500,
        onComplete: () => effect.destroy()
    });

    player.scene.tweens.add({
        targets: defenseText,
        alpha: 0,
        y: defenseText.y - 30,
        duration: 800,
        onComplete: () => defenseText.destroy()
    });
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


import { showMonsterDeathEffect } from '../../shared/combat/effects/deathEffects';

async function killEnemy(player, enemySprite) {
    enemySprite.setData('defeated', true);

    // Stop input/interaction on enemy
    if (enemySprite.body) enemySprite.body.checkCollision.none = true;

    // Helper to get direction (duplicated from Battle logic for independence)
    const getDir = (sprite, target) => {
        const ang = Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y);
        let deg = Phaser.Math.RadToDeg(ang);
        deg = Phaser.Math.Angle.WrapDegrees(deg);
        if (deg >= 45 && deg < 135) return 'down';
        if (deg >= -45 && deg < 45) return 'right';
        if (deg >= -135 && deg < -45) return 'up';
        return 'left';
    };

    // Try to play Death Animation
    let playedDeathAnim = false;
    if (enemySprite.getData('hasDirectionalAnims')) {
        const dir = getDir(enemySprite, player);
        const prefix = enemySprite.getData('animPrefix');
        const deathAnimKey = `${prefix}-death-${dir}`;

        if (player.scene.anims.exists(deathAnimKey)) {
            console.log(`💀 Playing death anim: ${deathAnimKey}`);
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
        const healthBar = enemySprite.getData('healthBar');
        const healthBarBg = enemySprite.getData('healthBarBg');
        if (healthBar) healthBar.setVisible(false);
        if (healthBarBg) healthBarBg.setVisible(false);

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
