const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let where = {};
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { username: { contains: searchLower, mode: 'insensitive' } },
          { email: { contains: searchLower, mode: 'insensitive' } },
          { first_name: { contains: searchLower, mode: 'insensitive' } },
          { last_name: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        user_id: true,
        clerk_user_id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        role: true,
        is_active: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminClerkId = req.user.id;

    console.log(`[ADMIN] Admin ${adminClerkId} updating role for User ${userId} to "${role}".`);

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.clerk_user_id === req.user.id && role === "user") {
      return res.status(400).json({ message: "Cannot remove your own admin role" });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(userId) },
      data: { role },
      select: {
        user_id: true,
        clerk_user_id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        role: true,
        is_active: true,
      },
    });

    console.log(`[ADMIN] Success: User ${userId} role changed to "${role}" by Admin ${adminClerkId}.`);

    res.json({
      message: "User role updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({ message: "Error updating user role" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
      select: {
        user_id: true,
        clerk_user_id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        pre_score: true,
        post_score: true,
        skill_level: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProgress = await prisma.userProgress.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: {
        completed_at: 'desc',
      },
    });

    const userRewards = await prisma.userReward.findMany({
      where: { user_id: parseInt(userId) },
      include: {
        reward: true,
      },
      orderBy: {
        earned_at: 'desc',
      },
    });

    const responseData = {
      user: user,
      user_progress: userProgress,
      user_reward: userRewards,
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminClerkId = req.user.id;

    console.log(`[ADMIN] Admin ${adminClerkId} attempting to delete User ${userId}.`);

    const targetUser = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.clerk_user_id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { user_id: parseInt(userId) },
    });

    console.log(`[ADMIN] Success: User ${userId} (${targetUser.username}) deleted by Admin ${adminClerkId}.`);

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

exports.resetUserTestScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.body; // 'pre' or 'post'
    const adminClerkId = req.user.id;

    console.log(`[ADMIN] Admin ${adminClerkId} resetting ${type}-test score for User ${userId}.`);

    if (!['pre', 'post'].includes(type)) {
      return res.status(400).json({ message: "Invalid test type. Use 'pre' or 'post'." });
    }

    const updateData = {};
    if (type === 'pre') updateData.pre_score = null;
    if (type === 'post') updateData.post_score = null;

    const targetTestType = type === 'pre' ? 'PreTest' : 'PostTest';

    await prisma.$transaction(async (prisma) => {
      // 1. Reset Score
      await prisma.user.update({
        where: { user_id: parseInt(userId) },
        data: updateData
      });

      // 2. Delete UserTest history for this test type
      await prisma.userTest.deleteMany({
        where: {
          user_id: parseInt(userId),
          test: {
            test_type: targetTestType
          }
        }
      });
    });

    console.log(`[ADMIN] Success: Reset ${type}-test score for User ${userId} by Admin ${adminClerkId}.`);

    res.json({
      message: `Reset ${type}-test score and history successfully`
    });

  } catch (error) {
    console.error("Error resetting score:", error);
    res.status(500).json({ message: "Error resetting score" });
  }
};

exports.getUserTestHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all test answers for this user
    const userTests = await prisma.userTest.findMany({
      where: { user_id: parseInt(userId) },
      include: {
        test: {
          include: {
            choices: true // To find correct answer
          }
        },
        choice: true
      },
      orderBy: {
        answered_at: 'desc'
      }
    });

    // Group by test type? Or just send flat list and let frontend handle?
    // Let's send a structured response.

    const history = userTests.map(record => {
      const correctAnswer = record.test.choices.find(c => c.is_correct);
      return {
        test_id: record.test_id,
        test_type: record.test.test_type,
        question: record.test.question,
        user_choice: record.choice ? record.choice.choice_text : "No Answer",
        is_correct: record.is_correct,
        correct_choice: correctAnswer ? correctAnswer.choice_text : "Unknown",
        answered_at: record.answered_at
      };
    });

    res.json(history);

  } catch (error) {
    console.error("Error fetching test history:", error);
    res.status(500).json({ message: "Error fetching test history" });
  }
};