// Custom hook for game condition functions (foundMonster, canMoveForward, nearPit, atGoal)
import { getCurrentGameState } from '../../../gameutils/shared/game';
import { nearPit as checkNearPit } from '../../../gameutils/shared/collision';
import { haveEnemy } from '../../../gameutils/phaser/player/playerCombat';

/**
 * Custom hook for game condition functions
 * @param {Object} params
 * @param {Object} params.currentLevel - Current level data
 * @returns {Object} Game condition functions
 */
export const useGameConditions = ({ currentLevel }) => {
  /**
   * Check if monster is found
   */
  const foundMonster = () => {
    // Use new combat system to check for monsters
    if (getCurrentGameState().currentScene && getCurrentGameState().currentScene.player) {
      const player = getCurrentGameState().currentScene.player;
      return haveEnemy(player);
    }
    return false;
  };

  /**
   * Check if player can move forward
   */
  const canMoveForward = () => {
    // Implementation would check if movement is possible
    return true;
  };

  /**
   * Check if player is near pit
   */
  const nearPit = () => {
    console.log("nearPit function called");
    // Use the imported checkNearPit function from gameUtils
    const result = checkNearPit();
    console.log("nearPit result:", result);
    return result;
  };

  /**
   * Check if player is at goal
   */
  const atGoal = () => {
    const currentState = getCurrentGameState();
    return currentState.currentNodeId === currentLevel.goalNodeId;
  };

  return {
    foundMonster,
    canMoveForward,
    nearPit,
    atGoal
  };
};

