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
  setCurrentHint,
  isRunning,
  handleRestartGame
}) {
  const initPhaserGame = () => {
    console.log("initPhaserGame called");
    console.log("gameRef.current:", !!gameRef.current);
    console.log("currentLevel:", !!currentLevel);
    console.log("phaserGameRef.current:", !!phaserGameRef.current);

    if (!gameRef.current || !currentLevel) {
      console.log("Early return - missing gameRef or currentLevel");
      return;
    }

    // Prevent creating multiple games
    if (phaserGameRef.current) {
      console.log("Phaser game already exists, destroying first...");
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
      backgroundColor: "#222222",
      parent: gameRef.current,
      // We don't define scene here, we add it manually to pass data
      scene: [],
      audio: {
        disableWebAudio: true
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER
      }
    };

    console.log("Creating Phaser game with config:", config);
    const game = new Phaser.Game(config);
    phaserGameRef.current = game;
    console.log("Phaser game created:", phaserGameRef.current);

    // Prepare data to pass to the scene
    const sceneData = {
      currentLevel: currentLevel,
      handlers: {
        handleRestartGame,
        isRunning,
        setPlayerHp,
        setIsGameOver,
        setCurrentHint,
        setCurrentWeaponData
      }
    };

    // Add and start the scene with data
    // Parameters: key, sceneClass, autoStart, data
    game.scene.add('GameScene', GameScene, true, sceneData);
  };

  return { initPhaserGame };
}