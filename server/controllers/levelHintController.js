const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// Get all hints for admin list (with pagination + search)
exports.getAllLevelHints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    let where = {};
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { title: { contains: searchLower, mode: "insensitive" } },
          { description: { contains: searchLower, mode: "insensitive" } },
        ],
      };
    }

    const total = await prisma.levelHint.count({ where });

    const hints = await prisma.levelHint.findMany({
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
        hint_images: {
          orderBy: {
            hint_image_id: "asc",
          },
        },
      },
      orderBy: [
        { level_id: "asc" },
        { display_order: "asc" },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      hints,
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
    console.error("Error fetching level hints:", error);
    res
      .status(500)
      .json({ message: "Error fetching level hints", error: error.message });
  }
};

// Get hints for a specific level (for admin or game use)
exports.getHintsByLevelId = async (req, res) => {
  try {
    const { levelId } = req.params;

    const hints = await prisma.levelHint.findMany({
      where: { level_id: parseInt(levelId) },
      include: {
        hint_images: {
          orderBy: {
            hint_image_id: "asc",
          },
        },
      },
      orderBy: {
        display_order: "asc",
      },
    });

    res.json(hints);
  } catch (error) {
    console.error("Error fetching hints for level:", error);
    res
      .status(500)
      .json({ message: "Error fetching hints for level", error: error.message });
  }
};

// Create new level hint
exports.createLevelHint = async (req, res) => {
  try {
    const { level_id, title, description, display_order, is_active } = req.body;

    if (!level_id || !title || !title.trim()) {
      return res.status(400).json({
        message: "Missing required fields: level_id, title",
        received: { level_id, title },
      });
    }

    // Validate level exists
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(level_id) },
    });

    if (!level) {
      return res.status(400).json({ message: "Level not found" });
    }

    const hintData = {
      level_id: parseInt(level_id),
      title: title.trim(),
      description:
        description && description.trim() ? description.trim() : null,
      display_order: display_order ? parseInt(display_order) : 0,
      is_active:
        is_active === true || is_active === "true" || is_active === undefined,
    };

    const hint = await prisma.levelHint.create({
      data: hintData,
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
        hint_images: true,
      },
    });

    res.status(201).json({
      message: "Level hint created successfully",
      hint,
    });
  } catch (error) {
    console.error("Error creating level hint:", error);
    res.status(500).json({
      message: "Error creating level hint",
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
};

// Update level hint
exports.updateLevelHint = async (req, res) => {
  try {
    const { hintId } = req.params;
    const { level_id, title, description, display_order, is_active } = req.body;

    const existingHint = await prisma.levelHint.findUnique({
      where: { hint_id: parseInt(hintId) },
    });

    if (!existingHint) {
      return res.status(404).json({ message: "Level hint not found" });
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
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (display_order !== undefined)
      updateData.display_order = parseInt(display_order);
    if (is_active !== undefined)
      updateData.is_active = is_active === true || is_active === "true";

    const hint = await prisma.levelHint.update({
      where: { hint_id: parseInt(hintId) },
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
        hint_images: {
          orderBy: {
            hint_image_id: "asc",
          },
        },
      },
    });

    res.json({
      message: "Level hint updated successfully",
      hint,
    });
  } catch (error) {
    console.error("Error updating level hint:", error);
    res.status(500).json({
      message: "Error updating level hint",
      error: error.message,
    });
  }
};

// Delete level hint (and its images)
exports.deleteLevelHint = async (req, res) => {
  try {
    const { hintId } = req.params;

    const hint = await prisma.levelHint.findUnique({
      where: { hint_id: parseInt(hintId) },
      include: {
        hint_images: true,
      },
    });

    if (!hint) {
      return res.status(404).json({ message: "Level hint not found" });
    }

    // ลบไฟล์รูปทั้งหมดของ hint นี้
    if (hint.hint_images && hint.hint_images.length > 0) {
      for (const image of hint.hint_images) {
        const filePath = path.join(__dirname, "..", image.path_file);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Error deleting file ${filePath}:`, err);
          }
        }
      }
    }

    await prisma.levelHintImage.deleteMany({
      where: { hint_id: parseInt(hintId) },
    });

    await prisma.levelHint.delete({
      where: { hint_id: parseInt(hintId) },
    });

    res.json({
      message: "Level hint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level hint:", error);
    res.status(500).json({
      message: "Error deleting level hint",
      error: error.message,
    });
  }
};

// Upload image for a level hint
exports.uploadHintImage = async (req, res) => {
  try {
    const { hintId } = req.params;

    console.log("Upload level hint image request:", {
      hintId,
      hasFile: !!req.file,
      fileInfo: req.file
        ? {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : null,
    });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const hint = await prisma.levelHint.findUnique({
      where: { hint_id: parseInt(hintId) },
    });

    if (!hint) {
      // delete file if hint not found
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Level hint not found" });
    }

    // file already stored in uploads/level_hints, build public path
    const filename = req.file.filename;
    const path_file = `/uploads/level_hints/${filename}`;

    const hintImage = await prisma.levelHintImage.create({
      data: {
        hint_id: parseInt(hintId),
        path_file,
      },
    });

    res.status(201).json({
      message: "Level hint image uploaded successfully",
      hintImage,
    });
  } catch (error) {
    console.error("Error uploading level hint image:", error);
    // delete uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting file on error:", err);
      }
    }
    res.status(500).json({
      message: "Error uploading level hint image",
      error: error.message,
    });
  }
};

// Delete a single hint image
exports.deleteHintImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const hintImage = await prisma.levelHintImage.findUnique({
      where: { hint_image_id: parseInt(imageId) },
    });

    if (!hintImage) {
      return res.status(404).json({ message: "Level hint image not found" });
    }

    const filePath = path.join(__dirname, "..", hintImage.path_file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }

    await prisma.levelHintImage.delete({
      where: { hint_image_id: parseInt(imageId) },
    });

    res.json({
      message: "Level hint image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level hint image:", error);
    res.status(500).json({
      message: "Error deleting level hint image",
      error: error.message,
    });
  }
};
