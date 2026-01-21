export function playIdle(player) {
    // Ensure directions array exists
    if (!player.directions) {
        player.directions = ['right', 'down', 'left', 'up'];
    }
    
    // Ensure directionIndex is valid
    if (player.directionIndex === undefined || player.directionIndex === null) {
        player.directionIndex = 0;
    }
    
    const dir = player.directions[player.directionIndex];
    
    // Debug: Log direction to verify it's correct
    console.log('playIdle - directionIndex:', player.directionIndex, 'direction:', dir);
    
    try {
        if (dir === 'left' || dir === 'right') {
            player.anims.play('stand-side', true);
            player.setFlipX(dir === 'left');
        } else {
            player.anims.play('stand-' + dir, true);
            player.setFlipX(false);
        }
    } catch (error) {
        console.warn(`Animation not found for direction:`, dir, error);
        player.setFlipX(dir === 'left');
    }
}

export function playAttack(player) {
    const dir = player.directions[player.directionIndex];
    
    try {
        if (dir === 'left' || dir === 'right') {
            player.anims.play('actack-side', true);
            player.setFlipX(dir === 'left');
        } else {
            player.anims.play('actack-' + dir, true);
            player.setFlipX(false);
        }

        player.once('animationcomplete', () => {
            playIdle(player);
        });
    } catch (error) {
        console.warn(`Attack animation not found for direction:`, dir);
        player.setFlipX(dir === 'left');
    }
}

export function playWalk(player) {
    // Ensure directions array exists
    if (!player.directions) {
        player.directions = ['right', 'down', 'left', 'up'];
    }
    
    // Ensure directionIndex is valid
    if (player.directionIndex === undefined || player.directionIndex === null) {
        player.directionIndex = 0;
    }
    
    const dir = player.directions[player.directionIndex];
    
    // Debug: Log direction to verify it's correct
    console.log('playWalk - directionIndex:', player.directionIndex, 'direction:', dir);
    
    try {
        if (dir === 'left' || dir === 'right') {
            player.anims.play('walk-side', true);
            player.setFlipX(dir === 'left');
        } else {
            player.anims.play('walk-' + dir, true);
            player.setFlipX(false);
        }
    } catch (error) {
        console.warn(`Walk animation not found for direction:`, dir, error);
        player.setFlipX(dir === 'left');
    }
}
