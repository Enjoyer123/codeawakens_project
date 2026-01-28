import Phaser from "phaser";
import {

    getWeaponData,
    displayPlayerWeapon
} from '../../shared/items';
import { getCurrentGameState, setCurrentGameState, setCurrentScene } from '../../shared/game';
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
    drawCinematicMonster
} from '..';
import { createCharacterAnims } from '../../../anims/PlayerAnims';
import { createVampireAnims } from '../../../anims/EnemyAnims';
import { createVampire_1Anims } from '../../../anims/Vampire_1Anims';
import { createSlime1Anims } from '../../../anims/Slime_1Anims';
import { preloadAllWeaponEffects } from '../../shared/combat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
        console.log('Loading background image from:', backgroundPath);
        console.log('Current level data:', this.currentLevel);

        // Error handler
        this.load.on('loaderror', (file) => {
            console.error('❌ Failed to load file:', file.key, 'from:', file.src);
            this.load.nextFile(file, true);
        });

        // Success handler
        this.load.on('filecomplete', (key) => {
            console.log('✅ File loaded successfully:', key);
        });

        if (backgroundPath) {
            this.load.image('bg', backgroundPath);
        } else {
            this.load.image('bg', '/default-background.png');
        }

        // Load sprites
        this.load.atlas('player', '/characters/player.png', '/characters/player.json');
        this.load.atlas('vampire', '/enemies/vampire.png', '/enemies/vampire.json');
        this.load.atlas('Vampire_1', '/enemies/Vampire1.png', '/enemies/Vampire1.json');
        // Load Slime sprites (using slime_1 key to match animation configs)
        this.load.atlas('slime_1', '/characters/Slime1.png', '/characters/Slime1.json');

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

        setCurrentScene(this);
        this.levelData = this.currentLevel;
        console.log('🔍 Level data assigned to scene:', {
            hasLevelData: !!this.levelData,
            hasKnapsackData: !!this.levelData?.knapsackData,
            knapsackData: this.levelData?.knapsackData
        });

        // Create animations
        createCharacterAnims(this.anims);
        createVampireAnims(this.anims);
        createVampire_1Anims(this.anims);
        createSlime1Anims(this.anims);

        // Debug: Verify Slime animations
        const testKey = 'slime_1-walk_right';
        console.log(`🐛 Debug Animation Check: ${testKey} exists?`, this.anims.exists(testKey));
        if (this.anims.exists(testKey)) {
            const anim = this.anims.get(testKey);
            console.log(`🐛 Animation ${testKey} has ${anim.frames.length} frames.`);
        } else {
            console.error(`❌ Animation ${testKey} FAILED to create!`);
            // Check if texture exists
            console.log(`🐛 Texture 'slime_1' exists?`, this.textures.exists('slime_1'));
            if (this.textures.exists('slime_1')) {
                const frames = this.textures.get('slime_1').getFrameNames();
                console.log(`🐛 Texture 'slime_1' has ${frames.length} frames. First few:`, frames.slice(0, 10));
            }
        }

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
                    console.log("All weapon effects preloaded, setting up game...");
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

        console.log('✅ Scene is ready, starting game setup');

        try {
            drawLevel(this);
            drawPlayer(this);
            setupMonsters(this);
            drawCinematicMonster(this);
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

            // Display default weapon
            if (this.levelData) {
                const defaultWeaponKey = this.levelData.defaultWeaponKey || "stick";
                const defaultWeaponData = getWeaponData(defaultWeaponKey);

                if (this.externalHandlers.setCurrentWeaponData) {
                    this.externalHandlers.setCurrentWeaponData(defaultWeaponData);
                }

                setCurrentGameState({
                    weaponKey: defaultWeaponKey,
                    weaponData: defaultWeaponData
                });

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
    }
}
