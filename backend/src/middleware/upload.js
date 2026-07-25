import multer from "multer";

// Memory storage — files never touch disk
const storage = multer.memoryStorage();

// Strict MIME type whitelist
const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${file.mimetype}" is not allowed. Only JPEG, PNG, and WEBP images are accepted.`
      ),
      false
    );
  }
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5, // Maximum 5 files per request
  },
  fileFilter,
});

/**
 * Express middleware that handles up to 5 images on the "images" field.
 * Wraps multer to return a user-friendly JSON error instead of crashing.
 */
const upload = (req, res, next) => {
  const multerMiddleware = multerUpload.array("images", 5);

  multerMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (file size, file count, etc.)
      const messages = {
        LIMIT_FILE_SIZE: "Each image must be under 5 MB.",
        LIMIT_FILE_COUNT: "You can upload a maximum of 5 images.",
        LIMIT_UNEXPECTED_FILE: 'Unexpected field. Use "images" as the field name.',
      };
      return res.status(400).json({
        success: false,
        message: messages[err.code] || err.message,
      });
    }

    if (err) {
      // Custom file-filter errors or other errors
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};

export default upload;
