const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directory for blocks
const blockUploadDir = path.join(__dirname, "..", "uploads", "blocks");

if (!fs.existsSync(blockUploadDir)) {
    fs.mkdirSync(blockUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            cb(null, blockUploadDir);
        } catch (error) {
            console.error("Error in multer destination (blocks):", error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        try {
            // block-{timestamp}-{random}.ext
            const ext = path.extname(file.originalname);
            const timestamp = Date.now();
            const randomSuffix = Math.round(Math.random() * 1e6);
            const filename = `block-${timestamp}-${randomSuffix}${ext}`;
            cb(null, filename);
        } catch (error) {
            console.error("Error in multer filename (blocks):", error);
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

const blockUploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

module.exports = {
    blockUploadMiddleware,
    blockUploadDir,
};
