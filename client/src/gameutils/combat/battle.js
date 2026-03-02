// Phaser Game Battle Functions
import Phaser from "phaser";
import {

  getWeaponData,
  calculateDamage
} from '../entities/weaponUtils';

import { getCurrentGameState, setCurrentGameState, getPlayerHp, setPlayerHp as setGlobalPlayerHp, } from '../shared/game';
import { isDefeat } from './enemyUtils';
import { showGameOver } from '../effects/gameEffects';
import { cleanupMonsterUI } from './battleUI';
import { getDirectionFromAngle, showFloatingText } from './combatHelpers';

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
                  showFloatingText(scene, playerSprite.x, playerSprite.y, dmgTextStr, dmgColor);

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
              showFloatingText(scene, monster.sprite.x, monster.sprite.y, '-100', '#ffcc00');
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


