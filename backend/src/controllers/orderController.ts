import { Response } from "express";
import mongoose from "mongoose";

import { AuthRequest } from "../middleware/auth";
import Order, {
    OrderStatus,
    PaymentMethod,
} from "../models/Order";
import Product from "../models/Product";
import Store from "../models/Store";
import User from "../models/User";
import VoucherRedemption from "../models/VoucherRedemption";
import { calculateVoucherForOrder } from "./voucherController";

async function restoreOrderStock(order: any) {
  if (order.stockRestoredAt) return;
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
      $set: { available: true },
    });
  }
  order.stockRestoredAt = new Date();
}

/**
 * =====================================================
 * CREATE ORDER
 * =====================================================
 * POST /api/orders
 */
export async function createOrder(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      storeId,
      items,
      pickupLocation,
      paymentMethod,
      voucherCode,
      fulfillmentMethod,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
    } = req.body;

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (!pickupLocation) {
      return res.status(400).json({
        success: false,
        message: "Pickup location is required",
      });
    }

    const resolvedFulfillment = fulfillmentMethod === "delivery" ? "delivery" : "pickup";

    if (
      paymentMethod !== "cash" &&
      paymentMethod !== "gcash"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const storeIdString = String(storeId);

    if (!mongoose.Types.ObjectId.isValid(storeIdString)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    // ---------------------------------------------------
    // CUSTOMER
    // ---------------------------------------------------

    const customer = await User.findById(req.userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    // ---------------------------------------------------
    // STORE
    // ---------------------------------------------------

    const store = await Store.findById(storeIdString);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (!store.isOpen) {
      return res.status(400).json({
        success: false,
        message: "This store is currently closed",
      });
    }

    if (paymentMethod === "gcash") {
      if (!store.gcashEnabled || !store.gcashName || !store.gcashNumber) {
        return res.status(400).json({ success: false, message: "GCash is not available for this store" });
      }
      if (!process.env.PAYMONGO_SECRET_KEY?.trim()) return res.status(503).json({ success: false, message: "Official GCash checkout is not configured yet" });
    }

    if (resolvedFulfillment === "delivery") {
      if (!store.deliveryEnabled) {
        return res.status(400).json({ success: false, message: "This seller is not accepting delivery orders" });
      }
      if (
        typeof deliveryAddress !== "string" || !deliveryAddress.trim() ||
        !Number.isFinite(Number(deliveryLatitude)) ||
        !Number.isFinite(Number(deliveryLongitude))
      ) {
        return res.status(400).json({ success: false, message: "Please pin a valid delivery location" });
      }
    }

    // ---------------------------------------------------
    // SELLER
    // ---------------------------------------------------

    const seller = await User.findById(store.seller).select(
      "role status firstName lastName username email contact"
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Store seller not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(400).json({
        success: false,
        message: "Store owner is not a seller",
      });
    }

    if (seller.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Store seller account is not approved",
      });
    }

    // ---------------------------------------------------
    // PRODUCTS
    // ---------------------------------------------------

    const orderItems: Array<{
      product: mongoose.Types.ObjectId;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }> = [];

    let subtotal = 0;

    for (const item of items) {
      const productId = item?.productId;
      const quantity = Number(item?.quantity);

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required for every item",
        });
      }

      const productIdString = String(productId);

      if (
        !mongoose.Types.ObjectId.isValid(productIdString)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${productIdString}`,
        });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be a positive integer",
        });
      }

      const product = await Product.findById(
        productIdString
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "One of the products no longer exists",
        });
      }

      // Product must belong to selected store
      if (
        product.store.toString() !==
        store._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not belong to this store`,
        });
      }

      // Product must be available
      if (!product.available) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // Check stock
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available stock: ${product.stock}`,
        });
      }

      const itemTotal = product.price * quantity;

      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    // ---------------------------------------------------
    // CREATE ORDER
    // ---------------------------------------------------

    let voucherResult;
    try {
      voucherResult = await calculateVoucherForOrder(
        customer._id.toString(),
        store._id.toString(),
        orderItems.map((item) => ({
          productId: item.product.toString(),
          total: item.price * item.quantity,
        })),
        subtotal,
        typeof voucherCode === "string" ? voucherCode : undefined
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Voucher cannot be applied",
      });
    }
    const discount = voucherResult?.discount ?? 0;

    const order = await Order.create({
      customer: customer._id,
      seller: seller._id,
      store: store._id,
      items: orderItems,
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      voucher: voucherResult?.voucher._id,
      voucherCode: voucherResult?.voucher.code,
      pickupLocation: String(pickupLocation).trim(),
      fulfillmentMethod: resolvedFulfillment,
      deliveryAddress: resolvedFulfillment === "delivery" ? String(deliveryAddress).trim() : undefined,
      deliveryLatitude: resolvedFulfillment === "delivery" ? Number(deliveryLatitude) : undefined,
      deliveryLongitude: resolvedFulfillment === "delivery" ? Number(deliveryLongitude) : undefined,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: "pending",
      status: "Pending" as OrderStatus,
    });

    if (voucherResult?.voucher) {
      try {
        await VoucherRedemption.create({
          voucher: voucherResult.voucher._id,
          customer: customer._id,
          store: store._id,
          order: order._id,
        });
      } catch (redemptionError: any) {
        await Order.findByIdAndDelete(order._id);
        if (redemptionError?.code === 11000) {
          return res.status(409).json({ success: false, message: "This voucher has already been used" });
        }
        throw redemptionError;
      }
    }

    // ---------------------------------------------------
    // REDUCE STOCK
    // ---------------------------------------------------

    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        continue;
      }

      product.stock -= item.quantity;

      if (product.stock <= 0) {
        product.stock = 0;
        product.available = false;
      }

      await product.save();
    }

    // ---------------------------------------------------
    // POPULATE RESPONSE
    // ---------------------------------------------------

    const populatedOrder = await Order.findById(order._id)
      .populate(
        "customer",
        "firstName lastName username email contact"
      )
      .populate(
        "seller",
        "firstName lastName username email contact"
      )
      .populate(
        "store",
        "name description location openTime closeTime isOpen pickupEnabled deliveryEnabled"
      )
      .populate(
        "items.product",
        "name category price stock available"
      );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
}

/**
 * =====================================================
 * GET MY ORDERS
 * =====================================================
 * GET /api/orders/my
 */
export async function getMyOrders(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await Order.find({
      customer: req.userId,
    })
      .populate(
        "seller",
        "firstName lastName username email"
      )
      .populate(
        "store",
        "name description location openTime closeTime isOpen pickupEnabled deliveryEnabled"
      )
      .populate(
        "items.product",
        "name category price stock available"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get orders",
    });
  }
}

/**
 * =====================================================
 * GET SELLER ORDERS
 * =====================================================
 * GET /api/orders/seller
 */
export async function getSellerOrders(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const seller = await User.findById(req.userId).select(
      "role status"
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Seller account is not approved",
      });
    }

    const orders = await Order.find({
      seller: req.userId,
    })
      .populate(
        "customer",
        "firstName lastName username email contact"
      )
      .populate(
        "store",
        "name description location openTime closeTime isOpen pickupEnabled deliveryEnabled"
      )
      .populate(
        "items.product",
        "name category price stock available"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get seller orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get seller orders",
    });
  }
}

/**
 * =====================================================
 * GET ORDER BY ID
 * =====================================================
 * GET /api/orders/:orderId
 */
export async function getOrderById(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orderId = String(req.params.orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId)
      .populate(
        "customer",
        "firstName lastName username email contact"
      )
      .populate(
        "seller",
        "firstName lastName username email contact"
      )
      .populate(
        "store",
        "name description location openTime closeTime isOpen pickupEnabled deliveryEnabled"
      )
      .populate(
        "items.product",
        "name category price stock available"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ---------------------------------------------------
    // OWNERSHIP CHECK
    // ---------------------------------------------------

    const customerId = String(
      (order.customer as unknown as {
        _id?: mongoose.Types.ObjectId;
      })?._id ?? order.customer
    );

    const sellerId = String(
      (order.seller as unknown as {
        _id?: mongoose.Types.ObjectId;
      })?._id ?? order.seller
    );

    if (
      customerId !== String(req.userId) &&
      sellerId !== String(req.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get order",
    });
  }
}

/**
 * =====================================================
 * UPDATE ORDER STATUS
 * =====================================================
 * PATCH /api/orders/:orderId/status
 */
export async function updateOrderStatus(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orderId = String(req.params.orderId);

    // IMPORTANT:
    // Don't leave status as `any`.
    // Convert it to string first, validate it,
    // then cast it to OrderStatus.
    const rawStatus: unknown = req.body?.status;

    // ---------------------------------------------------
    // ORDER ID VALIDATION
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ---------------------------------------------------
    // STATUS VALIDATION
    // ---------------------------------------------------

    const validStatuses: OrderStatus[] = [
      "Pending",
      "Preparing",
      "Ready",
      "On the Way",
      "Completed",
      "Cancelled",
    ];

    if (
      typeof rawStatus !== "string" ||
      !validStatuses.includes(rawStatus as OrderStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Now TypeScript knows this is an OrderStatus.
    const status = rawStatus as OrderStatus;

    // ---------------------------------------------------
    // VERIFY SELLER
    // ---------------------------------------------------

    const seller = await User.findById(req.userId).select(
      "role status"
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Seller account is not approved",
      });
    }

    // ---------------------------------------------------
    // FIND ORDER
    // ---------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ---------------------------------------------------
    // CHECK SELLER OWNERSHIP
    // ---------------------------------------------------

    if (
      order.seller.toString() !==
      String(req.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this order",
      });
    }

    if (order.cancellationStatus === "requested") {
      return res.status(409).json({
        success: false,
        message: "Review the customer's cancellation request before updating this order",
      });
    }

    if (order.paymentMethod === "gcash" && order.paymentStatus !== "paid") {
      return res.status(409).json({
        success: false,
        message: "Verify the customer's GCash payment before preparing this order",
      });
    }

    // ---------------------------------------------------
    // STATUS TRANSITIONS
    // ---------------------------------------------------

    const currentStatus: OrderStatus = order.status;

    const allowedTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {
      Pending: ["Preparing"],

      Preparing: ["Ready"],

      Ready: order.fulfillmentMethod === "delivery" ? ["On the Way"] : ["Completed"],

      "On the Way": ["Completed"],

      Completed: [],

      Cancelled: [],
    };

    // FIXED:
    // currentStatus is explicitly typed as OrderStatus,
    // so it can safely be used as a Record key.
    const allowedNextStatuses =
      allowedTransitions[currentStatus];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${currentStatus} to ${status}`,
      });
    }

    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------

    order.status = status;

    await order.save();

    // ---------------------------------------------------
    // POPULATE UPDATED ORDER
    // ---------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
      .populate(
        "customer",
        "firstName lastName username email contact"
      )
      .populate(
        "seller",
        "firstName lastName username email contact"
      )
      .populate(
        "store",
        "name description location openTime closeTime isOpen pickupEnabled deliveryEnabled"
      )
      .populate(
        "items.product",
        "name category price stock available"
      );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
}

export async function reviewGcashPayment(req: AuthRequest, res: Response) {
  try {
    if (process.env.PAYMONGO_SECRET_KEY?.trim()) {
      return res.status(403).json({ success: false, message: "GCash payments are verified automatically by PayMongo" });
    }
    const orderId = String(req.params.orderId);
    const action = req.body?.action;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (action !== "verify" && action !== "reject") {
      return res.status(400).json({ success: false, message: "Action must be verify or reject" });
    }

    const order = await Order.findOne({ _id: orderId, seller: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.paymentMethod !== "gcash") {
      return res.status(400).json({ success: false, message: "This is not a GCash order" });
    }
    if (order.status !== "Pending" || order.paymentStatus !== "pending") {
      return res.status(409).json({ success: false, message: "This GCash payment has already been reviewed" });
    }

    if (action === "verify") {
      order.paymentStatus = "paid";
    } else {
      order.paymentStatus = "failed";
      order.status = "Cancelled";
      order.cancellationStatus = "approved";
      order.cancellationReason = "GCash payment could not be verified";
      order.cancellationRequestedBy = "seller";
      order.cancellationReviewedAt = new Date();
      await restoreOrderStock(order);
    }
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "firstName lastName username email contact")
      .populate("seller", "firstName lastName username email contact")
      .populate("store", "name description location")
      .populate("items.product", "name category price stock available");
    return res.json({
      success: true,
      message: action === "verify" ? "GCash payment verified" : "GCash payment rejected and order cancelled",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Review GCash payment error:", error);
    return res.status(500).json({ success: false, message: "Unable to review GCash payment" });
  }
}

export async function updateOrderEta(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    const minutes = Number(req.body?.minutes);
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) return res.status(400).json({ success: false, message: "Estimated time must be between 5 and 180 minutes" });
    const order = await Order.findOne({ _id: orderId, seller: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (["Ready", "On the Way", "Completed", "Cancelled"].includes(order.status)) return res.status(400).json({ success: false, message: "Estimated time can no longer be changed" });
    order.estimatedMinutes = minutes;
    order.estimatedReadyAt = new Date(Date.now() + minutes * 60_000);
    await order.save();
    return res.json({ success: true, message: "Estimated preparation time updated", order });
  } catch (error) {
    console.error("Update order ETA error:", error);
    return res.status(500).json({ success: false, message: "Unable to update estimated time" });
  }
}

export async function requestOrderCancellation(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    if (reason.length < 3 || reason.length > 300) return res.status(400).json({ success: false, message: "Cancellation reason must be 3 to 300 characters" });
    const order = await Order.findOne({ _id: orderId, customer: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status === "Pending") {
      order.status = "Cancelled";
      order.cancellationStatus = "approved";
      order.cancellationReason = reason;
      order.cancellationRequestedBy = "client";
      order.cancellationRequestedAt = new Date();
      order.cancellationReviewedAt = new Date();
      await restoreOrderStock(order);
      await order.save();
      return res.json({ success: true, message: "Order cancelled", immediate: true, order });
    }
    if (order.status === "Preparing") {
      if (order.cancellationStatus === "requested") return res.status(409).json({ success: false, message: "Cancellation request is already pending" });
      order.cancellationStatus = "requested";
      order.cancellationReason = reason;
      order.cancellationRequestedBy = "client";
      order.cancellationRequestedAt = new Date();
      order.cancellationReviewedAt = undefined;
      order.cancellationRejectionReason = undefined;
      await order.save();
      return res.json({ success: true, message: "Cancellation request sent to seller", immediate: false, order });
    }
    return res.status(400).json({ success: false, message: "This order can no longer be cancelled" });
  } catch (error) {
    console.error("Request cancellation error:", error);
    return res.status(500).json({ success: false, message: "Unable to process cancellation" });
  }
}

export async function reviewCancellationRequest(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    const action = String(req.body?.action || "");
    const rejectionReason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    if (!["approve", "reject"].includes(action)) return res.status(400).json({ success: false, message: "Choose approve or reject" });
    const order = await Order.findOne({ _id: orderId, seller: req.userId, cancellationStatus: "requested" });
    if (!order) return res.status(404).json({ success: false, message: "Cancellation request not found" });
    if (action === "approve") {
      order.status = "Cancelled";
      order.cancellationStatus = "approved";
      order.cancellationReviewedAt = new Date();
      await restoreOrderStock(order);
    } else {
      if (rejectionReason.length < 3) return res.status(400).json({ success: false, message: "Give a reason for rejecting the request" });
      order.cancellationStatus = "rejected";
      order.cancellationRejectionReason = rejectionReason;
      order.cancellationReviewedAt = new Date();
    }
    await order.save();
    return res.json({ success: true, message: action === "approve" ? "Cancellation approved" : "Cancellation rejected", order });
  } catch (error) {
    console.error("Review cancellation error:", error);
    return res.status(500).json({ success: false, message: "Unable to review cancellation" });
  }
}

export async function cancelOrderBySeller(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    if (reason.length < 3 || reason.length > 300) return res.status(400).json({ success: false, message: "Cancellation reason must be 3 to 300 characters" });
    const order = await Order.findOne({ _id: orderId, seller: req.userId, status: { $in: ["Pending", "Preparing"] } });
    if (!order) return res.status(404).json({ success: false, message: "Order cannot be cancelled" });
    order.status = "Cancelled";
    order.cancellationStatus = "approved";
    order.cancellationReason = reason;
    order.cancellationRequestedBy = "seller";
    order.cancellationRequestedAt = new Date();
    order.cancellationReviewedAt = new Date();
    await restoreOrderStock(order);
    await order.save();
    return res.json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    console.error("Seller cancellation error:", error);
    return res.status(500).json({ success: false, message: "Unable to cancel order" });
  }
}
