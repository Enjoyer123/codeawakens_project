const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all blocks with pagination
exports.getAllBlocks = async (req, res) => {
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
          { block_key: { contains: searchLower, mode: 'insensitive' } },
          { block_name: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.block.count({ where });

    const blocks = await prisma.block.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    res.json({
      blocks,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ message: "Error fetching blocks", error: error.message });
  }
};

// Get block by ID
exports.getBlockById = async (req, res) => {
  try {
    const { blockId } = req.params;

    const block = await prisma.block.findUnique({
      where: { block_id: parseInt(blockId) },
    });

    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }

    res.json({ block });
  } catch (error) {
    console.error("Error fetching block:", error);
    res.status(500).json({ message: "Error fetching block", error: error.message });
  }
};

// Create block function removed as it is no longer allowed

// Update block
exports.updateBlock = async (req, res) => {
  try {
    const { blockId } = req.params;
    const {
      block_key,
      block_name,
      description,
      category,
      blockly_type,
      is_available,
      syntax_example,
      block_image,
    } = req.body;

    if (!block_key || !block_name || !category) {
      return res.status(400).json({
        message: "Missing required fields: block_key, block_name, category"
      });
    }

    const existingBlock = await prisma.block.findUnique({
      where: { block_id: parseInt(blockId) },
    });

    if (!existingBlock) {
      return res.status(404).json({ message: "Block not found" });
    }

    // Check if block_key is being changed and if it already exists for another block
    const trimmedBlockKey = block_key.trim();
    if (trimmedBlockKey !== existingBlock.block_key) {
      const blockWithSameKey = await prisma.block.findUnique({
        where: { block_key: trimmedBlockKey },
      });

      if (blockWithSameKey && blockWithSameKey.block_id !== parseInt(blockId)) {
        return res.status(409).json({
          message: "A block with this block_key already exists."
        });
      }
    }

    const block = await prisma.block.update({
      where: { block_id: parseInt(blockId) },
      data: {
        block_key: trimmedBlockKey,
        block_name: block_name.trim(),
        description: description ? description.trim() : null,
        category,
        blockly_type: blockly_type ? blockly_type.trim() : null,
        is_available: is_available === true || is_available === 'true',
        syntax_example: syntax_example ? syntax_example.trim() : null,
        block_image: block_image || null,
      },
    });

    res.json({
      message: "Block updated successfully",
      block,
    });
  } catch (error) {
    console.error("Error updating block:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "A block with this block_key already exists." });
    } else if (error.code === 'P2025') {
      return res.status(404).json({ message: "Block not found" });
    } else if (error.code === 'P2011') {
      return res.status(400).json({ message: "Null constraint violation. Check required fields." });
    }
    res.status(500).json({ message: "Error updating block", error: error.message });
  }
};

// Delete block
exports.deleteBlock = async (req, res) => {
  try {
    const { blockId } = req.params;

    console.log("Delete block request:", { blockId });

    const block = await prisma.block.findUnique({
      where: { block_id: parseInt(blockId) },
      include: {
        level_blocks: true,
      },
    });

    if (!block) {
      return res.status(404).json({ message: "Block not found" });
    }

    console.log("Block found:", {
      block_id: block.block_id,
      block_key: block.block_key,
      levelBlocksCount: block.level_blocks?.length || 0
    });

    // Prevent deletion if block is used in levels
    if (block.level_blocks && block.level_blocks.length > 0) {
      const levelIds = block.level_blocks.map(lb => lb.level_id);
      const uniqueLevelIds = [...new Set(levelIds)];

      return res.status(400).json({
        message: `Cannot delete block: This block is being used in ${block.level_blocks.length} level block(s) across ${uniqueLevelIds.length} level(s). Please remove the block from all levels before deleting.`,
        level_blocks_count: block.level_blocks.length,
        levels_count: uniqueLevelIds.length,
        level_ids: uniqueLevelIds
      });
    }

    // Delete the block (safe because no level_blocks exist)
    await prisma.block.delete({
      where: { block_id: parseInt(blockId) },
    });

    console.log("Block deleted successfully");

    res.json({
      message: "Block deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting block:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    // Provide more detailed error message
    let errorMessage = "Error deleting block";
    if (error.code === 'P2003') {
      errorMessage = "Cannot delete block: There are related records that prevent deletion";
    } else if (error.code === 'P2025') {
      errorMessage = "Block not found";
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

exports.uploadBlockImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = `/uploads/blocks/${req.file.filename}`;

    res.json({
      message: "Block image uploaded successfully",
      path: filePath,
      filename: req.file.filename
    });

  } catch (error) {
    console.error("Error uploading block image:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};


