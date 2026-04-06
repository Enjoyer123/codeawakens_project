import * as testCaseRepo from "../models/testCaseModel.js";

export const getTestCasesByLevel = async (levelId) => {
  return testCaseRepo.findTestCasesByLevel(levelId);
}

export const createTestCase = async (data) => {
  const { level_id, test_case_name, is_primary, function_name, input_params, expected_output, comparison_type, display_order } = data;
  if (!level_id || !test_case_name || !function_name || expected_output === undefined) {
    const err = new Error("Missing required fields: level_id, test_case_name, function_name, expected_output"); err.status = 400; throw err;
  }
  return testCaseRepo.createTestCase({ level_id: parseInt(level_id), test_case_name, is_primary: is_primary || false, function_name: function_name.toUpperCase(), input_params: input_params || {}, expected_output, comparison_type: comparison_type || "exact", display_order: display_order || 0 });
}

export const updateTestCase = async (testCaseId, data) => {
  const { test_case_name, is_primary, function_name, input_params, expected_output, comparison_type, display_order } = data;
  return testCaseRepo.updateTestCase(testCaseId, {
    ...(test_case_name && { test_case_name }),
    ...(is_primary !== undefined && { is_primary }),
    ...(function_name && { function_name: function_name.toUpperCase() }),
    ...(input_params !== undefined && { input_params }),
    ...(expected_output !== undefined && { expected_output }),
    ...(comparison_type && { comparison_type }),
    ...(display_order !== undefined && { display_order }),
  });
}

export const deleteTestCase = async (testCaseId) => {
  await testCaseRepo.deleteTestCase(testCaseId);
}


