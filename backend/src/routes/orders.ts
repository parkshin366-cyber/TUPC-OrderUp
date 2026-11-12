import { uploadProductImage } from "../middleware/upload";
import { Router } from "express";

import {
    authenticate,
    requireSeller,
} from "../middleware/auth";

import {
    createOrder,
    getOrderReceipt,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
    updateOrderEta,
    requestOrderCancellation,
    reviewCancellationRequest,
    cancelOrderBySeller,
    reviewGcashPayment,
    getPaymentProof,
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
  uploadProductImage.single("paymentProof"),
  createOrder
);

// Get logged-in client's orders
// GET /api/orders/my
router.get(
  "/my",
  authenticate,
  getMyOrders
);

router.get("/:orderId/receipt", authenticate, getOrderReceipt);

router.post("/:orderId/cancel", authenticate, requestOrderCancellation);
router.post("/:orderId/payment/checkout", authenticate, (_req, res) => { res.status(410).json({ message: "Use the seller GCash account and upload your payment screenshot." }); });
router.get("/:orderId/payment/proof", authenticate, getPaymentProof);
router.post("/:orderId/payment/verify", authenticate, (_req, res) => { res.status(410).json({ message: "Payment must be verified by the seller." }); });

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

router.patch("/:orderId/payment", authenticate, requireSeller, reviewGcashPayment);

router.patch("/:orderId/eta", authenticate, requireSeller, updateOrderEta);
router.patch("/:orderId/cancellation", authenticate, requireSeller, reviewCancellationRequest);
router.post("/:orderId/seller-cancel", authenticate, requireSeller, cancelOrderBySeller);

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
