const adminUserService = require("../services/adminUserService");
const { parsePagination } = require("../utils/pagination");

exports.getAllUsers = async (req, res) => {
  try {
    res.json(await adminUserService.getAllUsers(parsePagination(req.query, 5)));
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error fetching users" });
  }
};
exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const adminClerkId = req.user.id;
  console.log(
    `[ADMIN] Admin ${adminClerkId} updating role for User ${userId} to "${req.body.role}".`,
  );
  try {
    const user = await adminUserService.updateUserRole(
      parseInt(userId),
      req.body.role,
      adminClerkId,
    );
    console.log(
      `[ADMIN] Success: User ${userId} role changed to "${req.body.role}" by Admin ${adminClerkId}.`,
    );
    res.json({ message: "User role updated successfully", user });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error updating user role" });
  }
};
exports.getUserDetails = async (req, res) => {
  try {
    res.json(
      await adminUserService.getUserDetails(parseInt(req.params.userId)),
    );
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error fetching user details" });
  }
};
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const adminClerkId = req.user.id;
  console.log(
    `[ADMIN] Admin ${adminClerkId} attempting to delete User ${userId}.`,
  );
  try {
    await adminUserService.deleteUser(parseInt(userId), adminClerkId);
    console.log(
      `[ADMIN] Success: User ${userId} deleted by Admin ${adminClerkId}.`,
    );
    res.json({ message: "User deleted successfully" });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error deleting user" });
  }
};
exports.resetUserTestScore = async (req, res) => {
  const { userId } = req.params;
  const adminClerkId = req.user.id;
  console.log(
    `[ADMIN] Admin ${adminClerkId} resetting ${req.body.type}-test score for User ${userId}.`,
  );
  try {
    await adminUserService.resetUserTestScore(parseInt(userId), req.body.type);
    console.log(
      `[ADMIN] Success: Reset ${req.body.type}-test score for User ${userId} by Admin ${adminClerkId}.`,
    );
    res.json({
      message: `Reset ${req.body.type}-test score and history successfully`,
    });
  } catch (e) {
    console.error("Error resetting score:", e.message);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error resetting score" });
  }
};
exports.getUserTestHistory = async (req, res) => {
  try {
    res.json(
      await adminUserService.getUserTestHistory(parseInt(req.params.userId)),
    );
  } catch (e) {
    console.error("Error fetching test history:", e.message);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Error fetching test history" });
  }
};
