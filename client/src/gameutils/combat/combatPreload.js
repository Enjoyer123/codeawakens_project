// Combat Weapon Effects Preload
import { getImageUrl } from '../../utils/imageUtils';
import { getWeaponsData } from '../entities/weaponUtils';

export async function preloadAllWeaponEffects(scene) {
  if (!scene || !scene.load) return 0;

  const weaponsToPreloadSet = new Set();
  
  // Extract only needed weapons from the current level
  if (scene.levelData) {
     if (scene.levelData.defaultWeaponKey) {
        weaponsToPreloadSet.add(scene.levelData.defaultWeaponKey);
     }
     if (Array.isArray(scene.levelData.goodPatterns)) {
        scene.levelData.goodPatterns.forEach(pattern => {
           if (pattern.weaponKey) weaponsToPreloadSet.add(pattern.weaponKey);
        });
     }
  }
  
  // Fallback to stick if no weapons found
  if (weaponsToPreloadSet.size === 0) weaponsToPreloadSet.add('stick');

  const weaponsToPreload = Array.from(weaponsToPreloadSet);
  
  const promises = weaponsToPreload.map(weapon => preloadWeaponEffectSafe(scene, weapon));
  const results = await Promise.all(promises);
  
  return results.reduce((sum, count) => sum + count, 0);
}

export async function preloadWeaponEffectSafe(scene, weaponKey, effectType = 'attack') {
  if (!scene || !scene.load) return 0;

  const texturePrefix = `effect_${weaponKey}_${effectType}`;
  const framesToLoad = [];

  // 1. ตรวจสอบไฟล์เดี่ยว (เผื่อมี)
  const singleUrl = getImageUrl(`uploads/weapons_effect/${weaponKey}.png`);
  if (!scene.textures.exists(`effect_${weaponKey}`)) {
    if (await checkImageExistsSafe(singleUrl)) {
      framesToLoad.push({ key: `effect_${weaponKey}`, url: singleUrl });
    }
  }

  // 2. ตรวจสอบไฟล์แบบหลายเฟรมพร้อมกัน (Parallel) ช่วยลดเวลาได้มาก
  const frameIndices = Array.from({ length: 10 }, (_, i) => i + 1);
  const parallelChecks = frameIndices.map(async (i) => {
    const frameKey = `${texturePrefix}-${i}`;
    if (scene.textures.exists(frameKey)) return null;

    const url = getImageUrl(`uploads/weapons_effect/${weaponKey}_${effectType}_${i}.png`);
    const exists = await checkImageExistsSafe(url);
    return exists ? { key: frameKey, url: url } : null;
  });

  const checkResults = await Promise.all(parallelChecks);
  
  // 3. กรองเฉพาะเฟรมที่มีรูปอยู่จริง เติมลง framesToLoad (กรอง null ออก)
  framesToLoad.push(...checkResults.filter(Boolean));

  if (framesToLoad.length === 0) return 0;

  // โหลดเข้า Phaser
  return new Promise((resolve) => {
    framesToLoad.forEach(frame => scene.load.image(frame.key, frame.url));
    
    scene.load.once('complete', () => resolve(framesToLoad.length));
    scene.load.once('loaderror', () => resolve(framesToLoad.length)); // โหลดพลาดก็ไม่เป็นไร ให้ผ่านไปเลย
    
    scene.load.start();
  });
}

// ฟังก์ชันเช็คว่ารูปมีอยู่จริงไหมแบบสั้นๆ เคลียร์ๆ
export function checkImageExistsSafe(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

