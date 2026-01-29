
/**
 * Generic Async Utility Functions
 */

/**
 * Returns a Promise that resolves after a specified delay.
 * Replaces setTimeout in async functions.
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a Promise that resolves on the next animation frame.
 * Useful for ensuring DOM updates have rendered before proceeding.
 * @returns {Promise<void>}
 */
export const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

/**
 * Polls for a condition to be true.
 * @param {() => boolean} predicate - Function that returns true when condition is met
 * @param {number} interval - Interval between checks in ms (default 50)
 * @param {number} maxAttempts - Maximum number of checks (default 20)
 * @returns {Promise<boolean>} - True if condition met, False if timed out
 */
export const waitForCondition = async (predicate, interval = 50, maxAttempts = 20) => {
    for (let i = 0; i < maxAttempts; i++) {
        if (predicate()) {
            return true;
        }
        await delay(interval);
    }
    return false;
};
