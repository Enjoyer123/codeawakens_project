const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// Get all guides with pagination
exports.getAllGuides = async (req, res) => {
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
          { title: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.guide.count({ where });

    const guides = await prisma.guide.findMany({
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
        guide_images: {
          orderBy: {
            guide_file_id: 'asc',
          },
        },
      },
      orderBy: [
        { level_id: 'asc' },
        { display_order: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      guides,
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
    console.error("Error fetching guides:", error);
    res.status(500).json({ message: "Error fetching guides", error: error.message });
  }
};

// Get guides by level
exports.getGuidesByLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    
    // Check if level exists
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(levelId) }
    });

    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    const guides = await prisma.guide.findMany({
      where: {
        level_id: parseInt(levelId),
      },
      include: {
        guide_images: {
          orderBy: {
            guide_file_id: 'asc',
          },
        },
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    res.json(guides);
  } catch (error) {
    console.error("Error fetching guides by level:", error);
    res.status(500).json({ message: "Error fetching guides by level", error: error.message });
  }
};

// Get all levels for dropdown
exports.getLevelsForGuide = async (req, res) => {
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
    console.error("Error fetching levels for guide:", error);
    res.status(500).json({ message: "Error fetching levels", error: error.message });
  }
};

// Get single guide by ID
exports.getGuideById = async (req, res) => {
  try {
    const { guideId } = req.params;

    const guide = await prisma.guide.findUnique({
      where: { guide_id: parseInt(guideId) },
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
        guide_images: {
          orderBy: {
            guide_file_id: 'asc',
          },
        },
      },
    });

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    res.json(guide);
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({ message: "Error fetching guide", error: error.message });
  }
};

// Create new guide
exports.createGuide = async (req, res) => {
  try {
    const {
      level_id,
      title,
      description,
      display_order,
      is_active,
    } = req.body;

    console.log("Create guide request:", {
      level_id,
      title,
      description,
      display_order,
      is_active,
    });

    if (!level_id || !title || !title.trim()) {
      return res.status(400).json({ 
        message: "Missing required fields: level_id, title",
        received: { level_id, title }
      });
    }

    // Validate level exists
    const level = await prisma.level.findUnique({
      where: { level_id: parseInt(level_id) },
    });

    if (!level) {
      return res.status(400).json({ message: "Level not found" });
    }

    const guideData = {
      level_id: parseInt(level_id),
      title: title.trim(),
      description: description && description.trim() ? description.trim() : null,
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: is_active === true || is_active === 'true' || is_active === undefined,
    };

    console.log("Creating guide with data:", guideData);

    const guide = await prisma.guide.create({
      data: guideData,
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
        guide_images: true,
      },
    });

    console.log("Guide created successfully:", guide);

    res.status(201).json({
      message: "Guide created successfully",
      guide,
    });
  } catch (error) {
    console.error("Error creating guide:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    
    // Provide more detailed error message
    let errorMessage = "Error creating guide";
    if (error.code === 'P2002') {
      errorMessage = "Duplicate entry: A guide with the same level_id and title already exists";
    } else if (error.code === 'P2003') {
      errorMessage = "Invalid level_id: The level does not exist";
    } else if (error.code === 'P2011') {
      errorMessage = "Null constraint violation: Required field is missing";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
  }
};

// Update guide
exports.updateGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const {
      level_id,
      title,
      description,
      display_order,
      is_active,
    } = req.body;

    const existingGuide = await prisma.guide.findUnique({
      where: { guide_id: parseInt(guideId) },
    });

    if (!existingGuide) {
      return res.status(404).json({ message: "Guide not found" });
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
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (is_active !== undefined) updateData.is_active = is_active === true || is_active === 'true';

    const guide = await prisma.guide.update({
      where: { guide_id: parseInt(guideId) },
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
        guide_images: {
          orderBy: {
            guide_file_id: 'asc',
          },
        },
      },
    });

    res.json({
      message: "Guide updated successfully",
      guide,
    });
  } catch (error) {
    console.error("Error updating guide:", error);
    res.status(500).json({ message: "Error updating guide", error: error.message });
  }
};

// Delete guide
exports.deleteGuide = async (req, res) => {
  try {
    const { guideId } = req.params;

    console.log("Delete guide request:", { guideId });

    const guide = await prisma.guide.findUnique({
      where: { guide_id: parseInt(guideId) },
      include: {
        guide_images: true,
      },
    });

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    console.log("Guide found:", {
      guide_id: guide.guide_id,
      title: guide.title,
      imageCount: guide.guide_images?.length || 0
    });

    // Delete guide_images first (required because of ON DELETE RESTRICT constraint)
    if (guide.guide_images && guide.guide_images.length > 0) {
      console.log(`Deleting ${guide.guide_images.length} guide images...`);
      
      // Delete associated image files first
      for (const image of guide.guide_images) {
        const filePath = path.join(__dirname, "..", image.path_file);
        console.log("Deleting file:", filePath);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log("File deleted successfully:", filePath);
          } catch (err) {
            console.error(`Error deleting file ${filePath}:`, err);
            // Continue even if file deletion fails
          }
        } else {
          console.log("File not found (may already be deleted):", filePath);
        }
      }

      // Delete guide_images from database
      await prisma.guide_Image.deleteMany({
        where: { guide_id: parseInt(guideId) },
      });
      console.log("Deleted guide images from database");
    }

    // Delete the guide (now safe because guide_images are deleted)
    await prisma.guide.delete({
      where: { guide_id: parseInt(guideId) },
    });

    console.log("Guide deleted successfully");

    res.json({
      message: "Guide deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guide:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    
    // Provide more detailed error message
    let errorMessage = "Error deleting guide";
    if (error.code === 'P2003') {
      errorMessage = "Cannot delete guide: There are related records that prevent deletion";
    } else if (error.code === 'P2025') {
      errorMessage = "Guide not found";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
  }
};

// Upload guide image
exports.uploadGuideImage = async (req, res) => {
  try {
    const { guideId } = req.params;

    console.log("Upload guide image request:", {
      guideId,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const guide = await prisma.guide.findUnique({
      where: { guide_id: parseInt(guideId) },
    });

    if (!guide) {
      // Delete uploaded file if guide doesn't exist
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Guide not found" });
    }

    // Generate path_file
    const filename = req.file.filename;
    const path_file = `/uploads/guides/${filename}`;

    console.log("Creating guide image with data:", {
      guide_id: parseInt(guideId),
      path_file,
    });

    const guideImage = await prisma.guide_Image.create({
      data: {
        guide_id: parseInt(guideId),
        path_file,
      },
    });

    console.log("Guide image created successfully:", guideImage);

    res.status(201).json({
      message: "Guide image uploaded successfully",
      guideImage,
    });
  } catch (error) {
    console.error("Error uploading guide image:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Deleted uploaded file on error:", req.file.path);
      } catch (err) {
        console.error("Error deleting file on error:", err);
      }
    }
    
    // Provide more detailed error message
    let errorMessage = "Error uploading guide image";
    if (error.code === 'P2002') {
      errorMessage = "Duplicate entry: An image with the same path already exists";
    } else if (error.code === 'P2003') {
      errorMessage = "Invalid guide_id: The guide does not exist";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
  }
};

// Delete guide image
exports.deleteGuideImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const guideImage = await prisma.guide_Image.findUnique({
      where: { guide_file_id: parseInt(imageId) },
    });

    if (!guideImage) {
      return res.status(404).json({ message: "Guide image not found" });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", guideImage.path_file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }

    // Delete from database
    await prisma.guide_Image.delete({
      where: { guide_file_id: parseInt(imageId) },
    });

    res.json({
      message: "Guide image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guide image:", error);
    res.status(500).json({ message: "Error deleting guide image", error: error.message });
  }
};

