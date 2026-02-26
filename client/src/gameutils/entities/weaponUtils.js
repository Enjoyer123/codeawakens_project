// Weapon management functions
import { API_BASE_URL } from '../../config/apiConfig';

// Global weapon variables
let weaponsData = null; // เก็บข้อมูลอาวุธจาก API

// Export weaponsData for external access
export function getWeaponsData() {
  return weaponsData;
}

// ฟังก์ชันสำหรับโหลดข้อมูลอาวุธจาก API
export async function loadWeaponsData(getToken) {
  try {
    console.log("🔍 Loading weapons data from API...");
    const token = typeof getToken === 'function' ? await getToken().catch(() => null) : null;
    const response = await fetch(`${API_BASE_URL}/weapons`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse weapons response as JSON", jsonError);
      throw new Error("Invalid JSON response from weapons API");
    }

    console.log("🔍 API response:", result);

    const weaponList = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : Array.isArray(result?.weapons)
          ? result.weapons
          : [];

    if (weaponList.length === 0) {
      console.warn("Weapons API returned no items");
      weaponsData = null;
      return null;
    }

    weaponsData = {};
    weaponList.forEach(weapon => {
      if (!weapon?.weapon_key) return;
      weaponsData[weapon.weapon_key] = {
        name: weapon.weapon_name || weapon.name || weapon.weaponKey,
        combat_power: weapon.combat_power ?? weapon.power ?? 0,
        emoji: weapon.emoji || "🏭",
        weaponKey: weapon.weapon_key,
        weaponId: weapon.weapon_id,
        description: weapon.description || '',
        weaponType: weapon.weapon_type || weapon.type || 'melee'
      };
    });
    console.log("✅ Weapons data loaded from API:", weaponsData);
    console.log("✅ Available weapon keys:", Object.keys(weaponsData));
    return weaponsData;
  } catch (error) {
    console.error("Error loading weapons:", error);
    weaponsData = null;
    return null;
  }
}

export function getWeaponData(weaponKey) {
  if (!weaponsData) {
    console.warn(`[getWeaponData] weaponsData not loaded, falling back to stick. Requested: ${weaponKey}`);
    // Return default weapon structure if API data not loaded yet
    return {
      name: "🏭 ไม้เท้าเก่า",
      power: 10,
      emoji: "🏭",
      combat_power: 0,
      weaponKey: "stick",
      weaponId: 1,
      description: "อาวุธพื้นฐาน",
      weaponType: "melee"
    };
  }

  let weaponData = weaponsData[weaponKey];

  // Fallback if still not found
  if (!weaponData) {
    console.warn(`[getWeaponData] Weapon '${weaponKey}' not found in API data. Returning default stick.`);
    weaponData = weaponsData["stick"];
  }

  return weaponData;
}

// Calculate damage based on monster damage and weapon defense
export function calculateDamage(monsterDamage, weaponData) {
  // ✅ ถ้าไม่มี weaponData ให้ใช้ stick default (defense = 10)
  const defense = weaponData?.combat_power ?? 10;

  console.log(`Calculating damage: Monster Damage = ${monsterDamage}, Weapon Defense = ${defense}`, {
    weaponData,
    hasWeaponData: !!weaponData,
    combatPower: weaponData?.combat_power,
    weaponKey: weaponData?.weapon_key || 'unknown'
  });

  if (defense >= monsterDamage) {
    return 0; // Weapon strong enough to block all damage
  } else {
    return monsterDamage - defense; // Partial damage
  }
}



