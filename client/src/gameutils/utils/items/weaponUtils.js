// Weapon management functions
import Phaser from 'phaser';
import { preloadWeaponEffectSafe as preloadWeaponEffect } from '../combatSystem';
import { getCurrentGameState, setCurrentGameState, getCurrentScene } from '../game/gameState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Global weapon variables
let weaponsData = null; // เก็บข้อมูลอาวุธจาก API
let playerWeaponSprite = null;

// Export weaponsData for external access
export function getWeaponsData() {
  return weaponsData;
}

// ฟังก์ชันสำหรับโหลดข้อมูลอาวุธจาก API
export async function loadWeaponsData(getToken) {
  try {
    console.log("🔍 Loading weapons data from API...");
    const token = typeof getToken === 'function' ? await getToken().catch(() => null) : null;
    const response = await fetch(`${API_BASE_URL}/api/weapons`, {
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
  console.log("🔍 getWeaponData called with:", weaponKey);
  console.log("🔍 weaponsData available:", !!weaponsData);

  if (!weaponsData) {
    console.warn("Weapons data not loaded yet, returning default");
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

  const weaponData = weaponsData[weaponKey] || weaponsData["stick"];
  console.log("🔍 getWeaponData result:", weaponData);
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

export function displayPlayerWeapon(weaponKey, scene) {
  console.log("displayPlayerWeapon called", weaponKey);

  // Initial scene validation
  if (!scene || !scene.player) {
    console.warn("Scene or player not ready");
    return;
  }

  const textureKey = `weapon_${weaponKey}`;

  const createAndAttach = () => {
    if (!scene || !scene.player || !scene.add) {
      console.warn("Scene not ready for sprite creation");
      return;
    }

    try {
      // ลบ sprite เก่าก่อน
      if (playerWeaponSprite) {
        playerWeaponSprite.destroy();
        playerWeaponSprite = null;
      }

      playerWeaponSprite = scene.add.image(0, 0, textureKey);
      playerWeaponSprite.setScale(1.5);
      playerWeaponSprite.setDepth(scene.player.depth + 1);
      updateWeaponPosition(scene);

      console.log(`✅ Weapon sprite created: ${weaponKey}`);

      // โหลด effect ของอาวุธนี้ด้วย
      if (scene.sys && !scene.sys.isDestroyed) {
        try {
          preloadWeaponEffect(scene, weaponKey);
        } catch (error) {
          console.warn("Error preloading weapon effect:", error);
        }
      }
    } catch (error) {
      console.warn("Error creating weapon sprite:", error);
    }
  };

  // Main texture loading logic
  if (!scene.textures.exists(textureKey)) {
    console.log(`🔍 Loading weapon texture: ${textureKey}`);
    
    // ใช้รูปแบบใหม่: /uploads/weapons/{weaponkey}_idle_1.png (ใช้ idle frame 1 อย่างเดียว)
    const weaponImageUrl = `${API_BASE_URL}/uploads/weapons/${weaponKey}_idle_1.png`;
    console.log(`🔍 Loading weapon from: ${weaponImageUrl}`);
    
    // ใช้ Phaser's load.image แทนการสร้าง Image element เองเพื่อหลีกเลี่ยง CORS issues
    if (scene.load && typeof scene.load.image === 'function') {
      console.log(`🔍 Using Phaser load.image to load texture ${textureKey}`);
      
      // ตรวจสอบว่า scene.load.list มีอยู่หรือไม่
      if (!scene.load.list) {
        console.warn(`⚠️ scene.load.list is null, cannot load weapon texture`);
        // Fallback to default weapon
        const defaultWeaponKey = 'stick';
        const defaultTextureKey = `weapon_${defaultWeaponKey}`;
        if (scene.textures.exists(defaultTextureKey)) {
          if (playerWeaponSprite) {
            playerWeaponSprite.destroy();
            playerWeaponSprite = null;
          }
          playerWeaponSprite = scene.add.image(0, 0, defaultTextureKey);
          playerWeaponSprite.setScale(1.5);
          playerWeaponSprite.setDepth(scene.player.depth + 1);
          updateWeaponPosition(scene);
          console.log(`✅ Using default weapon: ${defaultTextureKey}`);
        }
        return;
      }
      
      scene.load.image(textureKey, weaponImageUrl);
      
      scene.load.once(`filecomplete-image-${textureKey}`, () => {
        console.log(`✅ Texture ${textureKey} loaded via Phaser`);
        // รอให้ texture พร้อม
        setTimeout(() => {
          if (scene.textures.exists(textureKey)) {
            createAndAttach();
          } else {
            console.warn(`⚠️ Texture ${textureKey} not found after loading`);
          }
        }, 50);
      });
      
      scene.load.once('loaderror', (file) => {
        if (file.key === textureKey) {
          console.error(`❌ Failed to load weapon image via Phaser: ${weaponImageUrl}`);
          // Fallback to default weapon
          const defaultWeaponKey = 'stick';
          const defaultTextureKey = `weapon_${defaultWeaponKey}`;
          if (scene.textures.exists(defaultTextureKey)) {
            if (playerWeaponSprite) {
              playerWeaponSprite.destroy();
              playerWeaponSprite = null;
            }
            playerWeaponSprite = scene.add.image(0, 0, defaultTextureKey);
            playerWeaponSprite.setScale(1.5);
            playerWeaponSprite.setDepth(scene.player.depth + 1);
            updateWeaponPosition(scene);
            console.log(`✅ Using default weapon: ${defaultTextureKey}`);
          }
        }
      });
      
      scene.load.start();
    } else {
      console.warn(`⚠️ Phaser load.image not available, texture may not load`);
    }
  } else {
    console.log(`✅ Texture ${textureKey} already exists, using existing texture`);
    createAndAttach();
  }

  setCurrentGameState({
    hasGoodWeapon: true,
    weaponKey: weaponKey
  });
}

export function updateWeaponPosition(scene) {
  if (!playerWeaponSprite || !scene.player) return;

  const player = scene.player;
  const currentState = getCurrentGameState();
  const direction = currentState.direction || 0;

  // ประกาศตัวแปร offset ก่อน
  let offsetX = 0;
  let offsetY = 0;

  switch (direction) {
    case 0: offsetX = 20; break;  // right
    case 1: offsetY = 20; break;  // down
    case 2: offsetX = -20; break; // left
    case 3: offsetY = -20; break; // up
  }

  // หรือใช้ offset แบบ fix ที่คุณอยากได้
  offsetX = -2; // ซ้าย 15px
  // เพิ่มขึ้น 3px จากของเดิม เพื่อชดเชยการขยายตัวละคร
  offsetY = 19;  // ลง 19px (เดิม 16)

  playerWeaponSprite.setPosition(player.x + offsetX, player.y + offsetY);
}

export function getPlayerWeaponSprite() {
  return playerWeaponSprite;
}

export function updatePlayerWeaponDisplay() {
  console.log("updatePlayerWeaponDisplay called");
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene || getCurrentScene();

  // If a scene is available and a weapon sprite exists, update its position
  if (scene && playerWeaponSprite) {
    try {
      updateWeaponPosition(scene);
    } catch (err) {
      console.warn('Error updating weapon position:', err);
    }
    return;
  }

  // If no sprite exists but we have a weapon key, attempt to display it
  if (scene && currentState.weaponKey) {
    try {
      displayPlayerWeapon(currentState.weaponKey, scene);
    } catch (err) {
      console.warn('Error displaying player weapon during update:', err);
    }
  }
}

// Helper functions for conditions
export function foundMonster() {
  const scene = getCurrentScene();
  if (!scene || !scene.monsters) return false;

  const playerX = scene.player.x;
  const playerY = scene.player.y;

  for (let monster of scene.monsters) {
    if (monster.data.defeated) continue;

    const distance = Phaser.Math.Distance.Between(
      playerX, playerY,
      monster.sprite.x, monster.sprite.y
    );

    // Monster detection range
    if (distance < 80) {
      return true;
    }
  }
  return false;
}

