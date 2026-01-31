// Combat Weapon Effects Preload
import { API_BASE_URL } from '../../../../config/apiConfig';

export async function preloadAllWeaponEffects(scene) {
  // ตรวจสอบว่า scene มีอยู่จริง
  if (!scene || !scene.load) {
    console.warn('Scene or scene.load is null, cannot preload weapon effects');
    return 0;
  }

  const weaponsToPreload = [
    'stick', 'sword', 'golden_sword', 'bow', 'crossbow',
    'axe', 'hammer', 'dagger', 'spear', 'staff', 'magic_sword'
  ];

  console.log('Starting to preload all weapon effects...');

  const promises = weaponsToPreload.map(weapon => {
    return preloadWeaponEffectSafe(scene, weapon);
  });

  try {
    const results = await Promise.all(promises);
    const total = results.reduce((sum, count) => sum + count, 0);
    console.log(`Preloaded ${total} weapon effect frames total`);
    return total;
  } catch (error) {
    console.error('Error preloading weapon effects:', error);
    return 0;
  }
}

export async function preloadWeaponEffectSafe(scene, weaponKey, effectType = '') {
  console.log(`Safely preloading effect for weapon: ${weaponKey}${effectType ? ` (${effectType})` : ''}`);

  // ตรวจสอบว่า scene และ scene.load มีอยู่จริง
  if (!scene) {
    console.warn('Scene is null, cannot preload weapon effects');
    return 0;
  }

  if (!scene.load) {
    console.warn('Scene.load is null, cannot preload weapon effects');
    return 0;
  }

  const texturePrefix = `effect_${weaponKey}${effectType ? `_${effectType}` : ''}`;
  const framesToLoad = [];

  // ใช้รูปแบบใหม่: {weaponkey}_attack_frame.png
  const typeFile = effectType || 'attack'; // default เป็น 'attack' สำหรับ effect
  // const API_BASE_URL = ... (Removed)

  // ตรวจสอบไฟล์ที่มีจริง
  // 1. Check for Single File first (e.g. sword.png)
  const singleFileUrl = `${API_BASE_URL}/uploads/weapons_effect/${weaponKey}.png`;
  const singleFileKey = texturePrefix; // effect_sword

  if (scene.textures && !scene.textures.exists(singleFileKey)) {
    const exists = await checkImageExistsSafe(singleFileUrl);
    if (exists) {
      framesToLoad.push({ key: singleFileKey, url: singleFileUrl });
      console.log(`Found single effect file: ${singleFileUrl}`);
    }
  }

  // 2. Check for Multi-Frame sequence (e.g. sword_attack_1.png)
  for (let i = 1; i <= 20; i++) { // เพิ่มจำนวนสูงสุดเป็น 20
    let url;
    let frameKey;

    // รูปแบบใหม่: {weaponkey}_{typefile}_frame.png
    url = `${API_BASE_URL}/uploads/weapons_effect/${weaponKey}_${typeFile}_${i}.png`;
    frameKey = `${texturePrefix}-${i}`;

    if (scene.textures && !scene.textures.exists(frameKey)) {
      const exists = await checkImageExistsSafe(url);
      if (exists) {
        framesToLoad.push({ key: frameKey, url: url });
      } else {
        break; // หยุดเมื่อไม่เจอไฟล์
      }
    }
  }

  console.log(`Found ${framesToLoad.length} effect frames to preload`);

  if (framesToLoad.length === 0) {
    return 0;
  }

  // โหลดทั้งหมด
  try {
    // ตรวจสอบว่า scene.load และ scene.load.list พร้อมใช้งาน
    if (!scene.load || !scene.load.list) {
      console.warn('Scene.load or scene.load.list is null, cannot load frames');
      return 0;
    }

    // ตรวจสอบว่า scene.load.list มี method iterate หรือไม่
    if (typeof scene.load.list.iterate !== 'function') {
      console.warn('Scene.load.list.iterate is not a function, scene may not be ready');
      return 0;
    }

    framesToLoad.forEach(frame => {
      try {
        if (scene.load && scene.load.image) {
          scene.load.image(frame.key, frame.url);
        }
      } catch (frameError) {
        console.error(`Error loading frame ${frame.key}:`, frameError);
      }
    });
  } catch (error) {
    console.error('Error loading weapon effect frames:', error);
    return 0;
  }

  return new Promise((resolve, reject) => {
    // ตรวจสอบว่า scene.load.list มีอยู่จริง
    if (!scene.load || !scene.load.list) {
      console.warn('Scene.load.list is null, resolving with 0');
      resolve(0);
      return;
    }

    // ตรวจสอบว่า scene.load.list มี method iterate หรือไม่
    if (typeof scene.load.list.iterate !== 'function') {
      console.warn('Scene.load.list.iterate is not a function, resolving with 0');
      resolve(0);
      return;
    }

    if (scene.load.list.size === 0) {
      resolve(0);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn(`Preload timeout for ${weaponKey}`);
      resolve(framesToLoad.length); // ไม่ reject แค่ resolve ไป
    }, 10000); // 10 วินาที timeout

    scene.load.once('complete', () => {
      clearTimeout(timeout);

      // ⭐ ตรวจสอบว่า texture พร้อมใช้งานจริงหรือไม่
      let validCount = 0;
      const checkLoadedTextures = () => {
        framesToLoad.forEach(frame => {
          if (scene.textures.exists(frame.key)) {
            const texture = scene.textures.get(frame.key);
            const source = texture.source[0];
            if (source?.image?.complete && source.image.naturalWidth > 0) {
              validCount++;
            }
          }
        });

        console.log(`Preloaded ${validCount}/${framesToLoad.length} valid textures for ${weaponKey}`);
        resolve(validCount);
      };

      // รอสักหน่อยให้ texture process เสร็จ
      scene.time.delayedCall(100, checkLoadedTextures);
    });

    scene.load.once('loaderror', (fileObj) => {
      clearTimeout(timeout);
      console.error(`Failed to preload:`, fileObj.key);
      resolve(framesToLoad.length); // ไม่ reject เพื่อไม่ให้หยุดทำงาน
    });

    scene.load.start();
  });
}

export function checkImageExistsSafe(url) {
  return new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      img.onabort = null;
    };

    img.onload = () => {
      cleanup();
      // ⭐ ตรวจสอบว่ารูปมีขนาดจริงหรือไม่
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(false);
    };

    img.onabort = () => {
      cleanup();
      resolve(false);
    };

    // Timeout สั้นลง
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 2000);

    img.src = url;
  });
}

export function validateTextureState(scene, textureKey) {
  if (!scene.textures.exists(textureKey)) {
    return {
      exists: false,
      loaded: false,
      valid: false,
      error: 'Texture does not exist'
    };
  }

  const texture = scene.textures.get(textureKey);
  const source = texture.source[0];

  const result = {
    exists: true,
    loaded: source?.image?.complete === true,
    valid: false,
    width: source?.width || 0,
    height: source?.height || 0,
    naturalWidth: source?.image?.naturalWidth || 0,
    naturalHeight: source?.image?.naturalHeight || 0,
    hasImage: !!source?.image,
    error: null
  };

  // ตรวจสอบว่า valid หรือไม่
  if (result.loaded &&
    result.naturalWidth > 0 &&
    result.naturalHeight > 0 &&
    result.width > 0 &&
    result.height > 0) {
    result.valid = true;
  } else {
    result.error = 'Texture loaded but invalid dimensions';
  }

  return result;
}

// Helper function เช็คว่าไฟล์รูปมีจริงหรือไม่
export function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    setTimeout(() => resolve(false), 3000);

    img.src = url;
  });
}

