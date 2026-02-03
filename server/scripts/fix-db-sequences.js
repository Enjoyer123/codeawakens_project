const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixSequences() {
    console.log("Starting database sequence fix...");

    const tablesToFix = [
        // --- 1. Critical for Code/Patch (Tables you might manually insert) ---
        { table: 'blocks', column: 'block_id' },
        { table: 'level_blocks', column: 'level_block_id' },
        { table: 'victory_conditions', column: 'victory_condition_id' },
        { table: 'level_victory_conditions', column: 'level_victory_condition_id' },

        // --- 2. General Safety (Tables usually managed by App, but good to check) ---
        { table: 'levels', column: 'level_id' },
        { table: 'level_categories', column: 'category_id' },
        { table: 'users', column: 'user_id' },
        { table: 'weapons', column: 'weapon_id' },
        { table: 'patterns', column: 'pattern_id' },
    ];

    for (const { table, column } of tablesToFix) {
        try {
            console.log(`Fixing sequence for ${table}.${column}...`);

            // Use raw SQL safely here for maintenance script
            await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('${table}', '${column}'),
          COALESCE((SELECT MAX(${column}) FROM ${table}), 1),
          true
        )
      `);

            console.log(`✓ Fixed ${table}`);
        } catch (error) {
            console.error(`✗ Failed to fix ${table}:`, error.message);
        }
    }

    console.log("Sequence fix completed.");
}

fixSequences()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
