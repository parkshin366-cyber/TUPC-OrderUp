import { Router } from "express";

import {
  authenticate,
  requireSeller,
} from "../middleware/auth";

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