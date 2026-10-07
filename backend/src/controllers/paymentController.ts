import { Response } from "express";
import mongoose from "mongoose";

import { AuthRequest } from "../middleware/auth";
import Order from "../models/Order";

const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader() {
  const secret = process.env.PAYMONGO_SECRET_KEY?.trim();
  if (!secret) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

async function paymongo(path: string, init?: RequestInit) {
  const response = await fetch(`${PAYMONGO_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: authHeader(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.errors?.[0]?.detail || "PayMongo rejected the payment request";
    throw new Error(detail);
  }
  return data;
}

export async function createGcashCheckout(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findOne({ _id: orderId, customer: req.userId }).select("+paymongoCheckoutSessionId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.paymentMethod !== "gcash") return res.status(400).json({ success: false, message: "This order does not use GCash" });
    if (order.paymentStatus === "paid") return res.status(409).json({ success: false, message: "This order is already paid" });

    const redirectBase = (process.env.PAYMONGO_REDIRECT_URL || process.env.EXPO_PUBLIC_API_URL || "https://paymongo.com").replace(/\/$/, "");
    const result = await paymongo("/checkout_sessions", {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: "TUPC OrderUp Customer" },
            cancel_url: `${redirectBase}/payment-cancelled?orderId=${order._id}`,
            success_url: `${redirectBase}/payment-success?orderId=${order._id}`,
            description: `TUPC OrderUp #${String(order._id).slice(-6).toUpperCase()}`,
            payment_method_types: ["gcash"],
            line_items: order.items.map((item: { price: number; name: string; quantity: number }) => ({
              amount: Math.round(item.price * 100),
              currency: "PHP",
              description: "Campus food order",
              name: item.name,
              quantity: item.quantity,
            })),
            reference_number: String(order._id),
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    order.paymongoCheckoutSessionId = result.data.id;
    await order.save();
    return res.json({ success: true, checkoutUrl: result.data.attributes.checkout_url });
  } catch (error) {
    console.error("Create PayMongo checkout error:", error);
    return res.status(502).json({ success: false, message: error instanceof Error ? error.message : "Unable to start GCash checkout" });
  }
}

export async function verifyGcashCheckout(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.params.orderId);
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findOne({ _id: orderId, customer: req.userId }).select("+paymongoCheckoutSessionId +paymongoPaymentId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!order.paymongoCheckoutSessionId) return res.status(409).json({ success: false, message: "No PayMongo checkout exists for this order" });

    const result = await paymongo(`/checkout_sessions/${encodeURIComponent(order.paymongoCheckoutSessionId)}`);
    const payments = result?.data?.attributes?.payments;
    const paidPayment = Array.isArray(payments)
      ? payments.find((payment: any) => payment?.attributes?.status === "paid" || payment?.status === "paid")
      : undefined;
    if (!paidPayment) return res.status(202).json({ success: false, pending: true, message: "Payment has not been completed yet" });

    order.paymentStatus = "paid";
    order.paymongoPaymentId = paidPayment.id;
    order.gcashReference = paidPayment?.attributes?.external_reference_number || paidPayment.id;
    await order.save();
    return res.json({ success: true, order });
  } catch (error) {
    console.error("Verify PayMongo checkout error:", error);
    return res.status(502).json({ success: false, message: error instanceof Error ? error.message : "Unable to verify GCash payment" });
  }
}
