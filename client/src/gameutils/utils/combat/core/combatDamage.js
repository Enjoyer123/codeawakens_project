// Combat Damage Calculation
import { getCurrentGameState, getWeaponData } from '../../gameUtils';

/**
 * คำนวณความเสียหายจากการโจมตีของผู้เล่น
 */
export function calculateAttackDamage(weaponData, weaponKey) {
  if (!weaponData) return 50; // ความเสียหายพื้นฐาน

  let baseDamage = weaponData.power * 10;

  // โบนัสจาก pattern ที่ใช้
  const patternBonus = getPatternBonus(weaponKey);
  baseDamage += patternBonus;

  return baseDamage;
}

/**
 * คำนวณความเสียหายที่ผู้เล่นจะได้รับ
 */
export function calculatePlayerDamage(enemyDamage) {
  const currentState = getCurrentGameState();
  const weaponData = currentState.weaponData;

  if (!weaponData) return enemyDamage;

  const defense = weaponData.defense || 0;
  return Math.max(0, enemyDamage - defense);
}

/**
 * โบนัสจาก pattern
 */
function getPatternBonus(weaponKey) {
  // TODO: Implement pattern bonus logic
  return 0;
}

