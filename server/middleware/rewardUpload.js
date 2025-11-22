const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directory for rewards
const rewardsDir = path.join(__dirname, "..", "uploads", "rewards");

if (!fs.existsSync(rewardsDir)) {
  fs.mkdirSync(rewardsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, rewardsDir);
    } catch (error) {
      console.error('Error in multer destination:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate temporary filename first, will be renamed in controller
      // Multer may not have parsed req.body yet, so we use a temporary name
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e6);
      const filename = `temp-reward-${timestamp}-${randomSuffix}${ext}`;
      
      console.log('Multer filename (temp):', { filename });
      cb(null, filename);
    } catch (error) {
      console.error('Error in multer filename:', error);
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
  rewardsDir,
};

