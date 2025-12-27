const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllUsers,
  updateUserRole,
  getUserDetails,

  deleteUser,
  resetUserTestScore,
  getUserTestHistory
} = require("../controllers/adminUserController");

router.get("/users", authCheck, requireAdmin, getAllUsers);
router.get("/users/:userId/details", authCheck, requireAdmin, getUserDetails);
router.put("/users/:userId/role", authCheck, requireAdmin, updateUserRole);
router.delete("/users/:userId", authCheck, requireAdmin, deleteUser);
router.post("/users/:userId/reset-test", authCheck, requireAdmin, resetUserTestScore);
router.get("/users/:userId/tests", authCheck, requireAdmin, getUserTestHistory);

module.exports = router;
