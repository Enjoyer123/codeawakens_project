import Phaser from "phaser";

const createSlime1Anims = (anims) => {
    const idleDown = anims.create({
        key: 'slime_1-idle_down',
        frames: anims.generateFrameNames('slime_1', {
            start: 0,
            end: 5,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'slime_1-idle_up',
        frames: anims.generateFrameNames('slime_1', {
            start: 6,
            end: 11,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'slime_1-idle_left',
        frames: anims.generateFrameNames('slime_1', {
            start: 12,
            end: 17,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'slime_1-idle_right',
        frames: anims.generateFrameNames('slime_1', {
            start: 18,
            end: 23,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'slime_1-walk_down',
        frames: anims.generateFrameNames('slime_1', {
            start: 24,
            end: 31,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-walk_up',
        frames: anims.generateFrameNames('slime_1', {
            start: 32,
            end: 39,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-walk_left',
        frames: anims.generateFrameNames('slime_1', {
            start: 40,
            end: 47,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-walk_right',
        frames: anims.generateFrameNames('slime_1', {
            start: 48,
            end: 55,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-attack_down',
        frames: anims.generateFrameNames('slime_1', {
            start: 56,
            end: 65,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-attack_up',
        frames: anims.generateFrameNames('slime_1', {
            start: 66,
            end: 75,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-attack_left',
        frames: anims.generateFrameNames('slime_1', {
            start: 76,
            end: 85,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-attack_right',
        frames: anims.generateFrameNames('slime_1', {
            start: 86,
            end: 95,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-death_down',
        frames: anims.generateFrameNames('slime_1', {
            start: 96,
            end: 105,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-death_up',
        frames: anims.generateFrameNames('slime_1', {
            start: 106,
            end: 115,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-death_left',
        frames: anims.generateFrameNames('slime_1', {
            start: 116,
            end: 125,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'slime_1-death_right',
        frames: anims.generateFrameNames('slime_1', {
            start: 126,
            end: 135,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
}

export { createSlime1Anims };
