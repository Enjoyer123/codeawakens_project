/**
 * Simple Sound Manager for Code Awakens
 * Uses HTML5 Audio API — no extra dependencies needed.
 * 
 * Usage:
 *   import { playSound, startLoopingSFX, stopLoopingSFX, startManagedLoop, stopManagedLoop, playBGM, stopBGM, toggleMute } from '@/gameutils/sound/soundManager';
 *   playSound('hit');      // plays /audio/sfx/sfx_hit.wav
 *   startManagedLoop('walk'); // plays /audio/sfx/sfx_walk.mp3 (loops with auto-debounce)
 *   stopManagedLoop('walk');  // stops looping sound after a small delay
 */

// ─── Sound Registry ─────────────────────────────────────────────
const SFX_MAP = {
  click: '/audio/sfx/sfx_click.wav',
  coin: '/audio/sfx/sfx_coin.mp3',
  defeat: '/audio/sfx/sfx_defeat.mp3',
  hit: '/audio/sfx/sfx_hit.wav',
  level_up: '/audio/sfx/sfx_level_up.wav',
  run: '/audio/sfx/sfx_run.wav',
  victory: '/audio/sfx/sfx_victory.mp3',
  walk: '/audio/sfx/sfx_walk.mp3',
  unlock_pattern: '/audio/sfx/sfx_unlock_pattern.wav',
  weapon_melee: '/audio/sfx/weapons/sfx_weapon_malee.mp3',
  weapon_magic: '/audio/sfx/weapons/sfx_weapon_magic.mp3',
  rescue: '/audio/sfx/sfx_recucepeople.mp3',
  enemy_defeat: '/audio/sfx/sfx_enemydefeat.mp3',
  select_map: '/audio/sfx/stx_select_map.mp3',
  paper: '/audio/sfx/stx_papersound.mp3',
  tab_editor: '/audio/sfx/stx_tabeditor.mp3',
};

const BGM_MAP = {
  game: '/audio/bgm/bgm_game.mp3',
  map: '/audio/bgm/bgm_map.mp3',
};

// ─── State ───────────────────────────────────────────────────────
let muted = false;
let bgmAudio = null;
let bgmVolume = 0.3;
let sfxVolume = 0.5;
let masterVolume = 1.0;
const activeLoopingSFX = new Map();
const loopTimers = new Map();

// ─── SFX ─────────────────────────────────────────────────────────

export function playSound(name) {
  if (muted) return;
  const src = SFX_MAP[name];
  if (!src) return;

  try {
    const audio = new Audio(src);
    audio.volume = sfxVolume * masterVolume;
    audio.play().catch(() => { });
  } catch { }
}

export function startLoopingSFX(name) {
  if (muted || activeLoopingSFX.has(name)) return;
  const src = SFX_MAP[name];
  if (!src) return;

  try {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = sfxVolume * masterVolume;
    audio.play().catch(() => { });
    activeLoopingSFX.set(name, audio);
  } catch { }
}

export function stopLoopingSFX(name) {
  const audio = activeLoopingSFX.get(name);
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch { }
    activeLoopingSFX.delete(name);
  }
}

/**
 * Start a looping SFX with management (handles overlapping calls).
 */
export function startManagedLoop(name) {
  if (loopTimers.has(name)) {
    clearTimeout(loopTimers.get(name));
    loopTimers.delete(name);
  }
  startLoopingSFX(name);
}

/**
 * Stop a looping SFX with a small delay to avoid clicking between consecutive movements.
 */
export function stopManagedLoop(name, delay = 100) {
  if (loopTimers.has(name)) clearTimeout(loopTimers.get(name));

  const timerId = setTimeout(() => {
    stopLoopingSFX(name);
    loopTimers.delete(name);
  }, delay);

  loopTimers.set(name, timerId);
}

// ─── BGM ─────────────────────────────────────────────────────────

export function playBGM(name) {
  stopBGM();
  const src = BGM_MAP[name];
  if (!src) return;

  try {
    bgmAudio = new Audio(src);
    bgmAudio.loop = true;
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
    bgmAudio.play().catch(() => { });
  } catch { }
}

export function stopBGM() {
  if (bgmAudio) {
    try {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      bgmAudio = null;
    } catch {
      bgmAudio = null;
    }
  }
}

// ─── Mute Controls ───────────────────────────────────────────────

export function toggleMute() {
  muted = !muted;
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
}

export function setVolume(value) {
  masterVolume = Math.max(0, Math.min(1, value));
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
}

export function getVolume() { return masterVolume; }
export function isMuted() { return muted; }
