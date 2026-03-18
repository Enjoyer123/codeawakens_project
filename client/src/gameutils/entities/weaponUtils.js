import { API_BASE_URL } from '../../config/apiConfig';

let weaponsData = null; // ถังเก็บข้อมูลอาวุธ (Cache ระดับไฟล์)

// ดึงข้อมูลอาวุธทั้งหมดที่มี
export function getWeaponsData() {
  return weaponsData;
}

// เอา Array อาวุธจาก React Query มายัดลง Cache ให้ Phaser ใช้แบบ Sync
export function seedWeaponsData(weaponList) {
  if (!weaponList || !Array.isArray(weaponList)) return;
  
  weaponsData = {}; // เตรียมถังเปล่า
  
  // แปลง List เป็น Object โดยใช้ weapon_key เป็นดัชนี (เพื่อให้ค้นหาไวระดับ O(1))
  weaponList.forEach(weapon => {
    if (!weapon?.weapon_key) return;
    weaponsData[weapon.weapon_key] = {
      name: weapon.weapon_name || weapon.name,
      combat_power: weapon.combat_power ?? 0,
      weaponKey: weapon.weapon_key,
      weaponId: weapon.weapon_id,
      description: weapon.description || '',
      weaponType: weapon.weapon_type || 'melee'
    };
  });
}

// ขอข้อมูลอาวุธ 1 ชิ้น (ถ้าไม่มีให้คืน stick)
export function getWeaponData(weaponKey) {
  // console.log("weaponKey", weaponsData?.[weaponKey]);
  return weaponsData?.[weaponKey] || weaponsData?.["stick"] || null;
}

