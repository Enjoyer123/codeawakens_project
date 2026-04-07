import prisma from "../models/prisma.js";
import { sendError } from "../utils/responseHelper.js";

const requireAdmin = async (req, res, next) => {
  try {

    if (!req.user) {
      return sendError(res, "Unauthorized: No user found", 401);
    }
    
    // --- BYPASS สำหรับ DEV (ใช้ทดสอบใน Postman/Swagger) ---
    if (process.env.NODE_ENV !== 'production' && req.user.publicMetadata && req.user.publicMetadata.role === 'admin') {
      console.log('[DEV BYPASS] Admin check bypassed!');
      return next();
    }
    // ----------------------------------------------------

    const clerkId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
    });

    if (!user || user.role !== "admin") {
      return sendError(res, "Forbidden: Admin access required", 403);
    }

    req.currentUser = user;
    next();
  } catch (error) {
    return sendError(res, "Error checking admin status", 500);
  }
};

export default requireAdmin;
