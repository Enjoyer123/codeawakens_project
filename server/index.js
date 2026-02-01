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
const path = require("path");
const { clerkMiddleware } = require("@clerk/express");

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(clerkMiddleware());

app.use("/api/profile", profileRouter);
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
app.use("/api/test-cases", testCaseRouter);
app.use("/api/tests", testRouter);
app.use("/api", notificationRouter);
app.use("/api", require("./routes/leaderboardRoutes"));
app.use("/api", dashboardRouter);

app.get("/", (req, res) => {
  res.send("Hello World - Server is running!");
});

app.listen(port);
