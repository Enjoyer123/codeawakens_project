import Phaser from 'phaser';

/**
 * Plays a cinematic combat sequence at the end of the level.
 * Only plays if the level has no nodes (Player on left, Monster on right).
 * 
 * @param {Phaser.Scene} scene - The current Phaser scene
 * @param {boolean} isWin - True if the player won (Player kills Monster), False if lost (Monster kills Player)
 * @param {Function} onComplete - Callback to run after animation (show Victory/GameOver)
 */
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
    const characterType = scene.levelData.character || 'player';
    let playerTexture = 'player';
    let animPrefix = 'player';
    let moveAnim = 'walk-side';
    let standAnim = 'stand-side';
    let attackAnim = 'actack-side';
    let deathAnim = 'die';

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
    const weaponTexture = `weapon_${weaponKey}`;
    let weaponSprite = null;

    if (scene.textures.exists(weaponTexture)) {
        weaponSprite = scene.add.image(player.x, player.y, weaponTexture);
        weaponSprite.setScale(1.5); // Maintain weapon scale
        weaponSprite.setDepth(101); // In front of player
    } else {
        console.warn(`⚠️ Cinematic weapon texture '${weaponTexture}' missing.`);
    }

    const updateWeaponPos = () => {
        if (weaponSprite && player) {
            // Adjusted offset for "holding" the weapon (was +10, +20)
            weaponSprite.setPosition(player.x + 5, player.y + 15);
        }
    };
    // Initial position sync
    updateWeaponPos();

    // Spawn Cinematic Monster
    // Determine texture and animation based on the first monster in levelData if available
    let textureKey = 'vampire';
    let idleAnim = 'vampire-idle';
    let monsterAttackAnim = 'vampire-attack'; // Default

    if (scene.levelData.monsters && scene.levelData.monsters.length > 0) {
        const monsterData = scene.levelData.monsters[0];
        const monsterType = monsterData.type || 'enemy';

        if (monsterType === 'vampire_1') {
            textureKey = 'Vampire_1';
            idleAnim = 'vampire_1-idle_down';
            monsterAttackAnim = 'vampire_1-attack-down';
        } else if (monsterType === 'enemy') {
            textureKey = 'vampire';
            idleAnim = 'vampire-idle';
            monsterAttackAnim = 'vampire-attack';
        } else if (monsterType === 'vampire_2') {
            textureKey = 'Vampire_2';
            idleAnim = 'vampire_2-idle_down';
            monsterAttackAnim = 'vampire_2-attack-down';
        }
    }

    const monster = scene.add.sprite(width - 100, centerY, textureKey);
    monster.setScale(scale);
    monster.setData('defaultScale', scale);
    monster.setDepth(100);
    monster.setFlipX(true); // Face left
    // Ensure monster has animation
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
            performCombatAction(scene, player, monster, isWin, monsterAttackAnim, () => {
                // Cleanup wrapper
                if (weaponSprite) weaponSprite.destroy();
                if (onComplete) onComplete();
            });
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

// Add helper imports
import { showEffectWeaponFixed } from '../../shared/combat';
import { getCurrentGameState } from '../../shared/game';
import { getPlayerWeaponSprite } from '../../shared/items'; // Helper to get the original weapon sprite

function performCombatAction(scene, player, monster, isWin, monsterAttackAnim, onComplete) {
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
                // 1. Player Attack Animation
                const attackAnimKey = player.customAnims ? player.customAnims.attack : 'actack-side';

                // DEBUG: Add visual marker for animation status
                const exists = scene.anims.exists(attackAnimKey);
                console.log(`⚔️ Playing attack: ${attackAnimKey}, Exists: ${exists}`);

                // Remove previous debug text if any
                if (player.debugText) player.debugText.destroy();

                player.debugText = scene.add.text(player.x, player.y - 120, `Anim: ${attackAnimKey}\nExist: ${exists}`, {
                    fontSize: '16px',
                    fill: exists ? '#00ff00' : '#ff0000',
                    backgroundColor: '#000000'
                }).setOrigin(0.5).setDepth(300);
                scene.tweens.add({ targets: player.debugText, alpha: 0, delay: 2000, duration: 500 });


                if (player.anims && exists) {
                    player.anims.stop(); // Force stop
                    player.setFlipX(false); // Force direction
                    player.play(attackAnimKey); // Force play (removed true to allow restart)
                } else {
                    // Fallback: visual hop
                    console.warn(`⚠️ Attack animation ${attackAnimKey} missing. Using fallback.`);
                    player.setY(player.y - 10);
                    scene.time.delayedCall(200, () => player.setY(player.y + 10));
                }

                // 2. Create Projectile & Impact Logic
                const state = getCurrentGameState();
                const weaponKey = (state && state.weaponKey) ? state.weaponKey : 'stick';
                const projectileTexture = `weapon_${weaponKey}`;

                // Common Impact & Death Sequence
                const triggerImpactAndDeath = () => {
                    // 4. Impact Effect
                    const mockEnemy = { sprite: monster };
                    try {
                        showEffectWeaponFixed(mockEnemy, 10, weaponKey, player);
                    } catch (e) { /* ignore */ }

                    // 5. Monster Reaction (Die)
                    monster.setTint(0xff0000);

                    // Die tween
                    scene.tweens.add({
                        targets: monster,
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        angle: 180,
                        duration: 500,
                        ease: 'Back.in',
                        onComplete: () => {
                            monster.destroy();
                            // Victory Jump
                            scene.tweens.add({
                                targets: player,
                                y: player.y - 50,
                                duration: 300,
                                yoyo: true,
                                repeat: 2,
                                onComplete: () => {
                                    if (player.anims && player.customAnims && scene.anims.exists(player.customAnims.stand)) {
                                        player.play(player.customAnims.stand);
                                    }
                                    safeComplete();
                                }
                            });
                        }
                    });
                };

                // Check if texture exists
                const texture = scene.textures.exists(projectileTexture) ? projectileTexture : null;

                if (texture) {
                    // Has texture: Show projectile flying
                    const effect = scene.add.image(player.x, player.y, texture);
                    effect.setScale(0.5);
                    effect.setDepth(200);

                    scene.tweens.add({
                        targets: effect,
                        x: monster.x,
                        y: monster.y,
                        duration: 400,
                        onComplete: () => {
                            effect.destroy();
                            triggerImpactAndDeath();
                        }
                    });
                } else {
                    // No texture: Just skip to impact after a short delay (sync with attack anim)
                    // No star fallback anymore as requested
                    scene.time.delayedCall(400, triggerImpactAndDeath);
                }
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
