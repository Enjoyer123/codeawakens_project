const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');       
require('dotenv').config();         
const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: '*',
}));
                  
app.use(express.json());

const port = process.env.PORT || 4000;



// Routes
app.get('/', (req, res) => {
    res.json({ message: "Level Generation API is running!" });
});

app.get("/api/levels/:levelId/full-details", async (req, res) => {
    try {
        const { levelId } = req.params;

        // 1️⃣ ดึงข้อมูล Level + Category + Creator
        const level = await prisma.level.findUnique({
            where: { level_id: Number(levelId) },
            include: {
                category: true,
                creator: true,
                guides: {
                    include: { guide_images: { take: 1 } },
                    where: { is_active: true },
                    orderBy: { display_order: 'asc' }
                },
                level_blocks: {
                    include: { block: true },
                    where: { block: { is_available: true } }
                },
                level_victory_conditions: {
                    include: { victory_condition: true },
                    where: { victory_condition: { is_available: true } },
                    orderBy: { victory_condition_id: 'asc' }
                },
                patterns: {
                    include: { pattern_type: true, weapon: true },
                    orderBy: { pattern_name: 'asc' }
                }
            }
        });

        if (!level) {
            return res.status(404).json({
                success: false,
                message: "Level not found"
            });
        }

        // จัดข้อมูล blocks
        const blocksData = level.level_blocks.map(lb => ({
            block_id: lb.block.block_id,
            block_key: lb.block.block_key,
            block_name: lb.block.block_name,
            description: lb.block.description,
            category: lb.block.category,
            blockly_type: lb.block.blockly_type,
            is_available: lb.block.is_available,
            syntax_example: lb.block.syntax_example
        }));

        // จัดข้อมูล guides
        const guidesData = level.guides.map(g => ({
            guide_id: g.guide_id,
            title: g.title,
            description: g.description,
            display_order: g.display_order,
            is_active: g.is_active,
            created_at: g.created_at,
            updated_at: g.updated_at,
            guide_image: g.guide_images[0]?.path_file || null
        }));

        // จัดข้อมูล victory conditions
        const victoryConditions = level.level_victory_conditions.map(vc => ({
            victory_condition_id: vc.victory_condition.victory_condition_id,
            name: vc.victory_condition.name,
            check: vc.victory_condition.check,
            description: vc.victory_condition.description,
            is_available: vc.victory_condition.is_available
        }));

        // จัดข้อมูล patterns พร้อม pattern_type และ weapon
        const patternsData = level.patterns.map(p => ({
            pattern_id: p.pattern_id,
            pattern_name: p.pattern_name,
            description: p.description,
            xmlpattern: p.xmlpattern,
            hints: p.hints,
            pattern_type: p.pattern_type ? {
                pattern_type_id: p.pattern_type.pattern_type_id,
                type_name: p.pattern_type.type_name,
                description: p.pattern_type.description,
                quality_level: p.pattern_type.quality_level
            } : null,
            weapon: p.weapon ? {
                weapon_id: p.weapon.weapon_id,
                weapon_key: p.weapon.weapon_key,
                weapon_name: p.weapon.weapon_name,
                description: p.weapon.description,
                combat_power: p.weapon.combat_power,
                emoji: p.weapon.emoji,
                weapon_type: p.weapon.weapon_type
            } : null
        }));

        // จัดข้อมูล weapon images
        const weaponIds = patternsData.filter(p => p.weapon).map(p => p.weapon.weapon_id);
        let weaponImages = [];
        if (weaponIds.length > 0) {
            weaponImages = await prisma.weapon_Image.findMany({
                where: { weapon_id: { in: weaponIds } },
                include: { weapon: true },
                orderBy: [
                    { weapon: { weapon_name: 'asc' } },
                    { frame: 'asc' }
                ]
            });
        }

        // รวมข้อมูลทั้งหมด
        const fullLevelData = {
            level: {
                level_id: level.level_id,
                level_name: level.level_name,
                description: level.description,
                difficulty_level: level.difficulty_level,
                difficulty: level.difficulty,
                category_id: level.category_id,
                category_name: level.category?.category_name || null,
                category_description: level.category?.description || null,
                textcode: level.textcode,
                nodes: level.nodes,
                edges: level.edges,
                start_node_id: level.start_node_id,
                goal_node_id: level.goal_node_id,
                monsters: level.monsters,
                obstacles: level.obstacles,
                coin_positions: level.coin_positions,
                people: level.people,
                treasures: level.treasures,
                background_image: level.background_image,
                created_at: level.created_at,
                updated_at: level.updated_at,
                created_by: {
                    user_id: level.creator?.user_id,
                    username: level.creator?.username,
                    first_name: level.creator?.first_name,
                    last_name: level.creator?.last_name
                }
            },
            enabledBlocks: blocksData,
            patterns: patternsData,
            victoryConditions,
            guides: guidesData,
            weaponImages
        };

        res.json({
            success: true,
            data: fullLevelData,
            message: `Full details for level ${levelId} retrieved successfully`
        });

    } catch (error) {
        console.error('Error fetching full level details:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch full level details",
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});