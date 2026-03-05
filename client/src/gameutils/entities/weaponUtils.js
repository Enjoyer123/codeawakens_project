import { API_BASE_URL } from '../../config/apiConfig';

let weaponsData = null;

export function getWeaponsData() {
  return weaponsData;
}

// ฟังก์ชันสำหรับโหลดข้อมูลอาวุธจาก API
// โหลดข้อมูลอาวุธจาก API เก็บไว้ใน module-level variable
// ใช้ fetch ตรงๆ แทน React Query เพราะ Phaser (non-React) ต้องเข้าถึงได้
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

    weaponsData = {};
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

    return weaponsData;
  } catch (error) {
    console.error("Error loading weapons:", error);
    weaponsData = null;
    return null;
  }
}

export function getWeaponData(weaponKey) {
  return weaponsData?.[weaponKey] || weaponsData?.["stick"] || null;
}

// Calculate damage based on monster damage and weapon defense
export function calculateDamage(monsterDamage, weaponData) {
  // ถ้าไม่มี weaponData ให้ใช้ stick default (defense = 10)
  const defense = weaponData?.combat_power ?? 10;
  //   weaponData,
  //   hasWeaponData: !!weaponData,
  //   combatPower: weaponData?.combat_power,
  //   weaponKey: weaponData?.weapon_key || 'unknown'
  // });
  if (defense >= monsterDamage) {
    return 0; // Weapon strong enough to block all damage
  } else {
    return monsterDamage - defense; // Partial damage
  }
}



