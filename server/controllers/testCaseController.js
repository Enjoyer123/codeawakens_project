const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all test cases for a level
 */
exports.getTestCasesByLevel = async (req, res) => {
  try {
    const { levelId } = req.params;

    const testCases = await prisma.levelTestCase.findMany({
      where: {
        level_id: parseInt(levelId),
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    res.json(testCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ message: 'Error fetching test cases', error: error.message });
  }
};

/**
 * Create a new test case
 */
exports.createTestCase = async (req, res) => {
  try {
    const {
      level_id,
      test_case_name,
      is_primary,
      function_name,
      input_params,
      expected_output,
      comparison_type,
      display_order,
    } = req.body;

    // Validate required fields
    if (!level_id || !test_case_name || !function_name || !expected_output) {
      return res.status(400).json({
        message: 'Missing required fields: level_id, test_case_name, function_name, expected_output',
      });
    }

    const testCase = await prisma.levelTestCase.create({
      data: {
        level_id: parseInt(level_id),
        test_case_name,
        is_primary: is_primary || false,
        function_name: function_name.toUpperCase(), // Store in uppercase
        input_params: input_params || {},
        expected_output,
        comparison_type: comparison_type || 'exact',
        display_order: display_order || 0,
      },
    });

    res.status(201).json(testCase);
  } catch (error) {
    console.error('Error creating test case:', error);
    res.status(500).json({ message: 'Error creating test case', error: error.message });
  }
};

/**
 * Update a test case
 */
exports.updateTestCase = async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const {
      test_case_name,
      is_primary,
      function_name,
      input_params,
      expected_output,
      comparison_type,
      display_order,
    } = req.body;

    const testCase = await prisma.levelTestCase.update({
      where: {
        test_case_id: parseInt(testCaseId),
      },
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

    res.json(testCase);
  } catch (error) {
    console.error('Error updating test case:', error);
    res.status(500).json({ message: 'Error updating test case', error: error.message });
  }
};

/**
 * Delete a test case
 */
exports.deleteTestCase = async (req, res) => {
  try {
    const { testCaseId } = req.params;

    await prisma.levelTestCase.delete({
      where: {
        test_case_id: parseInt(testCaseId),
      },
    });

    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    res.status(500).json({ message: 'Error deleting test case', error: error.message });
  }
};

