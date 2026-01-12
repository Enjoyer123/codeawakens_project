// Combat Death Effects
import * as Phaser from 'phaser';

/**
 * สร้างเอฟเฟกต์ระเบิด
 */
export function createDeathExplosion(scene, x, y) {
    const colors = [0xff0000, 0xffa500, 0xffff00];

    for (let i = 0; i < 8; i++) {
        const particle = scene.add.circle(x, y, 5, Phaser.Utils.Array.GetRandom(colors));
        particle.setDepth(25);

        const angle = (i / 8) * Math.PI * 2;
        const distance = Phaser.Math.Between(30, 60);

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 600,
            onComplete: () => particle.destroy()
        });
    }
}
