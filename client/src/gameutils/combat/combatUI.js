// Combat UI Functions
import { getCurrentGameState } from '../shared/game';
import { getCombatState } from './combatState';

/**
 * แสดง UI โหมดต่อสู้
 */
export function showCombatUI() {
  const scene = getCurrentGameState().currentScene;
  if (!scene) return;

  // สร้าง UI background
  const combatUI = scene.add.rectangle(600, 50, 400, 80, 0x000000, 0.8);
  combatUI.setDepth(40);

  // ข้อความสถานะ
  const statusText = scene.add.text(600, 30, '⚔️ COMBAT MODE', {
    fontSize: '16px',
    fill: '#FF0000',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  statusText.setDepth(41);

  // ข้อความคำแนะนำ
  const hintText = scene.add.text(600, 50, 'ใช้คำสั่ง hit() เพื่อโจมตี', {
    fontSize: '14px',
    fill: '#FFFFFF'
  }).setOrigin(0.5);
  hintText.setDepth(41);

  // ข้อความตาของผู้เล่น
  const turnText = scene.add.text(600, 70, '🎯 ตาของคุณ', {
    fontSize: '14px',
    fill: '#00FF00',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  turnText.setDepth(41);

  // เก็บ reference สำหรับอัปเดต
  const combatState = getCombatState();
  combatState.combatUI = { combatUI, statusText, hintText, turnText };
}

/**
 * ซ่อน UI โหมดต่อสู้
 */
export function hideCombatUI() {
  const combatState = getCombatState();
  if (combatState.combatUI) {
    Object.values(combatState.combatUI).forEach(ui => {
      if (ui && ui.destroy) ui.destroy();
    });
    combatState.combatUI = null;
  }
}

/**
 * อัปเดต UI โหมดต่อสู้
 */
export function updateCombatUI() {
  const combatState = getCombatState();
  if (!combatState.isInCombat || !combatState.combatUI) return;

  const { turnText } = combatState.combatUI;
  if (turnText) {
    turnText.setText(combatState.playerTurn ? '🎯 ตาของคุณ' : '👹 ตาของศัตรู');
    turnText.setFill(combatState.playerTurn ? '#00FF00' : '#FF0000');
  }
}

