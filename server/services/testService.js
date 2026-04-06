const prisma = require("../models/prisma");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function getTestsByType(type, clerkUserId) {
  let testType;
  if (type === "pre") testType = "PreTest";
  else if (type === "post") testType = "PostTest";
  else { const err = new Error("Invalid test type"); err.status = 400; throw err; }

  // Post-Test prerequisite check
  if (testType === "PostTest" && clerkUserId) {
    const user = await prisma.user.findUnique({ where: { clerk_user_id: clerkUserId }, select: { user_id: true } });
    if (user) {
      const requiredLevels = await prisma.level.findMany({ where: { required_for_post_test: true }, select: { level_id: true, level_name: true } });
      if (requiredLevels.length > 0) {
        const requiredLevelIds = requiredLevels.map((l) => l.level_id);
        const completedProgress = await prisma.userProgress.findMany({
          where: { user_id: user.user_id, level_id: { in: requiredLevelIds }, OR: [{ status: "completed" }, { is_correct: true }] },
          select: { level_id: true },
        });
        const completedIds = completedProgress.map((p) => p.level_id);
        const missingLevels = requiredLevels.filter((l) => !completedIds.includes(l.level_id));
        if (missingLevels.length > 0) {
          const err = new Error("Required levels not completed");
          err.status = 403;
          err.missing_levels = missingLevels;
          throw err;
        }
      }
    }
  }

  let tests = [];
  if (testType === "PreTest") {
    const parts = [1, 2, 3];
    const QUESTIONS_PER_PART = 5;
    for (const part of parts) {
      const partTests = await prisma.test.findMany({ where: { test_type: "PreTest", part, is_active: true }, include: { choices: true } });
      const shuffledPartTests = shuffleArray([...partTests]);
      tests = [...tests, ...shuffledPartTests.slice(0, QUESTIONS_PER_PART)];
    }
  } else {
    tests = await prisma.test.findMany({ where: { test_type: testType, is_active: true }, include: { choices: true } });
  }

  if (!tests || tests.length === 0) return [];

  const processedTests = tests.map((test) => {
    const shuffledChoices = shuffleArray([...test.choices]).map((choice) => ({
      test_choice_id: choice.test_choice_id, test_id: choice.test_id,
      choice_text: choice.choice_text, choice_image: choice.choice_image,
    }));
    return { test_id: test.test_id, test_type: test.test_type, question: test.question, description: test.description, test_image: test.test_image, choices: shuffledChoices };
  });

  return shuffleArray(processedTests);
}

async function submitTest(type, answers, clerkId) {
  let testType;
  if (type === "pre") testType = "PreTest";
  else if (type === "post") testType = "PostTest";
  else { const err = new Error("Invalid test type"); err.status = 400; throw err; }

  const user = await prisma.user.findUnique({ where: { clerk_user_id: clerkId }, select: { user_id: true, pre_score: true, post_score: true } });
  if (!user) { const err = new Error("User not found"); err.status = 404; throw err; }

  if (testType === "PreTest" && user.pre_score !== null) { const err = new Error("You have already completed the Pre-Test."); err.status = 400; throw err; }
  if (testType === "PostTest" && user.post_score !== null) { const err = new Error("You have already completed the Post-Test."); err.status = 400; throw err; }
  if (!answers || !Array.isArray(answers)) { const err = new Error("Invalid answers format"); err.status = 400; throw err; }

  const totalQuestions = answers.length;

  const result = await prisma.$transaction(async (tx) => {
    let score = 0, scoreP1 = 0, scoreP2 = 0, scoreP3 = 0;

    const dbTests = await tx.test.findMany({ where: { test_type: testType, is_active: true }, include: { choices: true } });
    const dbTestMap = new Map(dbTests.map((t) => [t.test_id, t]));
    const userTestCreates = [];

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
      userTestCreates.push(
        tx.userTest.upsert({
          where: { user_id_test_id: { user_id: user.user_id, test_id: ans.test_id } },
          update: { choice_id: ans.choice_id, is_correct: isCorrect, answered_at: new Date() },
          create: { user_id: user.user_id, test_id: ans.test_id, choice_id: ans.choice_id, is_correct: isCorrect },
        })
      );
    }
    await Promise.all(userTestCreates);

    let skillLevel = null;
    if (testType === "PreTest") {
      const percentage = (score / totalQuestions) * 100;
      if (percentage >= 80) skillLevel = "Zone_C";
      else if (percentage >= 50) skillLevel = "Zone_B";
      else skillLevel = "Zone_A";
      console.log(`Scoring: ${score}/${totalQuestions} (${percentage.toFixed(1)}%) => Skill: ${skillLevel}`);
    }

    const updateData = {};
    if (testType === "PreTest") { updateData.pre_score = score; if (skillLevel) updateData.skill_level = skillLevel; }
    if (testType === "PostTest") updateData.post_score = score;
    await tx.user.update({ where: { user_id: user.user_id }, data: updateData });

    return { score, skillLevel, scoreP1, scoreP2, scoreP3 };
  });

  return { success: true, score: result.score, skillLevel: result.skillLevel, details: { p1: result.scoreP1, p2: result.scoreP2, p3: result.scoreP3 }, total: totalQuestions, percentage: (result.score / totalQuestions) * 100 };
}

// ── Admin Functions ──

async function getAllTests(typeFilter) {
  const where = {};
  if (typeFilter === "pre") where.test_type = "PreTest";
  else if (typeFilter === "post") where.test_type = "PostTest";
  return prisma.test.findMany({ where, include: { choices: { orderBy: { test_choice_id: "asc" } } }, orderBy: { test_id: "asc" } });
}

async function createTest(data) {
  const { test_type, question, description, test_image, choices, part } = data;
  if (!test_type || !question || !choices || !Array.isArray(choices)) {
    const err = new Error("Missing required fields"); err.status = 400; throw err;
  }
  return prisma.test.create({
    data: {
      test_type, part: part ? parseInt(part) : null, question, description, test_image,
      choices: { create: choices.map((c) => ({ choice_text: c.choice_text, is_correct: c.is_correct || false, choice_image: c.choice_image || null })) },
    },
    include: { choices: true },
  });
}

async function updateTest(testId, data) {
  const { test_type, question, description, test_image, choices, is_active, part } = data;

  return prisma.$transaction(async (tx) => {
    await tx.test.update({
      where: { test_id: testId },
      data: { test_type, part: part ? parseInt(part) : null, question, description, test_image, is_active },
    });

    if (choices && Array.isArray(choices)) {
      for (const c of choices) {
        if (c.test_choice_id) {
          await tx.testChoice.update({ where: { test_choice_id: c.test_choice_id }, data: { choice_text: c.choice_text, is_correct: c.is_correct, choice_image: c.choice_image } });
        } else {
          await tx.testChoice.create({ data: { test_id: testId, choice_text: c.choice_text, is_correct: c.is_correct || false, choice_image: c.choice_image || null } });
        }
      }
    }

    return tx.test.findUnique({ where: { test_id: testId }, include: { choices: { orderBy: { test_choice_id: "asc" } } } });
  });
}

async function deleteTest(testId) {
  await prisma.test.delete({ where: { test_id: testId } });
}

async function deleteTestChoice(choiceId) {
  await prisma.testChoice.delete({ where: { test_choice_id: choiceId } });
}

module.exports = { getTestsByType, submitTest, getAllTests, createTest, updateTest, deleteTest, deleteTestChoice };
