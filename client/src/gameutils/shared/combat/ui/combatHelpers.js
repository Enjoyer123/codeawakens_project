// Combat Helper Functions - HP, Messages, Effects
import { getCurrentGameState, setCurrentGameState } from '../../game';
import { getWeaponData } from '../../items';
import { createDeathExplosion } from '../combatEffects';

/**
 * ลด HP ของผู้เล่น (พร้อมคำนวณ defense จาก weapon)
 */
export function reducePlayerHP(baseDamage) {
  const currentState = getCurrentGameState();

  // ดึง weaponData เพื่อคำนวณ defense
  const weaponData = currentState.weaponData || getWeaponData('stick');
  const defense = weaponData.combat_power || 10; // default stick = 10

  // คำนวณ damage ที่แท้จริง
  const actualDamage = Math.max(0, baseDamage - defense);

  console.log(`🗡️ Monster Attack:`, {
    baseDamage,
    defense,
    actualDamage,
    weaponKey: currentState.weaponKey || 'stick'
  });

  const currentHP = currentState.playerHP || 100;
  const newHP = Math.max(0, currentHP - actualDamage);

  // อัปเดต HP ใน game state
  setCurrentGameState({ playerHP: newHP });

  // อัปเดต UI
  if (window.setPlayerHp) {
    window.setPlayerHp(newHP);
  }

  console.log(`Player HP: ${newHP}/100 (รับ damage: ${actualDamage})`);

  if (newHP <= 0) {
    // ผู้เล่นตาย
    setCurrentGameState({ isGameOver: true });
    if (window.setIsGameOver) {
      window.setIsGameOver(true);
    }
  }
}

/**
 * แสดงผลการโจมตี
 */
export function showAttackResult(attacker, damage, targetDefeated) {
  const message = attacker === 'player'
    ? `⚔️ คุณโจมตี ${damage} damage${targetDefeated ? ' - ศัตรูตาย!' : ''}`
    : `👹 ศัตรูโจมตี ${damage} damage`;

  showCombatMessage(message);
}

/**
 * แสดงข้อความในโหมดต่อสู้
 */
export function showCombatMessage(message) {
  // สร้างข้อความแสดงผล
  const scene = getCurrentGameState().currentScene;
  if (!scene) return;

  const combatText = scene.add.text(600, 100, message, {
    fontSize: '20px',
    fill: '#FFD700',
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center'
  }).setOrigin(0.5);

  combatText.setDepth(50);

  // หายไปหลังจาก 2 วินาที
  scene.time.delayedCall(2000, () => {
    scene.tweens.add({
      targets: combatText,
      alpha: 0,
      duration: 500,
      onComplete: () => combatText.destroy()
    });
  });
}

/**
 * แสดงการตายของศัตรู
 */
export function showEnemyDefeat(enemy) {
  const scene = getCurrentGameState().currentScene;
  if (!scene || !enemy.sprite) return;

  // เอฟเฟกต์การตาย
  scene.tweens.add({
    targets: enemy.sprite,
    alpha: 0,
    scaleX: 0.5,
    scaleY: 0.5,
    rotation: Math.PI * 2,
    duration: 800,
    ease: 'Back.easeIn',
    onComplete: () => {
      enemy.sprite.setVisible(false);
    }
  });

  // เอฟเฟกต์ระเบิด
  createDeathExplosion(scene, enemy.sprite.x, enemy.sprite.y);
}

