/**
 * Simple Sound Manager for Code Awakens
 * Uses HTML5 Audio API — no extra dependencies needed.
 * 
 * Usage:
 *   import { playSound, playBGM, stopBGM, toggleMute } from '@/gameutils/sound/soundManager';
 *   playSound('hit');      // plays /audio/sfx/sfx_hit.wav
 *   playBGM('game');       // plays /audio/bgm/bgm_game.wav (loops)
 *   stopBGM();             // stops background music
 *   toggleMute();          // mute/unmute all audio
 */

// ─── Sound Registry ─────────────────────────────────────────────
// Maps short names → actual file paths under /audio/
const SFX_MAP = {
  click:    '/audio/sfx/sfx_click.wav',
  coin:     '/audio/sfx/sfx_coin.mp3',
  defeat:   '/audio/sfx/sfx_defeat.wav',
  hit:      '/audio/sfx/sfx_hit.wav',
  level_up: '/audio/sfx/sfx_level_up.wav',
  run:      '/audio/sfx/sfx_run.wav',
  victory:  '/audio/sfx/sfx_victory.mp3',
  walk:           '/audio/sfx/sfx_walk.wav',
  unlock_pattern: '/audio/sfx/sfx_unlock_pattern.wav',
};

const BGM_MAP = {
  game: '/audio/bgm/bgm_game.wav',
  map:  '/audio/bgm/bgm_map.wav',
};

// ─── State ───────────────────────────────────────────────────────
let muted = false;
let bgmAudio = null;
let bgmVolume = 0.3;   // BGM default volume (0-1)
let sfxVolume = 0.5;    // SFX default volume (0-1)
let masterVolume = 1.0; // Global volume (controlled by UI)

// ─── SFX ─────────────────────────────────────────────────────────

/**
 * Play a sound effect once.
 * @param {string} name - Key from SFX_MAP (e.g. 'hit', 'run', 'victory')
 */
export function playSound(name) {
  if (muted) return;
  const src = SFX_MAP[name];
  if (!src) return;

  try {
    const audio = new Audio(src);
    audio.volume = sfxVolume * masterVolume;
    audio.play().catch(() => { /* fail silently — file might not exist */ });
  } catch {
    // fail silently
  }
}

// ─── BGM ─────────────────────────────────────────────────────────

/**
 * Play background music (loops automatically).
 * Stops any currently playing BGM first.
 * @param {string} name - Key from BGM_MAP (e.g. 'game', 'map')
 */
export function playBGM(name) {
  stopBGM();

  const src = BGM_MAP[name];
  if (!src) return;

  try {
    bgmAudio = new Audio(src);
    bgmAudio.loop = true;
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
    bgmAudio.play().catch(() => { /* fail silently */ });
  } catch {
    // fail silently
  }
}

/**
 * Stop background music.
 */
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

/**
 * Toggle mute on/off. Returns new muted state.
 * @returns {boolean} isMuted
 */
export function toggleMute() {
  muted = !muted;
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
  return muted;
}

/**
 * Set muted state directly.
 * @param {boolean} value
 */
export function setMuted(value) {
  muted = !!value;
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
}

/**
 * Set master volume directly.
 * @param {number} value (0.0 - 1.0)
 */
export function setVolume(value) {
  masterVolume = Math.max(0, Math.min(1, value));
  if (bgmAudio) {
    bgmAudio.volume = muted ? 0 : (bgmVolume * masterVolume);
  }
}

/**
 * Get current master volume.
 * @returns {number}
 */
export function getVolume() {
  return masterVolume;
}

/**
 * Check if audio is muted.
 * @returns {boolean}
 */
export function isMuted() {
  return muted;
}
