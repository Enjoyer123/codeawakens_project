import Phaser from "phaser";

const createMain_1Anims = (anims) => {
    const idleDown = anims.create({
        key: 'main_1-idle_down',
        frames: anims.generateFrameNames('main_1', {
            start: 0,
            end: 11,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'main_1-idle_up',
        frames: anims.generateFrameNames('main_1', {
            start: 12,
            end: 23,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'main_1-idle_left',
        frames: anims.generateFrameNames('main_1', {
            start: 24,
            end: 35,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'main_1-idle_right',
        frames: anims.generateFrameNames('main_1', {
            start: 36,
            end: 47,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'main_1-walk_down',
        frames: anims.generateFrameNames('main_1', {
            start: 48,
            end: 55,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'main_1-walk_up',
        frames: anims.generateFrameNames('main_1', {
            start: 56,
            end: 63,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'main_1-walk_left',
        frames: anims.generateFrameNames('main_1', {
            start: 64,
            end: 71,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'main_1-walk_right',
        frames: anims.generateFrameNames('main_1', {
            start: 72,
            end: 79,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'main_1-attack_down',
        frames: anims.generateFrameNames('main_1', {
            start: 80,
            end: 91,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-attack_up',
        frames: anims.generateFrameNames('main_1', {
            start: 92,
            end: 103,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-attack_left',
        frames: anims.generateFrameNames('main_1', {
            start: 104,
            end: 115,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-attack_right',
        frames: anims.generateFrameNames('main_1', {
            start: 116,
            end: 127,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-death_down',
        frames: anims.generateFrameNames('main_1', {
            start: 128,
            end: 136,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-death_up',
        frames: anims.generateFrameNames('main_1', {
            start: 137,
            end: 145,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-death_left',
        frames: anims.generateFrameNames('main_1', {
            start: 146,
            end: 154,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'main_1-death_right',
        frames: anims.generateFrameNames('main_1', {
            start: 155,
            end: 163,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
}

export { createMain_1Anims };
