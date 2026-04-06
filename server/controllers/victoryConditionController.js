import * as victoryConditionService from "../services/victoryConditionService.js";

export const getAllVictoryConditions = async (req, res) => {
  try {
    const levelId = req.query.levelId;
    const result = await victoryConditionService.getAllVictoryConditions(levelId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching victory conditions:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching victory conditions",
    });
  }
};

export const getVictoryConditionById = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    const result = await victoryConditionService.getVictoryConditionById(conditionId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching victory condition:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching victory condition",
    });
  }
};

export const createVictoryCondition = async (req, res) => {
  try {
    const result = await victoryConditionService.createVictoryCondition(req.body);
    
    res.status(201).json({
      message: "Victory condition created successfully",
      victoryCondition: result,
    });
  } catch (error) {
    console.error("Error creating victory condition:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating victory condition",
    });
  }
};

export const updateVictoryCondition = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    const result = await victoryConditionService.updateVictoryCondition(conditionId, req.body);
    
    res.status(200).json({
      message: "Victory condition updated successfully",
      victoryCondition: result,
    });
  } catch (error) {
    console.error("Error updating victory condition:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating victory condition",
    });
  }
};

export const deleteVictoryCondition = async (req, res) => {
  try {
    const conditionId = parseInt(req.params.victoryConditionId);
    await victoryConditionService.deleteVictoryCondition(conditionId);
    
    res.status(200).json({
      message: "Victory condition deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting victory condition:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting victory condition",
    });
  }
};
