const rewardService = require("../services/rewardService");
const levelService = require("../services/levelService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllRewards = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await rewardService.getAllRewards(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching rewards:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching rewards",
    });
  }
};

exports.getLevelsForReward = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching levels for dropdown:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching levels for dropdown",
    });
  }
};

exports.getRewardById = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.getRewardById(rewardId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching reward:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching reward",
    });
  }
};

exports.createReward = async (req, res) => {
  try {
    const result = await rewardService.createReward(req.body);
    
    res.status(201).json({
      message: "Reward created successfully",
      reward: result,
    });
  } catch (error) {
    console.error("Error creating reward:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating reward",
    });
  }
};

exports.updateReward = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.updateReward(rewardId, req.body);
    
    res.status(200).json({
      message: "Reward updated successfully",
      reward: result,
    });
  } catch (error) {
    console.error("Error updating reward:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating reward",
    });
  }
};

exports.deleteReward = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    await rewardService.deleteReward(rewardId);
    
    res.status(200).json({
      message: "Reward deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reward:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting reward",
    });
  }
};

exports.uploadRewardFrame = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }
    
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.uploadRewardFrame(rewardId, req.file);
    
    res.status(200).json({
      message: "Reward frame image uploaded successfully",
      reward: result,
    });
  } catch (error) {
    console.error("Error uploading reward frame:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error uploading reward frame image",
    });
  }
};

exports.deleteRewardFrame = async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const result = await rewardService.deleteRewardFrame(rewardId);
    
    res.status(200).json({
      message: "Reward frame image deleted successfully",
      reward: result,
    });
  } catch (error) {
    console.error("Error deleting reward frame:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting reward frame image",
    });
  }
};
