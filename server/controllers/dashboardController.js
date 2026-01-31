const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({
            where: { role: 'user' }
        });

        const totalLevels = await prisma.level.count();

        // Total completions (correct attempts)
        const totalCompletions = await prisma.userProgress.count({
            where: { is_correct: true }
        });

        const totalStars = await prisma.userProgress.aggregate({
            _sum: { stars_earned: true }
        });

        res.json({
            totalUsers,
            totalLevels,
            totalCompletions,
            totalStars: totalStars._sum.stars_earned || 0
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getLevelStats = async (req, res) => {
    try {
        const levels = await prisma.level.groupBy({
            by: ['category_id'],
            _count: {
                level_id: true,
            },
            orderBy: {
                _count: {
                    level_id: 'desc'
                }
            }
        });

        // Need to fetch category names
        const enrichedStats = await Promise.all(levels.map(async (item) => {
            const category = await prisma.levelCategory.findUnique({
                where: { category_id: item.category_id },
                select: { category_name: true }
            });
            return {
                name: category ? category.category_name : 'Unknown',
                value: item._count.level_id
            };
        }));

        res.json(enrichedStats);
    } catch (error) {
        console.error("Error fetching level stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        // Skill Level Distribution
        const skillDistribution = await prisma.user.groupBy({
            by: ['skill_level'],
            _count: {
                user_id: true
            },
            where: {
                role: 'user',
                skill_level: {
                    not: null
                }
            }
        });

        const formattedSkillStats = skillDistribution.map(item => ({
            name: item.skill_level || 'Unranked',
            value: item._count.user_id
        }));

        res.json({
            skillDistribution: formattedSkillStats
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getTestStats = async (req, res) => {
    try {
        const avgScores = await prisma.user.aggregate({
            _avg: {
                pre_score: true,
                post_score: true
            },
            where: {
                role: 'user',
                pre_score: { not: null },
            }
        });

        res.json([
            {
                name: 'Average Scores',
                pre_test: Math.round(avgScores._avg.pre_score || 0),
                post_test: Math.round(avgScores._avg.post_score || 0)
            }
        ]);
    } catch (error) {
        console.error("Error fetching test stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
