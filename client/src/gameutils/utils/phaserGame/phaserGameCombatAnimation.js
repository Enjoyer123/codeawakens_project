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
    const player = scene.add.sprite(100, centerY, 'player');
    const scale = 1.8; // Restored to standard size for consistency
    player.setScale(scale);
    player.setData('defaultScale', scale);
    player.setDepth(100);
    // Ensure player has animation
    if (player.anims && scene.anims.exists('walk-side')) {
        player.play('walk-side');
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
    const monster = scene.add.sprite(width - 100, centerY, 'vampire');
    monster.setScale(scale);
    monster.setData('defaultScale', scale);
    monster.setDepth(100);
    monster.setFlipX(true); // Face left
    // Ensure monster has animation (assuming 'vampire-idle' exists, maybe no walk anim yet)
    if (monster.anims && scene.anims.exists('vampire-idle')) {
        monster.play('vampire-idle');
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
            performCombatAction(scene, player, monster, isWin, () => {
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
            if (player.anims && scene.anims.exists('stand-side')) {
                player.play('stand-side');
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
import { showEffectWeaponFixed } from '../combat/combatEffects';
import { getCurrentGameState } from '../gameUtils';
import { getPlayerWeaponSprite } from '../gameUtils'; // Helper to get the original weapon sprite

function performCombatAction(scene, player, monster, isWin, onComplete) {
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
                const attackAnimKey = 'actack-side';
                if (player.anims && scene.anims.exists(attackAnimKey)) {
                    player.play(attackAnimKey);
                } else {
                    // Fallback: visual hop
                    player.setY(player.y - 10);
                    scene.time.delayedCall(200, () => player.setY(player.y + 10));
                }

                // 2. Create Projectile
                const state = getCurrentGameState();
                const weaponKey = (state && state.weaponKey) ? state.weaponKey : 'stick';
                const projectileTexture = `weapon_${weaponKey}`;

                // Check if texture exists, else fallback
                let texture = scene.textures.exists(projectileTexture) ? projectileTexture : 'weapon_stick';
                if (!scene.textures.exists(texture)) texture = null;

                let effect;
                if (texture) {
                    effect = scene.add.image(player.x, player.y, texture);
                    effect.setScale(0.5);
                } else {
                    effect = scene.add.star(player.x, player.y, 5, 10, 20, 0xffffff);
                }
                effect.setDepth(200);

                // 3. Projectile Move Tween
                scene.tweens.add({
                    targets: effect,
                    x: monster.x,
                    y: monster.y,
                    duration: 400,
                    onComplete: () => {
                        effect.destroy();

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
                                        if (player.anims && scene.anims.exists('stand-side')) {
                                            player.play('stand-side');
                                        }
                                        safeComplete();
                                    }
                                });
                            }
                        });
                    }
                });

            } else {
                // --- PLAYER LOSES ---
                const attackCount = 3;
                let currentAttack = 0;

                const performMonsterAttack = () => {
                    currentAttack++;
                    scene.tweens.add({
                        targets: monster,
                        x: monster.x - 40,
                        duration: 100,
                        yoyo: true,
                        onYoyo: () => {
                            createImpactEffect(scene, player.x, player.y);
                            player.setTint(0xff0000);

                            if (currentAttack >= attackCount) {
                                scene.time.delayedCall(200, () => {
                                    if (player.anims && scene.anims.exists('die')) {
                                        player.play('die');
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

function createImpactEffect(scene, x, y) {
    const star = scene.add.star(x, y, 5, 20, 40, 0xffff00);
    star.setDepth(200);
    scene.tweens.add({
        targets: star,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        rotation: 1,
        duration: 200,
        onComplete: () => star.destroy()
    });

    // Camera shake for impact
    scene.cameras.main.shake(100, 0.01);
}
