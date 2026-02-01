const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// Get all rewards with pagination
exports.getAllRewards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let where = {};
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { reward_name: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.reward.count({ where });

    const rewards = await prisma.reward.findMany({
      where,
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        reward_id: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ message: "Error fetching rewards", error: error.message });
  }
};

// Get all levels for dropdown
exports.getLevelsForReward = async (req, res) => {
  try {
    const levels = await prisma.level.findMany({
      select: {
        level_id: true,
        level_name: true,
        category: {
          select: {
            category_name: true,
          },
        },
      },
      orderBy: {
        level_name: 'asc',
      },
    });

    res.json(levels);
  } catch (error) {
    console.error("Error fetching levels for reward:", error);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get single reward by ID
exports.getRewardById = async (req, res) => {
  try {
    const { rewardId } = req.params;

    const reward = await prisma.reward.findUnique({
      where: { reward_id: parseInt(rewardId) },
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
    });

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    res.json(reward);
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({ message: "Error fetching reward", error: error.message });
  }
};

// Create new reward
exports.createReward = async (req, res) => {
  try {
    const {
      level_id,
      reward_type,
      reward_name,
      description,
      required_score,
      is_automatic,
      frame1,
    } = req.body;

    if (!level_id || !reward_type || !reward_name || required_score === undefined) {
      return res.status(400).json({
        message: "Missing required fields: level_id, reward_type, reward_name, required_score"
      });
    }

    // Validate level exists
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(level_id) },
    });

    if (!level) {
      return res.status(400).json({ message: "Level not found" });
    }

    // Validate reward_type
    const validRewardTypes = ['weapon', 'block', 'badge', 'experience', 'coin'];
    if (!validRewardTypes.includes(reward_type)) {
      return res.status(400).json({ message: "Invalid reward_type" });
    }

    const reward = await prisma.reward.create({
      data: {
        level_id: parseInt(level_id),
        reward_type,
        reward_name,
        description: description || null,
        required_score: parseInt(required_score),
        is_automatic: is_automatic === true || is_automatic === 'true',
        frame1: frame1 || null,
      },
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: "Reward created successfully",
      reward,
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({ message: "Error creating reward", error: error.message });
  }
};

// Update reward
exports.updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const {
      level_id,
      reward_type,
      reward_name,
      description,
      required_score,
      is_automatic,
      frame1,
    } = req.body;

    const existingReward = await prisma.reward.findUnique({
      where: { reward_id: parseInt(rewardId) },
    });

    if (!existingReward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    const updateData = {};
    if (level_id !== undefined) {
      // Validate level exists
      const level = await prisma.level.findUnique({
        where: { level_id: parseInt(level_id) },
      });
      if (!level) {
        return res.status(400).json({ message: "Level not found" });
      }
      updateData.level_id = parseInt(level_id);
    }
    if (reward_type !== undefined) {
      const validRewardTypes = ['weapon', 'block', 'badge', 'experience', 'coin'];
      if (!validRewardTypes.includes(reward_type)) {
        return res.status(400).json({ message: "Invalid reward_type" });
      }
      updateData.reward_type = reward_type;
    }
    if (reward_name !== undefined) updateData.reward_name = reward_name;
    if (description !== undefined) updateData.description = description;
    if (required_score !== undefined) updateData.required_score = parseInt(required_score);
    if (is_automatic !== undefined) updateData.is_automatic = is_automatic === true || is_automatic === 'true';
    if (frame1 !== undefined) updateData.frame1 = frame1 || null;

    const reward = await prisma.reward.update({
      where: { reward_id: parseInt(rewardId) },
      data: updateData,
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: "Reward updated successfully",
      reward,
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    res.status(500).json({ message: "Error updating reward", error: error.message });
  }
};

// Delete reward
exports.deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;

    const reward = await prisma.reward.findUnique({
      where: { reward_id: parseInt(rewardId) },
    });

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    // Delete associated frame images
    if (reward.frame1) {
      const filePath = path.join(__dirname, "..", reward.frame1);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
    }

    await prisma.reward.delete({
      where: { reward_id: parseInt(rewardId) },
    });

    res.json({
      message: "Reward deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({ message: "Error deleting reward", error: error.message });
  }
};

// Upload reward frame image
exports.uploadRewardFrame = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { frame_number } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!frame_number || frame_number !== '1') {
      // Delete uploaded file if invalid frame number
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(400).json({ message: "Invalid frame_number. Must be 1" });
    }

    const reward = await prisma.reward.findUnique({
      where: { reward_id: parseInt(rewardId) },
    });

    if (!reward) {
      // Delete uploaded file if reward doesn't exist
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Reward not found" });
    }

    // Generate correct filename with frame number
    const ext = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e6);
    const correctFilename = `reward-${rewardId}-frame${frame_number}-${timestamp}-${randomSuffix}${ext}`;

    // Move/rename file to correct name
    const tempPath = req.file.path;
    const rewardsDir = path.join(__dirname, "..", "uploads", "rewards");
    const correctPath = path.join(rewardsDir, correctFilename);

    try {
      fs.renameSync(tempPath, correctPath);
      console.log(`Renamed file from ${tempPath} to ${correctPath}`);
    } catch (renameError) {
      console.error("Error renaming file:", renameError);
      // Delete temp file if rename fails
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error("Error deleting temp file:", err);
        }
      }
      return res.status(500).json({
        message: "Error renaming file",
        error: renameError.message
      });
    }

    // Generate path_file
    const path_file = `/uploads/rewards/${correctFilename}`;

    // Update the corresponding frame field
    const frameField = `frame${frame_number}`;
    const updateData = {};
    updateData[frameField] = path_file;

    // Delete old file if exists
    const oldFramePath = reward[frameField];
    if (oldFramePath) {
      const oldFilePath = path.join(__dirname, "..", oldFramePath);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.error(`Error deleting old file ${oldFilePath}:`, err);
        }
      }
    }

    const updatedReward = await prisma.reward.update({
      where: { reward_id: parseInt(rewardId) },
      data: updateData,
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: "Reward frame image uploaded successfully",
      reward: updatedReward,
    });
  } catch (error) {
    console.error("Error uploading reward frame:", error);
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting file on error:", err);
      }
    }
    res.status(500).json({ message: "Error uploading reward frame", error: error.message });
  }
};

// Delete reward frame image
exports.deleteRewardFrame = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { frame_number } = req.body;

    if (!frame_number || frame_number !== '1') {
      return res.status(400).json({ message: "Invalid frame_number. Must be 1" });
    }

    const reward = await prisma.reward.findUnique({
      where: { reward_id: parseInt(rewardId) },
    });

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    const frameField = `frame${frame_number}`;
    const framePath = reward[frameField];

    if (!framePath) {
      return res.status(404).json({ message: "Frame image not found" });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", framePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }

    // Update database to set frame to null
    const updateData = {};
    updateData[frameField] = null;

    const updatedReward = await prisma.reward.update({
      where: { reward_id: parseInt(rewardId) },
      data: updateData,
      include: {
        level: {
          select: {
            level_id: true,
            level_name: true,
            category: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: "Reward frame image deleted successfully",
      reward: updatedReward,
    });
  } catch (error) {
    console.error("Error deleting reward frame:", error);
    res.status(500).json({ message: "Error deleting reward frame", error: error.message });
  }
};

