import { describe, it, expect } from 'vitest';
import { calculateFinalScore } from '../../utils/scoreUtils.js';

describe('Backend Score Utilities', () => {

  it('should return 0 score and 0 stars if game is over', () => {
    const result = calculateFinalScore(true, 40, 'O(1)', 'O(1)');
    expect(result.totalScore).toBe(0);
    expect(result.stars).toBe(0);
  });

  it('should calculate perfect score (100) with good pattern and correct Big O', () => {
    const result = calculateFinalScore(false, 40, 'O(N)', 'O(N)');
    expect(result.totalScore).toBe(100);
    expect(result.stars).toBe(3);
    expect(result.bigOPenalty).toBe(0);
  });

  it('should calculate base score (80) with medium pattern and correct Big O', () => {
    const result = calculateFinalScore(false, 20, 'O(N^2)', 'O(N^2)');
    expect(result.totalScore).toBe(80);
    expect(result.stars).toBe(2);
  });

  it('should apply 20 penalty points if Big O is incorrect', () => {
    // Bad Big O but best pattern
    const result = calculateFinalScore(false, 40, 'O(N)', 'O(1)');
    // 60 (base) + 40 (pattern) - 20 (penalty) = 80
    expect(result.totalScore).toBe(80);
    expect(result.stars).toBe(2);
    expect(result.bigOPenalty).toBe(20);
  });

  it('should protect against injected high pattern bonus score', () => {
    // Fake hacked pattern bonus
    const result = calculateFinalScore(false, 9999, 'O(N)', 'O(N)');
    // Invalid bonus becomes 0. Score: 60 + 0 - 0 = 60
    expect(result.totalScore).toBe(60);
    expect(result.stars).toBe(1);
    expect(result.patternBonusScore).toBe(0);
  });

});
