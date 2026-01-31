// Combat Death Effects
import * as Phaser from 'phaser';
import { checkImageExistsSafe } from '../assets/combatPreload';
import { animateTextureFrames } from './animationUtils';

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

/**
 * Loads and plays the monster death animation (dead_1...dead_7)
 * Returns a promise that resolves when animation completes.
 */
export function showMonsterDeathEffect(scene, x, y) {
    return new Promise(async (resolve) => {
        const frames = [];
        const texturePrefix = 'effect_dead';

        // Try to finding frames
        // Assumes assets are at /dead/dead_{i}.png
        for (let i = 1; i <= 7; i++) {
            const frameKey = `${texturePrefix}_${i}`;
            const url = `/dead/dead_${i}.png`; // Accessing public folder directly

            if (!scene.textures.exists(frameKey)) {
                // Load it if not exists
                // We can use the loader, but need to wait.
                // Ideally we preload this. But for now, load on demand.
                try {
                    const exists = await checkImageExistsSafe(url);
                    if (exists) {
                        await new Promise(r => {
                            scene.load.image(frameKey, url);
                            scene.load.once(`filecomplete-image-${frameKey}`, () => r());
                            scene.load.start();
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to check/load death frame ${i}`, e);
                }
            }

            if (scene.textures.exists(frameKey)) {
                frames.push(frameKey);
            }
        }

        if (frames.length === 0) {
            console.warn("No death frames found, using fallback explosion");
            createDeathExplosion(scene, x, y);
            resolve();
            return;
        }

        const effect = scene.add.image(x, y, frames[0]);
        effect.setDepth(30);
        effect.setScale(1.5); // Adjust scale as needed

        animateTextureFrames(scene, effect, frames, null);

        // Resolve after animation duration (approx 7 * 150ms)
        // animateTextureFrames internal duration is 150ms per frame
        const duration = frames.length * 150;

        scene.time.delayedCall(duration, () => {
            resolve();
        });
    });
}
