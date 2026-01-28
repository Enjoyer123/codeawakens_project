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
export function calculateFinalScore(isGameOver, patternTypeId, hintOpens = 0, userBigO = null, targetBigO = null, testCaseBonus = 0) {
  if (isGameOver) {
    return { totalScore: 0, stars: 0, pattern_bonus_score: 0 };
  }

  const bestScore = 60;
  let pattern_bonus_score = 0;

  // Pattern Tier Bonus
  if (patternTypeId === 1) {
    pattern_bonus_score = 40; // Good
  } else if (patternTypeId === 2) {
    pattern_bonus_score = 20; // Medium
  }

  // Big O Logic: Subtract 20 if wrong when required, no bonus if correct
  let bigOPenalty = 0;
  if (targetBigO) {
    if (userBigO !== targetBigO) {
      bigOPenalty = 20;
      console.log('❌ Big O Incorrect! Applying -20 penalty.');
    } else {
      console.log('✅ Big O Correct! Full score maintained.');
    }
  }

  const hintPenalty = Math.max(0, (hintOpens || 0)) * 5;

  // Total Score Calculation with Test Case Bonus
  // Ensure testCaseBonus is non-negative
  let safeTestCaseBonus = Math.max(0, testCaseBonus || 0);

  // If pattern bonus is awarded, we do not add test case bonus
  // Reason: Pattern match implies valid solution. BigO will determine 2 vs 3 stars.
  if (pattern_bonus_score > 0) {
    safeTestCaseBonus = 0;
  }

  let totalScore = bestScore + pattern_bonus_score + safeTestCaseBonus - bigOPenalty - hintPenalty;

  if (totalScore < 0) totalScore = 0;
  if (totalScore > 100) totalScore = 100;

  let stars = 1;
  if (totalScore > 80) stars = 3;
  else if (totalScore > 60) stars = 2;
  else if (totalScore >= 1) stars = 1;

  return { totalScore, stars, pattern_bonus_score, bigOPenalty, testCaseBonus: safeTestCaseBonus };
}

