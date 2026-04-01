// Phaser Game Battle Functions
import Phaser from "phaser";
import { getWeaponData } from '../entities/weaponUtils';
import { playSound } from '../sound/soundManager';

import { getCurrentGameState, setCurrentGameState, getPlayerHp, setPlayerHp as setGlobalPlayerHp, } from '../shared/game/gameState';
import { isDefeat } from './enemyUtils';
import { showGameOver } from '../effects/gameEffects';
import { cleanupMonsterUI } from './battleUI';
import { getDirectionFromAngle, showFloatingText } from './combatHelpers';

// คำนวณดาเมจตอนโดนมอนสเตอร์ตี (พลังป้องกันจากอาวุธ)
function calculateDamage(monsterDamage, weaponData) {
  // ถ้าไม่มีอาวุธ ให้ใช้ไม้พลองเป็นตัวฐาน (ป้องกัน=10)
  const defense = weaponData?.combat_power ?? 10;

  if (defense >= monsterDamage) {
    return 0; // อาวุธกันดาเมจได้หมด
  } else {
    return monsterDamage - defense; // ทะลวงเกราะเข้ามาได้นิดหน่อย
  }
}

export function startBattle(scene, monster, setPlayerHp, setIsGameOver, isPlayerAttack) {
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
                  playSound('hit');
                  scene.cameras.main.shake(200, 0.02);

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

        const finishBattle = (attackerFirst) => {

          monster.data.inBattle = false;
          resolve();
        };

        if (!isPlayerAttack) {
          // Priority 2: Monster hits first if it caught player manually
          monsterAttacks().then(() => {
            finishBattle('monster');
          });
        }
      },
    });
  });
}


