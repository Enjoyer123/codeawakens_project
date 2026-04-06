const testCaseService = require("../services/testCaseService");

exports.getTestCasesByLevel = async (req, res) => {
  try { res.json(await testCaseService.getTestCasesByLevel(parseInt(req.params.levelId))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching test cases" }); }
};
exports.createTestCase = async (req, res) => {
  try { const tc = await testCaseService.createTestCase(req.body); res.status(201).json(tc); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating test case" }); }
};
exports.updateTestCase = async (req, res) => {
  try { const tc = await testCaseService.updateTestCase(parseInt(req.params.testCaseId), req.body); res.json(tc); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error updating test case" }); }
};
exports.deleteTestCase = async (req, res) => {
  try { await testCaseService.deleteTestCase(parseInt(req.params.testCaseId)); res.json({ message: "Test case deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting test case" }); }
};
