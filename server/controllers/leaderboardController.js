const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLeaderboard = async (req, res) => {
    try {
        const clerkId = req.user?.id || 'anonymous';
        console.log(`[LEADERBOARD] User ${clerkId} viewing leaderboard.`);

        const users = await prisma.user.findMany({
            where: {
                role: 'user',
                is_active: true
            },
            select: {
                user_id: true,
                username: true,
                first_name: true,
                last_name: true,
                profile_image: true,
                user_progress: {
                    select: {
                        stars_earned: true
                    }
                }
            }
        });

        // Calculate total stars for each user
        const leaderboard = users.map(user => {
            const totalStars = user.user_progress.reduce((sum, progress) => sum + (progress.stars_earned || 0), 0);
            return {
                user_id: user.user_id,
                username: user.username,
                displayName: user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username,
                profile_image: user.profile_image,
                total_stars: totalStars
            };
        });

        // Sort by total stars descending
        leaderboard.sort((a, b) => b.total_stars - a.total_stars);

        // Limit to top 100
        const top100 = leaderboard.slice(0, 100);

        res.status(200).json(top100);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};
