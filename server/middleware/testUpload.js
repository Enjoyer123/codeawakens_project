const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directory for tests
const testUploadDir = path.join(__dirname, "..", "uploads", "tests");

if (!fs.existsSync(testUploadDir)) {
  fs.mkdirSync(testUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, testUploadDir);
    } catch (error) {
      console.error("Error in multer destination (test):", error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // test-image-{timestamp}-{random}.ext
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e6);
      const filename = `test-image-${timestamp}-${randomSuffix}${ext}`;
      cb(null, filename);
    } catch (error) {
      console.error("Error in multer filename (test):", error);
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
  testUploadDir,
};
