const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;
const profileRouter = require("./routes/ProfileRoute");
const adminUsersRouter = require("./routes/AdminUserRoute");
const path = require("path");
const { clerkMiddleware } = require("@clerk/express");

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(clerkMiddleware());

app.use("/api/profile", profileRouter);
app.use("/api", adminUsersRouter);

app.get("/", (req, res) => {
  res.send("Hello World - Server is running!");
});

app.listen(port);
