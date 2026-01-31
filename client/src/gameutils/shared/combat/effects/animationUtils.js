// Combat Animation Utilities
import { checkImageExistsSafe } from '../assets/combatPreload';

export function createSingleSpriteEffect(scene, weaponSprite, textureKey) {
    console.log(`Creating single sprite effect: ${textureKey}`);

    const offsetX = weaponSprite.width * weaponSprite.scaleX * 0.5 + 10;
    // shift down to compensate larger player scale
    const offsetY = 3;

    // ตรวจสอบ texture
    if (!scene.textures.exists(textureKey)) {
        console.warn(`Single sprite texture ${textureKey} not found`);
        showFallbackEffect(scene, weaponSprite);
        return;
    }

    const texture = scene.textures.get(textureKey);
    const source = texture.source[0];

    if (!source?.image?.complete || source.image.naturalWidth <= 0) {
        console.warn(`Single sprite texture not ready`);
        showFallbackEffect(scene, weaponSprite);
        return;
    }

    console.log(`Single sprite validated: ${textureKey} (${source.width}x${source.height})`);

    // สร้าง effect sprite
    const effect = scene.add.image(
        weaponSprite.x + offsetX,
        weaponSprite.y + offsetY,
        textureKey
    );

    effect.setScale(0.5);
    effect.setDepth(weaponSprite.depth + 1);

    console.log(`Single sprite effect created`);

    // แทนที่จะเล่น frame animation ให้ใช้ tween animation
    scene.tweens.add({
        targets: effect,
        scaleX: { from: 0.3, to: 0.8 },
        scaleY: { from: 0.3, to: 0.8 },
        alpha: { from: 0.8, to: 0 },
        angle: { from: 0, to: 45 },
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
            effect.destroy();
            console.log(`Single sprite effect completed`);
        }
    });

    // เพิ่ม secondary animation
    scene.tweens.add({
        targets: effect,
        scaleX: { from: 0.5, to: 0.7 },
        scaleY: { from: 0.5, to: 0.7 },
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut'
    });
}

export function loadSingleSpriteEffect(scene, weaponSprite, weaponKey) {
    const textureKey = `effect_${weaponKey}`;
    const url = `/weapons_effect/${weaponKey}.png`;

    console.log(`Loading single sprite effect: ${textureKey} from ${url}`);

    // ตรวจสอบว่าไฟล์มีจริงหรือไม่ก่อนโหลด
    checkImageExistsSafe(url).then(exists => {
        if (exists) {
            scene.load.image(textureKey, url);

            scene.load.once('complete', () => {
                console.log(`Single sprite loaded: ${textureKey}`);
                // รอให้ texture พร้อมแล้วค่อยสร้าง effect
                scene.time.delayedCall(100, () => {
                    createSingleSpriteEffect(scene, weaponSprite, textureKey);
                });
            });

            scene.load.once('loaderror', (fileObj) => {
                console.error(`Failed to load single sprite:`, fileObj.key);
                showFallbackEffect(scene, weaponSprite);
            });

            scene.load.start();
        } else {
            console.warn(`Single sprite file ${url} not found, using fallback`);
            showFallbackEffect(scene, weaponSprite);
        }
    });
}

export function createCanvasBasedEffect(scene, posOrSprite, validFrames, weaponKey) {
    // console.log(`🔍 DEEP DEBUG: Creating texture effect for ${weaponKey}`);

    let x, y, depth, angle = 0;

    // Check if it's a Phaser GameObject (Sprite/Image) or a plain config object
    if (posOrSprite.scene) {
        // It's a sprite (Old behavior)
        const offsetX = posOrSprite.width * posOrSprite.scaleX * 0.5 + 10;
        const offsetY = 3;
        x = posOrSprite.x + offsetX;
        y = posOrSprite.y + offsetY;
        depth = posOrSprite.depth + 10;
    } else {
        // It's a config object {x, y, depth, angle}
        x = posOrSprite.x;
        y = posOrSprite.y;
        depth = posOrSprite.depth || 100;
        angle = posOrSprite.angle || 0;
    }

    const firstFrameKey = validFrames[0];

    if (!scene.textures.exists(firstFrameKey)) {
        // console.warn(`First frame ${firstFrameKey} doesn't exist`);
        // We can't use showFallbackEffect easily here without a sprite, so just return
        return;
    }

    // ... (skip pixel validation for speed/cleanliness in this patch) ...

    // *** สร้าง effect ***
    const effect = scene.add.image(x, y, firstFrameKey);
    // Use scale from config if available (for Circle aura etc), else default to 4.0
    const finalScale = posOrSprite.scale || 4.0;
    effect.setScale(finalScale);
    effect.setDepth(depth);
    effect.setRotation(angle); // Apply rotation if provided
    effect.setAlpha(0);

    // Debug border removed for cleanliness
    effect.setAlpha(1);

    // Animate frames
    animateTextureFrames(scene, effect, validFrames, null);

    // Add outward movement if it's a radial effect (inferred from config object)
    if (!posOrSprite.scene && posOrSprite.moveOutward) {
        const moveDistance = 40; // Expand by 40px
        const moveDuration = 300; // Fast burst

        // Calculate target based on rotation (angle)
        // Note: 'angle' passed in posOrSprite is in radians probably? No, Phaser uses degrees usually, but my math used radians.
        // In weaponEffects.js I passed: angle: angle + Math.PI/2.
        // Let's rely on the physics of the loop or passed props.
        // Actually, let's just use the 'angle' property from the config directly.

        // Wait, 'angle' in Phaser object is degrees vs radians.
        // In weaponEffects.js, I passed angle in Radians + PI/2?
        // Let's checking weaponEffects.js ...
        // I passed `angle: angle + Math.PI/2`. The `effect.setRotation(angle)` expects Radians.

        // The rotation of the effect is "facing outward". So we move forward in that direction?
        // Yes.

        const forwardAngle = effect.rotation - Math.PI / 2; // Adjust back to normal vector if sprite is rotated 90deg?
        // Actually, if I rotated it to point outward:
        // effect.rotation matches the vector (cos, sin).

        // Let's assume effect.rotation IS the direction.

        const targetX = x + Math.cos(effect.rotation - Math.PI / 2) * moveDistance;
        const targetY = y + Math.sin(effect.rotation - Math.PI / 2) * moveDistance;

        scene.tweens.add({
            targets: effect,
            x: targetX,
            y: targetY,
            duration: moveDuration,
            ease: 'Cubic.out'
        });
    }
}



export function animateTextureFrames(scene, effect, validFrames, debugBorder = null) {
    let frameIndex = 0;

    const nextFrame = () => {
        if (frameIndex < validFrames.length && effect && effect.active) {
            const frameKey = validFrames[frameIndex];

            if (scene.textures.exists(frameKey)) {
                const texture = scene.textures.get(frameKey);
                const source = texture.source[0];

                if (source?.image?.complete && source.image.naturalWidth > 0) {
                    effect.setTexture(frameKey);
                    console.log(`Frame ${frameIndex + 1}/${validFrames.length}: ${frameKey}`);

                    // Force render update after texture change
                    scene.sys.displayList.queueDepthSort();
                    if (scene.renderer.gl) {
                        scene.renderer.flush();
                    }
                } else {
                    console.warn(`Frame ${frameKey} became invalid, stopping`);
                    if (effect.active) effect.destroy();
                    if (debugBorder?.active) debugBorder.destroy();
                    return;
                }
            } else {
                console.warn(`Frame ${frameKey} no longer exists, stopping`);
                if (effect.active) effect.destroy();
                if (debugBorder?.active) debugBorder.destroy();
                return;
            }

            frameIndex++;

            if (frameIndex < validFrames.length) {
                scene.time.delayedCall(150, nextFrame); // เพิ่มเวลา frame duration
            } else {
                console.log(`Texture animation completed`);
                // Fade out
                scene.tweens.add({
                    targets: [effect, debugBorder].filter(Boolean),
                    alpha: { from: 1, to: 0 },
                    duration: 200,
                    onComplete: () => {
                        if (effect?.active) effect.destroy();
                        if (debugBorder?.active) debugBorder.destroy();
                        console.log(`Texture effect destroyed with fade out`);
                    }
                });
            }
        }
    };

    nextFrame();
}

export function showFallbackEffect(scene, weaponSprite) {
    console.log("Creating fallback effect");

    const offsetX = weaponSprite.width * weaponSprite.scaleX * 0.5 + 10;
    // shift down a few pixels to align with scaled player
    const offsetY = 3;

    // สร้าง effect ด้วย graphics แทน
    const effect = scene.add.graphics();
    effect.setPosition(weaponSprite.x + offsetX, weaponSprite.y + offsetY);
    effect.setDepth(weaponSprite.depth + 1);

    // วาด effect pattern
    effect.fillStyle(0xFFD700, 0.9); // สีทอง
    effect.fillCircle(0, 0, 20);

    effect.fillStyle(0xFFFFFF, 0.7); // สีขาว
    effect.fillCircle(0, 0, 15);

    effect.fillStyle(0xFFD700, 1); // สีทองตรงกลาง
    effect.fillCircle(0, 0, 8);

    // Animation
    scene.tweens.add({
        targets: effect,
        scaleX: { from: 0.3, to: 1.5 },
        scaleY: { from: 0.3, to: 1.5 },
        alpha: { from: 1, to: 0 },
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
            effect.destroy();
            console.log("Fallback effect completed");
        }
    });
}
