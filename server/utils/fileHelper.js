import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const UPLOAD_BASE = path.join(__dirname, "..");

/**
 * Safely delete a file if it exists. Does not throw on failure.
 * @param {string} relativePath - path relative to server root (e.g. "/uploads/weapons/img.png")
 */
export const safeDeleteFile = (relativePath) => {
  if (!relativePath) return;
  const fullPath = path.join(UPLOAD_BASE, relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error(`[fileHelper] Error deleting file ${fullPath}:`, err.message);
    }
  }
}

/**
 * Move/rename a file. Creates target directory if needed.
 * @param {string} srcAbsolute - absolute source path
 * @param {string} destAbsolute - absolute destination path
 * @throws {Error} if move fails
 */
export const moveFile = (srcAbsolute, destAbsolute) => {
  const destDir = path.dirname(destAbsolute);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Delete existing target if present
  if (fs.existsSync(destAbsolute)) {
    fs.unlinkSync(destAbsolute);
  }

  try {
    fs.renameSync(srcAbsolute, destAbsolute);
  } catch (renameError) {
    // Cross-device fallback: copy + delete
    try {
      fs.copyFileSync(srcAbsolute, destAbsolute);
      fs.unlinkSync(srcAbsolute);
    } catch (copyError) {
      if (fs.existsSync(srcAbsolute)) fs.unlinkSync(srcAbsolute);
      throw copyError;
    }
  }
}

/**
 * Delete an uploaded temp file (e.g. on validation failure). Does not throw.
 * @param {object} file - multer file object (req.file)
 */
export const cleanupTempFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`[fileHelper] Error cleaning temp file:`, err.message);
    }
  }
}


