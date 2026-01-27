import Phaser from "phaser";

const createVampire_1Anims = (anims) => {
    anims.create({
        key: 'vampire_1-idle_down',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 0,
            end: 3,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-idle_up',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 4,
            end: 7,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-idle_left',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 8,
            end: 11,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-idle_right',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 12,
            end: 15,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-walk_down',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 16,
            end: 21,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-walk_up',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 22,
            end: 27,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-walk_left',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 28,
            end: 33,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-walk_right',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 34,
            end: 39,
            suffix: '.png',
            zeroPad: 2
        }),
        repeat: -1,
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-attack-down',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 40,
            end: 51,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-attack-up',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 52,
            end: 63,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-attack-left',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 64,
            end: 75,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    })
    anims.create({
        key: 'vampire_1-attack-right',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 76,
            end: 87,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-death-down',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 88,
            end: 98,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-death-up',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 99,
            end: 109,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-death-left',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 110,
            end: 120,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    });
    anims.create({
        key: 'vampire_1-death-right',
        frames: anims.generateFrameNames('Vampire_1', {
            start: 121,
            end: 131,
            suffix: '.png',
            zeroPad: 2
        }),
        frameRate: 13
    });
}

export { createVampire_1Anims };
