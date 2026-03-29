/**
 * AnimationController.js — Module-level singleton (Functional style)
 *
 * ฟีเจอร์:
 *   - pause()   → หยุดชั่วคราว
 *   - resume()  → เล่นต่อ
 *   - step()    → เดินไป 1 step แล้ว pause ใหม่
 *   - reset()   → คืนค่าเริ่มต้น (เรียกตอนเริ่ม run ใหม่)
 *   - abort()   → หยุดทันที (ใช้ตอนออกจากด่าน)
 *   - sleep(ms) → ใช้แทน setTimeout ใน playback files
 *
 * วิธีใช้ใน playback:
 *   import { animationController } from './AnimationController';
 *   const sleep = (ms) => animationController.sleep(ms);
 */

// ── Private state (module-level closure) ─────────────────────────────────────
let _paused      = false;
let _pauseOnNext = false;
let _aborted     = false;
let _speed       = 1.0;   // 0.25 = slow … 4.0 = fast
let _listeners   = [];
let _pauseResolve = null;

// ── Private helpers ───────────────────────────────────────────────────────────
function _notify() {
    const state = { isPaused: _paused, isAborted: _aborted };
    _listeners.forEach(fn => { try { fn(state); } catch (_) {} });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Replacement for `setTimeout` based sleep.
 * หาก _aborted=true จะ resolve ทันทีโดยไม่รอเวลา
 * @param {number} ms
 */
async function sleep(ms) {
    if (_aborted) return;

    if (_pauseOnNext) {
        _pauseOnNext = false;
        _paused = true;
        _notify();
    }

    while (_paused && !_aborted) {
        await new Promise(resolve => { _pauseResolve = resolve; });
    }

    if (_aborted) return;

    // ปรับ delay ตาม speed (speed 2x = หน่วงครึ่งหนึ่ง)
    const adjusted = Math.max(0, ms / Math.max(0.1, _speed));

    // แบ่งเป็น chunk เพื่อเช็ค abort ระหว่าง sleep
    const chunkMs = 50;
    let elapsed = 0;
    while (elapsed < adjusted) {
        if (_aborted) return;
        const wait = Math.min(chunkMs, adjusted - elapsed);
        await new Promise(res => setTimeout(res, wait));
        elapsed += wait;
    }
}

/** Pause the animation */
function pause() {
    if (_aborted) return;
    _paused = true;
    _notify();
}

/** Resume the animation (play continuously) */
function resume() {
    if (_aborted) return;
    _paused = false;
    _pauseOnNext = false;
    if (_pauseResolve) { _pauseResolve(); _pauseResolve = null; }
    _notify();
}

/** Advance exactly one step, then pause again at the next sleep() */
function step() {
    if (!_paused || _aborted) return;
    _pauseOnNext = true;
    _paused = false;
    if (_pauseResolve) { _pauseResolve(); _pauseResolve = null; }
}

/**
 * Abort immediately — ใช้เมื่อออกจากด่าน
 * ต้องเรียก reset() ก่อน run ใหม่
 */
function abort() {
    _aborted     = true;
    _paused      = false;
    _pauseOnNext = false;
    if (_pauseResolve) { _pauseResolve(); _pauseResolve = null; }
    _notify();
}

/** Reset to initial state (เรียกก่อนเริ่ม run ใหม่) */
function reset() {
    _paused      = false;
    _pauseOnNext = false;
    _aborted     = false;
    // ไม่ reset _speed เพราะ user อาจตั้งไว้ก่อน run
    if (_pauseResolve) { _pauseResolve(); _pauseResolve = null; }
    _notify();
}

/**
 * Set playback speed multiplier
 * @param {number} v  0.25 = 0.25x (ช้ามาก) … 4.0 = 4x (เร็วมาก)
 */
function setSpeed(v) {
    _speed = Math.max(0.1, Math.min(8, v));
    _notify();
}

/**
 * Subscribe to state changes.
 * @param {Function} fn  callback({ isPaused, isAborted })
 * @returns {Function}   unsubscribe
 */
function subscribe(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
}

// ── Singleton export ──────────────────────────────────────────────────────────
export const animationController = {
    get isPaused()  { return _paused;  },
    get isAborted() { return _aborted; },
    get speed()     { return _speed;   },
    sleep,
    pause,
    resume,
    step,
    abort,
    reset,
    setSpeed,
    subscribe,
};

/**
 * Async Generator สำหรับหมุนลูป Trace ทีละ step
 * Pause อัตโนมัติก่อนอ่าน step แรก — abort ทำให้ generator หยุดส่งค่า
 */
export async function* createTraceBuffer(trace) {
    if (trace && trace.length > 0) {
        await sleep(10); // ยึดสถานะ _paused ที่ algoRunner เซ็ตไว้
    }
    for (let i = 0; i < trace.length; i++) {
        if (_aborted) return;
        yield trace[i];
    }
}
