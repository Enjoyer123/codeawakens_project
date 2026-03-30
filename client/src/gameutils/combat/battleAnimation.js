import Phaser from 'phaser';
import { getCurrentGameState } from '../shared/game/gameState';
import { getWeaponData } from '../entities/weaponUtils';
import {
    showEffectWeaponFixed,
    createWeaponRing,
    animateWeaponAttack,
    getPlayerWeaponSprite,
    getPlayerAuraSprite,
    getPlayerCircleSprite
} from './weaponEffects';
import { playSound } from '../sound/soundManager';

export function playCombatSequence(scene, isWin, onComplete) {
    // Check condition: Only play if level has no nodes (OR if it falls back to cinematic mode like drawPlayer)
    const hasNodes = scene.levelData?.nodes && scene.levelData.nodes.length > 0;
    const startNode = hasNodes ? scene.levelData.nodes.find(n => n.id === scene.levelData.start_node_id) : null;

    // If we have nodes AND a valid start node -> Skip combat (Standard Graph Level)
    if (hasNodes && startNode) {
        if (onComplete) onComplete();
        return;
    }



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

    // Hide coins/people/obstacles
    if (scene.coins) scene.coins.forEach(c => c.setVisible(false));


    // Spawn Cinematic Player
    const characterType = scene.levelData.character;

    const playerPrefix = characterType === 'main_1' ? 'main_1' : characterType;
    const playerTexture = playerPrefix;
    const moveAnim = `${playerPrefix}-walk_right`;
    const standAnim = `${playerPrefix}-idle_right`;
    const attackAnim = `${playerPrefix}-attack_right`;
    const deathAnim = `${playerPrefix}-death_right`;

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
        if (player) {
            // ⭐ Sync underlying player position so aura/circle effects follow properly
            if (scene.player) {
                scene.player.setPosition(player.x, player.y);
            }

            if (weaponRing) {
                weaponRing.setPosition(player.x, player.y);
            }

            // Sync Aura/Circle effects manually just in case
            const aura = getPlayerAuraSprite();
            if (aura && aura.active) {
                aura.setPosition(player.x, player.y);
            }

            const circle = getPlayerCircleSprite();
            if (circle && circle.active) {
                circle.setPosition(player.x, player.y);
            }
        }
    };
    // Initial position sync
    updateWeaponPos();

    // Spawn Cinematic Monster
    // Determine texture and animation based on the first monster in levelData if available
    let textureKey = 'Vampire_1';
    let monsterPrefix = 'vampire_1';

    const monsters = scene.levelData.map_entities?.filter(e => e.entity_type === 'MONSTER') || [];
    if (monsters.length > 0) {
        const monsterData = monsters[0];
        const monsterType = monsterData.type || 'vampire_1';
        monsterPrefix = monsterType;

        // Capitalize first letter for texture key (e.g. vampire_1 -> Vampire_1)
        if (monsterPrefix.startsWith('vampire_')) {
            textureKey = monsterPrefix.charAt(0).toUpperCase() + monsterPrefix.slice(1);
        } else {
            textureKey = monsterPrefix; // e.g. slime_1
        }
    }

    const idleAnim = `${monsterPrefix}-idle_left`;
    const walkAnim = `${monsterPrefix}-walk_left`;
    const monsterAttackAnim = `${monsterPrefix}-attack-left`;
    const monsterDeathAnim = `${monsterPrefix}-death-left`;

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
    // Force complete after 5 seconds max
    scene.time.delayedCall(5000, () => {
        if (!completed) {
            console.warn('⚠️ Combat animation timed out. Forcing completion.');
            safeComplete();
        }
    });

    // Small pause before attack
    scene.time.delayedCall(800, () => {

        try {
            if (isWin) {
                playVictorySequence(scene, player, monster, weaponRing, monsterDeathAnim, safeComplete);
            } else {
                playDefeatSequence(scene, player, monster, monsterAttackAnim, safeComplete);
            }
        } catch (err) {
            console.error('❌ Error in combat action:', err);
            safeComplete();
        }
    });
}

function playVictorySequence(scene, player, monster, weaponRing, monsterDeathAnim, onComplete) {
    // 1. Lunge Tween (Enhanced impact feel)
    scene.tweens.add({
        targets: player,
        x: player.x + 30, // Lunge towards monster
        duration: 200,
        yoyo: true,
        ease: 'Power2',
        onYoyo: () => {
            // 2. Play Weapon Specific Sound
            const state = getCurrentGameState();
            const weaponKey = (state && state.weaponKey) ? state.weaponKey : 'stick';
            const wData = getWeaponData(weaponKey);
            const wType = wData ? wData.weaponType : 'melee';

            const sfxKey = (weaponKey === 'stick')
                ? 'hit'
                : (wType === 'magic' ? 'weapon_magic' : 'weapon_melee');
            playSound(sfxKey);

            // 3. Player Attack Animation
            const attackAnimKey = player.customAnims ? player.customAnims.attack : 'actack-side';
            if (player.anims && scene.anims.exists(attackAnimKey)) {
                player.play(attackAnimKey);
            }

            // 4. Trigger Weapon Ring Attack
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
            scene.cameras.main.shake(200, 0.02);

            const onDeathDone = () => {
                monster.destroy();
                // Victory Jump
                scene.tweens.add({
                    targets: player,
                    y: player.y - 50,
                    duration: 300,
                    yoyo: true,
                    repeat: 2,
                    onComplete: onComplete
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
}

function playDefeatSequence(scene, player, monster, monsterAttackAnim, onComplete) {
    const attackCount = 3;
    let currentAttack = 0;

    const performMonsterAttack = () => {
        currentAttack++;

        if (monster.anims && scene.anims.exists(monsterAttackAnim)) {
            monster.play(monsterAttackAnim);
        }

        scene.tweens.add({
            targets: monster,
            x: monster.x - 40,
            duration: 300,
            yoyo: true,
            onYoyo: () => {
                playSound('hit');
                player.setTint(0xff0000);
                scene.cameras.main.shake(200, 0.02);
                scene.cameras.main.flash(100, 255, 0, 0);

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
                                    onComplete: onComplete
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
