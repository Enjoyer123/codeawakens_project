const testService = require("../services/testService");

exports.getTestsByType = async (req, res) => {
  try {
    const result = await testService.getTestsByType(req.params.type, req.user?.id);
    res.json(result);
  } catch (e) {
    console.error("Error fetching tests:", e.message);
    const response = { message: e.message || "Error fetching tests" };
    if (e.missing_levels) response.missing_levels = e.missing_levels;
    res.status(e.status || 500).json(response);
  }
};

exports.submitTest = async (req, res) => {
  try {
    const result = await testService.submitTest(req.body.type, req.body.answers, req.user.id);
    res.json(result);
  } catch (e) {
    console.error("Error submitting test:", e.message);
    res.status(e.status || 500).json({ message: e.message || "Error submitting test" });
  }
};

exports.getAllTests = async (req, res) => {
  try { res.json(await testService.getAllTests(req.query.type)); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching tests" }); }
};

exports.createTest = async (req, res) => {
  try { const test = await testService.createTest(req.body); res.status(201).json(test); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating test" }); }
};

exports.updateTest = async (req, res) => {
  try { const test = await testService.updateTest(parseInt(req.params.id), req.body); res.json(test); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error updating test" }); }
};

exports.deleteTest = async (req, res) => {
  try { await testService.deleteTest(parseInt(req.params.id)); res.json({ message: "Test deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting test" }); }
};

exports.deleteTestChoice = async (req, res) => {
  try { await testService.deleteTestChoice(parseInt(req.params.id)); res.json({ message: "Choice deleted" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting choice" }); }
};

exports.uploadTestImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ message: "Image uploaded successfully", path: `/uploads/tests/${req.file.filename}`, filename: req.file.filename });
  } catch (e) { res.status(500).json({ message: "Upload failed", error: e.message }); }
};

exports.uploadChoiceImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ message: "Choice image uploaded successfully", path: `/uploads/test_choices/${req.file.filename}`, filename: req.file.filename });
  } catch (e) { res.status(500).json({ message: "Upload failed", error: e.message }); }
};
