/**
 * Score calculation utilities for the Backend
 * Copied from Frontend to ensure Server acts as Source of Truth
 */

export function calculateFinalScore(isGameOver, pattern_bonus_score, userBigO = null, targetBigO = null) {
  if (isGameOver) {
    return { totalScore: 0, stars: 0, pattern_bonus_score: 0, bigOPenalty: 0 };
  }

  const baseScore = 60;
  
  // We trust the pattern_bonus_score passed from the frontend for now, 
  // since verifying Blockly code patterns server-side is extremely complex.
  // Validate it falls into allowed buckets
  let parsedPatternBonus = parseInt(pattern_bonus_score) || 0;
  if (![0, 20, 40].includes(parsedPatternBonus)) {
    parsedPatternBonus = 0; // fallback to 0 if manipulated
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
