const path = require('path');
const fs = require('fs');

const dotenvPath = path.join(__dirname, '.env');
console.log("Loading .env from:", dotenvPath);
require('dotenv').config({ path: dotenvPath });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const levelId = 5; // Check Level 5
    let output = `Checking patterns for Level ${levelId}...\n`;

    try {
        const patterns = await prisma.pattern.findMany({
            where: {
                level_id: levelId
            },
            include: {
                pattern_type: true
            }
        });

        output += `Found ${patterns.length} patterns for Level ${levelId}:\n`;
        patterns.forEach(p => {
            output += `- Pattern ID: ${p.pattern_id}\n`;
            output += `  Name: ${p.pattern_name}\n`;
            output += `  Type: ${p.pattern_type?.type_name} (ID: ${p.pattern_type_id})\n`;
            output += `  BigO: ${JSON.stringify(p.bigO)} (Type: ${typeof p.bigO})\n`;
            output += '---\n';
        });
    } catch (err) {
        output += `Error: ${err.message}\n${err.stack}\n`;
    }

    fs.writeFileSync('bigo_results.txt', output);
    console.log("Results written to bigo_results.txt");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
