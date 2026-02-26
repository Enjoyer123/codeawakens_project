import Phaser from "phaser";
import { setPlayerHp as setGlobalPlayerHp } from '../shared/game';
import { isDefeat } from './enemyUtils';
import { showGameOver } from '../effects/gameEffects';
import { updateAllCombatUIs } from './battleUI';
import { getDirectionFromAngle } from './combatHelpers';
import { startBattle } from './battle';

export function updateMonsters(scene, delta, isRunning, setPlayerHp, setIsGameOver, setCurrentHint) {
    if (!scene.monsters) return;

    // Update combat UIs for all nearby enemies
    updateAllCombatUIs(scene);

    scene.monsters.forEach((monster) => {
        // ตรวจสอบว่าศัตรูตายแล้วหรือไม่ (Remove inBattle check to allow Flee Detection to run)
        if (isDefeat(monster.sprite) || monster.data?.defeated || monster.sprite.getData('defeated') || monster.isDefeated) return;

        const distToPlayer = Phaser.Math.Distance.Between(
            scene.player.x,
            scene.player.y,
            monster.sprite.x,
            monster.sprite.y
        );

        // Update combat UI based on distance (handled by updateAllCombatUIs)

        // Check if should start chasing
        if (distToPlayer < monster.data.detectionRange && !monster.data.isChasing) {
            monster.data.isChasing = true;
            monster.glow.setFillStyle(0xff6600, 0.4);
        } else if (distToPlayer > monster.data.detectionRange && monster.data.isChasing && !monster.data.hasEngaged) {
            // Determine direction from last movement to play correct idle
            const angle = Phaser.Math.Angle.Between(monster.sprite.x, monster.sprite.y, scene.player.x, scene.player.y);
            const idleAnim = monster.sprite.getData('idleAnim') || 'vampire-idle';

            if (monster.sprite.getData('hasDirectionalAnims')) {
                const dir = getDirectionFromAngle(angle);
                const prefix = monster.sprite.getData('animPrefix');
                const directionalIdle = `${prefix}-idle_${dir}`;
                if (scene.anims.exists(directionalIdle)) {
                    monster.sprite.anims.play(directionalIdle, true);
                } else {
                    monster.sprite.anims.play(idleAnim, true);
                }
            } else {
                monster.sprite.anims.play(idleAnim, true);
            }

            // continue to next monster (Stop chasing)
            monster.data.isChasing = false;
            return;
        }

        if (monster.data.isChasing) {
            handleMonsterChase(scene, monster, delta, setPlayerHp, setIsGameOver, setCurrentHint);
        } else {
            handleMonsterPatrol(scene, monster, delta);
        }
    });
}

function handleMonsterChase(scene, monster, delta, setPlayerHp, setIsGameOver, setCurrentHint) {
    const angle = Phaser.Math.Angle.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
    );

    // Only move if NOT in battle
    if (!monster.data.inBattle) {
        const speed = 120 * (delta / 1000);
        monster.sprite.x += Math.cos(angle) * speed;
        monster.sprite.y += Math.sin(angle) * speed;
        monster.glow.x = monster.sprite.x;
        monster.glow.y = monster.sprite.y;
    }

    // 🛑 Flee Detection & "Walk Past" Detection
    if (monster.data.hasEngaged) {
        const distForFlee = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, monster.sprite.x, monster.sprite.y);
        if (distForFlee > (monster.data.detectionRange || 60) + 20) {
            console.log("💀 Player fled from battle! Instant Death.");
            if (scene.player.takeDamage) {
                scene.player.takeDamage(100, true);
            } else {
                setGlobalPlayerHp(0);
                if (typeof setIsGameOver === 'function') setIsGameOver(true);
                showGameOver(scene);
            }
            return;
        }
    }

    // 🛑 Collision Detection
    if (!monster.data.inBattle) {
        const isPlayerMoving = scene.tweens.isTweening(scene.player);
        const distForCollision = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, monster.sprite.x, monster.sprite.y);

        if (isPlayerMoving && distForCollision < 25) {
            console.log("💀 Player walked into monster! Instant Death.");
            if (scene.player.takeDamage) {
                scene.player.takeDamage(100, true);
            } else {
                setGlobalPlayerHp(0);
                if (typeof setIsGameOver === 'function') setIsGameOver(true);
                showGameOver(scene);
            }
            return;
        }
    }

    // Update animation based on direction
    if (!monster.data.inBattle) {
        if (monster.sprite.getData('hasDirectionalAnims')) {
            const dir = getDirectionFromAngle(angle);
            const prefix = monster.sprite.getData('animPrefix');
            const animKey = `${prefix}-walk_${dir}`;
            if (scene.anims.exists(animKey)) {
                monster.sprite.anims.play(animKey, true);
            }
        } else {
            monster.sprite.anims.play(monster.sprite.getData('moveAnim') || 'vampire-movement', true);
        }
    }

    updateMonsterHealthBarPos(monster);

    // After moving, check distance again and trigger battle
    const distAfterMove = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
    );

    const attackRange = monster.data.attackRange || 45;
    if (distAfterMove <= attackRange && !monster.data.inBattle) {
        startBattle(scene, monster, setPlayerHp, setIsGameOver, setCurrentHint, false).catch(err => {
            console.error('Error starting battle:', err);
        });
    }
}

function handleMonsterPatrol(scene, monster, delta) {
    if (!monster.data.patrol || !Array.isArray(monster.data.patrol) || monster.data.patrol.length === 0) {
        return;
    }
    const target = monster.data.patrol[monster.data.currentPatrolIndex];
    if (!target || typeof target.x === 'undefined' || typeof target.y === 'undefined') {
        return;
    }

    const distToTarget = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        target.x,
        target.y
    );

    if (distToTarget < 5) {
        monster.data.currentPatrolIndex = (monster.data.currentPatrolIndex + 1) % monster.data.patrol.length;
        return;
    }

    const angle = Phaser.Math.Angle.Between(
        monster.sprite.x,
        monster.sprite.y,
        target.x,
        target.y
    );

    const speed = 40 * (delta / 1000);
    monster.sprite.x += Math.cos(angle) * speed;
    monster.sprite.y += Math.sin(angle) * speed;
    monster.glow.x = monster.sprite.x;
    monster.glow.y = monster.sprite.y;

    // Update animation for patrol
    if (monster.sprite.getData('hasDirectionalAnims')) {
        const dir = getDirectionFromAngle(angle);
        const prefix = monster.sprite.getData('animPrefix');
        const animKey = `${prefix}-walk_${dir}`;
        if (scene.anims.exists(animKey)) {
            monster.sprite.anims.play(animKey, true);
        }
    } else {
        monster.sprite.anims.play(monster.sprite.getData('moveAnim') || 'vampire-movement', true);
    }

    updateMonsterHealthBarPos(monster);
}

function updateMonsterHealthBarPos(monster) {
    const healthBar = monster.sprite.getData('healthBar');
    const healthBarBg = monster.sprite.getData('healthBarBg');
    if (healthBar) {
        healthBar.x = monster.sprite.x;
        healthBar.y = monster.sprite.y - 70;
    }
    if (healthBarBg) {
        healthBarBg.x = monster.sprite.x;
        healthBarBg.y = monster.sprite.y - 70;
    }
}
