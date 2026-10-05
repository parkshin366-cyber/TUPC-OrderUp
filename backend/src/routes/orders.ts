import { Router } from "express";

import {
    authenticate,
    requireSeller,
} from "../middleware/auth";

import {
    createOrder,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
} from "../controllers/orderController";

const router = Router();

/**
 * =====================================================
 * CLIENT
 * =====================================================
 */

// Create new order
// POST /api/orders
router.post(
  "/",
  authenticate,
  createOrder
);

// Get logged-in client's orders
// GET /api/orders/my
router.get(
  "/my",
  authenticate,
  getMyOrders
);

/**
 * =====================================================
 * SELLER
 * =====================================================
 */

// Get logged-in seller's orders
// GET /api/orders/seller
router.get(
  "/seller",
  authenticate,
  requireSeller,
  getSellerOrders
);

// Update order status
// PATCH /api/orders/:orderId/status
router.patch(
  "/:orderId/status",
  authenticate,
  requireSeller,
  updateOrderStatus
);

/**
 * =====================================================
 * SINGLE ORDER
 * =====================================================
 */

// Get one order
// GET /api/orders/:orderId
router.get(
  "/:orderId",
  authenticate,
  getOrderById
);

export default router;