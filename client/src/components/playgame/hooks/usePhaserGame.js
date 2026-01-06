/**
 * Hook for Phaser game initialization
 */

import Phaser from "phaser";
import {
  setCurrentScene,
  getCurrentGameState,
  setCurrentGameState,
  getWeaponData,
  displayPlayerWeapon
} from '../../../gameutils/utils/gameUtils';
import {
  drawLevel,
  setupObstacles,
  setupMonsters,
  setupCoins,
  setupPeople,
  setupTreasures,
  setupKnapsack,
  setupSubsetSum,
  setupCoinChange,
  setupAntDp,
  setupNQueen,
  setupTrainSchedule,
  setupRopePartition,
  setupEmeiMountain,
  drawPlayer,
  updateMonsters,
  clearGameOverScreen,
  drawCinematicMonster
} from '../../../gameutils/utils/phaserGame';
import { createCharacterAnims } from '../../../anims/PlayerAnims';
import { createVampireAnims } from '../../../anims/EnemyAnims';
import { preloadAllWeaponEffects } from '../../../gameutils/utils/combatSystem';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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

    class GameScene extends Phaser.Scene {
      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        const backgroundPath = currentLevel?.background_image;
        console.log('Loading background image from:', backgroundPath);
        console.log('Current level data:', currentLevel);

        // เพิ่ม error handler
        this.load.on('loaderror', (file) => {
          console.error('❌ Failed to load file:', file.key, 'from:', file.src);
          // ถ้าโหลดไม่สำเร็จ ให้ข้ามไป
          this.load.nextFile(file, true);
        });

        // เพิ่ม success handler
        this.load.on('filecomplete', (key) => {
          console.log('✅ File loaded successfully:', key);
        });

        if (backgroundPath) {
          this.load.image('bg', backgroundPath);
        } else {
          this.load.image('bg', '/default-background.png');
        }

        // ตรวจสอบว่าไฟล์มีอยู่จริงก่อนโหลด - ใช้ path ที่ถูกต้อง
        // Load player sprites
        this.load.atlas('player', '/characters/player.png', '/characters/player.json');

        // Load enemy sprites  
        this.load.atlas('vampire', '/enemies/vampire.png', '/enemies/vampire.json');

        this.load.image('weapon_stick', `${API_BASE_URL}/uploads/weapons/stick_idle_1.png`);

        // Load aura effects
        for (let i = 1; i <= 4; i++) {
          this.load.image(`aura_1_${i}`, `/aura/aura_1_${i}.png`);
        }
      }

      create() {
        console.log("Phaser scene create() called");

        // Create aura animation
        if (this.textures.exists('aura_1_1')) {
          this.anims.create({
            key: 'aura_1',
            frames: [
              { key: 'aura_1_1' },
              { key: 'aura_1_2' },
              { key: 'aura_1_3' },
              { key: 'aura_1_4' }
            ],
            frameRate: 8,
            repeat: -1
          });
          console.log("✅ Aura animation created");
        }
        console.log("Scene.add available:", !!this.add);
        console.log("Scene.add.graphics available:", !!this.add?.graphics);
        console.log("Scene.sys available:", !!this.sys);
        console.log("Scene.scene available:", !!this.scene);

        setCurrentScene(this);
        this.levelData = currentLevel;
        console.log('🔍 Level data assigned to scene:', {
          hasLevelData: !!this.levelData,
          hasKnapsackData: !!this.levelData?.knapsackData,
          knapsackData: this.levelData?.knapsackData
        });

        // Create animations
        createCharacterAnims(this.anims);
        createVampireAnims(this.anims);

        // Function to safely call setupGame with retry mechanism
        const safeSetupGame = (retryCount = 0, maxRetries = 20) => {
          // ตรวจสอบว่า scene ยังมีชีวิตอยู่
          if (!this || !this.scene || !this.sys) {
            console.error('❌ Scene has been destroyed or is invalid');
            return;
          }

          // ตรวจสอบ scene.add อีกครั้ง
          if (!this.add || !this.add.graphics || !this.add.sprite || !this.add.image) {
            if (retryCount < maxRetries) {
              console.warn(`Scene.add not ready for setupGame (attempt ${retryCount + 1}/${maxRetries}), retrying in 100ms...`);
              console.warn('this.add:', !!this.add);
              console.warn('this.add.graphics:', !!this.add?.graphics);
              console.warn('this.add.sprite:', !!this.add?.sprite);
              console.warn('this.add.image:', !!this.add?.image);
              setTimeout(() => {
                if (this && this.setupGame) {
                  safeSetupGame(retryCount + 1, maxRetries);
                }
              }, 100);
              return;
            } else {
              console.error('❌ Scene.add still not ready after max retries, cannot setup game');
              return;
            }
          }

          console.log('✅ Scene.add is ready, calling setupGame');
          console.log('Scene.add verification:', {
            add: !!this.add,
            graphics: !!this.add?.graphics,
            sprite: !!this.add?.sprite,
            image: !!this.add?.image,
            circle: !!this.add?.circle,
            rectangle: !!this.add?.rectangle
          });
          this.setupGame();
        };

        // ใช้ Phaser's time.delayedCall แทน setTimeout เพื่อให้แน่ใจว่า scene พร้อม
        // รอให้ scene พร้อมจริงๆ ก่อน setup
        this.time.delayedCall(200, () => {
          // Preload effects แล้วค่อยสร้างเกม
          if (this.load && this.load.list) {
            preloadAllWeaponEffects(this).then(() => {
              console.log("All weapon effects preloaded, setting up game...");
              safeSetupGame();
            }).catch((error) => {
              console.error("Error preloading weapon effects:", error);
              // ยังคง setup game แม้ว่าจะ preload ไม่สำเร็จ
              safeSetupGame();
            });
          } else {
            console.warn("Scene.load is not ready, skipping weapon effect preload");
            // รอสักครู่ก่อน setup game
            safeSetupGame();
          }
        });
      }

      setupGame() {
        // ตรวจสอบว่า scene ยังมีชีวิตอยู่
        if (!this || !this.scene || !this.sys) {
          console.error('❌ Scene has been destroyed or is invalid');
          return;
        }

        // ตรวจสอบว่า scene พร้อมก่อน setup
        if (!this.add) {
          console.error('❌ Scene.add is null, retrying setupGame in 200ms...');
          setTimeout(() => {
            if (this && this.setupGame) {
              this.setupGame();
            }
          }, 200);
          return;
        }

        if (!this.levelData) {
          console.error('❌ Level data is null, cannot setup game');
          return;
        }

        // ตรวจสอบเพิ่มเติมว่า scene.add มี methods ที่จำเป็น
        if (!this.add.graphics || !this.add.sprite || !this.add.image) {
          console.error('❌ Scene.add methods not ready, retrying setupGame in 200ms...');
          console.error('this.add:', this.add);
          console.error('this.add.graphics:', this.add?.graphics);
          console.error('this.add.sprite:', this.add?.sprite);
          console.error('this.add.image:', this.add?.image);
          setTimeout(() => {
            if (this && this.setupGame) {
              this.setupGame();
            }
          }, 200);
          return;
        }

        console.log('✅ Scene is ready, starting game setup');
        console.log('Scene.add verification:', {
          add: !!this.add,
          graphics: !!this.add?.graphics,
          sprite: !!this.add?.sprite,
          image: !!this.add?.image,
          circle: !!this.add?.circle,
          rectangle: !!this.add?.rectangle
        });

        try {
          // ตรวจสอบ scene.add อีกครั้งก่อนเรียกแต่ละ function
          if (!this || !this.add || !this.add.graphics || !this.add.sprite || !this.add.image) {
            console.error('❌ Scene.add not ready in try block, retrying...');
            console.error('this:', !!this);
            console.error('this.add:', !!this?.add);
            console.error('this.add.graphics:', !!this?.add?.graphics);
            setTimeout(() => {
              if (this && this.setupGame) {
                this.setupGame();
              }
            }, 200);
            return;
          }

          // ตรวจสอบอีกครั้งก่อนเรียก drawLevel
          if (!this.add || !this.add.graphics) {
            console.error('❌ Scene.add.graphics not ready before drawLevel, retrying...');
            setTimeout(() => {
              if (this && this.setupGame) {
                this.setupGame();
              }
            }, 200);
            return;
          }

          drawLevel(this);

          // ตรวจสอบอีกครั้งก่อน drawPlayer
          if (!this.add || !this.add.sprite || !this.add.triangle) {
            console.error('❌ Scene.add not ready for drawPlayer, retrying...');
            setTimeout(() => {
              if (this && this.setupGame) {
                this.setupGame();
              }
            }, 200);
            return;
          }


          drawPlayer(this);

          // ตรวจสอบอีกครั้งก่อน setupMonsters
          if (!this.add || !this.add.sprite || !this.add.circle || !this.add.rectangle) {
            console.error('❌ Scene.add not ready for setupMonsters, retrying...');
            setTimeout(() => {
              if (this && this.setupGame) {
                this.setupGame();
              }
            }, 200);
            return;
          }

          setupMonsters(this);
          drawCinematicMonster(this); // Added after setupMonsters to ensure it stays in the scene.monsters array
          setupObstacles(this);
          setupCoins(this);
          setupPeople(this);
          setupTreasures(this);
          setupKnapsack(this);
          setupSubsetSum(this);
          setupCoinChange(this);
          setupAntDp(this);
          setupNQueen(this);
          setupTrainSchedule(this);
          setupRopePartition(this);
          setupEmeiMountain(this);

          const currentState = getCurrentGameState();
          console.log("Current scene set in game state:", !!currentState.currentScene);

          // Display default weapon after setup
          if (currentState.levelData) {
            const defaultWeaponKey = currentState.levelData.defaultWeaponKey || "stick";
            const defaultWeaponData = getWeaponData(defaultWeaponKey);
            setCurrentWeaponData(defaultWeaponData);
            setCurrentGameState({
              weaponKey: defaultWeaponKey,
              weaponData: defaultWeaponData
            });

            // Wait a bit for scene to be fully ready before displaying weapon
            this.time.delayedCall(300, () => {
              if (this && this.add && this.player) {
                try {
                  displayPlayerWeapon(defaultWeaponKey, this);
                  console.log("✅ Default weapon displayed after setup");
                } catch (error) {
                  console.error("❌ Error displaying default weapon:", error);
                }
              }
            });
          }

          // Add keyboard input for restart
          if (this.input && this.input.keyboard) {
            this.input.keyboard.on('keydown-R', () => {
              if (getCurrentGameState().isGameOver) {
                handleRestartGame();
              }
            });
          }
        } catch (error) {
          console.error('❌ Error in setupGame:', error);
        }
      }

      update(time, delta) {
        const currentState = getCurrentGameState();
        if (currentState.isGameOver || currentState.goalReached) return;

        updateMonsters(this, delta, isRunning, setPlayerHp, setIsGameOver, setCurrentHint);
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 1200,
      height: 920,
      backgroundColor: "#222222",
      parent: gameRef.current,
      scene: GameScene,
      audio: {
        disableWebAudio: true
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER
      }
    };

    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
    }

    console.log("Creating Phaser game with config:", config);
    phaserGameRef.current = new Phaser.Game(config);
    console.log("Phaser game created:", phaserGameRef.current);
  };

  return { initPhaserGame };
}