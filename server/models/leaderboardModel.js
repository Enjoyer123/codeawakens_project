import prisma from "./prisma.js";

export const getLeaderboardUsers = async () => {
  return await prisma.user.findMany({
    where: { role: "user", is_active: true },
    select: { user_id: true, username: true, first_name: true, last_name: true, profile_image: true, user_progress: { select: { stars_earned: true } } },
  });
};
