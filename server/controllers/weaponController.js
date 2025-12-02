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
    const weaponKeyChanged = weapon_key && weapon_key !== existingWeapon.weapon_key;
    if (weaponKeyChanged) {
      const keyExists = await prisma.weapon.findUnique({
        where: { weapon_key },
      });
      if (keyExists) {
        return res.status(400).json({ message: "Weapon key already exists" });
      }
    }

    // If weapon_key changed, rename all image files
    if (weaponKeyChanged) {
      const existingImages = await prisma.weapon_Image.findMany({
        where: { weapon_id: parseInt(weaponId) },
      });

      for (const image of existingImages) {
        const oldFilePath = path.join(__dirname, "..", image.path_file);
        const fileExtension = path.extname(image.path_file) || '.png';
        
        // Generate new filename in format: {new_weaponkey}_{typefile}_{frame}.png
        const newFilename = `${weapon_key}_${image.type_file}_${image.frame}${fileExtension}`;
        
        // Determine directory based on type_animation
        const typeAnimation = image.type_animation === 'effect' ? 'weapons_effect' : 'weapons';
        const targetDir = image.type_animation === 'effect' 
          ? path.join(__dirname, "..", "uploads", "weapons_effect")
          : path.join(__dirname, "..", "uploads", "weapons");
        
        const newFilePath = path.join(targetDir, newFilename);
        const newPath = `/uploads/${typeAnimation}/${newFilename}`;

        // Rename file if it exists
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.renameSync(oldFilePath, newFilePath);
            console.log(`Renamed file from ${oldFilePath} to ${newFilePath}`);
            
            // Update database
            await prisma.weapon_Image.update({
              where: { file_id: image.file_id },
              data: { path_file: newPath },
            });
          } catch (renameError) {
            console.error(`Error renaming file ${oldFilePath}:`, renameError);
            // Continue with other files even if one fails
          }
        } else {
          // File doesn't exist, just update database path
          await prisma.weapon_Image.update({
            where: { file_id: image.file_id },
            data: { path_file: newPath },
          });
        }
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
    
    // Generate new filename in format: {weaponkey}_{typefile}_{frame}.png
    const fileExtension = path.extname(req.file.originalname) || '.png';
    const newFilename = `${weapon.weapon_key}_${type_file}_${frame}${fileExtension}`;
    
    // Move file to correct directory with new filename
    const currentPath = path.resolve(req.file.path);
    const targetPath = path.resolve(path.join(targetDir, newFilename));
    
    // Check if target file already exists
    if (fs.existsSync(targetPath)) {
      // Delete existing file
      try {
        fs.unlinkSync(targetPath);
        console.log(`Deleted existing file: ${targetPath}`);
      } catch (unlinkError) {
        console.error("Error deleting existing file:", unlinkError);
      }
    }
    
    // Move and rename file
    try {
      fs.renameSync(currentPath, targetPath);
      console.log(`Moved and renamed file from ${currentPath} to ${targetPath}`);
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
    
    const path_file = `/uploads/${typeAnimation}/${newFilename}`;

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

// Update weapon image
exports.updateWeaponImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { type_file, type_animation, frame } = req.body;

    console.log("Update weapon image request:", {
      imageId,
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

    // Find existing weapon image
    const existingImage = await prisma.weapon_Image.findUnique({
      where: { file_id: parseInt(imageId) },
      include: {
        weapon: true,
      },
    });

    if (!existingImage) {
      // Delete uploaded file if image doesn't exist
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
      return res.status(404).json({ message: "Weapon image not found" });
    }

    const weapon = existingImage.weapon;

    // Determine correct destination folder based on type_animation
    const typeAnimation = (type_animation || existingImage.type_animation) === 'effect' ? 'weapons_effect' : 'weapons';
    const targetDir = (type_animation || existingImage.type_animation) === 'effect' 
      ? path.join(__dirname, "..", "uploads", "weapons_effect")
      : path.join(__dirname, "..", "uploads", "weapons");
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let newFilename = null;
    let newPath = null;

    // If new file is uploaded, rename it
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname) || '.png';
      const finalTypeFile = type_file || existingImage.type_file;
      const finalFrame = frame || existingImage.frame;
      
      // Generate new filename in format: {weaponkey}_{typefile}_{frame}.png
      newFilename = `${weapon.weapon_key}_${finalTypeFile}_${finalFrame}${fileExtension}`;
      
      // Move file to correct directory with new filename
      const currentPath = path.resolve(req.file.path);
      const targetPath = path.resolve(path.join(targetDir, newFilename));
      
      // Delete old file if it exists and is different
      const oldFilePath = path.join(__dirname, "..", existingImage.path_file);
      if (fs.existsSync(oldFilePath) && oldFilePath !== targetPath) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old file: ${oldFilePath}`);
        } catch (unlinkError) {
          console.error("Error deleting old file:", unlinkError);
        }
      }
      
      // Check if target file already exists (different image)
      if (fs.existsSync(targetPath) && targetPath !== oldFilePath) {
        try {
          fs.unlinkSync(targetPath);
          console.log(`Deleted existing file: ${targetPath}`);
        } catch (unlinkError) {
          console.error("Error deleting existing file:", unlinkError);
        }
      }
      
      // Move and rename file
      try {
        fs.renameSync(currentPath, targetPath);
        console.log(`Moved and renamed file from ${currentPath} to ${targetPath}`);
        newPath = `/uploads/${typeAnimation}/${newFilename}`;
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
    } else {
      // No new file, but might need to rename existing file if type_file or frame changed
      const finalTypeFile = type_file || existingImage.type_file;
      const finalFrame = frame || existingImage.frame;
      const finalTypeAnimation = type_animation || existingImage.type_animation;
      
      // Check if type_file or frame changed
      if (finalTypeFile !== existingImage.type_file || finalFrame !== existingImage.frame || finalTypeAnimation !== existingImage.type_animation) {
        const fileExtension = path.extname(existingImage.path_file) || '.png';
        newFilename = `${weapon.weapon_key}_${finalTypeFile}_${finalFrame}${fileExtension}`;
        
        const oldFilePath = path.join(__dirname, "..", existingImage.path_file);
        const newTargetDir = finalTypeAnimation === 'effect' 
          ? path.join(__dirname, "..", "uploads", "weapons_effect")
          : path.join(__dirname, "..", "uploads", "weapons");
        const newTargetPath = path.join(newTargetDir, newFilename);
        
        // Ensure new directory exists
        if (!fs.existsSync(newTargetDir)) {
          fs.mkdirSync(newTargetDir, { recursive: true });
        }
        
        // Move and rename existing file
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.renameSync(oldFilePath, newTargetPath);
            console.log(`Renamed existing file from ${oldFilePath} to ${newTargetPath}`);
            newPath = `/uploads/${finalTypeAnimation === 'effect' ? 'weapons_effect' : 'weapons'}/${newFilename}`;
          } catch (renameError) {
            console.error("Error renaming file:", renameError);
            return res.status(500).json({ 
              message: "Error renaming file", 
              error: renameError.message 
            });
          }
        }
      }
    }

    // Update database
    const updateData = {};
    if (type_file) updateData.type_file = type_file;
    if (type_animation) updateData.type_animation = type_animation;
    if (frame) updateData.frame = parseInt(frame);
    if (newPath) updateData.path_file = newPath;

    const updatedImage = await prisma.weapon_Image.update({
      where: { file_id: parseInt(imageId) },
      data: updateData,
    });

    console.log("Weapon image updated successfully:", updatedImage);

    res.json({
      message: "Weapon image updated successfully",
      weaponImage: updatedImage,
    });
  } catch (error) {
    console.error("Error updating weapon image:", error);
    console.error("Error stack:", error.stack);
    
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Deleted uploaded file on error:", req.file.path);
      } catch (err) {
        console.error("Error deleting file on error:", err);
      }
    }
    
    res.status(500).json({ 
      message: "Error updating weapon image", 
      error: error.message 
    });
  }
};

