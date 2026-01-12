// Phaser Game Battle Functions
import Phaser from "phaser";
import {
  getCurrentGameState,
  setCurrentGameState,
  getPlayerHp,
  setPlayerHp as setGlobalPlayerHp,
  getWeaponData,
  calculateDamage
} from '../gameUtils';
import { checkPlayerInRange } from '../../phaser/utils/enemyBehavior';
import { isDefeat } from '../../phaser/utils/enemyUtils';
import { showGameOver } from './phaserGameEffects';
import { updateAllCombatUIs, cleanupMonsterUI } from './phaserGameCombatUI';

export function startBattle(scene, monster, setPlayerHp, setIsGameOver, setCurrentHint, isPlayerAttack = false) {
  return new Promise((resolve) => {
    // Check if monster is already defeated or currently in battle
    if (monster.data.defeated || monster.data.inBattle) {
      resolve();
      return;
    }

    // Set battle flag to prevent multiple battles
    monster.data.inBattle = true;

    console.log("Battle started - HP before:", getPlayerHp());

    const flash = scene.add.circle(scene.player.x, scene.player.y, 30, 0xffffff, 0.8);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 400,
      onComplete: () => {
        flash.destroy();

        const currentState = getCurrentGameState();
        const weaponData = currentState.weaponData || getWeaponData(currentState.weaponKey || 'stick');

        // ✅ เพิ่ม log เพื่อดูข้อมูล weapon ทั้งหมด
        console.log("🔍 Full weaponData:", weaponData);
        console.log("🔍 weaponData keys:", Object.keys(weaponData || {}));
        console.log("🔍 currentState.weaponKey:", currentState.weaponKey);

        const monsterDamage = monster.data.damage || 25;
        const finalDamage = calculateDamage(monsterDamage, weaponData);

        console.log("🗡️ Monster Attack Details:", {
          monsterDamage,
          weaponKey: currentState.weaponKey || 'stick',
          weaponDefense: weaponData?.combat_power || 0,
          finalDamage,
          hpBefore: getPlayerHp()
        });

        // Monster attacks first (unless already defeated)
        if (!monster.data.defeated) {
          // Apply damage to player
          if (finalDamage > 0) {
            const oldHp = getPlayerHp();
            const newHp = Math.max(0, oldHp - finalDamage);

            // Update module-level canonical HP
            try {
              setGlobalPlayerHp(newHp);
            } catch (err) {
              console.warn('Failed to set global player HP:', err);
            }

            // Update shared game state
            try {
              setCurrentGameState({ playerHP: newHp });
            } catch (err) {
              console.warn('Failed to set current game state playerHP:', err);
            }

            // Update React UI setter if provided
            try {
              if (typeof setPlayerHp === 'function') setPlayerHp(newHp);
            } catch (err) {
              console.warn('Failed to call React setPlayerHp:', err);
            }

            // Notify global hook
            try { if (window.setPlayerHp) window.setPlayerHp(newHp); } catch (err) { }

            console.log(`✅ HP change: ${oldHp} -> ${newHp} (damage: ${finalDamage})`);
          } else {
            console.log(`🛡️ Attack blocked! Weapon defense: ${weaponData?.combat_power || 0}`);
          }

          // Show floating damage number (or blocked text)
          try {
            const scenePlayer = scene.player;
            if (scenePlayer) {
              const dmgTextStr = finalDamage > 0 ? `-${finalDamage}` : 'Blocked!';
              const dmgColor = finalDamage > 0 ? '#ff4444' : '#00ff00';
              const damageText = scene.add.text(scenePlayer.x, scenePlayer.y - 40, dmgTextStr, {
                fontSize: '20px',
                color: dmgColor,
                stroke: '#000000',
                strokeThickness: 2,
                fontStyle: 'bold'
              }).setOrigin(0.5);
              damageText.setDepth(60);

              scene.tweens.add({
                targets: damageText,
                y: scenePlayer.y - 70,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => { if (damageText) damageText.destroy(); }
              });
            }
          } catch (err) {
            console.warn('Failed to show damage text:', err);
          }
        }

        // Then player attacks monster (if player initiated attack)
        if (isPlayerAttack) {
          // Player attacks monster - Monster dies in 1 hit
          monster.data.hp = 0;
          monster.data.defeated = true;
          console.log(`💀 Player defeats monster in 1 hit!`);

          // Visual feedback for monster taking damage
          scene.tweens.add({
            targets: monster.sprite,
            tint: 0xff0000,
            duration: 200,
            yoyo: true,
            onComplete: () => {
              // Monster defeated
              monster.sprite.setTint(0x333333);
              monster.glow.setVisible(false);

              // Clean up combat UI
              cleanupMonsterUI(scene, monster);
            }
          });
        }

        // Reset battle flag
        monster.data.inBattle = false;

        // ✅ ใช้ finalDamage ที่คำนวณแล้ว (ไม่ต้องคำนวณซ้ำ)
        const effectColor = !monster.data.defeated && finalDamage === 0 ? 0x00ff00 :
          !monster.data.defeated && finalDamage < 10 ? 0xffff00 : 0xff0000;

        scene.tweens.add({
          targets: [scene.player, scene.playerBorder],
          tint: effectColor,
          duration: 120,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            // Show battle result
            if (getPlayerHp() <= 0) {
              setCurrentGameState({ isGameOver: true });
              setCurrentHint("💀 Game Over! HP หมดแล้ว");
              showGameOver(scene);
            } else if (monster.data.defeated) {
              setCurrentHint(`💀 ชนะ ${monster.data.name}! (เหลือ ${getPlayerHp()} HP)`);
            } else {
              if (finalDamage === 0) {
                setCurrentHint(`🛡️ สู้ ${monster.data.name}! อาวุธป้องกันได้! (เหลือ ${getPlayerHp()} HP)`);
              } else {
                setCurrentHint(`⚔️ สู้ ${monster.data.name}! โดน ${finalDamage} damage (เหลือ ${getPlayerHp()} HP)`);
              }
            }
            resolve();
          },
        });
      },
    });
  });
}

export function updateMonsters(scene, delta, isRunning, setPlayerHp, setIsGameOver, setCurrentHint) {
  if (!scene.monsters) return;

  // Update combat UIs for all nearby enemies
  updateAllCombatUIs(scene);

  scene.monsters.forEach((monster) => {
    // ตรวจสอบว่าศัตรูตายแล้วหรือไม่
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
      monster.sprite.anims.play('vampire-movement', true);
    } else if (distToPlayer > monster.data.detectionRange && monster.data.isChasing) {
      // Player moved out of detection range - stop chasing (do NOT insta-kill)
      monster.data.isChasing = false;
      monster.glow.setFillStyle(0xff0000, 0.2);
      monster.sprite.anims.play('vampire-idle', true);
      // continue to next monster
      return;
    }

    if (monster.data.isChasing) {
      const angle = Phaser.Math.Angle.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
      );
      const speed = 120 * (delta / 1000);
      monster.sprite.x += Math.cos(angle) * speed;
      monster.sprite.y += Math.sin(angle) * speed;
      monster.glow.x = monster.sprite.x;
      monster.glow.y = monster.sprite.y;

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

      checkPlayerInRange(monster.sprite);

      // After moving, check distance again and trigger battle only if close enough AND game is running
      const distAfterMove = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        scene.player.x,
        scene.player.y
      );

      const attackRange = monster.data.attackRange || 30;
      // ⭐ Only attack if game is running (not paused)
      if (distAfterMove <= attackRange && !monster.data.inBattle && isRunning) {
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
        return;  // Added return to prevent extra movement after reaching target
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

