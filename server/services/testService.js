import * as testRepo from "../models/testModel.js";

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const getTestsByType = async (type, clerkUserId) => {
  let testType;
  if (type === "pre") testType = "PreTest";
  else if (type === "post") testType = "PostTest";
  else {
    const err = new Error("Invalid test type"); err.status = 400; throw err;
  }

  // Post-Test prerequisite check
  if (testType === "PostTest" && clerkUserId) {
    const user = await testRepo.findUserByClerkId(clerkUserId);
    if (user) {
      const requiredLevels = await testRepo.findRequiredLevels();
      if (requiredLevels.length > 0) {
        const requiredLevelIds = requiredLevels.map((l) => l.level_id);
        const completedProgress = await testRepo.findCompletedProgress(user.user_id, requiredLevelIds);
        
        const completedIds = completedProgress.map((p) => p.level_id);
        const missingLevels = requiredLevels.filter((l) => !completedIds.includes(l.level_id));
        if (missingLevels.length > 0) {
          const err = new Error("Required levels not completed"); err.status = 403; err.missing_levels = missingLevels; throw err;
        }
      }
    }
  }

  let tests = [];
  if (testType === "PreTest") {
    const parts = [1, 2, 3];
    const QUESTIONS_PER_PART = 5;
    for (const part of parts) {
      const partTests = await testRepo.findTests({ test_type: "PreTest", part, is_active: true });
      const shuffledPartTests = shuffleArray([...partTests]);
      tests = [...tests, ...shuffledPartTests.slice(0, QUESTIONS_PER_PART)];
    }
  } else {
    tests = await testRepo.findTests({ test_type: testType, is_active: true });
  }

  if (!tests || tests.length === 0) return [];

  const processedTests = tests.map((test) => {
    const shuffledChoices = shuffleArray([...test.choices]).map((choice) => ({
      test_choice_id: choice.test_choice_id,
      test_id: choice.test_id,
      choice_text: choice.choice_text,
      choice_image: choice.choice_image,
    }));
    return {
      test_id: test.test_id,
      test_type: test.test_type,
      question: test.question,
      description: test.description,
      test_image: test.test_image,
      choices: shuffledChoices,
    };
  });

  return shuffleArray(processedTests);
}

export const submitTest = async (type, answers, clerkId) => {
  let testType;
  if (type === "pre") testType = "PreTest";
  else if (type === "post") testType = "PostTest";
  else {
    const err = new Error("Invalid test type"); err.status = 400; throw err;
  }

  const user = await testRepo.findUserByClerkId(clerkId);
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  if (testType === "PreTest" && user.pre_score !== null) {
    const err = new Error("You have already completed the Pre-Test."); err.status = 400; throw err;
  }
  if (testType === "PostTest" && user.post_score !== null) {
    const err = new Error("You have already completed the Post-Test."); err.status = 400; throw err;
  }
  if (!answers || !Array.isArray(answers)) {
    const err = new Error("Invalid answers format"); err.status = 400; throw err;
  }

  const totalQuestions = answers.length;

  let score = 0, scoreP1 = 0, scoreP2 = 0, scoreP3 = 0;
  const dbTests = await testRepo.findTests({ test_type: testType, is_active: true });
  const dbTestMap = new Map(dbTests.map((t) => [t.test_id, t]));
  
  const answersToUpsert = [];

  for (const ans of answers) {
    const test = dbTestMap.get(ans.test_id);
    if (!test) continue;
    const selectedChoice = test.choices.find((c) => c.test_choice_id === ans.choice_id);
    const isCorrect = selectedChoice ? selectedChoice.is_correct : false;
    
    if (isCorrect) {
      score++;
      if (testType === "PreTest") {
        if (test.part === 1) scoreP1++;
        else if (test.part === 2) scoreP2++;
        else if (test.part === 3) scoreP3++;
      }
    }
    
    answersToUpsert.push({ test_id: ans.test_id, choice_id: ans.choice_id, is_correct: isCorrect });
  }

  let skillLevel = null;
  if (testType === "PreTest") {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) skillLevel = "Zone_C";
    else if (percentage >= 50) skillLevel = "Zone_B";
    else skillLevel = "Zone_A";
    console.log(`Scoring: ${score}/${totalQuestions} (${percentage.toFixed(1)}%) => Skill: ${skillLevel}`);
  }

  // Execute the transaction in the repository layer
  await testRepo.saveTestSubmissionTransaction(user.user_id, testType, answersToUpsert, score, skillLevel, score);

  return {
    success: true,
    score: score,
    skillLevel: skillLevel,
    details: { p1: scoreP1, p2: scoreP2, p3: scoreP3 },
    total: totalQuestions,
    percentage: (score / totalQuestions) * 100,
  };
}

// ── Admin Functions ──

export const getAllTests = async (typeFilter) => {
  return testRepo.findAllTestsWithChoices(typeFilter);
}

export const createTest = async (data) => {
  const { test_type, question, choices } = data;
  if (!test_type || !question || !choices || !Array.isArray(choices)) {
    const err = new Error("Missing required fields"); err.status = 400; throw err;
  }
  return testRepo.createTest(data);
}

export const updateTest = async (testId, data) => {
  // Pass the complex update transaction directly to the Repo
  return testRepo.updateTestTransaction(testId, data);
}

export const deleteTest = async (testId) => await testRepo.deleteTest(testId);
export const deleteTestChoice = async (choiceId) => await testRepo.deleteTestChoice(choiceId);
