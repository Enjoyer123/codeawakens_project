// Combat Weapon Effects
import { getCurrentGameState } from '../gameUtils';
import { getPlayerWeaponSprite } from '../gameUtils';
import { checkImageExistsSafe } from './combatPreload';

/**
 * โจมตีศัตรู
 */
export function attackEnemy(enemy, damage, weaponKey) {
  const scene = getCurrentGameState().currentScene;
  if (!scene || !enemy.sprite) return false;

  const player = scene.player;
  if (!player) return false;

  const weaponSprite = getPlayerWeaponSprite();
  const currentWeaponKey = getCurrentGameState().weaponKey || 'stick';

  // ใช้ฟังก์ชันที่แก้ไขแล้ว
  showEffectWeaponFixed(enemy, damage, currentWeaponKey, weaponSprite);

  // ส่วนที่เหลือเหมือนเดิม
  enemy.data.hp = Math.max(0, (enemy.data.hp || 3) - damage);
  if (enemy.data.hp <= 0) {
    enemy.data.defeated = true;
    return true;
  }
  return false;
}

export function showEffectWeaponFixed(enemy, damage, weaponKey = 'stick', weaponSprite, effectType = '') {
  console.log(`🔍 showEffectWeaponFixed called with weaponKey: ${weaponKey}`);

  if (!weaponSprite) {
    console.warn("No weapon sprite, cannot show effect:", weaponKey);
    return;
  }

  const scene = getCurrentGameState().currentScene;
  if (!scene || !enemy?.sprite) return;

  const currentWeaponKey = getCurrentGameState().weaponKey || 'stick';
  const actualWeaponKey = weaponKey === currentWeaponKey ? weaponKey : currentWeaponKey;

  console.log("🎯 Effect path decision for weapon:", actualWeaponKey);

  const texturePrefix = `effect_${actualWeaponKey}${effectType ? `_${effectType}` : ''}`;
  const firstFrameKey = `${texturePrefix}-1`;
  console.log(`🔍 Checking first frame: ${firstFrameKey} - exists: ${scene.textures.exists(firstFrameKey)}`);

  if (!scene.textures.exists(firstFrameKey)) {
    console.log(`⚠️  No multi-frame textures found, using fallback`);
    showFallbackEffect(scene, weaponSprite);
    return;
  }

  console.log(`✅ Using MULTI-FRAME path`);

  // ใช้วิธีเก่า (multiple frames) ถ้ามี
  console.log(`Using legacy multi-frame effect for ${actualWeaponKey}`);
  const spawnEffect = () => {
    const validFrames = [];
    let consecutiveFailures = 0;

    for (let i = 1; i <= 10; i++) {
      const frameKey = `${texturePrefix}-${i}`;

      if (!scene.textures.exists(frameKey)) {
        break;
      }

      const texture = scene.textures.get(frameKey);
      const source = texture?.source[0];

      const isValid = source &&
        source.image &&
        source.image.complete &&
        source.image.naturalWidth > 0 &&
        source.image.naturalHeight > 0 &&
        source.width > 0 &&
        source.height > 0 &&
        source.isLoaded !== false;

      if (isValid) {
        validFrames.push(frameKey);
        consecutiveFailures = 0;
        console.log(`✓ Valid: ${frameKey} (${source.width}x${source.height})`);
      } else {
        consecutiveFailures++;
        if (consecutiveFailures >= 2) {
          break;
        }
      }
    }

    if (validFrames.length === 0) {
      console.warn("❌ No valid texture frames found, using fallback");
      showFallbackEffect(scene, weaponSprite);
      return;
    }

    createCanvasBasedEffect(scene, weaponSprite, validFrames, actualWeaponKey);
  };

  spawnEffect();
}

function createSingleSpriteEffect(scene, weaponSprite, textureKey) {
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

function loadSingleSpriteEffect(scene, weaponSprite, weaponKey) {
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

function createCanvasBasedEffect(scene, weaponSprite, validFrames, weaponKey) {
  console.log(`🔍 DEEP DEBUG: Creating texture effect for ${weaponKey}`);

  const offsetX = weaponSprite.width * weaponSprite.scaleX * 0.5 + 10;
  // shift down to compensate larger player scale
  const offsetY = 3;
  const firstFrameKey = validFrames[0];

  if (!scene.textures.exists(firstFrameKey)) {
    console.warn(`First frame ${firstFrameKey} doesn't exist, using fallback`);
    showFallbackEffect(scene, weaponSprite);
    return;
  }

  const texture = scene.textures.get(firstFrameKey);
  const source = texture.source[0];

  if (!source?.image?.complete || source.image.naturalWidth <= 0) {
    console.warn(`First frame texture not ready, using fallback`);
    showFallbackEffect(scene, weaponSprite);
    return;
  }

  // *** EXTREME PIXEL DEBUG ***
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.min(source.image.naturalWidth, 10);
    canvas.height = Math.min(source.image.naturalHeight, 10);

    ctx.drawImage(source.image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let colorCount = {};
    for (let i = 0; i < pixels.length; i += 4) {
      const rgba = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]},${pixels[i + 3]}`;
      colorCount[rgba] = (colorCount[rgba] || 0) + 1;
    }

    console.log(`🎨 PIXEL ANALYSIS:`, colorCount);

    const isAllBlack = Object.keys(colorCount).every(color =>
      color === '0,0,0,255' || color === '0,0,0,0'
    );

    if (isAllBlack) {
      console.error(`❌ TEXTURE IS ALL BLACK! Using fallback effect instead`);
      showFallbackEffect(scene, weaponSprite);
      return;
    }

    console.log(`✅ Pixel validation passed - texture has colors`);

  } catch (error) {
    console.error(`❌ Pixel validation failed:`, error);
    showFallbackEffect(scene, weaponSprite);
    return;
  }

  console.log(`✅ Using validated texture effect: ${firstFrameKey} (${source.width}x${source.height})`);

  // *** สร้าง effect แต่มี debug background ***
  const effect = scene.add.image(
    weaponSprite.x + offsetX,
    weaponSprite.y + offsetY,
    firstFrameKey
  );

  effect.setScale(0.5);
  effect.setDepth(weaponSprite.depth + 10); // เพิ่ม depth มากขึ้น
  effect.setAlpha(0);

  // *** เพิ่ม debug border ชัดๆ ***
  const debugBorder = scene.add.graphics();
  debugBorder.lineStyle(3, 0xFF0000, 1); // เส้นแดงชัดๆ
  debugBorder.strokeRect(
    effect.x - (effect.width * effect.scaleX) / 2 - 2,
    effect.y - (effect.height * effect.scaleY) / 2 - 2,
    effect.width * effect.scaleX + 4,
    effect.height * effect.scaleY + 4
  );
  debugBorder.setDepth(effect.depth + 1);

  console.log(`🔴 Debug border created at depth ${debugBorder.depth}`);
  console.log(`🖼️  Effect created at (${effect.x}, ${effect.y}) with depth ${effect.depth}`);

  // Immediate show (no delay)
  effect.setAlpha(1);

  console.log(`📊 RENDER STATE CHECK:`, {
    effectVisible: effect.visible,
    effectAlpha: effect.alpha,
    effectDepth: effect.depth,
    effectTexture: effect.texture?.key,
    sceneChildren: scene.children.length,
    rendererType: scene.renderer.type
  });

  // Force render update
  scene.sys.displayList.queueDepthSort();
  if (scene.renderer.gl) {
    scene.renderer.flush();
  }

  // Animate frames
  animateTextureFrames(scene, effect, validFrames, debugBorder);
}

function animateTextureFrames(scene, effect, validFrames, debugBorder = null) {
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

