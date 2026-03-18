// Combat Weapon Attack Effects
import { getCurrentGameState } from '../shared/game/gameState';
import { createCanvasBasedEffect } from './animationUtils';

// ─── Global State ───────────────────────────────────────────────

let playerWeaponContainer = null;
let playerEffectGraphics = null;
let circleEffectSprite = null;
let auraEffectSprite = null;

// ─── Getters ────────────────────────────────────────────────────

export function getPlayerWeaponSprite() { return playerWeaponContainer; }
export function getPlayerAuraSprite() { return auraEffectSprite; }
export function getPlayerCircleSprite() { return circleEffectSprite; }

// ─── Weapon Ring ────────────────────────────────────────────────

/** สร้างวงแหวนอาวุธหมุนรอบจุดที่กำหนด */
export function createWeaponRing(scene, x, y, weaponKey, options = {}) {
    const { count = 6, radius = 45, scale = 0.4 } = options;
    const textureKey = `weapon_${weaponKey}`;

    if (!scene.textures.exists(textureKey)) {
        console.warn(`Weapon texture '${textureKey}' missing for ring.`);
        return null;
    }

    const container = scene.add.container(x, y);
    const weapons = [];

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const sprite = scene.add.image(Math.cos(angle) * radius, Math.sin(angle) * radius, textureKey);
        sprite.setScale(scale);
        sprite.setRotation(angle + Math.PI / 2);
        container.add(sprite);
        weapons.push(sprite);
    }

    container.setData('weapons', weapons);
    container.setData('radius', radius);
    scene.tweens.add({ targets: container, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });

    return container;
}

// ─── Weapon Display ─────────────────────────────────────────────

/** แสดง/ซ่อนอาวุธรอบตัวผู้เล่น + preload effect texture */
export function displayPlayerWeapon(weaponKey, scene) {
    if (!scene || !scene.player) return;

    // ซ่อนอาวุธถ้าเป็น stick หรือไม่มี key
    if (!weaponKey || weaponKey === 'stick') {
        if (playerWeaponContainer) {
            playerWeaponContainer.destroy();
            playerWeaponContainer = null;
        }
        return;
    }

    const textureKey = `weapon_${weaponKey}`;

    const createAndAttach = () => {
        if (!scene?.player?.active) return;
        try {
            if (playerWeaponContainer) {
                playerWeaponContainer.destroy();
                playerWeaponContainer = null;
            }
            playerWeaponContainer = createWeaponRing(scene, scene.player.x, scene.player.y, weaponKey);
            if (playerWeaponContainer) {
                playerWeaponContainer.setDepth(scene.player.depth - 1);
                updateWeaponPosition(scene);
            }
            // Preload effect textures
            if (scene.sys && !scene.sys.isDestroyed) {
                import('./combatPreload').then(m => m.preloadWeaponEffectSafe(scene, weaponKey));
            }
        } catch (error) {
            console.warn("Error creating weapon sprite:", error);
        }
    };

    if (!scene.textures.exists(textureKey)) {
        import('../../utils/imageUtils').then(({ getImageUrl }) => {
            const url = getImageUrl(`uploads/weapons/${weaponKey}_idle_1.png`);
            if (!scene.load?.list) return;
            scene.load.image(textureKey, url);
            scene.load.once(`filecomplete-image-${textureKey}`, () => {
                setTimeout(() => { if (scene.textures.exists(textureKey)) createAndAttach(); }, 50);
            });
            scene.load.start();
        });
    } else {
        createAndAttach();
    }
}

/** Sync ตำแหน่งวงแหวนอาวุธตามผู้เล่น */
export function updateWeaponPosition(scene) {
    if (!playerWeaponContainer || !scene.player) return;
    playerWeaponContainer.setPosition(scene.player.x, scene.player.y);
}

// ─── Attack Animation ───────────────────────────────────────────

/** เล่น animation ตอนโจมตี (melee = หมุน+หด, magic = ขยาย+pulse) */
export function animateWeaponAttack(scene, weaponType, targetContainer = null) {
    const container = targetContainer || playerWeaponContainer;
    if (!container?.active) return;

    const weapons = container.getData('weapons');
    if (!weapons) return;

    const radius = container.getData('radius') || 45;

    // Helper: tween weapons to new radius
    const tweenToRadius = (r, duration, yoyo = true) => {
        scene.tweens.add({
            targets: weapons,
            x: (_, __, ___, index, total) => Math.cos((index / total) * Math.PI * 2) * r,
            y: (_, __, ___, index, total) => Math.sin((index / total) * Math.PI * 2) * r,
            duration, yoyo
        });
    };

    if (weaponType === 'magic') {
        tweenToRadius(radius * 1.5, 300);
        scene.tweens.add({ targets: weapons, scaleX: 0.6, scaleY: 0.6, duration: 300, yoyo: true, ease: 'Back.out' });
        scene.tweens.add({ targets: container, angle: container.angle + 180, duration: 600, ease: 'Cubic.out' });
    } else {
        scene.tweens.add({ targets: weapons, angle: '+=100', duration: 150, yoyo: true, ease: 'Power2' });
        tweenToRadius(radius * 0.8, 100);
    }
}

// ─── Attack Effects ─────────────────────────────────────────────

/** ยิง effect กระจายจากตัวผู้เล่นเมื่อโจมตีศัตรู */
export function showEffectWeaponFixed(enemy, damage, weaponKey = 'stick', weaponSprite, effectType = 'attack') {
    const container = getPlayerWeaponSprite();
    const scene = getCurrentGameState().currentScene;
    if (!scene || !enemy?.sprite) return;

    const radius = 45;
    const sourceObj = (weaponSprite && typeof weaponSprite.x === 'number') ? weaponSprite : scene.player;
    const { x: px, y: py } = sourceObj;
    const texturePrefix = `effect_${weaponKey}${effectType ? `_${effectType}` : ''}`;

    // ─── ค้นหา frames ───
    let validFrames = [];
    let customScale;

    // Special case: Circle weapon ใช้ Circle_N format
    if (weaponKey.toLowerCase() === 'circle') {
        for (let i = 1; i <= 10; i++) {
            if (scene.textures.exists(`Circle_${i}`)) validFrames.push(`Circle_${i}`);
            else break;
        }
        if (validFrames.length > 0) customScale = 8.0;
    }

    // Multi-frame: effect_weaponKey-1, -2, ...
    if (validFrames.length === 0) {
        for (let i = 1; i <= 10; i++) {
            const key = `${texturePrefix}-${i}`;
            if (scene.textures.exists(key)) validFrames.push(key);
            else break;
        }
    }

    // Single-frame fallback
    if (validFrames.length === 0 && scene.textures.exists(texturePrefix)) {
        validFrames = [texturePrefix];
    }

    if (validFrames.length === 0) return;

    // ─── คำนวณมุมยิง ───
    let baseAngle = 0;
    if (sourceObj.directions && sourceObj.directionIndex !== undefined) {
        const dir = sourceObj.directions[sourceObj.directionIndex];
        const angles = { down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2, right: 0 };
        baseAngle = angles[dir] ?? 0;
    } else {
        baseAngle = sourceObj.flipX ? Math.PI : 0;
    }

    // ─── ยิง 3 ลูกเป็นพัด 60° ───
    const coneSpread = Math.PI / 3;
    const startAngle = baseAngle - coneSpread / 2;

    for (let i = 0; i < 3; i++) {
        const angle = startAngle + (i / 2) * coneSpread;
        createCanvasBasedEffect(scene, {
            x: px + Math.cos(angle) * (radius + 60),
            y: py + Math.sin(angle) * (radius + 60),
            depth: sourceObj.depth + 10,
            angle: angle + Math.PI / 2,
            moveOutward: true,
            scale: customScale
        }, validFrames, weaponKey);
    }
}

// ─── Player Effects (Circle, Aura) ──────────────────────────────

/** แสดง effect พิเศษตาม effectKey เช่น "circle_1", "aura_2" */
export function displayPlayerEffect(effectKey, scene, keepExisting = false) {
    if (!scene?.player) return;
    if (!keepExisting) clearPlayerEffects();
    if (!effectKey) return;

    const [type, indexStr] = effectKey.split('_');
    const index = parseInt(indexStr) || 1;

    if (type === 'circle') drawMagicCircle(scene, index);
    else if (type === 'aura') showPlayerAura(scene, index);
}

function clearPlayerEffects() {
    [playerEffectGraphics, circleEffectSprite, auraEffectSprite].forEach(s => { if (s) s.destroy(); });
    playerEffectGraphics = null;
    circleEffectSprite = null;
    auraEffectSprite = null;
}

/** Helper: สร้าง effect sprite ที่ติดตามตำแหน่งผู้เล่น */
function createTrackedSprite(scene, textureKey, animKey, scale, alpha) {
    const player = scene.player;
    const sprite = scene.add.sprite(player.x, player.y, textureKey);
    sprite.setDepth(player.depth - 1);
    sprite.setScale(scale);
    sprite.setAlpha(alpha);

    if (scene.anims.exists(animKey)) {
        sprite.play(animKey);
    } else {
        // Fallback: หมุนช้าๆ ถ้าไม่มี animation
        scene.tweens.add({ targets: sprite, angle: 360, duration: 3000, repeat: -1, ease: 'Linear' });
    }

    // ติดตามตำแหน่งผู้เล่น
    const updatePos = () => {
        if (sprite?.active && player) sprite.setPosition(player.x, player.y);
    };
    scene.events.on('update', updatePos);
    sprite.once('destroy', () => scene.events.off('update', updatePos));

    return sprite;
}

function drawMagicCircle(scene, index) {
    if (circleEffectSprite) { circleEffectSprite.destroy(); circleEffectSprite = null; }
    if (playerEffectGraphics) { playerEffectGraphics.destroy(); playerEffectGraphics = null; }

    const animKey = `circle_${index}`;
    const firstFrame = `circle_${index}_1`;
    const textureKey = scene.textures.exists(firstFrame) ? firstFrame : animKey;

    if (!scene.textures.exists(textureKey) && !scene.anims.exists(animKey)) {
        console.warn(`⚠️ Circle ${animKey} not found`);
        return;
    }

    circleEffectSprite = createTrackedSprite(scene, textureKey, animKey, 4.5, 0.8);
}

function showPlayerAura(scene, index) {
    if (auraEffectSprite) { auraEffectSprite.destroy(); auraEffectSprite = null; }

    const animKey = `aura_${index}`;
    const firstFrame = `${animKey}_1`;

    if (!scene.textures.exists(firstFrame) && !scene.anims.exists(animKey)) {
        console.warn(`⚠️ Aura ${animKey} not found`);
        return;
    }

    auraEffectSprite = createTrackedSprite(scene, firstFrame, animKey, 1.5, 0.8);
}
