import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const uploadIdImages = multer({
  storage,

  limits: {
    files: 4,
    fileSize: 5 * 1024 * 1024, // 5 MB per image
  },

  fileFilter: (_req, file, callback) => {
    const mimeType = String(file.mimetype || "").toLowerCase();

    if (!allowedMimeTypes.has(mimeType)) {
      return callback(
        new Error(
          "Only JPG, JPEG, PNG, WEBP, HEIC, or HEIF ID images are allowed."
        )
      );
    }

    callback(null, true);
  },
});

export { uploadIdImages };
