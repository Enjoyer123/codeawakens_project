/**
 * Game handler functions
 */

import {
  getCurrentGameState,
  setCurrentGameState,
  resetPlayerHp,
  clearPlayerCoins,
  clearRescuedPeople,
  resetAllPeople,
  clearStack
} from '../../../gameutils/utils/gameUtils';
import { updatePlayer, showGameOver, showVictory, clearGameOverScreen } from '../../../gameutils/utils/phaserGame';
import { resetEnemy } from '../../../gameutils/phaser/utils/enemyUtils';
import { calculateFinalScore } from './scoreUtils';

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
      monster.data.hp = 3;

      // Use new utility function to reset enemy
      resetEnemy(monster.sprite, monster.sprite.x, monster.sprite.y);
      if (monster.glow) {
        monster.glow.setVisible(true);
        monster.glow.setFillStyle(0xff0000, 0.2);
      }
      if (monster.sprite.anims) {
        monster.sprite.anims.play('vampire-idle', true);
      }
    });
  }
}

/**
 * Handle victory condition
 * @param {Object} params - Parameters object
 * @param {boolean} params.isCompleted - Whether level is already completed
 * @param {Function} params.setIsCompleted - Function to set completion state
 * @param {Function} params.setIsRunning - Function to set running state
 * @param {Function} params.setGameState - Function to set game state
 * @param {Function} params.showVictory - Function to show victory screen
 * @param {Function} params.calculateFinalScore - Function to calculate final score
 * @param {Function} params.setFinalScore - Function to set final score
 * @param {Function} params.gameStartTime - Ref to game start time
 * @param {Function} params.setTimeSpent - Function to set time spent
 * @param {Function} params.setGameResult - Function to set game result
 * @param {boolean} params.isPreview - Whether in preview mode
 * @param {Function} params.onUnlockPattern - Callback for unlocking pattern
 * @param {Function} params.onUnlockLevel - Callback for unlocking level
 * @param {number} params.patternId - Pattern ID for preview mode
 * @param {Object} params.currentLevel - Current level data
 * @param {Function} params.setShowProgressModal - Function to show progress modal
 * @param {number} params.hintOpenCount - Number of times hints were opened
 * @param {Object} params.matchedPattern - Matched pattern object
 */
export async function handleVictory({
  isCompleted,
  setIsCompleted,
  setIsRunning,
  setGameState,
  showVictory,
  calculateFinalScore,
  setFinalScore,
  gameStartTime,
  setTimeSpent,
  setGameResult,
  isPreview,
  onUnlockPattern,
  onUnlockLevel,
  patternId,
  currentLevel,
  setShowProgressModal,
  hintOpenCount,
  matchedPattern = null
}) {
  if (isCompleted) return;

  setIsCompleted(true);
  setIsRunning(false);
  setGameState("victory");

  const currentState = getCurrentGameState();
  if (currentState.currentScene) {
    showVictory(currentState.currentScene);
  }

  // Calculate score
  const patternTypeId = matchedPattern?.pattern_type_id || null;
  const score = calculateFinalScore(false, patternTypeId, hintOpenCount);
  setFinalScore(score);

  // Calculate time spent
  if (gameStartTime.current) {
    const endTime = Date.now();
    setTimeSpent(Math.floor((endTime - gameStartTime.current) / 1000));
  }

  setGameResult('victory');

  // In preview mode, unlock pattern and level
  if (isPreview && matchedPattern) {
    try {
      if (onUnlockPattern) {
        await onUnlockPattern(patternId || matchedPattern.pattern_id);
      }
      if (onUnlockLevel && currentLevel) {
        await onUnlockLevel(currentLevel.level_id);
      }
    } catch (error) {
      console.error('Error unlocking pattern/level:', error);
    }
  }

  // In normal mode, show progress modal (which will save progress)
  if (!isPreview) {
    setShowProgressModal(true);
  }
}

