import { clerkClient } from "@clerk/express";

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
      return res.status(401).json({ message: "Unauthorized: No Clerk Token provided" });
    }

    const user = await clerkClient.users.getUser(userId);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export default authCheck;
