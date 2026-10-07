import { Router } from "express";

import {
  authenticate,
  requireSeller,
} from "../middleware/auth";
import { uploadStoreImages } from "../middleware/upload";

import {
  getMyStore,
  saveMyStore,
  getPublicStores,
  getPublicStoreById,
} from "../controllers/storeController";

const router = Router();

// =====================================================
// SELLER STORE
// =====================================================

router.get(
  "/me",
  authenticate,
  requireSeller,
  getMyStore
);

router.put(
  "/me",
  authenticate,
  requireSeller,
  uploadStoreImages.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  saveMyStore
);

// =====================================================
// PUBLIC STORE
// =====================================================

router.get(
  "/",
  getPublicStores
);

router.get(
  "/:storeId",
  getPublicStoreById
);

export default router;
