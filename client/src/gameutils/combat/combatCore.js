// Combat Core Functions - Initiation, Ending, Attack Execution
import { getWeaponData } from '../entities/weaponUtils';
import { getCurrentGameState, setCurrentGameState } from '../shared/game'


import { getCombatState, setCombatState } from './combatState';
import { calculateAttackDamage, calculatePlayerDamage } from './combatDamage';
import { attackEnemy, showEffectWeaponFixed } from './combatEffects';
import { showAttackResult, showCombatMessage, reducePlayerHP, showEnemyDefeat } from './combatHelpers';
import { showCombatUI, hideCombatUI } from './combatUI';

/**
 * เริ่มต้น Combat Mode เมื่อเข้าใกล้ศัตรู
 */
export function initiateCombat(player, enemy) {
  const combatState = getCombatState();
  if (combatState.isInCombat) return;

  console.log('Initiating combat with enemy:', enemy);

  setCombatState({
    isInCombat: true,
    currentEnemy: enemy,
    playerTurn: true,
    combatQueue: [],
    combatResults: [],
    isCombatResolved: false,
    combatWinner: null,
    combatPaused: false
  });

  // แสดง UI Combat Mode
  showCombatUI();

  // หยุดการเคลื่อนที่ของศัตรู
  if (enemy.sprite) {
    enemy.sprite.body?.setVelocity?.(0, 0); // ปลอดภัย ถ้ามี physics body
    enemy.sprite.anims?.play('vampire_1-idle_down', true);
  }

  // แสดงข้อความเริ่มต้นการต่อสู้
  showCombatMessage(`⚔️ เริ่มการต่อสู้กับ ${enemy.name || 'ศัตรู'}!`);

  return getCombatState();
}

/**
 * จบ Combat Mode
 */
export function endCombat(winner = null) {
  console.log('Ending combat, winner:', winner);

  setCombatState({
    isInCombat: false,
    currentEnemy: null,
    playerTurn: true,
    combatQueue: [],
    combatResults: [],
    isCombatResolved: true,
    combatWinner: winner,
    combatPaused: false
  });

  // ซ่อน UI Combat Mode
  hideCombatUI();

  // แสดงผลการต่อสู้
  if (winner === 'player') {
    showCombatMessage(`🎉 คุณชนะ! ศัตรูตายแล้ว`);
  } else if (winner === 'enemy') {
    showCombatMessage(`💀 คุณแพ้! เกมจบ`);
  }

  return getCombatState();
}

/**
 * ตรวจสอบว่าอยู่ในโหมดต่อสู้หรือไม่
 */
export function isInCombat() {
  return getCombatState().isInCombat;
}

/**
 * รับคำสั่งโจมตีจาก Blockly
 */
export function executePlayerAttack() {
  console.log("executePlayerAttack called");
  const combatState = getCombatState();
  if (!combatState.isInCombat || !combatState.playerTurn) {
    console.log('Not in combat or not player turn');
    return false;
  }

  const currentState = getCurrentGameState();
  const weaponData = currentState.weaponData || getWeaponData('stick');

  const damage = calculateAttackDamage(weaponData, currentState.weaponKey);
  console.log(`Player attacks for ${damage} damage`);

  // 🚀 ยิง effect projectile จาก player → enemy
  const scene = currentState.currentScene;
  const enemy = combatState.currentEnemy;
  if (scene && enemy?.sprite) {
    const projectileTexture = `weapon_${currentState.weaponKey}` || 'weapon_stick';
    const effect = scene.add.image(scene.player.x, scene.player.y, projectileTexture);
    effect.setScale(0.3);
    effect.setDepth(30);

    scene.tweens.add({
      targets: effect,
      x: enemy.sprite.x,
      y: enemy.sprite.y,
      duration: 400, // ความเร็ว projectile
      onComplete: () => {
        effect.destroy();

        // 💥 ตอนนี้ค่อยทำ damage จริง
        const enemyDefeated = attackEnemy(enemy, damage, currentState.weaponKey || 'stick');
        showAttackResult('player', damage, enemyDefeated);

        if (enemyDefeated) {
          endCombat('player');
        } else {
          setCombatState({ playerTurn: false });
          scheduleEnemyAttack();
        }
      }
    });
  }

  return true;
}

/**
 * กำหนดการโจมตีของศัตรู
 */
function scheduleEnemyAttack() {
  setTimeout(() => {
    const combatState = getCombatState();
    if (!combatState.isInCombat) return;

    executeEnemyAttack();
  }, 1000); // ศัตรูโจมตีหลังจาก 1 วินาที
}

/**
 * ศัตรูโจมตี
 */
function executeEnemyAttack() {
  const combatState = getCombatState();
  if (!combatState.isInCombat || combatState.playerTurn) return;

  const enemy = combatState.currentEnemy;
  const enemyDamage = enemy.data?.damage || 20;

  console.log(`Enemy attacks for ${enemyDamage} damage`);

  // คำนวณความเสียหายที่ผู้เล่นจะได้รับ (รวมการป้องกัน)
  const actualDamage = calculatePlayerDamage(enemyDamage);

  // แสดงผลการโจมตีของศัตรู
  showAttackResult('enemy', actualDamage, false);

  // ลด HP ของผู้เล่น
  if (actualDamage > 0) {
    reducePlayerHP(actualDamage);
  }

  // เปลี่ยนเป็นตาของผู้เล่น
  setCombatState({ playerTurn: true });

  // ตรวจสอบว่าเกมจบหรือไม่
  if (getCurrentGameState().isGameOver) {
    endCombat('enemy');
  }
}

