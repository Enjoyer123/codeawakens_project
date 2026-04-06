const rewardService = require("../services/rewardService");
const levelService = require("../services/levelService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllRewards = async (req, res) => {
  try { res.json(await rewardService.getAllRewards(parsePagination(req.query))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching rewards" }); }
};
exports.getLevelsForReward = async (req, res) => {
  try { res.json(await levelService.getLevelsForDropdown()); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching levels" }); }
};
exports.getRewardById = async (req, res) => {
  try { res.json(await rewardService.getRewardById(parseInt(req.params.rewardId))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching reward" }); }
};
exports.createReward = async (req, res) => {
  try { const reward = await rewardService.createReward(req.body); res.status(201).json({ message: "Reward created successfully", reward }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating reward" }); }
};
exports.updateReward = async (req, res) => {
  try { const reward = await rewardService.updateReward(parseInt(req.params.rewardId), req.body); res.json({ message: "Reward updated successfully", reward }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error updating reward" }); }
};
exports.deleteReward = async (req, res) => {
  try { await rewardService.deleteReward(parseInt(req.params.rewardId)); res.json({ message: "Reward deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting reward" }); }
};
exports.uploadRewardFrame = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const reward = await rewardService.uploadRewardFrame(parseInt(req.params.rewardId), req.file, req.body.frame_number);
    res.status(200).json({ message: "Reward frame image uploaded successfully", reward });
  } catch (e) { cleanupTempFile(req.file); res.status(e.status || 500).json({ message: e.message || "Error uploading reward frame" }); }
};
exports.deleteRewardFrame = async (req, res) => {
  try { const reward = await rewardService.deleteRewardFrame(parseInt(req.params.rewardId), req.body.frame_number); res.json({ message: "Reward frame image deleted successfully", reward }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting reward frame" }); }
};
