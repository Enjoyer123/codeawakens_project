const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllUsers,
  updateUserRole,
  getUserDetails,
  deleteUser,
} = require("../controllers/adminUserController");

router.get("/users", authCheck, requireAdmin, getAllUsers);
router.get("/users/:userId/details", authCheck, requireAdmin, getUserDetails);
router.put("/users/:userId/role", authCheck, requireAdmin, updateUserRole);
router.delete("/users/:userId", authCheck, requireAdmin, deleteUser);

module.exports = router;
