const prisma = require("../models/prisma");

async function getLeaderboard() {
  const users = await prisma.user.findMany({
    where: { role: "user", is_active: true },
    select: { user_id: true, username: true, first_name: true, last_name: true, profile_image: true, user_progress: { select: { stars_earned: true } } },
  });

  const leaderboard = users
    .map((user) => {
      const totalStars = user.user_progress.reduce((sum, p) => sum + (p.stars_earned || 0), 0);
      return {
        user_id: user.user_id, username: user.username,
        displayName: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username,
        profile_image: user.profile_image, total_stars: totalStars,
      };
    })
    .sort((a, b) => b.total_stars - a.total_stars)
    .slice(0, 100);

  return leaderboard;
}

module.exports = { getLeaderboard };
