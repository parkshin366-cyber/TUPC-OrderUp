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

    const order = await Order.create({
      customer: customer._id,
      seller: seller._id,
      store: store._id,
      items: orderItems,
      subtotal,
      total: subtotal,
      pickupLocation: String(pickupLocation).trim(),
      paymentMethod: paymentMethod as PaymentMethod,
      status: "Pending" as OrderStatus,
    });

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
        "name description location openTime closeTime isOpen pickupEnabled"
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
        "name description location openTime closeTime isOpen pickupEnabled"
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
        "name description location openTime closeTime isOpen pickupEnabled"
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
        "name description location openTime closeTime isOpen pickupEnabled"
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

    // ---------------------------------------------------
    // STATUS TRANSITIONS
    // ---------------------------------------------------

    const currentStatus: OrderStatus = order.status;

    const allowedTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {
      Pending: ["Preparing", "Cancelled"],

      Preparing: ["Ready", "Cancelled"],

      Ready: ["Completed"],

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
        "name description location openTime closeTime isOpen pickupEnabled"
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