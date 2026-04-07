import { clerkClient } from "@clerk/express";
import { sendError } from "../utils/responseHelper.js";

const authCheck = async (req, res, next) => {
  try {
    // --- BYPASS สำหรับ DEV (ใช้ทดสอบใน Postman) ---
    // ทำงานเฉพาะโหมด Development เท่านั้น (ป้องกันอันตรายบนเซิร์ฟเวอร์จริง)
    const isDevMode = process.env.NODE_ENV !== 'production';
    if (isDevMode && (req.headers['x-dev-user-id'] || req.headers['x-dev-admin-id'])) {
      console.log('[DEV BYPASS] Postman bypass activated!');
      req.user = {
        id: req.headers['x-dev-user-id'] || req.headers['x-dev-admin-id'],
        publicMetadata: { role: req.headers['x-dev-admin-id'] ? 'admin' : 'user' }
      };
      return next();
    }
    // ----------------------------------------------

    const { userId } = req.auth();

    if (!userId) {
      return sendError(res, "Unauthorized: No Clerk Token provided", 401);
    }

    const user = await clerkClient.users.getUser(userId);
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Unauthorized", 401);
  }
}

export default authCheck;
