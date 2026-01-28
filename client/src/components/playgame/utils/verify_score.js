
function calculateFinalScore(isGameOver, patternTypeId, hintOpens = 0, userBigO = null, targetBigO = null, testCaseBonus = 0) {
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

console.log("Running Verification Tests...");

// Case 1: Good Pattern (40), Wrong BigO (-20), TestCaseBonus (20). 
// Old: 60 + 40 + 20 - 20 = 100.
// New: 60 + 40 + 0 - 20 = 80.
const case1 = calculateFinalScore(false, 1, 0, "O(n)", "O(1)", 20);
console.log("Case 1 (Good Pattern, Wrong BigO):", case1.totalScore, "Expected: 80");
if (case1.totalScore !== 80) console.error("FAILED Case 1");

// Case 2: Good Pattern (40), Correct BigO (0), TestCaseBonus (20).
// New: 60 + 40 + 0 - 0 = 100.
const case2 = calculateFinalScore(false, 1, 0, "O(1)", "O(1)", 20);
console.log("Case 2 (Good Pattern, Correct BigO):", case2.totalScore, "Expected: 100");
if (case2.totalScore !== 100) console.error("FAILED Case 2");

// Case 3: No Pattern (0), TestCaseBonus (20).
// New: 60 + 0 + 20 - 0 = 80.
const case3 = calculateFinalScore(false, 0, 0, null, null, 20);
console.log("Case 3 (No Pattern, TestCaseBonus):", case3.totalScore, "Expected: 80");
if (case3.totalScore !== 80) console.error("FAILED Case 3");

// Case 4: Medium Pattern (20), Wrong BigO (-20), TestCaseBonus (20).
// New: 60 + 20 + 0 - 20 = 60.
const case4 = calculateFinalScore(false, 2, 0, "O(n)", "O(1)", 20);
console.log("Case 4 (Medium Pattern, Wrong BigO):", case4.totalScore, "Expected: 60");
if (case4.totalScore !== 60) console.error("FAILED Case 4");
