const prisma = require("../models/prisma");

async function getTestCasesByLevel(levelId) {
  return prisma.levelTestCase.findMany({ where: { level_id: levelId }, orderBy: { display_order: "asc" } });
}

async function createTestCase(data) {
  const { level_id, test_case_name, is_primary, function_name, input_params, expected_output, comparison_type, display_order } = data;
  if (!level_id || !test_case_name || !function_name || expected_output === undefined) {
    const err = new Error("Missing required fields: level_id, test_case_name, function_name, expected_output"); err.status = 400; throw err;
  }
  return prisma.levelTestCase.create({
    data: { level_id: parseInt(level_id), test_case_name, is_primary: is_primary || false, function_name: function_name.toUpperCase(), input_params: input_params || {}, expected_output, comparison_type: comparison_type || "exact", display_order: display_order || 0 },
  });
}

async function updateTestCase(testCaseId, data) {
  const { test_case_name, is_primary, function_name, input_params, expected_output, comparison_type, display_order } = data;
  return prisma.levelTestCase.update({
    where: { test_case_id: testCaseId },
    data: {
      ...(test_case_name && { test_case_name }),
      ...(is_primary !== undefined && { is_primary }),
      ...(function_name && { function_name: function_name.toUpperCase() }),
      ...(input_params !== undefined && { input_params }),
      ...(expected_output !== undefined && { expected_output }),
      ...(comparison_type && { comparison_type }),
      ...(display_order !== undefined && { display_order }),
    },
  });
}

async function deleteTestCase(testCaseId) {
  await prisma.levelTestCase.delete({ where: { test_case_id: testCaseId } });
}

module.exports = { getTestCasesByLevel, createTestCase, updateTestCase, deleteTestCase };
