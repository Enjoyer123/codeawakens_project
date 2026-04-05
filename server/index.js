const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;
const profileRouter = require("./routes/ProfileRoute");
const adminUsersRouter = require("./routes/AdminUserRoute");
const weaponRouter = require("./routes/WeaponRoute");
const levelRouter = require("./routes/LevelRoute");
const rewardRouter = require("./routes/RewardRoute");
const guideRouter = require("./routes/GuideRoute");
const levelHintRouter = require("./routes/LevelHintRoute");
const blockRouter = require("./routes/BlockRoute");
const victoryConditionRouter = require("./routes/VictoryConditionRoute");
const levelCategoryRouter = require("./routes/LevelCategoryRoute");
const patternRouter = require("./routes/PatternRoute");
const testCaseRouter = require("./routes/testCaseRoutes");
const testRouter = require("./routes/testRoutes");
const notificationRouter = require("./routes/NotificationRoute");
const dashboardRouter = require("./routes/dashboardRoutes");
const leaderboardRouter = require("./routes/leaderboardRoutes");
const path = require("path");
const { clerkMiddleware } = require("@clerk/express");
const morgan = require("morgan");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// Morgan HTTP request logging for UAT evidence
app.use(morgan("combined"));
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
    return res.status(400).json({ message: "ไฟล์มีขนาดใหญ่เกินกว่าที่กำหนด" });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "ชื่อ field ของไฟล์ไม่ถูกต้อง" });
  }
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({ message: "ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)" });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
});

app.listen(port);
