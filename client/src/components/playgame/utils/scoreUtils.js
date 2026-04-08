/**
 * Score calculation utilities
 * 
 * Formula: totalScore = 60 (base) + patternBonus (0/20/40) - bigOPenalty (0/20)
 */

/**
 * Calculate final score based on game result and pattern type
 * @param {boolean} isGameOver - Whether the game ended in game over
 * @param {number} patternTypeId - Pattern type ID (1 = good, 2 = medium)
 * @param {string|null} userBigO - User's Big O answer
 * @param {string|null} targetBigO - Expected Big O answer
 * @returns {Object} Score data with totalScore, stars, and pattern_bonus_score
 */
export function calculateFinalScore(isGameOver, patternTypeId, userBigO = null, targetBigO = null) {
  if (isGameOver) {
    return { totalScore: 0, stars: 0, pattern_bonus_score: 0 };
  }

  const baseScore = 60;
  let pattern_bonus_score = 0;

  // Pattern Tier Bonus
  if (patternTypeId === 1) {
    pattern_bonus_score = 40; // Good
  } else if (patternTypeId === 2) {
    pattern_bonus_score = 20; // Medium
  }

  // Big O Logic: Subtract 20 if wrong when required
  let bigOPenalty = 0;
  if (targetBigO) {
    if (userBigO !== targetBigO) {
      bigOPenalty = 20;
    }
  }

  let totalScore = baseScore + pattern_bonus_score - bigOPenalty;

  if (totalScore < 0) totalScore = 0;
  if (totalScore > 100) totalScore = 100;

  let stars = 1;
  if (totalScore > 80) stars = 3;
  else if (totalScore > 60) stars = 2;
  else if (totalScore >= 1) stars = 1;

  return { totalScore, stars, pattern_bonus_score, bigOPenalty, patternTypeId };
}

