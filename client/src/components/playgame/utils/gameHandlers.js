/**
 * Game handler functions
 */

import {
  getCurrentGameState,
  setCurrentGameState,
  resetPlayerHp,

} from '../../../gameutils/shared/game';

import { clearPlayerCoins } from '../../../gameutils/entities/coinUtils';
import { resetAllPeople } from '../../../gameutils/entities/personUtils';
import { updatePlayer } from '../../../gameutils/phaser/player/phaserGamePlayer';
import { clearGameOverScreen } from '../../../gameutils/effects/gameEffects';
import { resetEnemy } from '../../../gameutils/combat/enemyUtils';

/**
 * Handle game restart
 * @param {Object} params - Parameters object
 * @param {Object} params.currentLevel - Current level data
 * @param {Function} params.setPlayerNodeId - Function to set player node ID
 * @param {Function} params.setPlayerDirection - Function to set player direction
 * @param {Function} params.setPlayerHp - Function to set player HP
 * @param {Function} params.setIsCompleted - Function to set completion state
 * @param {Function} params.setIsGameOver - Function to set game over state
 * @param {Function} params.setGameState - Function to set game state
 * @param {Function} params.setCurrentHint - Function to set current hint
 * @param {Function} params.clearGameOverScreen - Function to clear game over screen
 * @param {Function} params.updatePlayerWeaponDisplay - Function to update weapon display
 */
export function handleRestartGame({
  currentLevel,
  setPlayerNodeId,
  setPlayerDirection,
  setPlayerHp,
  setIsCompleted,
  setIsGameOver,
  setGameState,
  setCurrentHint,
  clearGameOverScreen,
  updatePlayerWeaponDisplay
}) {
  console.log("Restarting game...");

  // Clear Game Over screen
  if (getCurrentGameState().currentScene) {
    clearGameOverScreen(getCurrentGameState().currentScene);
  }

  // Reset game state
  setCurrentGameState({
    currentNodeId: currentLevel.startNodeId,
    direction: 0,
    goalReached: false,
    moveCount: 0,
    isGameOver: false
  });

  // Reset player position
  setPlayerNodeId(currentLevel.startNodeId);
  setPlayerDirection(0);

  // Reset HP
  resetPlayerHp(setPlayerHp);

  // Clear collected coins
  clearPlayerCoins();

  // Reset game status
  setIsCompleted(false);
  setIsGameOver(false);
  setGameState("ready");
  setCurrentHint("🔄 เกมเริ่มใหม่แล้ว! ลองใหม่อีกครั้ง");

  // Update player position in Phaser
  if (getCurrentGameState().currentScene) {
    updatePlayer(getCurrentGameState().currentScene, currentLevel.startNodeId, 0);
  }

  if (updatePlayerWeaponDisplay) {
    updatePlayerWeaponDisplay();
  }

  // Reset monsters if they exist using new utility functions
  if (getCurrentGameState().currentScene && getCurrentGameState().currentScene.monsters) {
    getCurrentGameState().currentScene.monsters.forEach(monster => {
      monster.data.defeated = false;
      monster.data.inBattle = false;
      monster.data.isChasing = false;
      monster.data.lastAttackTime = null;
      monster.data.hp = monster.data.maxHp || 3;

      // Use new utility function to reset enemy
      resetEnemy(monster.sprite, monster.sprite.x, monster.sprite.y);
      if (monster.glow) {
        monster.glow.setVisible(true);
        monster.glow.setFillStyle(0xff0000, 0.2);
      }
      if (monster.sprite.anims) {
        const idleAnim = monster.sprite.getData('idleAnim') || 'vampire-idle';
        monster.sprite.anims.play(idleAnim, true);
      }
    });
  }
}
