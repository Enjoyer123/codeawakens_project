import Phaser from "phaser";
import { getWeaponData } from '../../entities/weaponUtils';
import { displayPlayerWeapon, displayPlayerEffect } from '../../combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState, setCurrentScene } from '../../shared/game';
import { drawLevel, setupObstacles } from '../../setup/levelRenderer';
import { setupMonsters } from '../../setup/monsterSetup';
import { setupCoins, setupPeople } from '../../setup/entitySetup';
import { drawPlayer, drawCinematicMonster } from '../../setup/playerSetup';
import { setupKnapsack } from '../../algo/setup/knapsackSetup';
import { setupSubsetSum } from '../../algo/setup/subsetSumSetup';
import { setupCoinChange } from '../../algo/setup/coinChangeSetup';
import { setupGoalUI } from '../../setup/uiManager';
import { updateMonsters } from '../../combat/enemyMovement';
// Removed Legacy Anims
import { createVampire_1Anims } from '../../../anims/Vampire_1Anims';
import { createSlime1Anims } from '../../../anims/Slime_1Anims';
import { createMain_1Anims } from '../../../anims/Main_1Anims';
import { createMain_2Anims } from '../../../anims/Main_2Anims';
import { createMain_3Anims } from '../../../anims/Main_3Anims';
import { createVampire_2Anims } from '../../../anims/Vampire_2Anims';
import { createVampire_3Anims } from '../../../anims/Vampire_3Anims';
import { preloadAllWeaponEffects } from '../../combat/combatPreload';

import { API_BASE_URL } from '../../../config/apiConfig';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = null; // Will be set via init data or directly
        this.externalHandlers = {
            handleRestartGame: null,
            isRunning: false,
            setPlayerHp: null,
            setIsGameOver: null,
            setCurrentHint: null,
            setCurrentWeaponData: null
        };
        // Use custom property to track currently rendered state
        this.renderedEffectsJson = "[]";
    }

    init(data) {
        if (data) {
            this.currentLevel = data.currentLevel;
            this.externalHandlers = {
                ...this.externalHandlers,
                ...data.handlers
            };
        }
    }

    preload() {
        const backgroundPath = this.currentLevel?.background_image;

        // Error handler
        this.load.on('loaderror', (file) => {
            console.error('❌ Failed to load file:', file.key, 'from:', file.src);
            this.load.nextFile(file, true);
        });



        if (backgroundPath) {
            this.load.image('bg', backgroundPath);
        } else {
            this.load.image('bg', '/default-background.png');
        }

        // Load sprites
        // Legacy 'player' and 'vampire' atlases removed
        // Only load V1/2/3 and Main1/2/3 + Slime
        this.load.atlas('Vampire_1', '/enemies/Vampire1.png', '/enemies/Vampire1.json');
        this.load.atlas('Vampire_2', '/enemies/Vampire2.png', '/enemies/Vampire2.json');
        this.load.atlas('Vampire_3', '/enemies/Vampire3.png', '/enemies/Vampire3.json');
        // Load Slime sprites (using slime_1 key to match animation configs)
        this.load.atlas('slime_1', '/characters/Slime1.png', '/characters/Slime1.json');
        // Load newly added Main_1 character
        this.load.atlas('main_1', '/characters/Main1.png', '/characters/Main1.json');
        // Load newly added Main_2 character
        this.load.atlas('main_2', '/characters/Main2.png', '/characters/Main2.json');
        // Load newly added Main_3 character
        this.load.atlas('main_3', '/characters/Main3.png', '/characters/Main3.json');

        // Load Org bots for Coin Change
        this.load.image('bot_slime1', '/bot/slime1.png');
        this.load.image('bot_humen1', '/bot/humen1.png');
        this.load.image('org1', '/bot/org1.png');
        this.load.image('org2', '/bot/org2.png');
        this.load.image('org3', '/bot/org3.png');

        // this.load.image('weapon_stick', `${API_BASE_URL}/uploads/weapons/stick_idle_1.png`);

        // Load bag object
        this.load.image('bag', '/object/bag.png');
        // Load crown items
        this.load.image('crown-1', '/object/crown-1.png');
        this.load.image('crown-2', '/object/crown-2.png');
        this.load.image('crown-3', '/object/crown-3.png');

        // Load miscellaneous
        this.load.image('board_bg', '/background.png');
        this.load.image('gun', '/object/gun.png');

        // Load aura effects
        for (let i = 1; i <= 8; i++) {
            this.load.image(`aura_1_${i}`, `/aura/aura_1_${i}.png`);
        }
        // Load aura_2 (13 frames)
        for (let i = 1; i <= 13; i++) {
            this.load.image(`aura_2_${i}`, `/aura/aura_2_${i}.png`);
        }

        // Load circle_1 (7 frames)
        for (let i = 1; i <= 7; i++) {
            this.load.image(`circle_1_${i}`, `/aura/circle_1_${i}.png`);
        }
        // Load circle_2 (9 frames)
        for (let i = 1; i <= 9; i++) {
            this.load.image(`circle_2_${i}`, `/aura/circle_2_${i}.png`);
        }
    }

    create() {


        // Create aura animation
        if (this.textures.exists('aura_1_1')) {
            this.anims.create({
                key: 'aura_1',
                frames: [
                    { key: 'aura_1_1' },
                    { key: 'aura_1_2' },
                    { key: 'aura_1_3' },
                    { key: 'aura_1_4' },
                    { key: 'aura_1_5' },
                    { key: 'aura_1_6' },
                    { key: 'aura_1_7' },
                    { key: 'aura_1_8' }
                ],
                frameRate: 8,
                repeat: -1
            });

        }

        // Create aura_2 animation
        if (this.textures.exists('aura_2_1')) {
            const frames = [];
            for (let i = 1; i <= 13; i++) {
                frames.push({ key: `aura_2_${i}` });
            }
            this.anims.create({
                key: 'aura_2',
                frames: frames,
                frameRate: 12,
                repeat: -1
            });

        }

        // Create circle_1 animation
        if (this.textures.exists('circle_1_1')) {
            const frames = [];
            for (let i = 1; i <= 7; i++) {
                frames.push({ key: `circle_1_${i}` });
            }
            this.anims.create({
                key: 'circle_1',
                frames: frames,
                frameRate: 10,
                repeat: -1
            });
        }

        // Create circle_2 animation
        if (this.textures.exists('circle_2_1')) {
            const frames = [];
            for (let i = 1; i <= 9; i++) {
                frames.push({ key: `circle_2_${i}` });
            }
            this.anims.create({
                key: 'circle_2',
                frames: frames,
                frameRate: 10,
                repeat: -1
            });
        }

        setCurrentScene(this);
        this.levelData = this.currentLevel;


        // Create animations
        // Legacy Animation Creators Removed
        // createCharacterAnims(this.anims);
        // createVampireAnims(this.anims);
        createVampire_1Anims(this.anims);
        createSlime1Anims(this.anims);
        createMain_1Anims(this.anims);
        createMain_2Anims(this.anims);
        createMain_3Anims(this.anims);
        createVampire_2Anims(this.anims);
        createVampire_3Anims(this.anims);



        // Helper for safe setup
        const safeSetupGame = (retryCount = 0, maxRetries = 20) => {
            if (!this || !this.scene || !this.sys) return;

            if (!this.add || !this.add.graphics || !this.add.sprite || !this.add.image) {
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        if (this && this.setupGame) safeSetupGame(retryCount + 1, maxRetries);
                    }, 100);
                    return;
                } else {
                    console.error('❌ Scene.add still not ready after max retries');
                    return;
                }
            }
            this.setupGame();
        };

        // Delay to ensure scene is ready
        this.time.delayedCall(200, () => {
            if (this.load && this.load.list) {
                preloadAllWeaponEffects(this).then(() => {

                    safeSetupGame();
                }).catch((error) => {
                    console.error("Error preloading weapon effects:", error);
                    safeSetupGame();
                });
            } else {
                safeSetupGame();
            }
        });

        // Keyboard input for restart
        if (this.input && this.input.keyboard) {
            this.input.keyboard.on('keydown-R', () => {
                if (getCurrentGameState().isGameOver && this.externalHandlers.handleRestartGame) {
                    this.externalHandlers.handleRestartGame();
                }
            });
        }
    }

    setupGame() {
        if (!this || !this.scene || !this.sys) return;
        if (!this.add || !this.levelData) {
            console.error('❌ Scene not ready or missing level data');
            return;
        }

        // Additional checks for add methods
        if (!this.add.graphics || !this.add.sprite || !this.add.image) {
            console.error('❌ Scene.add methods missing in setupGame');
            return;
        }



        try {
            drawLevel(this);
            drawPlayer(this);
            setupMonsters(this);
            drawCinematicMonster(this);
            setupObstacles(this);
            setupCoins(this);
            setupPeople(this);

            setupKnapsack(this);
            setupSubsetSum(this);
            setupCoinChange(this);

            // Setup new Goal UI for tracking items
            setupGoalUI(this);

            const currentState = getCurrentGameState();

            // Display default weapon
            if (this.levelData) {
                const defaultWeaponKey = this.levelData.defaultWeaponKey || "stick";
                const defaultWeaponData = getWeaponData(defaultWeaponKey);

                if (this.externalHandlers.setCurrentWeaponData) {
                    this.externalHandlers.setCurrentWeaponData(defaultWeaponData);
                }

                setCurrentGameState({
                    weaponKey: currentState.weaponKey || defaultWeaponKey,
                    weaponData: currentState.weaponData || defaultWeaponData,
                    activeEffects: currentState.activeEffects || [],
                    patternTypeId: currentState.patternTypeId || 0
                });

                // Clear renderedEffectsJson to force a re-sync on the first update()
                this.renderedEffectsJson = "[]";

                this.time.delayedCall(300, () => {
                    if (this && this.add && this.player) {
                        try {
                            displayPlayerWeapon(defaultWeaponKey, this);
                        } catch (error) { console.error("❌ Error displaying default weapon:", error); }
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

        // ⭐ Always update monster patrol/movement (even when game is paused)
        // This ensures enemies patrol around nodes in node-based levels
        updateMonsters(
            this,
            delta,
            this.externalHandlers.isRunning,
            this.externalHandlers.setPlayerHp,
            this.externalHandlers.setIsGameOver,
            this.externalHandlers.setCurrentHint
        );

        // State-driven Visual Effects sync
        this.syncEffectsWithState(currentState);
    }

    syncEffectsWithState(state) {
        if (!state.activeEffects) return;

        const effectsJson = JSON.stringify(state.activeEffects);
        if (this.renderedEffectsJson !== effectsJson) {
            // State has changed, update visuals!
            this.renderedEffectsJson = effectsJson;

            try {
                // Clear existing effects first
                displayPlayerEffect(null, this);

                // Draw new effects
                if (state.activeEffects.length > 0) {
                    state.activeEffects.forEach(effectKey => {
                        displayPlayerEffect(effectKey, this, true);
                    });
                }
            } catch (error) {
                console.error("❌ Error syncing effects with state:", error);
            }
        }
    }
}
