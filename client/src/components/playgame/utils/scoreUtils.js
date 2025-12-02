/**
 * Score calculation utilities
 */

/**
 * Calculate final score based on game result, pattern type, and hint usage
 * @param {boolean} isGameOver - Whether the game ended in game over
 * @param {number} patternTypeId - Pattern type ID (1 = good, 2 = medium, etc.)
 * @param {number} hintOpens - Number of times hints were opened
 * @returns {Object} Score data with totalScore, stars, and pattern_bonus_score
 */
export function calculateFinalScore(isGameOver, patternTypeId, hintOpens = 0) {
  if (isGameOver) {
    return { totalScore: 0, stars: 0, pattern_bonus_score: 0 };
  }

  const bestScore = 60;
  let pattern_bonus_score = 0;

  if (patternTypeId === 1) pattern_bonus_score = 40;
  else if (patternTypeId === 2) pattern_bonus_score = 20;

  const hintPenalty = Math.max(0, (hintOpens || 0)) * 5;
  let totalScore = bestScore + pattern_bonus_score - hintPenalty;
  if (totalScore < 0) totalScore = 0;

  let stars = 1;
  if (totalScore >= 90) stars = 3;
  else if (totalScore >= 50) stars = 2;
  else if (totalScore >= 1) stars = 1;

  return { totalScore, stars, pattern_bonus_score };
}

