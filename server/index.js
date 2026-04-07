import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { sendError } from "./utils/responseHelper.js";
const app = express();
const port = process.env.PORT || 4000;
import profileRouter from "./routes/ProfileRoute.js";
import adminUsersRouter from "./routes/AdminUserRoute.js";
import weaponRouter from "./routes/WeaponRoute.js";
import levelRouter from "./routes/LevelRoute.js";
import rewardRouter from "./routes/RewardRoute.js";
import guideRouter from "./routes/GuideRoute.js";
import levelHintRouter from "./routes/LevelHintRoute.js";
import blockRouter from "./routes/BlockRoute.js";
import victoryConditionRouter from "./routes/VictoryConditionRoute.js";
import levelCategoryRouter from "./routes/LevelCategoryRoute.js";
import patternRouter from "./routes/PatternRoute.js";
import testCaseRouter from "./routes/testCaseRoutes.js";
import testRouter from "./routes/testRoutes.js";
import notificationRouter from "./routes/NotificationRoute.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import leaderboardRouter from "./routes/leaderboardRoutes.js";
import { setupSwagger } from "./swagger.js";

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import morgan from "morgan";
app.use(morgan('dev'));

// ====== API DOCS ======
setupSwagger(app);


import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// Morgan HTTP request logging for UAT evidence
// app.use(morgan("combined"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(clerkMiddleware());

// ─── API Routes ───
app.use("/api", profileRouter);
app.use("/api", adminUsersRouter);
app.use("/api", weaponRouter);
app.use("/api", levelRouter);
app.use("/api", rewardRouter);
app.use("/api", guideRouter);
app.use("/api", levelHintRouter);
app.use("/api", blockRouter);
app.use("/api", victoryConditionRouter);
app.use("/api", levelCategoryRouter);
app.use("/api", patternRouter);
app.use("/api", testCaseRouter);
app.use("/api", testRouter);
app.use("/api", notificationRouter);
app.use("/api", dashboardRouter);
app.use("/api", leaderboardRouter);

app.get("/", (req, res) => {
  res.send("Hello World - Server is running!");
});

// Global error handler – must be defined after all routes
// Catches multer errors (file size, unexpected field, invalid type) and
// any other errors that are passed via next(err).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, "ไฟล์มีขนาดใหญ่เกินกว่าที่กำหนด", 400);
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return sendError(res, "ชื่อ field ของไฟล์ไม่ถูกต้อง", 400);
  }
  if (err.message && err.message.includes("Invalid file type")) {
    return sendError(res, "ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)", 400);
  }
  
  if (err.message === "Only images are allowed") {
    return sendError(res, "ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)", 400);
  }

  return sendError(res, err.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", err.status || 500);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
