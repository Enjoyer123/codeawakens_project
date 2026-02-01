// Phaser Game Battle Functions
import Phaser from "phaser";
import {

  getWeaponData,
  calculateDamage
} from '../../shared/items';

import { getCurrentGameState, setCurrentGameState, getPlayerHp, setPlayerHp as setGlobalPlayerHp, } from '../../shared/game';
import { checkPlayerInRange } from '../../phaser/enemies/enemyBehavior';
import { isDefeat } from '../../phaser/enemies/enemyUtils';
import { showGameOver } from '../../phaser/effects/phaserGameEffects';
import { updateAllCombatUIs, cleanupMonsterUI } from '../../phaser/combat/phaserGameCombatUI';

export function startBattle(scene, monster, setPlayerHp, setIsGameOver, setCurrentHint, isPlayerAttack = false) {
  return new Promise((resolve) => {
    // Check if monster is already defeated or currently in battle
    if (monster.data.defeated || monster.data.inBattle) {
      resolve();
      return;
    }

    // Set battle flag to prevent multiple battles
    monster.data.inBattle = true;
    monster.data.hasEngaged = true; // Mark as engaged for flee detection

    // Flash effect for battle start
    const flash = scene.add.circle(scene.player.x, scene.player.y, 30, 0xffffff, 0.8);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 100, // Reduced from 400ms for immediate attack feel
      onComplete: () => {
        flash.destroy();

        const currentState = getCurrentGameState();
        const weaponData = currentState.weaponData || getWeaponData(currentState.weaponKey || 'stick');
        const monsterDamage = monster.data.damage || 25;
        const finalDamage = calculateDamage(monsterDamage, weaponData);

        // --- Sequence function for Monster Attack ---
        const monsterAttacks = () => {
          if (monster.data.defeated) return Promise.resolve();

          return new Promise((mResolve) => {
            const monsterSprite = monster.sprite;
            const playerSprite = scene.player;

            if (monsterSprite && playerSprite) {
              // 1. Play Attack Animation
              if (monsterSprite.getData('hasDirectionalAnims')) {
                const ang = Phaser.Math.Angle.Between(monsterSprite.x, monsterSprite.y, playerSprite.x, playerSprite.y);
                const dir = getDirectionFromAngle(ang);
                const prefix = monsterSprite.getData('animPrefix');
                const animKey = `${prefix}-attack-${dir}`;
                if (scene.anims.exists(animKey)) {
                  monsterSprite.anims.play(animKey, true);
                } else {
                  monsterSprite.anims.play(monsterSprite.getData('attackAnim') || 'vampire-attack', true);
                }
              } else {
                monsterSprite.anims.play(monsterSprite.getData('attackAnim') || 'vampire-attack', true);
              }

              // 2. Add Lunge Tween
              const ang = Phaser.Math.Angle.Between(monsterSprite.x, monsterSprite.y, playerSprite.x, playerSprite.y);
              const lungeDist = 15;

              scene.tweens.add({
                targets: monsterSprite,
                x: monsterSprite.x + Math.cos(ang) * lungeDist,
                y: monsterSprite.y + Math.sin(ang) * lungeDist,
                duration: 150,
                yoyo: true,
                ease: 'Power2',
                onComplete: () => {
                  // Apply damage to player
                  // Apply damage to player
                  if (finalDamage > 0) {
                    if (scene.player.takeDamage) {
                      scene.player.takeDamage(finalDamage);
                    } else {
                      // Fallback only if takeDamage not ready (shouldn't happen)
                      const oldHp = getPlayerHp();
                      const newHp = Math.max(0, oldHp - finalDamage);
                      setGlobalPlayerHp(newHp);
                      setCurrentGameState({ playerHP: newHp });
                      if (typeof setPlayerHp === 'function') setPlayerHp(newHp);
                      try { if (window.setPlayerHp) window.setPlayerHp(newHp); } catch (err) { }
                      if (newHp <= 0) {
                        setIsGameOver(true);
                        setCurrentGameState({ isGameOver: true });
                        showGameOver(scene);
                      }
                    }
                  }

                  // Show floating damage number
                  const dmgTextStr = finalDamage > 0 ? `-${finalDamage}` : 'Blocked!';
                  const dmgColor = finalDamage > 0 ? '#ff4444' : '#00ff00';
                  const damageText = scene.add.text(playerSprite.x, playerSprite.y - 40, dmgTextStr, {
                    fontSize: '20px',
                    color: dmgColor,
                    stroke: '#000000',
                    strokeThickness: 2,
                    fontStyle: 'bold'
                  }).setOrigin(0.5).setDepth(60);

                  scene.tweens.add({
                    targets: damageText,
                    y: playerSprite.y - 70,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => { damageText.destroy(); }
                  });

                  // Delay for impact feel before resolving
                  scene.time.delayedCall(400, mResolve);
                }
              });
            } else {
              mResolve();
            }
          });
        };

        // --- Sequence function for Player Attack ---
        const playerAttacks = () => {
          return new Promise((pResolve) => {
            // Player attacks monster - Always 100 damage (Monster dies in 1 hit)
            monster.data.hp = 0;
            monster.data.defeated = true;

            // Show damage text for monster
            if (monster.sprite) {
              const damageText = scene.add.text(monster.sprite.x, monster.sprite.y - 40, `-100`, {
                fontSize: '24px',
                color: '#ffcc00',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
              }).setOrigin(0.5).setDepth(60);

              scene.tweens.add({
                targets: damageText,
                y: monster.sprite.y - 80,
                alpha: 0,
                duration: 600,
                onComplete: () => { damageText.destroy(); }
              });
            }

            scene.tweens.add({
              targets: monster.sprite,
              tint: 0xff0000,
              duration: 200,
              yoyo: true,
              onComplete: () => {
                monster.sprite.setTint(0x333333);
                monster.glow.setVisible(false);
                cleanupMonsterUI(scene, monster);
                pResolve();
              }
            });
          });
        };

        // --- Finalize Battle Results ---
        const finishBattle = (attackerFirst) => {
          // Final Check for Hints
          if (getPlayerHp() <= 0) {
            setCurrentHint(`💀 แพ้แล้ว! ถูก ${monster.data.name} โจมตีหนักเกินไป`);
          } else if (monster.data.defeated) {
            setCurrentHint(`💀 ชนะ ${monster.data.name}! (เหลือ ${getPlayerHp()} HP)`);
          } else {
            if (finalDamage === 0) {
              setCurrentHint(`🛡️ สู้ ${monster.data.name}! อาวุธป้องกันได้! (เหลือ ${getPlayerHp()} HP)`);
            } else {
              setCurrentHint(`⚔️ สู้ ${monster.data.name}! โดน ${finalDamage} damage (เหลือ ${getPlayerHp()} HP)`);
            }
          }

          monster.data.inBattle = false;
          resolve();
        };

        if (isPlayerAttack) {
          // Priority 1: Player hits monster immediately during code run
          playerAttacks().then(() => finishBattle('player'));
        } else {
          // Priority 2: Monster hits first if it caught player manually
          monsterAttacks().then(() => {
            finishBattle('monster');
          });
        }
      },
    });
  });
}

// Helper to get direction string from angle (in radians)
function getDirectionFromAngle(angle) {
  let deg = Phaser.Math.RadToDeg(angle);
  // Phaser 3 uses WrapDegrees (-180 to 180)
  deg = Phaser.Math.Angle.WrapDegrees(deg);

  // Convert to 0-360 for easier checking if needed, or just handle -180 to 180
  if (deg >= 45 && deg < 135) return 'down';
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= -135 && deg < -45) return 'up';
  return 'left'; // 135 to 180 and -180 to -135
}

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
      const angle = Phaser.Math.Angle.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
      );

      // Only move if NOT in battle (Don't override attack lunges)
      if (!monster.data.inBattle) {
        const speed = 120 * (delta / 1000);
        monster.sprite.x += Math.cos(angle) * speed;
        monster.sprite.y += Math.sin(angle) * speed;
        monster.glow.x = monster.sprite.x;
        monster.glow.y = monster.sprite.y;
      }

      // 🛑 Flee Detection & "Walk Past" Detection
      if (monster.data.hasEngaged) {
        const isPlayerMoving = scene.tweens.isTweening(scene.player);

        // Rule 1: Moving while Engaged -> Removed to prevent instant death while entering the node
        // We only enforce Rule 2 (Distance) now.

        const distForFlee = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, monster.sprite.x, monster.sprite.y);
        // Rule 2: Fleeing (Distance based)
        // If distance exceeds detection range + buffer (e.g. 80), considering it fleeing
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

      // 🛑 Collision Detection: If player walks INTO monster (isMoving + close)
      if (!monster.data.inBattle) { // Only checking generic collision if not already battling
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

      // Update animation based on direction (Only if NOT in battle)
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

      // Update health bar position - adjusted for bigger sprite
      const healthBar = monster.sprite.getData('healthBar');
      const healthBarBg = monster.sprite.getData('healthBarBg');
      if (healthBar) {
        healthBar.x = monster.sprite.x;
        healthBar.y = monster.sprite.y - 40;
      }
      if (healthBarBg) {
        healthBarBg.x = monster.sprite.x;
        healthBarBg.y = monster.sprite.y - 40;
      }

      // checkPlayerInRange(monster.sprite); // ⚠️ Comment out to prevent conflict with cinematic startBattle system

      // After moving, check distance again and trigger battle only if close enough AND game is running
      const distAfterMove = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
      );

      const attackRange = monster.data.attackRange || 45;
      // ⭐ Attack if close enough (removed isRunning check to allow manual movement attacks)
      if (distAfterMove <= attackRange && !monster.data.inBattle) {
        // startBattle will handle damage and game over logic; don't await here to keep update loop responsive
        startBattle(scene, monster, setPlayerHp, setIsGameOver, setCurrentHint, false).catch(err => {
          console.error('Error starting battle:', err);
        });
      }
    } else {
      // Normal patrol behavior
      if (!monster.data.patrol || !Array.isArray(monster.data.patrol) || monster.data.patrol.length === 0) {
        return; // Skip if no patrol points
      }
      const target = monster.data.patrol[monster.data.currentPatrolIndex];
      if (!target || typeof target.x === 'undefined' || typeof target.y === 'undefined') {
        return; // Skip if target is invalid
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
      } else {
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

        // Update health bar position - adjusted for bigger sprite
        const healthBar = monster.sprite.getData('healthBar');
        const healthBarBg = monster.sprite.getData('healthBarBg');
        if (healthBar) {
          healthBar.x = monster.sprite.x;
          healthBar.y = monster.sprite.y - 40;
        }
        if (healthBarBg) {
          healthBarBg.x = monster.sprite.x;
          healthBarBg.y = monster.sprite.y - 40;
        }
      }
    }
  });
}

