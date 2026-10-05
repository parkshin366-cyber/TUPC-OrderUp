import { Router } from "express";

import {
  authenticate,
  requireSeller,
} from "../middleware/auth";

import {
  uploadProductImage,
} from "../middleware/upload";

import {
  analyzeNutrition,
  createProduct,
  deleteProduct,
  getMyProducts,
  getPublicProductById,
  getPublicProductsByStore,
  updateAvailability,
  updateProduct,
} from "../controllers/productController";

const router = Router();

// =====================================================
// PUBLIC PRODUCTS
// =====================================================

// Get all available products from a store
router.get(
  "/store/:storeId",
  getPublicProductsByStore
);

// =====================================================
// SELLER PRODUCTS
// =====================================================

// Get seller's own products
router.get(
  "/my",
  authenticate,
  requireSeller,
  getMyProducts
);

// =====================================================
// AI NUTRITION ANALYSIS
// =====================================================

// Analyze food image and return estimated
// nutrition information.
//
// IMPORTANT:
// This must be BEFORE "/:productId"
// so "analyze-nutrition" is not treated
// as a MongoDB product ID.

router.post(
  "/analyze-nutrition",
  authenticate,
  requireSeller,
  uploadProductImage.single("image"),
  analyzeNutrition
);

// =====================================================
// PUBLIC SINGLE PRODUCT
// =====================================================

// Get one available public product
router.get(
  "/:productId",
  getPublicProductById
);

// =====================================================
// CREATE PRODUCT
// =====================================================

router.post(
  "/",
  authenticate,
  requireSeller,
  uploadProductImage.single("image"),
  createProduct
);

// =====================================================
// UPDATE PRODUCT
// =====================================================

router.put(
  "/:productId",
  authenticate,
  requireSeller,
  uploadProductImage.single("image"),
  updateProduct
);

// =====================================================
// DELETE PRODUCT
// =====================================================

router.delete(
  "/:productId",
  authenticate,
  requireSeller,
  deleteProduct
);

// =====================================================
// UPDATE PRODUCT AVAILABILITY
// =====================================================

router.patch(
  "/:productId/availability",
  authenticate,
  requireSeller,
  updateAvailability
);

export default router;