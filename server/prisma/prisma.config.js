/** @type {import('@prisma/migrate').Config} */
const config = {
    schema: "./schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL,
    },
};

export default config;
