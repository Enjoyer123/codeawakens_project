import Phaser from "phaser";
import { getWeaponData } from '../../entities/weaponUtils';
import { displayPlayerWeapon, displayPlayerEffect } from '../../combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState, setCurrentScene } from '../../shared/game/gameState';
import { drawLevel, setupObstacles } from '../../setup/levelRenderer';
import { setupMonsters } from '../../setup/monsterSetup';
import { setupCoins, setupPeople } from '../../setup/entitySetup';
import { drawPlayer, drawCinematicMonster } from '../../setup/playerSetup';
import { setupKnapsack } from '../../algo/setup/knapsackSetup';
import { setupSubsetSum } from '../../algo/setup/subsetSumSetup';
import { setupCoinChange } from '../../algo/setup/coinChangeSetup';

import { setupGoalUI } from '../../setup/uiManager';
import { updateMonsters } from '../../combat/enemyMovement';
import { detectAlgoType } from '../../shared/levelType';
// Removed Legacy Anims
import { createVampire_1Anims } from '../../../anims/Vampire_1Anims';
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
        this.currentLevel = null;
        this.externalHandlers = {
            isRunning: false,
            setPlayerHp: null,
            setIsGameOver: null,
            setCurrentWeaponData: null
        };
        this.renderedEffects = [];
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
            console.error('Failed to load file:', file.key, 'from:', file.src);
            this.load.nextFile(file, true);
        });

        if (backgroundPath) {
            this.load.image('bg', backgroundPath);
        } else {
            this.load.image('bg', '/Mapdefault.png');
        }

        // ─── Character Sprites (Load only what we need) ───
        const charKey = (this.currentLevel?.character === 'player' || !this.currentLevel?.character)
            ? 'main_1'
            : this.currentLevel?.character;

        if (charKey === 'main_1' || charKey === 'player') {
            this.load.atlas('main_1', '/characters/Main1.png', '/characters/Main1.json');
        } else if (charKey === 'main_2') {
            this.load.atlas('main_2', '/characters/Main2.png', '/characters/Main2.json');
        } else if (charKey === 'main_3') {
            this.load.atlas('main_3', '/characters/Main3.png', '/characters/Main3.json');
        }

        // ─── Monster Sprites (Load only what we need) ───
        const monsters = this.currentLevel?.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
        const monsterTypes = new Set(monsters.map(m => m.type || 'vampire_1'));
        // If there's no node and no start_node but it's an old legacy map, it might spawn cinematic monster. Let's add vampire_1 just in case, but usually we just load what's in map_entities.
        if (monsters.length === 0 && (!this.currentLevel?.nodes || this.currentLevel.nodes.length === 0)) {
            monsterTypes.add('vampire_1'); // Fallback for cinematic
        }

        if (monsterTypes.has('vampire_1')) {
            this.load.atlas('Vampire_1', '/enemies/Vampire1.png', '/enemies/Vampire1.json');
        }
        if (monsterTypes.has('vampire_2')) {
            this.load.atlas('Vampire_2', '/enemies/Vampire2.png', '/enemies/Vampire2.json');
        }
        if (monsterTypes.has('vampire_3')) {
            this.load.atlas('Vampire_3', '/enemies/Vampire3.png', '/enemies/Vampire3.json');
        }

        // Load Org bots for Coin Change
        this.load.image('bot_slime1', '/bot/slime1.png');
        this.load.image('bot_humen1', '/bot/humen1.png');
        this.load.image('org1', '/bot/org1.png');
        this.load.image('org2', '/bot/org2.png');
        this.load.image('org3', '/bot/org3.png');

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


        // Create animations (Only create if textures exist, save processing power)
        if (this.textures.exists('Vampire_1')) createVampire_1Anims(this.anims);
        if (this.textures.exists('Vampire_2')) createVampire_2Anims(this.anims);
        if (this.textures.exists('Vampire_3')) createVampire_3Anims(this.anims);

        if (this.textures.exists('main_1')) createMain_1Anims(this.anims);
        if (this.textures.exists('main_2')) createMain_2Anims(this.anims);
        if (this.textures.exists('main_3')) createMain_3Anims(this.anims);


        // Helper for safe setup (Cleaner Version)
        const safeSetupGame = () => {
            // เช็คว่าถ้า Scene ถูกปิดหรือทำลายทิ้งไประหว่างรอโหลด (เช่น ผู้เล่นกดออกด่านเร็ว)
            // ให้ล้มเลิกการตั้งค่าทันที ไม่ต้องวนลูปให้เปลือง Memory
            if (!this || !this.scene || !this.sys || !this.add || !this.sys.isActive() || !this.sys.displayList) {
                console.warn('Scene was destroyed or inactive. Aborting setup.');
                return;
            }
            this.setupGame();
        };

        // Initializing async loading for dynamic assets (Weapon Effects)
        const initDynamicAssets = async () => {
            if (this.load && this.load.list) {
                try {
                    await preloadAllWeaponEffects(this);
                } catch (error) {
                    console.error("Error preloading weapon effects:", error);
                }
            }
            // หลัง await กลับมา เช็คอีกทีว่า Scene ยังอยู่ไหม
            // (ผู้เล่นอาจกดออกด่านระหว่างรอโหลด)
            if (!this || !this.scene || !this.sys || !this.add || !this.sys.isActive() || !this.sys.displayList) {
                console.warn('Scene was destroyed during preload. Aborting setup.');
                return;
            }
            safeSetupGame();
        };

        initDynamicAssets();

    }

    setupGame() {
        try {
            drawLevel(this);
            drawPlayer(this);
            setupMonsters(this);
            drawCinematicMonster(this);
            setupObstacles(this);
            setupCoins(this);
            setupPeople(this);

            const algoType = detectAlgoType(this.levelData);
            if (algoType === 'KNAPSACK') {
                setupKnapsack(this);
            } else if (algoType === 'SUBSETSUM') {
                setupSubsetSum(this);
            } else if (algoType === 'COINCHANGE') {
                setupCoinChange(this);
            }


            // Setup new Goal UI for tracking items
            setupGoalUI(this);

            const currentState = getCurrentGameState();

            // Display weapon — respect pattern-matched weapon if already set
            if (this.levelData) {
                const defaultWeaponKey = this.levelData.defaultWeaponKey || "stick";
                const activeWeaponKey = currentState.weaponKey && currentState.patternTypeId
                    ? currentState.weaponKey
                    : defaultWeaponKey;
                const activeWeaponData = getWeaponData(activeWeaponKey);

                if (this.externalHandlers.setCurrentWeaponData) {
                    this.externalHandlers.setCurrentWeaponData(activeWeaponData);
                }

                setCurrentGameState({
                    weaponKey: activeWeaponKey,
                    weaponData: activeWeaponData,
                    activeEffects: currentState.activeEffects || [],
                    patternTypeId: currentState.patternTypeId || 0
                });

                // Clear renderedEffects to force a re-sync on the first update()
                this.renderedEffects = [];

                if (this && this.add && this.player) {
                    try {
                        displayPlayerWeapon(activeWeaponKey, this);
                    } catch (error) {
                        console.error("Error displaying weapon:", error);
                    }
                }
            }

        } catch (error) {
            console.error('Error in setupGame:', error);
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
            this.externalHandlers.isRunning
        );

        // State-driven Visual Effects sync
        this.syncEffectsWithState(currentState);
    }

    syncEffectsWithState(state) {
        if (!state.activeEffects || !Array.isArray(state.activeEffects)) return;

        // Efficient array comparison instead of JSON.stringify every frame (60fps)
        const isChanged =
            this.renderedEffects.length !== state.activeEffects.length ||
            this.renderedEffects.some((val, i) => val !== state.activeEffects[i]);

        if (isChanged) {
            // State has changed, update visuals!
            this.renderedEffects = [...state.activeEffects];

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
