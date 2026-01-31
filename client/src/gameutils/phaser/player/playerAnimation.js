// Helper to get animation key based on prefix
import { animateWeaponAttack, getWeaponData } from '../../shared/items/weaponUtils';
import { getCurrentGameState } from '../../shared/game/gameState';

function getAnimKey(prefix, type, dir, hasDirectionalAnims) {
    if (prefix === 'player') {
        // Player formatting: 'stand-side', 'walk-down', 'actack-side'
        // 'actack' seems to be a typo in original assets but checks out with existing code
        const typeMap = { 'idle': 'stand', 'walk': 'walk', 'attack': 'actack' };
        const action = typeMap[type];

        if (dir === 'left' || dir === 'right') {
            return `${action}-side`;
        }
        return `${action}-${dir}`;
    } else if (prefix === 'slime_1' || prefix === 'main_1' || prefix === 'main_2' || prefix === 'main_3') {
        // Slime/Main formatting: 'slime_1-walk_down', 'main_1-idle_down'
        // Uses prefix + '_1' as the animation key base
        const keyPrefix = `${prefix}`;
        return `${keyPrefix}-${type}_${dir}`;
    }
    return '';
}

export function playIdle(player) {
    if (!player.directions) player.directions = ['right', 'down', 'left', 'up'];
    if (player.directionIndex === undefined || player.directionIndex === null) player.directionIndex = 0;

    const dir = player.directions[player.directionIndex];
    const prefix = player.animPrefix || 'player';
    const hasDirectionalAnims = player.hasDirectionalAnims || false;

    // Debug: Log direction to verify it's correct
    // console.log('playIdle - directionIndex:', player.directionIndex, 'direction:', dir, 'prefix:', prefix);

    try {
        if (prefix === 'player') {
            if (dir === 'left' || dir === 'right') {
                player.anims.play('stand-side', true);
                player.setFlipX(dir === 'left');
            } else {
                player.anims.play('stand-' + dir, true);
                player.setFlipX(false);
            }
        } else {
            // For non-player characters (e.g. Slime)
            // Try IDLE animation first
            const idleKey = getAnimKey(prefix, 'idle', dir);
            const walkKey = getAnimKey(prefix, 'walk', dir);

            if (player.scene && player.scene.anims && player.scene.anims.exists(idleKey)) {
                player.anims.play(idleKey, true);
            } else if (player.scene && player.scene.anims && player.scene.anims.exists(walkKey)) {
                player.anims.play(walkKey, true);
                console.warn(`Idle animation (${idleKey}) not found, falling back to walk (${walkKey})`);
            } else {
                console.warn(`Neither Idle (${idleKey}) nor Walk (${walkKey}) animation found.`);
            }

            player.setFlipX(false);
        }
    } catch (error) {
        console.warn(`Animation error for direction:`, dir, error);
    }
}



export function playAttack(player) {
    const dir = player.directions[player.directionIndex];
    const prefix = player.animPrefix || 'player';

    try {
        if (prefix === 'player') {
            if (dir === 'left' || dir === 'right') {
                player.anims.play('actack-side', true);
                player.setFlipX(dir === 'left');
            } else {
                player.anims.play('actack-' + dir, true);
                player.setFlipX(false);
            }
        } else {
            // Use standardized helper
            // Main/Slime: full prefix + '-attack_' + dir
            // Example: 'main_3-attack_down'
            // Example: 'slime_1-attack_down' (if prefix is slime_1)
            // But if prefix is 'slime', we need to check how it's set in playerSetup. 
            // Previous code assumed 'slime' -> 'slime_1'. 
            // But main_3 -> 'main_3_1' was the bug.

            // Logic:
            let animKey = '';
            if (prefix.startsWith('main_')) {
                animKey = `${prefix}-attack_${dir}`;
            } else {
                // Default fallback/Slime behavior to maintain existing logic if unsure
                // But generally getAnimKey logic is safer.
                animKey = getAnimKey(prefix, 'attack', dir);
                // getAnimKey returns: `${keyPrefix}-${type}_${dir}`.
                // For slime, if prefix is 'slime_1', getAnimKey returns 'slime_1-actack_dir'??
                // Wait, getAnimKey uses 'actack' for player but type argument 'attack'.
                // Line 20: return `${keyPrefix}-${type}_${dir}`;
            }

            // Let's rely on getAnimKey logic which I will fix/verify below
            // Actually, simply applying the logic directly here is cleaner for now to match user request style
            if (prefix === 'slime') {
                animKey = `slime_1-attack_${dir}`;
            } else {
                animKey = `${prefix}-attack_${dir}`;
            }

            if (player.scene && player.scene.anims && player.scene.anims.exists(animKey)) {
                player.anims.play(animKey, true);
            }
            player.setFlipX(false);
        }

        // --- NEW: Trigger Weapon Animation ---
        const state = getCurrentGameState();
        const weaponKey = (state && state.weaponKey) ? state.weaponKey : 'stick';
        const weaponData = getWeaponData(weaponKey);
        // Default to melee if invalid
        const type = weaponData ? weaponData.weaponType : 'melee';

        animateWeaponAttack(player.scene, type);

        // -------------------------------------

        player.once('animationcomplete', () => {
            playIdle(player);
        });
    } catch (error) {
        console.warn(`Attack animation not found for direction:`, dir);
    }
}

export function playWalk(player) {
    if (!player.directions) player.directions = ['right', 'down', 'left', 'up'];
    if (player.directionIndex === undefined || player.directionIndex === null) player.directionIndex = 0;

    const dir = player.directions[player.directionIndex];
    const prefix = player.animPrefix || 'player';

    // Debug: Log direction to verify it's correct
    // console.log('playWalk - directionIndex:', player.directionIndex, 'direction:', dir);

    try {
        if (prefix === 'player') {
            if (dir === 'left' || dir === 'right') {
                player.anims.play('walk-side', true);
                player.setFlipX(dir === 'left');
            } else {
                player.anims.play('walk-' + dir, true);
                player.setFlipX(false);
            }
        } else {
            // Main/Slime logic
            let animKey = '';
            if (prefix === 'slime') {
                animKey = `slime_1-walk_${dir}`;
            } else {
                animKey = `${prefix}-walk_${dir}`;
            }

            if (player.scene && player.scene.anims && player.scene.anims.exists(animKey)) {
                player.anims.play(animKey, true);
            }
            player.setFlipX(false);
        }
    } catch (error) {
        console.warn(`Walk animation not found for direction:`, dir, error);
    }
}
