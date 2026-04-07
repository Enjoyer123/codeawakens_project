import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as testService from '../../services/testService.js';
import * as testRepo from '../../models/testModel.js';
import * as profileRepo from '../../models/profileModel.js';

vi.mock('../../models/testModel.js');
vi.mock('../../models/profileModel.js');

describe('Test Service - Evaluation Logic', () => {

  const mockUser = { user_id: 1, clerk_user_id: 'clerk123', pre_score: null, post_score: null };
  
  beforeEach(() => {
    vi.clearAllMocks();
    profileRepo.findUserByClerkIdMinimal.mockResolvedValue(mockUser);
    testRepo.findUserByClerkId.mockResolvedValue(mockUser);
    testRepo.saveTestSubmissionTransaction.mockResolvedValue(true);
  });

  const runTestEvaluation = async (testType, answers, testQuestionsDict) => {
    // Generate a quick mock for testRepo.findTests so it resolves the questions we pass
    testRepo.findTests.mockResolvedValue(Object.values(testQuestionsDict));
    return testService.submitTest(testType, answers, 'clerk123');
  };

  it('should categorize a perfect Pre-test score into Zone_C', async () => {
    // 2 questions, 2 correct answers = 100%
    const mockQuestions = {
      1: { test_id: 1, choices: [{ test_choice_id: 10, is_correct: true }], part: 1 },
      2: { test_id: 2, choices: [{ test_choice_id: 20, is_correct: true }], part: 2 }
    };
    const answers = [
      { test_id: 1, choice_id: 10 },
      { test_id: 2, choice_id: 20 }
    ];

    const result = await runTestEvaluation('pre', answers, mockQuestions);

    expect(result.score).toBe(2);
    expect(result.skillLevel).toBe('Zone_C');
    expect(testRepo.saveTestSubmissionTransaction).toHaveBeenCalledWith(
      1, 'PreTest', expect.any(Array), 2, 'Zone_C', 2
    );
  });

  it('should categorize a 50% Pre-test score into Zone_B', async () => {
    // 2 questions, 1 correct answers = 50%
    const mockQuestions = {
      1: { test_id: 1, choices: [{ test_choice_id: 10, is_correct: true }], part: 1 },
      2: { test_id: 2, choices: [{ test_choice_id: 20, is_correct: true }], part: 2 }
    };
    const answers = [
      { test_id: 1, choice_id: 10 }, // Correct
      { test_id: 2, choice_id: 99 }  // Wrong
    ];

    const result = await runTestEvaluation('pre', answers, mockQuestions);

    expect(result.score).toBe(1);
    expect(result.skillLevel).toBe('Zone_B');
    expect(result.percentage).toBe(50);
  });

  it('should categorize a low Pre-test score (<50%) into Zone_A', async () => {
    // 3 questions, 1 correct = 33%
    const mockQuestions = {
      1: { test_id: 1, choices: [{ test_choice_id: 10, is_correct: true }], part: 1 },
      2: { test_id: 2, choices: [{ test_choice_id: 20, is_correct: true }], part: 2 },
      3: { test_id: 3, choices: [{ test_choice_id: 30, is_correct: true }], part: 3 }
    };
    const answers = [
      { test_id: 1, choice_id: 10 }, // Correct
      { test_id: 2, choice_id: 99 }, // Wrong
      { test_id: 3, choice_id: 99 }  // Wrong
    ];

    const result = await runTestEvaluation('pre', answers, mockQuestions);

    expect(result.score).toBe(1);
    expect(result.skillLevel).toBe('Zone_A');
  });

  it('should not assign a skill level for PostTest', async () => {
    const mockQuestions = {
      1: { test_id: 1, choices: [{ test_choice_id: 10, is_correct: true }], part: 1 }
    };
    const answers = [{ test_id: 1, choice_id: 10 }];

    const result = await runTestEvaluation('post', answers, mockQuestions);

    expect(result.skillLevel).toBeNull(); // PostTests do not alter skillLevel this way
  });

});
