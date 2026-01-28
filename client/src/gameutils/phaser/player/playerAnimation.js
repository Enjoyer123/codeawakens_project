// Helper to get animation key based on prefix
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
    } else if (prefix === 'slime') {
        // Slime formatting: 'slime_1-walk_down', 'slime_1-attack_down'
        // Note: Check Slime_1Anims.js for exact keys. Assuming 'slime_1' is the prefix in keys.
        // The asset key is 'slime_1' but prefix passed in setup is 'slime'
        // Let's use 'slime_1' as the animation key prefix.
        const keyPrefix = 'slime_1';
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
            // Slime: slime_1-attack_down
            const animKey = `${prefix}_1-attack_${dir}`;
            if (player.scene && player.scene.anims && player.scene.anims.exists(animKey)) {
                player.anims.play(animKey, true);
            }
            player.setFlipX(false);
        }

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
            // Slime: slime_1-walk_down
            const animKey = `${prefix}_1-walk_${dir}`;
            if (player.scene && player.scene.anims && player.scene.anims.exists(animKey)) {
                player.anims.play(animKey, true);
            }
            player.setFlipX(false);
        }
    } catch (error) {
        console.warn(`Walk animation not found for direction:`, dir, error);
    }
}
