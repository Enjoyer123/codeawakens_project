const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper to shuffle array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

exports.getTestsByType = async (req, res) => {
  try {
    const { type } = req.params; // 'pre' or 'post'

    let testType;
    if (type === 'pre') testType = 'PreTest';
    else if (type === 'post') testType = 'PostTest';
    else return res.status(400).json({ message: "Invalid test type" });

    // 0. Pre-check: If Post-Test, check if user has completed required levels
    if (testType === 'PostTest' && req.user && req.user.id) {
      // Only valid if request comes with auth token (should be standard for tests)
      const user = await prisma.user.findUnique({
        where: { clerk_user_id: req.user.id },
        select: { user_id: true }
      });

      if (user) {
        // Get all levels required for Post Test
        const requiredLevels = await prisma.level.findMany({
          where: { required_for_post_test: true },
          select: { level_id: true, level_name: true }
        });

        if (requiredLevels.length > 0) {
          // Check user progress on these levels
          const requiredLevelIds = requiredLevels.map(l => l.level_id);

          const completedProgress = await prisma.userProgress.findMany({
            where: {
              user_id: user.user_id,
              level_id: { in: requiredLevelIds },
              OR: [
                { status: 'completed' },
                { is_correct: true } // Some legacy records might use this
              ]
            },
            select: { level_id: true }
          });

          const completedIds = completedProgress.map(p => p.level_id);
          const missingLevels = requiredLevels.filter(l => !completedIds.includes(l.level_id));

          if (missingLevels.length > 0) {
            return res.status(403).json({
              message: "Required levels not completed",
              missing_levels: missingLevels
            });
          }
        }
      }
    }

    // 1. Fetch questions and choices
    const tests = await prisma.test.findMany({
      where: {
        test_type: testType,
        is_active: true,
      },
      include: {
        choices: true, // Fetch all choices
      },
    });

    if (!tests || tests.length === 0) {
      return res.json([]);
    }

    // 2. Process for client: Shuffle questions & choices, remove is_correct
    const processedTests = tests.map(test => {
      // Shuffle choices
      const shuffledChoices = shuffleArray([...test.choices]).map(choice => ({
        test_choice_id: choice.test_choice_id,
        test_id: choice.test_id,
        choice_text: choice.choice_text,
        // OMIT is_correct
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

    // 3. Shuffle questions order
    const shuffiedTests = shuffleArray(processedTests);

    res.json(shuffiedTests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ message: "Error fetching tests", error: error.message });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const { type, answers } = req.body; // answers: [{ test_id, choice_id }]
    const clerkId = req.user.id; // From Clerk Object

    // Find User in DB
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: { user_id: true }
    });

    const user_id = user.user_id;

    let testType;
    if (type === 'pre') testType = 'PreTest';
    else if (type === 'post') testType = 'PostTest';
    else return res.status(400).json({ message: "Invalid test type" });

    // Check if user already has a score for this test type
    if (testType === 'PreTest' && user.pre_score !== null && user.pre_score !== undefined) {
      return res.status(400).json({ message: "You have already completed the Pre-Test." });
    }
    if (testType === 'PostTest' && user.post_score !== null && user.post_score !== undefined) {
      return res.status(400).json({ message: "You have already completed the Post-Test." });
    }

    // Check (need to fetch fields first, findUnique above only selected user_id)
    // Actually optimize: fetch scores in the first query.
    const userWithScores = await prisma.user.findUnique({
      where: { user_id: user_id },
      select: { pre_score: true, post_score: true }
    });

    if (testType === 'PreTest' && userWithScores.pre_score !== null) {
      return res.status(400).json({ message: "You have already completed the Pre-Test." });
    }
    if (testType === 'PostTest' && userWithScores.post_score !== null) {
      return res.status(400).json({ message: "You have already completed the Post-Test." });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers format" });
    }



    // 1. Fetch correct answers from DB
    // We need to verify each submitted answer
    let score = 0;
    const totalQuestions = answers.length;

    // Use transaction to ensure data integrity
    const result = await prisma.$transaction(async (prisma) => {
      // Clear previous attempts for this test type if necessary? 
      // Requirement says "store in user_test", implies history or single latest attempt.
      // Usually pre-test is done once. But let's assume we just add new records or update.
      // For simplicity, we'll delete old answers for this specific test type to keep "latest" attempt,
      // OR we just append. Schema has @@unique([user_id, test_id]), so we must update or delete old.
      // Let's delete old answers for the tests matching this type first (or upsert).

      // Get all active tests to check correctness
      const dbTests = await prisma.test.findMany({
        where: { test_type: testType, is_active: true },
        include: { choices: true }
      });

      const dbTestMap = new Map(dbTests.map(t => [t.test_id, t]));

      const userTestCreates = [];

      for (const ans of answers) {
        const test = dbTestMap.get(ans.test_id);
        if (!test) continue; // Invalid test_id or inactive

        const selectedChoice = test.choices.find(c => c.test_choice_id === ans.choice_id);
        const isCorrect = selectedChoice ? selectedChoice.is_correct : false;

        if (isCorrect) {
          score++;
        }

        // Prepare for upsert/create
        // Because of @@unique([user_id, test_id]), we use upsert
        userTestCreates.push(
          prisma.userTest.upsert({
            where: {
              user_id_test_id: {
                user_id: user_id,
                test_id: ans.test_id
              }
            },
            update: {
              choice_id: ans.choice_id,
              is_correct: isCorrect,
              answered_at: new Date()
            },
            create: {
              user_id: user_id,
              test_id: ans.test_id,
              choice_id: ans.choice_id,
              is_correct: isCorrect
            }
          })
        );
      }

      await Promise.all(userTestCreates);

      // Update User Score
      const updateData = {};
      if (testType === 'PreTest') updateData.pre_score = score;
      if (testType === 'PostTest') updateData.post_score = score;

      await prisma.user.update({
        where: { user_id },
        data: updateData
      });

      return score;
    });

    res.json({
      success: true,
      score: result,
      total: totalQuestions,
      percentage: (result / totalQuestions) * 100
    });

  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Error submitting test", error: error.message });
  }
};

// --- ADMIN FUNCTIONS ---

// Get all tests (Admin - no shuffle, include correct answers)
exports.getAllTests = async (req, res) => {
  try {
    const { type } = req.query; // Optional filter by type

    const where = {};
    if (type) {
      if (type === 'pre') where.test_type = 'PreTest';
      else if (type === 'post') where.test_type = 'PostTest';
    }

    const tests = await prisma.test.findMany({
      where: where,
      include: {
        choices: {
          orderBy: { test_choice_id: 'asc' }
        },
      },
      orderBy: {
        test_id: 'asc',
      },
    });

    res.json(tests);
  } catch (error) {
    console.error("Error fetching all tests:", error);
    res.status(500).json({ message: "Error fetching tests", error: error.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { test_type, question, description, test_image, choices } = req.body;

    if (!test_type || !question || !choices || !Array.isArray(choices)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate at least one correct answer?
    // Not strictly required but good practice.

    const newTest = await prisma.test.create({
      data: {
        test_type, // 'PreTest' or 'PostTest'
        question,
        description,
        test_image,
        choices: {
          create: choices.map(c => ({
            choice_text: c.choice_text,
            is_correct: c.is_correct || false
          }))
        }
      },
      include: {
        choices: true
      }
    });

    res.status(201).json(newTest);
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({ message: "Error creating test", error: error.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { test_type, question, description, test_image, choices, is_active } = req.body;

    // Transaction to update test and replace choices
    const updatedTest = await prisma.$transaction(async (prisma) => {
      // 1. Update Test fields
      const test = await prisma.test.update({
        where: { test_id: parseInt(id) },
        data: {
          test_type,
          question,
          description,
          test_image,
          is_active
        }
      });

      // 2. Update Choices
      // Strategy: Delete all existing choices and re-create them? 
      // Or try to match IDs? Re-creating is safer/easier for validity, 
      // but UserTests reference choice_id. 
      // IF UserTests reference choice_id, deleting choices will fail or cascade delete user history!
      // Schema: UserTest -> choice_id (foreign key).
      // TestChoice model has `user_tests UserTest[]`.
      // Relation `test           Test        @relation(fields: [test_id], references: [test_id], onDelete: Cascade)`
      // Relation `choice       TestChoice?  @relation(fields: [choice_id], references: [test_choice_id])`
      // If we delete choices, we might lose history or violate FK if restricted.
      // Usually better to update existing if possible, or create new ones.

      // Let's check choices input. If it has id, update. If no id, create.
      // If id missing from input but exists in DB, delete? (Dangerous if history exists).
      // For now, simpler approach: Update fields if ID provided, create if new. 
      // Deleting specific choices might be restricted if used.

      // We will perform updates for existing IDs and creates for new ones.
      // We won't delete missing IDs automatically to preserve history, 
      // unless user explicitly deletes them (which we can implement if needed).

      if (choices && Array.isArray(choices)) {
        for (const c of choices) {
          if (c.test_choice_id) {
            // Update
            await prisma.testChoice.update({
              where: { test_choice_id: c.test_choice_id },
              data: {
                choice_text: c.choice_text,
                is_correct: c.is_correct
              }
            });
          } else {
            // Create
            await prisma.testChoice.create({
              data: {
                test_id: parseInt(id),
                choice_text: c.choice_text,
                is_correct: c.is_correct || false
              }
            });
          }
        }
      }

      // 3. Return updated
      return prisma.test.findUnique({
        where: { test_id: parseInt(id) },
        include: { choices: { orderBy: { test_choice_id: 'asc' } } }
      });
    });

    res.json(updatedTest);

  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).json({ message: "Error updating test", error: error.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Prisma configured with onDelete: Cascade for choices?
    // Schema: 
    // test           Test        @relation(fields: [test_id], references: [test_id], onDelete: Cascade)
    // So deleting Test will delete Choices.
    // user_tests also has onDelete: Cascade for Test.

    await prisma.test.delete({
      where: { test_id: parseInt(id) }
    });

    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({ message: "Error deleting test", error: error.message });
  }
};

exports.deleteTestChoice = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.testChoice.delete({
      where: { test_choice_id: parseInt(id) }
    });
    res.json({ message: "Choice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting choice", error: error.message });
  }
}

exports.uploadTestImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Return relative path from uploads root or just filename if client handles path
    // Usually we return `tests/${req.file.filename}` or similar if static serve is set up
    // Based on other controllers, we might just return the filename or full path.
    // Let's return the filename and let frontend/backend logic handle the rest, 
    // OR return a relative path like `tests/${req.file.filename}` 
    // to match how we might serve it.

    // User requested path format: /uploads/tests/filename
    const filePath = `/uploads/tests/${req.file.filename}`;

    res.json({
      message: "Image uploaded successfully",
      path: filePath,
      filename: req.file.filename
    });

  } catch (error) {
    console.error("Error uploading test image:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

