import multer from "multer";

// =====================================================
// STORAGE
// =====================================================
// Use memory storage because the uploaded image will be
// processed by the controller/service before saving.
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// ALLOWED IMAGE TYPES
// =====================================================

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// =====================================================
// COMMON IMAGE FILTER
// =====================================================

const imageFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  const mimeType = String(
    file.mimetype || ""
  ).toLowerCase();

  if (!allowedMimeTypes.has(mimeType)) {
    return callback(
      new Error(
        "Only JPG, JPEG, PNG, WEBP, HEIC, or HEIF images are allowed."
      )
    );
  }

  callback(null, true);
};

// =====================================================
// ID IMAGE UPLOAD
// =====================================================
// Existing upload used for ID images.
// Supports up to 4 files.
// Maximum 5 MB per file.
// =====================================================

const uploadIdImages = multer({
  storage,

  limits: {
    files: 4,
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFileFilter,
});

// =====================================================
// PRODUCT IMAGE UPLOAD
// =====================================================
// Used specifically for Product images.
//
// One product = one image.
// Maximum 5 MB.
// =====================================================

const uploadProductImage = multer({
  storage,

  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFileFilter,
});

// =====================================================
// EXPORTS
// =====================================================

export {
  uploadIdImages,
  uploadProductImage
};
