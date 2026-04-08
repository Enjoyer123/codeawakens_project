/**
 * Score calculation utilities for the Backend
 * Copied from Frontend to ensure Server acts as Source of Truth
 */

export function calculateFinalScore(isGameOver, patternTypeId, userBigO = null, targetBigO = null) {
  if (isGameOver) {
    return { totalScore: 0, stars: 0, pattern_bonus_score: 0, bigOPenalty: 0, patternTypeId };
  }

  const baseScore = 60;
  let parsedPatternBonus = 0;

  // Pattern Tier Bonus (Same logic as frontend)
  let parsedPatternTypeId = parseInt(patternTypeId) || 0;
  if (parsedPatternTypeId === 1) {
    parsedPatternBonus = 40; // Good
  } else if (parsedPatternTypeId === 2) {
    parsedPatternBonus = 20; // Medium
  }

  // Big O Logic: Subtract 20 if wrong when required
  let bigOPenalty = 0;
  if (targetBigO) {
    if (userBigO !== targetBigO) {
      bigOPenalty = 20;
    }
  }

  let totalScore = baseScore + parsedPatternBonus - bigOPenalty;

  if (totalScore < 0) totalScore = 0;
  if (totalScore > 100) totalScore = 100;

  let stars = 1;
  if (totalScore > 80) stars = 3;
  else if (totalScore > 60) stars = 2;
  else if (totalScore >= 1) stars = 1;

  return { totalScore, stars, patternBonusScore: parsedPatternBonus, bigOPenalty };
}
