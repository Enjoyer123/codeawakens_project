import prisma from "./prisma.js";

export const findTestCasesByLevel = async (levelId) => prisma.levelTestCase.findMany({ where: { level_id: levelId }, orderBy: { display_order: "asc" } });
export const findLevelWithCategory = async (levelId) => prisma.level.findUnique({ where: { level_id: levelId }, include: { category: true } });
export const createTestCase = async (data) => prisma.levelTestCase.create({ data });
export const updateTestCase = async (testCaseId, data) => prisma.levelTestCase.update({ where: { test_case_id: testCaseId }, data });
export const deleteTestCase = async (testCaseId) => prisma.levelTestCase.delete({ where: { test_case_id: testCaseId } });
