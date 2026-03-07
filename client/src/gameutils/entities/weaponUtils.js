import { API_BASE_URL } from '../../config/apiConfig';

let weaponsData = null; // ถังเก็บข้อมูลอาวุธ (Cache ระดับไฟล์)

// ดึงข้อมูลอาวุธทั้งหมดที่มี
export function getWeaponsData() {
  return weaponsData;
}

// โหลดข้อมูลอาวุธจาก API (ย้ายมาใช้ fetch ตรงๆ เพราะ Phaser ต้องดึงข้อมูลโดยไม่ง้อ React)
export async function loadWeaponsData(getToken) {
  try {
    const token = typeof getToken === 'function' ? await getToken().catch(() => null) : null;
    const response = await fetch(`${API_BASE_URL}/weapons`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    const weaponList = result?.data || result?.weapons || (Array.isArray(result) ? result : []);

    weaponsData = {}; // เตรียมถังเปล่า
    // แปลง List เป็น Object โดยใช้ weapon_key เป็นดัชนี (เพื่อให้ค้นหาไวระดับ O(1))
    weaponList.forEach(weapon => {
      if (!weapon?.weapon_key) return;
      weaponsData[weapon.weapon_key] = {
        name: weapon.weapon_name || weapon.name,
        combat_power: weapon.combat_power ?? 0,
        weaponKey: weapon.weapon_key,
        weaponId: weapon.weapon_id, // ไว้เทียบ id ใน DB
        description: weapon.description || '',
        weaponType: weapon.weapon_type || 'melee' // ประเภทอาวุธ (ตีใกล้/ไกล)
      };
    });

    return weaponsData;
  } catch (error) {
    console.error("Error loading weapons:", error);
    weaponsData = null;
    return null;
  }
}

// ขอข้อมูลอาวุธ 1 ชิ้น (ถ้าไม่มีให้คืน stick)
export function getWeaponData(weaponKey) {
  // console.log("weaponKey", weaponsData?.[weaponKey]);
  return weaponsData?.[weaponKey] || weaponsData?.["stick"] || null;
}

