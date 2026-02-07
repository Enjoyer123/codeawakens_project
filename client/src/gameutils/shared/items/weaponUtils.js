// Weapon management functions
import Phaser from 'phaser';
import { preloadWeaponEffectSafe as preloadWeaponEffect } from '../../shared/combat';
import { getCurrentGameState, setCurrentGameState, getCurrentScene } from '../game/gameState';

import { API_BASE_URL } from '../../../config/apiConfig';

// Global weapon variables
let weaponsData = null; // เก็บข้อมูลอาวุธจาก API
let playerWeaponContainer = null; // Container for the weapon ring
let playerEffectGraphics = null; // สำหรับวาด circle (legacy/fallback)
let circleEffectSprite = null;   // สำหรับแสดง Circle effect
let auraEffectSprite = null;     // สำหรับแสดง Aura effect
let playerEffectSprite = null;   // DEPRECATED: Keeping for compatibility during refactor, will remove usages

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
  // console.log("🔍 getWeaponData called with:", weaponKey);
  // console.log("🔍 weaponsData available:", !!weaponsData);

  if (!weaponsData) {
    // console.warn("Weapons data not loaded yet, returning default");
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
  // console.log("🔍 getWeaponData result:", weaponData);
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

/**
 * Creates a ring of weapons around a target.
 * @param {Phaser.Scene} scene 
 * @param {number} x Center X
 * @param {number} y Center Y
 * @param {string} weaponKey 
 * @param {object} options { count, radius, scale }
 */
export function createWeaponRing(scene, x, y, weaponKey, options = {}) {
  const count = options.count || 6; // Number of weapons
  const radius = options.radius || 45;
  const scale = options.scale || 0.4;
  const textureKey = `weapon_${weaponKey}`;

  if (!scene.textures.exists(textureKey)) {
    console.warn(`Weapon texture '${textureKey}' missing for ring.`);
    return null;
  }

  const container = scene.add.container(x, y);
  const weapons = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const wx = Math.cos(angle) * radius;
    const wy = Math.sin(angle) * radius;

    // Create sprite relative to container center (0,0)
    const sprite = scene.add.image(wx, wy, textureKey);
    sprite.setScale(scale);

    // Point outward by default
    sprite.setRotation(angle + Math.PI / 2);

    container.add(sprite);
    weapons.push(sprite);
  }

  container.setData('weapons', weapons);
  container.setData('radius', radius);

  // Add continuous rotation to the container
  scene.tweens.add({
    targets: container,
    angle: 360,
    duration: 8000,
    repeat: -1,
    ease: 'Linear'
  });

  return container;
}

export function displayPlayerWeapon(weaponKey, scene) {
  console.log("displayPlayerWeapon called", weaponKey);

  // Initial scene validation
  if (!scene || !scene.player) {
    console.warn("Scene or player not ready");
    return;
  }

  // Hide default weapon (stick) or empty key
  if (!weaponKey || weaponKey === 'stick') {
    if (playerWeaponContainer) {
      playerWeaponContainer.destroy();
      playerWeaponContainer = null;
    }
    return;
  }

  const textureKey = `weapon_${weaponKey}`;

  const createAndAttach = () => {
    if (!scene || !scene.player || !scene.add) {
      console.warn("Scene not ready for sprite creation");
      return;
    }

    try {
      // ลบ sprite/container เก่าก่อน
      if (playerWeaponContainer) {
        playerWeaponContainer.destroy();
        playerWeaponContainer = null;
      }

      // Create new Weapon Ring
      playerWeaponContainer = createWeaponRing(scene, scene.player.x, scene.player.y, weaponKey);

      if (playerWeaponContainer) {
        playerWeaponContainer.setDepth(scene.player.depth - 1);
        updateWeaponPosition(scene); // Sync position immediately
        console.log(`✅ Weapon Ring created: ${weaponKey}`);
      }

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

  // Main texture loading logic (unchanged)
  if (!scene.textures.exists(textureKey)) {
    console.log(`🔍 Loading weapon texture: ${textureKey}`);
    const weaponImageUrl = `${API_BASE_URL}/uploads/weapons/${weaponKey}_idle_1.png`;

    if (scene.load && typeof scene.load.image === 'function') {
      if (!scene.load.list) return; // Scene not ready

      scene.load.image(textureKey, weaponImageUrl);
      scene.load.once(`filecomplete-image-${textureKey}`, () => {
        setTimeout(() => {
          if (scene.textures.exists(textureKey)) createAndAttach();
        }, 50);
      });
      scene.load.start();
    }
  } else {
    createAndAttach();
  }

  setCurrentGameState({
    hasGoodWeapon: true,
    weaponKey: weaponKey
  });
}

/**
 * Triggers the attack animation for the weapon ring.
 * @param {Phaser.Scene} scene 
 * @param {string} weaponType 'melee' or 'magic'
 * @param {Phaser.GameObjects.Container} targetContainer Optional container to animate (defaults to player's)
 */
export function animateWeaponAttack(scene, weaponType, targetContainer = null) {
  const container = targetContainer || playerWeaponContainer;
  if (!container || !container.active) return;

  const weapons = container.getData('weapons');
  if (!weapons) return;

  if (weaponType === 'magic') {
    // MAGIC ATTACK: Expand and Pulse
    const originalRadius = container.getData('radius') || 45;
    const expandRadius = originalRadius * 1.5;

    // Expand
    scene.tweens.add({
      targets: weapons,
      x: (target, key, value, index, total) => {
        const angle = (index / total) * Math.PI * 2;
        return Math.cos(angle) * expandRadius;
      },
      y: (target, key, value, index, total) => {
        const angle = (index / total) * Math.PI * 2;
        return Math.sin(angle) * expandRadius;
      },
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 300,
      yoyo: true,
      ease: 'Back.out',
      onComplete: () => {
        // Reset positions explicitly to be safe
        // handled by yoyo roughly, but logic above uses function so yoyo works on 'value'
      }
    });

    // Spin faster during cast
    scene.tweens.add({
      targets: container,
      angle: container.angle + 180,
      duration: 600,
      ease: 'Cubic.out'
    });

  } else {
    // MELEE ATTACK: Slash/Point Inward
    // All swords point their tips towards the center (or down relative to their rotation)

    scene.tweens.add({
      targets: weapons,
      angle: '+=100', // Slash rotation
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        // Return to normal orbit
      }
    });

    // Slight radius contraction for impact
    const originalRadius = container.getData('radius') || 45;
    const contractRadius = originalRadius * 0.8;

    scene.tweens.add({
      targets: weapons,
      x: (target, key, value, index, total) => {
        const angle = (index / total) * Math.PI * 2;
        return Math.cos(angle) * contractRadius;
      },
      y: (target, key, value, index, total) => {
        const angle = (index / total) * Math.PI * 2;
        return Math.sin(angle) * contractRadius;
      },
      duration: 100,
      yoyo: true
    });
  }
}

/**
 * แสดงเอฟเฟกต์พิเศษสำหรับแต่ละ Part (เช่น circle_1, aura_1)
 */
export function displayPlayerEffect(effectKey, scene, keepExisting = false) {
  if (!scene || !scene.player) return;

  // ลบเอฟเฟกต์เก่าออกก่อน (ถ้าไม่ได้สั่งให้เก็บไว้)
  // Note: ถ้า keepExisting = true แสดงว่าเราต้องการให้ effect ซ้อนกันได้ (เช่น จากการใส่ item หลายชิ้น)
  if (!keepExisting) {
    clearPlayerEffects();
  }

  if (!effectKey) return;

  console.log(`✨ Displaying effect: ${effectKey} (keep: ${keepExisting})`);

  if (effectKey.startsWith('circle_')) {
    // วาดวงเวทย์ (Magic Circle)
    const index = parseInt(effectKey.split('_')[1]) || 1;
    drawMagicCircle(scene, index);
  } else if (effectKey.startsWith('aura_')) {
    // แสดง Aura
    const index = parseInt(effectKey.split('_')[1]) || 1;
    showPlayerAura(scene, index);
  }
}

function clearPlayerEffects() {
  if (playerEffectGraphics) {
    playerEffectGraphics.destroy();
    playerEffectGraphics = null;
  }
  if (circleEffectSprite) {
    circleEffectSprite.destroy();
    circleEffectSprite = null;
  }
  if (auraEffectSprite) {
    auraEffectSprite.destroy();
    auraEffectSprite = null;
  }
  // Legacy cleanup
  if (playerEffectSprite) {
    playerEffectSprite.destroy();
    playerEffectSprite = null;
  }
}

function drawMagicCircle(scene, index) {
  const player = scene.player;

  // Logic: "circle_1" is the animation key. 
  // Frames are "circle_1_1" to "circle_1_7".
  const animKey = `circle_${index}`;
  const firstFrameKey = `circle_${index}_1`; // Default first frame if anim doesn't exist but texture does

  console.log(`🔥 [weaponUtils] drawMagicCircle trying anim: ${animKey}`);

  // เคลียร์สไปรท์เก่าออกก่อน
  if (circleEffectSprite) {
    circleEffectSprite.destroy();
    circleEffectSprite = null;
  }
  if (playerEffectGraphics) {
    playerEffectGraphics.destroy();
    playerEffectGraphics = null;
  }

  // Check if animation exists or at least the first frame exists
  if (scene.anims.exists(animKey) || scene.textures.exists(firstFrameKey)) {
    // Create sprite using the first frame
    // Note: If anim exists, playing it will override this texture anyway
    const startTexture = scene.textures.exists(firstFrameKey) ? firstFrameKey : animKey;

    // Safety check if we can actually create a sprite
    if (!scene.textures.exists(startTexture) && !scene.anims.exists(animKey)) {
      console.warn(`⚠️ Cannot create circle sprite: texture ${startTexture} not found.`);
      return;
    }

    // Create sprite
    const circle = scene.add.sprite(player.x, player.y, startTexture);
    circle.setDepth(player.depth - 1);
    circle.setScale(4.5); // ปรับลดขนาดลงอีกตามที่ขอ (6.0 -> 4.5)
    circle.setAlpha(0.8);

    // Play animation if available
    if (scene.anims.exists(animKey)) {
      circle.play(animKey);
    } else {
      // Fallback: rotate the single frame we found
      scene.tweens.add({
        targets: circle,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    circleEffectSprite = circle;

    // อัปเดตตำแหน่งตามผู้เล่น
    const updatePos = () => {
      if (circleEffectSprite && !circleEffectSprite.isDestroyed && player) {
        circleEffectSprite.setPosition(player.x, player.y);
      }
    };
    scene.events.on('update', updatePos);

    circle.once('destroy', () => {
      scene.events.off('update', updatePos);
    });
  } else {
    console.warn(`⚠️ Circle animation/texture ${animKey} or ${firstFrameKey} not found!`);
  }
}

function showPlayerAura(scene, index) {
  const player = scene.player;
  const animKey = `aura_${index}`;

  console.log(`🔥 [weaponUtils] showPlayerAura using sprite: ${animKey}`);

  // เคลียร์สไปรท์ของ Aura อันเก่าออกก่อน
  if (auraEffectSprite) {
    auraEffectSprite.destroy();
    auraEffectSprite = null;
  }

  // Create aura sprite
  // We use the first frame as the initial texture
  const startTexture = `${animKey}_1`;

  if (!scene.textures.exists(startTexture) && !scene.anims.exists(animKey)) {
    console.warn(`⚠️ Aura texture/anim ${animKey} not found`);
    return;
  }

  const aura = scene.add.sprite(player.x, player.y, startTexture);
  // Aura depth: If circle is depth-1, aura can be depth-1 too, but let's make sure it sorts correctly.
  // Adding it after circle (if both present) will make it appear on top.
  aura.setDepth(player.depth - 1);
  aura.setScale(1.5);
  aura.setAlpha(0.8);

  // เล่น Animation
  if (scene.anims.exists(animKey)) {
    aura.play(animKey);
  } else {
    // If just static frames (which aura usually isn't), maybe rotate?
    // But aura logic usually expects anim.
    if (scene.textures.exists(startTexture)) {
      // Just static
    } else {
      console.warn(`⚠️ Animation ${animKey} failed to play`);
    }
  }

  auraEffectSprite = aura;

  // อัปเดตตำแหน่งตามผู้เล่น
  const updatePos = () => {
    if (auraEffectSprite && !auraEffectSprite.isDestroyed && player) {
      auraEffectSprite.setPosition(player.x, player.y);
    }
  };
  scene.events.on('update', updatePos);

  aura.once('destroy', () => {
    scene.events.off('update', updatePos);
  });
}

export function updateWeaponPosition(scene) {
  if (!playerWeaponContainer || !scene.player) return;

  const player = scene.player;
  // Center on player
  playerWeaponContainer.setPosition(player.x, player.y);
}

export function getPlayerWeaponSprite() {
  return playerWeaponContainer;
}

export function updatePlayerWeaponDisplay() {
  console.log("updatePlayerWeaponDisplay called");
  const currentState = getCurrentGameState();
  const scene = currentState.currentScene || getCurrentScene();

  // If a scene is available and a weapon sprite exists, update its position
  if (scene && playerWeaponContainer) {
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

