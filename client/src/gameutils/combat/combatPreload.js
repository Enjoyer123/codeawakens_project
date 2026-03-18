// Combat Weapon Effects Preload
import { getImageUrl } from '../../utils/imageUtils';
import { getWeaponsData } from '../entities/weaponUtils';

export async function preloadAllWeaponEffects(scene) {
  if (!scene || !scene.load) return 0;

  const weaponsCache = getWeaponsData();
  const weaponsToPreload = weaponsCache ? Object.keys(weaponsCache) : ['stick'];
  
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

  // 2. ตรวจสอบไฟล์แบบหลายเฟรม (รองรับสูงสุด 10 เฟรมก็พอสำหรับมอนสเตอร์ทั่วไป)
  let consecutiveMisses = 0;
  for (let i = 1; i <= 10; i++) {
    const frameKey = `${texturePrefix}-${i}`;
    if (scene.textures.exists(frameKey)) continue;

    const url = getImageUrl(`uploads/weapons_effect/${weaponKey}_${effectType}_${i}.png`);
    if (await checkImageExistsSafe(url)) {
      framesToLoad.push({ key: frameKey, url });
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
      // ถ้าหาไม่เจอ 2 เฟรมติดกัน แปลว่าหมดชุดแอนิเมชันแล้ว ให้หยุดหา
      if (consecutiveMisses >= 2) break; 
    }
  }

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

