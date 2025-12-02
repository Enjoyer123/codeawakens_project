// Combat Utility Functions
import { getCombatState } from './combatState';

/**
 * ตรวจสอบว่าผู้เล่นสามารถใช้คำสั่งได้หรือไม่
 */
export function canExecuteCommand() {
  // ให้สามารถใช้คำสั่งได้เสมอ ยกเว้นเมื่อเกมจบหรือถึงเป้าหมายแล้ว
  return true;
}

/**
 * ตรวจสอบว่าต้องใช้คำสั่ง hit() หรือไม่
 */
export function requiresHitCommand() {
  const combatState = getCombatState();
  return combatState.isInCombat && combatState.playerTurn;
}

/**
 * หยุดการทำงานของเกม (ใช้เมื่อเริ่มการต่อสู้)
 * ปัจจุบันปิดการใช้งานเพื่อไม่ให้เกมหยุดทำงาน
 */
export function pauseGameExecution() {
  // combatState.combatPaused = true;
  console.log('Game execution pause disabled for better gameplay');
}

/**
 * เริ่มการทำงานของเกมต่อ (ใช้เมื่อจบการต่อสู้)
 */
export function resumeGameExecution() {
  const combatState = getCombatState();
  combatState.combatPaused = false;
  console.log('Game execution resumed after combat');
}

/**
 * ตรวจสอบว่าเกมถูกหยุดหรือไม่
 */
export function isGamePaused() {
  const combatState = getCombatState();
  return combatState.combatPaused;
}

/**
 * ตรวจสอบว่าการต่อสู้จบแล้วหรือไม่
 */
export function isCombatResolved() {
  const combatState = getCombatState();
  return combatState.isCombatResolved;
}

/**
 * รับผลการต่อสู้
 */
export function getCombatResult() {
  const combatState = getCombatState();
  return {
    winner: combatState.combatWinner,
    resolved: combatState.isCombatResolved
  };
}

