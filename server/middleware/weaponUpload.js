const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directories
const weaponsDir = path.join(__dirname, "..", "uploads", "weapons");
const weaponsEffectDir = path.join(__dirname, "..", "uploads", "weapons_effect");

[weaponsDir, weaponsEffectDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Multer may not have parsed req.body yet, so we'll use a temporary location
      // and move the file in the controller based on type_animation
      // Use weaponsDir as default, will be moved later if needed
      cb(null, weaponsDir);
    } catch (error) {
      console.error('Error in multer destination:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Use original filename if provided, otherwise generate unique name
      // Note: req.body may not be available immediately in multer, so we use a fallback
      const weaponKey = (req.body && req.body.weapon_key) || 'weapon';
      const typeAnimation = (req.body && req.body.type_animation) || 'weapon';
      const frame = (req.body && req.body.frame) || '1';
      const ext = path.extname(file.originalname);
      
      // Generate filename: weapon_key-type_animation-frame-timestamp.ext
      // Add timestamp to prevent filename conflicts
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e6);
      
      // Generate filename: weapon_key-type_animation-frame-timestamp-random.ext
      // e.g., stick-weapon-1-1234567890-123456.png or magic_sword-effect-1-1234567890-123456.png
      const filename = `${weaponKey}-${typeAnimation === 'effect' ? 'effect' : 'weapon'}-${frame}-${timestamp}-${randomSuffix}${ext}`;
      console.log('Multer filename:', { weaponKey, typeAnimation, frame, filename });
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
  weaponsDir,
  weaponsEffectDir,
};

