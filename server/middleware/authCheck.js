const { clerkClient } = require("@clerk/express");

const authCheck = async (req, res, next) => {
  try {
    const { userId } = req.auth();
   
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
   
    const user = await clerkClient.users.getUser(userId);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = authCheck;
