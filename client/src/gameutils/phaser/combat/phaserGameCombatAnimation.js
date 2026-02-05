import Phaser from 'phaser';
import { showEffectWeaponFixed } from '../../shared/combat';
import { getCurrentGameState } from '../../shared/game';
import {
    createWeaponRing,
    animateWeaponAttack,
    getWeaponData
} from '../../shared/items/weaponUtils';
import { getPlayerWeaponSprite } from '../../shared/items/weaponUtils'; // Updated import path
export function playCombatSequence(scene, isWin, onComplete) {
    // Check condition: Only play if level has no nodes (OR if it falls back to cinematic mode like drawPlayer)
    const hasNodes = scene.levelData?.nodes && scene.levelData.nodes.length > 0;
    const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.startNodeId) : null;

    // Check for special game types that have nodes but are NOT graph traversal (so they SHOULD play combat)
    const gameType = (scene.levelData?.gameType || '').toLowerCase();
    const appliedType = (scene.levelData?.appliedData?.type || '').toUpperCase();

    const isSpecialVisualLevel =
        gameType.includes('rope') ||
        gameType.includes('train') ||
        appliedType.includes('ROPE') ||
        appliedType.includes('TRAIN');

    console.log('⚔️ playCombatSequence Check:', {
        hasNodes,
        hasStartNode: !!startNode,
        gameType: scene.levelData?.gameType,
        appliedType: scene.levelData?.appliedData?.type,
        isSpecial: isSpecialVisualLevel
    });

    // FORCE PLAY: Commenting out the skip logic to debug
    /*
    // If we have nodes AND a valid start node AND it's not a special visual level -> Skip combat (Standard Graph Level)
    if (hasNodes && startNode && !isSpecialVisualLevel) {
        console.log('⚠️ Skipping combat sequence: Standard Graph Walk Level');
        if (onComplete) onComplete();
        return;
    }
    */
    console.log('⚔️ [DEBUG-FORCE] Skip check bypassed. STARTING ANIMATION.');

    console.log('✅ execution proceeding (Cinematic Mode) for result:', isWin ? 'Win' : 'Loss');

    console.log('Starting combat sequence. Result:', isWin ? 'Win' : 'Loss');

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    const centerY = height - 100; // Match the "bottom-left" spawn height roughly

    // 1. Create Actors (Player Left, Monster Right)
    // 1. Hide/Destroy existing entities
    const existingPlayer = scene.player;
    if (existingPlayer) existingPlayer.setVisible(false);
    if (existingPlayer && existingPlayer.directionArrow) existingPlayer.directionArrow.setVisible(false);
    if (scene.playerArrow) scene.playerArrow.setVisible(false);

    // Hide Global Weapon Sprite if it exists
    const globalWeapon = getPlayerWeaponSprite();
    if (globalWeapon) {
        console.log('⚔️ Hiding global weapon sprite for cinematic');
        globalWeapon.setVisible(false);
    }

    // Hide regular monsters and DESTROY cinematic idle monsters
    if (scene.monsters) {
        // Iterate backwards to safely remove from array
        for (let i = scene.monsters.length - 1; i >= 0; i--) {
            const m = scene.monsters[i];
            if (m.isCinematic) {
                // It's the idle decoration monster we added in setup. 
                // Destroy it so we can spawn the fresh combat actor.
                if (m.sprite) m.sprite.destroy();
                if (m.glow) m.glow.destroy(); // Also destroy glow if it exists
                if (m.data && m.data.healthBar) m.data.healthBar.destroy();
                if (m.data && m.data.healthBarBg) m.data.healthBarBg.destroy();
                scene.monsters.splice(i, 1);
            } else if (m.sprite) {
                // Regular monster, just hide
                m.sprite.setVisible(false);
                if (m.glow) m.glow.setVisible(false);
                if (m.data && m.data.healthBar) m.data.healthBar.setVisible(false);
                if (m.data && m.data.healthBarBg) m.data.healthBarBg.setVisible(false);
            }
        }
    }

    // Hide coins/people/treasures/obstacles
    if (scene.coins) scene.coins.forEach(c => c.setVisible(false));


    // Spawn Cinematic Player
    // Spawn Cinematic Player
    const characterType = scene.levelData.character || 'main_1';
    let playerTexture = 'main_1';
    let animPrefix = 'main_1';
    let moveAnim = 'main_1-walk_right';
    let standAnim = 'main_1-idle_right';
    let attackAnim = 'main_1-attack_right';
    let deathAnim = 'main_1-death_right';

    if (characterType === 'slime') {
        playerTexture = 'slime_1';
        animPrefix = 'slime'; // Note: actual keys use slime_1 prefix often
        moveAnim = 'slime_1-walk_right';
        standAnim = 'slime_1-idle_right'; // Assuming idle exists now
        attackAnim = 'slime_1-attack_right';
        deathAnim = 'slime_1-death_right';
    } else if (characterType === 'main_1') {
        playerTexture = 'main_1';
        animPrefix = 'main_1';
        moveAnim = 'main_1-walk_right';
        standAnim = 'main_1-idle_right';
        attackAnim = 'main_1-attack_right';
        deathAnim = 'main_1-death_right';
    } else if (characterType === 'main_2') {
        playerTexture = 'main_2';
        animPrefix = 'main_2';
        moveAnim = 'main_2-walk_right';
        standAnim = 'main_2-idle_right';
        attackAnim = 'main_2-attack_right';
        deathAnim = 'main_2-death_right';
    } else if (characterType === 'main_3') {
        playerTexture = 'main_3';
        animPrefix = 'main_3';
        moveAnim = 'main_3-walk_right';
        standAnim = 'main_3-idle_right';
        attackAnim = 'main_3-attack_right';
        deathAnim = 'main_3-death_right';
    }

    const player = scene.add.sprite(100, centerY, playerTexture);
    // Store anim props for later use in this file
    player.customAnims = { move: moveAnim, stand: standAnim, attack: attackAnim, death: deathAnim };

    const scale = 2.2; // Restored to standard size for consistency
    player.setScale(scale);
    player.setData('defaultScale', scale);
    player.setDepth(100);
    // Ensure player has animation
    if (player.anims && scene.anims.exists(moveAnim)) {
        player.play(moveAnim);
    }

    // --- Cinematic Weapon Setup ---
    const weaponKey = getCurrentGameState().weaponKey || 'stick';
    const weaponData = getWeaponData(weaponKey);
    let weaponRing = null;

    if (weaponKey !== 'stick') {
        weaponRing = createWeaponRing(scene, player.x, player.y, weaponKey, {
            count: 6,
            radius: 45,
            scale: 0.4
        });
        if (weaponRing) {
            weaponRing.setDepth(101);
        }
    }

    const updateWeaponPos = () => {
        if (weaponRing && player) {
            weaponRing.setPosition(player.x, player.y);
        }
    };
    // Initial position sync
    updateWeaponPos();

    // Spawn Cinematic Monster
    // Determine texture and animation based on the first monster in levelData if available
    let textureKey = 'Vampire_1';
    // Use Left for all to ensure consistency with "Walk Left" being correct
    let idleAnim = 'vampire_1-idle_left';
    let walkAnim = 'vampire_1-walk_left';
    let monsterAttackAnim = 'vampire_1-attack-left';
    let monsterDeathAnim = 'vampire_1-death-left'; // Default

    if (scene.levelData.monsters && scene.levelData.monsters.length > 0) {
        const monsterData = scene.levelData.monsters[0];
        const monsterType = monsterData.type || 'vampire_1';

        if (monsterType === 'vampire_1') {
            textureKey = 'Vampire_1';
            idleAnim = 'vampire_1-idle_left';
            walkAnim = 'vampire_1-walk_left';
            monsterAttackAnim = 'vampire_1-attack-left';
            monsterDeathAnim = 'vampire_1-death-left';
        } else if (monsterType === 'vampire_2') {
            textureKey = 'Vampire_2';
            idleAnim = 'vampire_2-idle_left';
            walkAnim = 'vampire_2-walk_left';
            monsterAttackAnim = 'vampire_2-attack-left';
            monsterDeathAnim = 'vampire_2-death-left';
        } else if (monsterType === 'vampire_3') {
            textureKey = 'Vampire_3';
            idleAnim = 'vampire_3-idle_left';
            walkAnim = 'vampire_3-walk_left';
            monsterAttackAnim = 'vampire_3-attack-left';
            monsterDeathAnim = 'vampire_3-death-left';
        } else if (monsterType === 'slime_1') {
            textureKey = 'slime_1';
            idleAnim = 'slime_1-idle_left';
            walkAnim = 'slime_1-walk_left';
            monsterAttackAnim = 'slime_1-attack-left';
            monsterDeathAnim = 'slime_1-death-left'; // Slime might not have death-left? Check later, but standardizing naming is safe if key missing
        }
    }

    const monster = scene.add.sprite(width - 100, centerY, textureKey);
    monster.setScale(scale);
    monster.setData('defaultScale', scale);
    monster.setDepth(100);
    monster.setFlipX(false); // Force FALSE to ensure _left anims show as intended

    // Ensure monster has animation (Start with Idle)
    if (monster.anims && scene.anims.exists(idleAnim)) {
        monster.play(idleAnim);
    }

    // 2. Walk to Center
    // Move them closer so the attack lunge connects visually
    const centerLeft = width / 2 - 40;
    const centerRight = width / 2 + 40;

    let walksCompleted = 0;
    const checkWalksDone = () => {
        walksCompleted++;
        if (walksCompleted >= 2) {
            console.log('⚔️ Both actors reached center. Starting combat action...');
            // Stop walking, play idle briefly before attack?
            // Actually performCombatAction usually starts immediately.
            // But let's ensure we are facing correct way or idle if there's a delay.
            if (monster.anims && scene.anims.exists(idleAnim)) monster.play(idleAnim);

            performCombatAction(scene, player, monster, isWin, monsterAttackAnim, monsterDeathAnim, () => {
                // Cleanup wrapper
                if (weaponRing) weaponRing.destroy();
                if (onComplete) onComplete();
            }, weaponRing);
        }
    };

    scene.tweens.add({
        targets: player,
        x: centerLeft,
        duration: 1500,
        ease: 'Power1',
        onUpdate: updateWeaponPos, // Force weapon to follow player frame-by-frame
        onComplete: () => {
            console.log('⚔️ Player walk complete');
            if (player.anims && player.customAnims && scene.anims.exists(player.customAnims.stand)) {
                player.play(player.customAnims.stand);
            } else {
                player.setFrame(0);
            }
            updateWeaponPos(); // Final sync
            checkWalksDone();
        }
    });

    // Play walk animation for monster
    if (monster.anims && scene.anims.exists(walkAnim)) {
        monster.play(walkAnim);
    }

    scene.tweens.add({
        targets: monster,
        x: centerRight,
        duration: 1500,
        ease: 'Power1',
        onComplete: () => {
            console.log('⚔️ Monster walk complete');
            checkWalksDone();
        }
    });
}

// Add helper imports (Remove duplicates if any)

function performCombatAction(scene, player, monster, isWin, monsterAttackAnim, monsterDeathAnim, onComplete, weaponRing) {
    // FAILSAFE: Ensure onComplete runs even if animation logic crashes or hangs
    let completed = false;
    const safeComplete = () => {
        if (!completed) {
            completed = true;
            if (onComplete) onComplete();
        }
    };
    // Force complete after 5 seconds max (Combat shouldn't take longer than this)
    scene.time.delayedCall(5000, () => {
        if (!completed) {
            console.warn('⚠️ Combat animation timed out. Forcing completion.');
            safeComplete();
        }
    });

    // Small pause before attack
    scene.time.delayedCall(800, () => {
        console.log('⚔️ Combat Action Triggered for result:', isWin);

        try {
            if (isWin) {
                // --- PLAYER WINS ---
                // 1. Lunge Tween (Enhanced impact feel)
                scene.tweens.add({
                    targets: player,
                    x: player.x + 30, // Lunge towards monster
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2',
                    onYoyo: () => {
                        // HIT FRAME (Middle of lunge)

                        // 2. Player Attack Animation
                        const attackAnimKey = player.customAnims ? player.customAnims.attack : 'actack-side';
                        if (player.anims && scene.anims.exists(attackAnimKey)) {
                            player.play(attackAnimKey);
                        }

                        // 3. Trigger Weapon Ring Attack
                        const state = getCurrentGameState();
                        const weaponKey = (state && state.weaponKey) ? state.weaponKey : 'stick';
                        const wData = getWeaponData(weaponKey);
                        const wType = wData ? wData.weaponType : 'melee';

                        // Use the passed weaponRing container
                        if (weaponRing && weaponRing.active) {
                            animateWeaponAttack(scene, wType, weaponRing);
                        }

                        // 4. Show Damage Text
                        const dmgText = scene.add.text(monster.x, monster.y - 60, '-100', {
                            fontSize: '48px',
                            color: '#ffcc00',
                            fontStyle: 'bold',
                            stroke: '#000000',
                            strokeThickness: 6
                        }).setOrigin(0.5).setDepth(200);

                        scene.tweens.add({
                            targets: dmgText,
                            y: dmgText.y - 40,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => dmgText.destroy()
                        });

                        // 5. Impact Effect
                        try {
                            showEffectWeaponFixed({ sprite: monster }, 10, weaponKey, player);
                        } catch (e) { console.error('Error showing impact:', e); }

                        // 6. Monster Death Sequence
                        monster.setTint(0xff0000);
                        scene.cameras.main.shake(100, 0.01);

                        const onDeathDone = () => {
                            monster.destroy();
                            // Victory Jump
                            scene.tweens.add({
                                targets: player,
                                y: player.y - 50,
                                duration: 300,
                                yoyo: true,
                                repeat: 2,
                                onComplete: safeComplete
                            });
                        };

                        if (monster.anims && scene.anims.exists(monsterDeathAnim)) {
                            monster.play(monsterDeathAnim);
                            monster.once('animationcomplete', onDeathDone);
                        } else {
                            scene.tweens.add({
                                targets: monster,
                                alpha: 0,
                                scale: 0,
                                angle: 180,
                                duration: 500,
                                onComplete: onDeathDone
                            });
                        }
                    }
                });
            } else {
                // --- PLAYER LOSES ---
                const attackCount = 3;
                let currentAttack = 0;

                const performMonsterAttack = () => {
                    currentAttack++;

                    // Trigger Monster Animation
                    if (monster.anims && scene.anims.exists(monsterAttackAnim)) {
                        monster.play(monsterAttackAnim);
                    }

                    // Move toggle for visual impact
                    scene.tweens.add({
                        targets: monster,
                        x: monster.x - 40,
                        duration: 300,
                        yoyo: true,
                        onYoyo: () => {
                            // Hit Frame: No star impact, just tint
                            player.setTint(0xff0000);

                            // Shake camera slightly
                            scene.cameras.main.shake(100, 0.01);

                            if (currentAttack >= attackCount) {
                                scene.time.delayedCall(200, () => {
                                    const deathAnimKey = player.customAnims ? player.customAnims.death : 'die';
                                    if (player.anims && scene.anims.exists(deathAnimKey)) {
                                        player.play(deathAnimKey);
                                    } else {
                                        player.setAlpha(0.5);
                                        player.setAngle(90);
                                    }

                                    scene.tweens.add({
                                        targets: player,
                                        alpha: 0,
                                        duration: 800,
                                        delay: 500,
                                        onComplete: () => {
                                            player.destroy();
                                            scene.tweens.add({
                                                targets: monster,
                                                scaleX: 3,
                                                scaleY: 3,
                                                duration: 300,
                                                yoyo: true,
                                                repeat: 2,
                                                onComplete: safeComplete
                                            });
                                        }
                                    });
                                });
                            } else {
                                scene.time.delayedCall(300, () => {
                                    player.clearTint();
                                    performMonsterAttack();
                                });
                            }
                        }
                    });
                };
                performMonsterAttack();
            }
        } catch (err) {
            console.error('❌ Error in combat action:', err);
            safeComplete();
        }
    });
}
