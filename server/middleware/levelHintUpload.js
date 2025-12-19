const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directory for level hints
const hintsDir = path.join(__dirname, "..", "uploads", "level_hints");

if (!fs.existsSync(hintsDir)) {
  fs.mkdirSync(hintsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, hintsDir);
    } catch (error) {
      console.error("Error in multer destination (levelHint):", error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate filename: level-{levelId}-hint-{hintId}-{timestamp}-{random}.ext
      const levelId = req.params.levelId || req.body.level_id || "level";
      const hintId = req.params.hintId || "hint";
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e6);
      const filename = `level-${levelId}-hint-${hintId}-${timestamp}-${randomSuffix}${ext}`;

      console.log("LevelHint multer filename:", { levelId, hintId, filename });
      cb(null, filename);
    } catch (error) {
      console.error("Error in multer filename (levelHint):", error);
      cb(error);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      ),
      false
    );
  }
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = {
  uploadMiddleware,
  hintsDir,
};


