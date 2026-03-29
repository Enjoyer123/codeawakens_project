/**
 * Hook for Phaser game initialization
 */

import Phaser from "phaser";
import { GameScene } from "../../../gameutils/phaser/scenes/GameScene";

/**
 * Hook for Phaser game initialization
 * @param {Object} params - Parameters object
 * @returns {Function} initPhaserGame function
 */
export function usePhaserGame({
  gameRef,
  phaserGameRef,
  currentLevel,
  setCurrentWeaponData,
  setPlayerHp,
  setIsGameOver,
  isRunning
}) {
  const initPhaserGame = () => {

    if (!gameRef.current || !currentLevel) {
      return;
    }

    // Prevent creating multiple games
    if (phaserGameRef.current) {
      try {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      } catch (error) {
        console.warn("Error destroying existing Phaser game:", error);
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 1200,
      height: 920,
      backgroundColor: "#0f111a",
      parent: gameRef.current,
      // We don't define scene here, we add it manually to pass data
      scene: [],
      audio: {
        disableWebAudio: true
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Use ResizeObserver to detect when the React layout actually finishes settling
    // and forces Phaser to update its scale based on the real final dimensions.
    const resizeObserver = new ResizeObserver(() => {
      if (game && game.scale) {
        game.scale.refresh();
      }
    });
    resizeObserver.observe(gameRef.current);

    game.events.once('destroy', () => {
      resizeObserver.disconnect();
    });

    // Prepare data to pass to the scene
    const sceneData = {
      currentLevel: currentLevel,
      handlers: {
        isRunning,
        setPlayerHp,
        setIsGameOver,
        setCurrentWeaponData
      }
    };

    // Add and start the scene with data
    // Parameters: key, sceneClass, autoStart, data
    game.scene.add('GameScene', GameScene, true, sceneData);
  };

  return { initPhaserGame };
}
