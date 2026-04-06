import prisma from "./prisma.js";

// ====== FINDERS ======
export const findUserByClerkId = async (clerkUserId) => prisma.user.findUnique({ where: { clerk_user_id: clerkUserId }, select: { user_id: true, pre_score: true, post_score: true } });
export const findRequiredLevels = async () => prisma.level.findMany({ where: { required_for_post_test: true }, select: { level_id: true, level_name: true } });
export const findCompletedProgress = async (userId, requiredLevelIds) => prisma.userProgress.findMany({ where: { user_id: userId, level_id: { in: requiredLevelIds }, OR: [{ status: "completed" }, { is_correct: true }] }, select: { level_id: true } });
export const findTests = async (where) => prisma.test.findMany({ where, include: { choices: true } });
export const findAllTestsWithChoices = async (typeFilter) => {
  const where = {};
  if (typeFilter === "pre") where.test_type = "PreTest";
  else if (typeFilter === "post") where.test_type = "PostTest";
  return prisma.test.findMany({ where, include: { choices: { orderBy: { test_choice_id: "asc" } } }, orderBy: { test_id: "asc" } });
};

// ====== TRANSACTIONAL UPDATES ======
export const saveTestSubmissionTransaction = async (userId, testType, answersToUpsert, preScore, skillLevel, postScore) => {
  return prisma.$transaction(async (tx) => {
    // Upsert all choices
    const userTestCreates = answersToUpsert.map((ans) => 
      tx.userTest.upsert({
        where: { user_id_test_id: { user_id: userId, test_id: ans.test_id } },
        update: { choice_id: ans.choice_id, is_correct: ans.is_correct, answered_at: new Date() },
        create: { user_id: userId, test_id: ans.test_id, choice_id: ans.choice_id, is_correct: ans.is_correct }
      })
    );
    await Promise.all(userTestCreates);

    // Update user score
    const updateData = {};
    if (testType === "PreTest") {
      updateData.pre_score = preScore;
      if (skillLevel) updateData.skill_level = skillLevel;
    }
    if (testType === "PostTest") updateData.post_score = postScore;
    
    await tx.user.update({ where: { user_id: userId }, data: updateData });
  });
};

export const updateTestTransaction = async (testId, data) => {
  const { test_type, question, description, test_image, choices, is_active, part } = data;
  return prisma.$transaction(async (tx) => {
    await tx.test.update({
      where: { test_id: testId },
      data: { test_type, part: part ? parseInt(part) : null, question, description, test_image, is_active }
    });

    if (choices && Array.isArray(choices)) {
      for (const c of choices) {
        if (c.test_choice_id) {
          await tx.testChoice.update({
            where: { test_choice_id: c.test_choice_id },
            data: { choice_text: c.choice_text, is_correct: c.is_correct, choice_image: c.choice_image }
          });
        } else {
          await tx.testChoice.create({
            data: { test_id: testId, choice_text: c.choice_text, is_correct: c.is_correct || false, choice_image: c.choice_image || null }
          });
        }
      }
    }

    return tx.test.findUnique({
      where: { test_id: testId },
      include: { choices: { orderBy: { test_choice_id: "asc" } } }
    });
  });
};

// ====== CRUD ======
export const createTest = async (data) => {
  const { test_type, question, description, test_image, choices, part } = data;
  return prisma.test.create({
    data: {
      test_type, part: part ? parseInt(part) : null, question, description, test_image,
      choices: {
        create: choices.map((c) => ({ choice_text: c.choice_text, is_correct: c.is_correct || false, choice_image: c.choice_image || null }))
      }
    },
    include: { choices: true }
  });
};
export const deleteTest = async (testId) => prisma.test.delete({ where: { test_id: testId } });
export const deleteTestChoice = async (choiceId) => prisma.testChoice.delete({ where: { test_choice_id: choiceId } });
