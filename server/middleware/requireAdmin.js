import prisma from "../models/prisma.js";

const requireAdmin = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }
    const clerkId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking admin status" });
  }
};

export default requireAdmin;
