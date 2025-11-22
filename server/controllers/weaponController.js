const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

// Get all weapons with pagination
exports.getAllWeapons = async (req, res) => {
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
          { weapon_name: { contains: searchLower, mode: 'insensitive' } },
          { weapon_key: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.weapon.count({ where });

    const weapons = await prisma.weapon.findMany({
      where,
      include: {
        weapon_images: {
          orderBy: [
            { type_animation: 'asc' },
            { frame: 'asc' },
          ],
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      weapons,
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
    console.error("Error fetching weapons:", error);
    res.status(500).json({ message: "Error fetching weapons", error: error.message });
  }
};

// Get single weapon by ID
exports.getWeaponById = async (req, res) => {
  try {
    const { weaponId } = req.params;

    const weapon = await prisma.weapon.findUnique({
      where: { weapon_id: parseInt(weaponId) },
      include: {
        weapon_images: {
          orderBy: [
            { type_animation: 'asc' },
            { frame: 'asc' },
          ],
        },
      },
    });

    if (!weapon) {
      return res.status(404).json({ message: "Weapon not found" });
    }

    res.json(weapon);
  } catch (error) {
    console.error("Error fetching weapon:", error);
    res.status(500).json({ message: "Error fetching weapon", error: error.message });
  }
};

// Create new weapon
exports.createWeapon = async (req, res) => {
  try {
    const { weapon_key, weapon_name, description, combat_power, emoji, weapon_type } = req.body;

    if (!weapon_key || !weapon_name || !weapon_type) {
      return res.status(400).json({ message: "Missing required fields: weapon_key, weapon_name, weapon_type" });
    }

    // Check if weapon_key already exists
    const existingWeapon = await prisma.weapon.findUnique({
      where: { weapon_key },
    });

    if (existingWeapon) {
      return res.status(400).json({ message: "Weapon key already exists" });
    }

    const weapon = await prisma.weapon.create({
      data: {
        weapon_key,
        weapon_name,
        description: description || null,
        combat_power: parseInt(combat_power) || 0,
        emoji: emoji || null,
        weapon_type,
      },
      include: {
        weapon_images: true,
      },
    });

    res.status(201).json({
      message: "Weapon created successfully",
      weapon,
    });
  } catch (error) {
    console.error("Error creating weapon:", error);
    res.status(500).json({ message: "Error creating weapon", error: error.message });
  }
};

// Update weapon
exports.updateWeapon = async (req, res) => {
  try {
    const { weaponId } = req.params;
    const { weapon_key, weapon_name, description, combat_power, emoji, weapon_type } = req.body;

    const existingWeapon = await prisma.weapon.findUnique({
      where: { weapon_id: parseInt(weaponId) },
    });

    if (!existingWeapon) {
      return res.status(404).json({ message: "Weapon not found" });
    }

    // Check if weapon_key is being changed and if it conflicts
    if (weapon_key && weapon_key !== existingWeapon.weapon_key) {
      const keyExists = await prisma.weapon.findUnique({
        where: { weapon_key },
      });
      if (keyExists) {
        return res.status(400).json({ message: "Weapon key already exists" });
      }
    }

    const updateData = {};
    if (weapon_key) updateData.weapon_key = weapon_key;
    if (weapon_name) updateData.weapon_name = weapon_name;
    if (description !== undefined) updateData.description = description;
    if (combat_power !== undefined) updateData.combat_power = parseInt(combat_power);
    if (emoji !== undefined) updateData.emoji = emoji;
    if (weapon_type) updateData.weapon_type = weapon_type;

    const weapon = await prisma.weapon.update({
      where: { weapon_id: parseInt(weaponId) },
      data: updateData,
      include: {
        weapon_images: {
          orderBy: [
            { type_animation: 'asc' },
            { frame: 'asc' },
          ],
        },
      },
    });

    res.json({
      message: "Weapon updated successfully",
      weapon,
    });
  } catch (error) {
    console.error("Error updating weapon:", error);
    res.status(500).json({ message: "Error updating weapon", error: error.message });
  }
};

// Delete weapon
exports.deleteWeapon = async (req, res) => {
  try {
    const { weaponId } = req.params;

    const weapon = await prisma.weapon.findUnique({
      where: { weapon_id: parseInt(weaponId) },
      include: {
        weapon_images: true,
      },
    });

    if (!weapon) {
      return res.status(404).json({ message: "Weapon not found" });
    }

    // Delete associated image files
    for (const image of weapon.weapon_images) {
      const filePath = path.join(__dirname, "..", image.path_file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
    }

    // Delete weapon (cascade will delete weapon_images)
    await prisma.weapon.delete({
      where: { weapon_id: parseInt(weaponId) },
    });

    res.json({
      message: "Weapon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weapon:", error);
    res.status(500).json({ message: "Error deleting weapon", error: error.message });
  }
};

// Add weapon image
exports.addWeaponImage = async (req, res) => {
  try {
    const { weaponId } = req.params;
    const { type_file, type_animation, frame } = req.body;

    console.log("Add weapon image request:", {
      weaponId,
      type_file,
      type_animation,
      frame,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!type_file || !type_animation || !frame) {
      return res.status(400).json({ 
        message: "Missing required fields: type_file, type_animation, frame",
        received: { type_file, type_animation, frame }
      });
    }

    const weapon = await prisma.weapon.findUnique({
      where: { weapon_id: parseInt(weaponId) },
    });

    if (!weapon) {
      // Delete uploaded file if weapon doesn't exist
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Weapon not found" });
    }

    // Determine correct destination folder based on type_animation
    const typeAnimation = type_animation === 'effect' ? 'weapons_effect' : 'weapons';
    const targetDir = type_animation === 'effect' 
      ? path.join(__dirname, "..", "uploads", "weapons_effect")
      : path.join(__dirname, "..", "uploads", "weapons");
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move file to correct directory if needed
    const currentPath = path.resolve(req.file.path);
    const filename = req.file.filename;
    const targetPath = path.resolve(path.join(targetDir, filename));
    
    // Only move if file is not already in the correct directory
    if (currentPath !== targetPath) {
      try {
        fs.renameSync(currentPath, targetPath);
        console.log(`Moved file from ${currentPath} to ${targetPath}`);
      } catch (moveError) {
        console.error("Error moving file:", moveError);
        // If move fails, delete the uploaded file
        if (fs.existsSync(currentPath)) {
          try {
            fs.unlinkSync(currentPath);
          } catch (unlinkError) {
            console.error("Error deleting file:", unlinkError);
          }
        }
        return res.status(500).json({ 
          message: "Error moving file to correct directory", 
          error: moveError.message 
        });
      }
    }
    
    const path_file = `/uploads/${typeAnimation}/${filename}`;

    console.log("Creating weapon image with data:", {
      weapon_id: parseInt(weaponId),
      path_file,
      type_file,
      type_animation,
      frame: parseInt(frame),
      targetPath,
    });

    const weaponImage = await prisma.weapon_Image.create({
      data: {
        weapon_id: parseInt(weaponId),
        path_file,
        type_file,
        type_animation,
        frame: parseInt(frame),
      },
    });

    console.log("Weapon image created successfully:", weaponImage);

    res.status(201).json({
      message: "Weapon image added successfully",
      weaponImage,
    });
  } catch (error) {
    console.error("Error adding weapon image:", error);
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
    let errorMessage = "Error adding weapon image";
    if (error.code === 'P2002') {
      errorMessage = "Duplicate entry: An image with the same weapon_id, type_file, type_animation, and frame already exists";
    } else if (error.code === 'P2003') {
      errorMessage = "Invalid weapon_id: The weapon does not exist";
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

// Delete weapon image
exports.deleteWeaponImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const weaponImage = await prisma.weapon_Image.findUnique({
      where: { file_id: parseInt(imageId) },
    });

    if (!weaponImage) {
      return res.status(404).json({ message: "Weapon image not found" });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", weaponImage.path_file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }

    // Delete from database
    await prisma.weapon_Image.delete({
      where: { file_id: parseInt(imageId) },
    });

    res.json({
      message: "Weapon image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weapon image:", error);
    res.status(500).json({ message: "Error deleting weapon image", error: error.message });
  }
};

