const levelService = require("../services/levelService");
const { parsePagination } = require("../utils/pagination");

exports.getAllLevels = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await levelService.getAllLevels(pagination);
    res.json(result);
  } catch (error) {
    console.error("[ERROR] Failed to fetch levels:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching levels" });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await levelService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("[ERROR] Failed to fetch categories:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching categories" });
  }
};

exports.getLevelsForPrerequisite = async (req, res) => {
  try {
    const levels = await levelService.getLevelsForDropdown();
    res.json(levels);
  } catch (error) {
    console.error("[ERROR] Failed to fetch levels for prerequisite:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching levels" });
  }
};

exports.getLevelById = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  if (clerkUserId) {
    console.log(`[GAME] User ${clerkUserId} viewing Level ${levelId}.`);
  }

  try {
    const result = await levelService.getLevelById(parseInt(levelId), clerkUserId);
    res.json(result);
  } catch (error) {
    console.error(`[ERROR] Failed to fetch Level ${levelId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching level" });
  }
};

exports.createLevel = async (req, res) => {
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} creating new level.`);

  try {
    const level = await levelService.createLevel(req.body, clerkUserId);
    console.log(`[ADMIN] Success: Created Level ${level.level_id} ("${level.level_name}") by User ${clerkUserId}.`);
    res.status(201).json({ message: "Level created successfully", level });
  } catch (error) {
    console.error(`[ERROR] Failed to create level by User ${clerkUserId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error creating level" });
  }
};

exports.updateLevel = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} updating Level ${levelId}.`);

  try {
    const level = await levelService.updateLevel(parseInt(levelId), req.body);
    console.log(`[ADMIN] Success: Updated Level ${levelId} by User ${clerkUserId}.`);
    res.json({ message: "Level updated successfully", level });
  } catch (error) {
    console.error(`[ERROR] Failed to update Level ${levelId} by User ${clerkUserId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error updating level" });
  }
};

exports.deleteLevel = async (req, res) => {
  const { levelId } = req.params;
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} deleting Level ${levelId}.`);

  try {
    await levelService.deleteLevel(parseInt(levelId));
    console.log(`[ADMIN] Success: Deleted Level ${levelId} by User ${clerkUserId}.`);
    res.json({ message: "Level deleted successfully" });
  } catch (error) {
    console.error(`[ERROR] Failed to delete Level ${levelId} by User ${clerkUserId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error deleting level" });
  }
};

exports.unlockLevel = async (req, res) => {
  const { levelId } = req.params;
  console.log(`[ADMIN] Unlocking Level ${levelId}.`);

  try {
    await levelService.unlockLevel(parseInt(levelId));
    console.log(`[ADMIN] Success: Level ${levelId} unlocked.`);
    res.json({ message: "Level unlocked successfully" });
  } catch (error) {
    console.error(`[ERROR] Failed to unlock Level ${levelId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error unlocking level" });
  }
};

exports.updateLevelCoordinates = async (req, res) => {
  const { levelId } = req.params;

  try {
    const level = await levelService.updateLevelCoordinates(parseInt(levelId), req.body.coordinates);
    res.json({ message: "Level coordinates updated successfully", level });
  } catch (error) {
    console.error(`[ERROR] Failed to update coordinates for Level ${levelId}:`, error.message);
    res.status(error.status || 500).json({ message: error.message || "Error updating level coordinates" });
  }
};

exports.uploadLevelBackgroundImage = async (req, res) => {
  const clerkUserId = req.user?.id;
  console.log(`[ADMIN] User ${clerkUserId} uploading level background.`);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const imagePath = `/uploads/levels/${req.file.filename}`;
    console.log(`[ADMIN] Success: Level background uploaded by User ${clerkUserId} at ${imagePath}.`);
    res.json({ message: "Level background image uploaded successfully", imageUrl: imagePath });
  } catch (error) {
    console.error(`[ERROR] Failed to upload level background by User ${clerkUserId}:`, error.message);
    res.status(500).json({ message: "Failed to upload level background image" });
  }
};
