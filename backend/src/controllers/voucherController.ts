import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import Order from "../models/Order";
import Product from "../models/Product";
import Store from "../models/Store";
import Voucher from "../models/Voucher";
import VoucherActivation from "../models/VoucherActivation";
import VoucherRedemption from "../models/VoucherRedemption";

const isObjectId = (value: unknown) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export async function getAdminVouchers(_req: AuthRequest, res: Response) {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, vouchers });
  } catch (error) {
    console.error("getAdminVouchers error:", error);
    return res.status(500).json({ success: false, message: "Unable to load vouchers" });
  }
}

export async function createAdminVoucher(req: AuthRequest, res: Response) {
  try {
    const { code, title, description, discountPercent, minimumOrder, newUsersOnly, endsAt } = req.body;
    const normalizedCode = String(code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) return res.status(400).json({ success: false, message: "Use 3–30 letters, numbers, underscores, or hyphens for the code" });
    if (!String(title ?? "").trim()) return res.status(400).json({ success: false, message: "Voucher title is required" });
    const percent = Number(discountPercent);
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) return res.status(400).json({ success: false, message: "Discount must be between 1 and 100 percent" });
    const voucher = await Voucher.create({
      code: normalizedCode,
      title: String(title).trim(),
      description: typeof description === "string" ? description.trim() : "",
      discountPercent: percent,
      minimumOrder: Math.max(0, Number(minimumOrder) || 0),
      newUsersOnly: Boolean(newUsersOnly),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      createdBy: req.userId,
    });
    return res.status(201).json({ success: true, voucher });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error && error.message.includes("duplicate") ? "Voucher code already exists" : "Unable to create voucher" });
  }
}

export async function updateAdminVoucher(req: AuthRequest, res: Response) {
  try {
    const voucherId = String(req.params.voucherId);
    if (!isObjectId(voucherId)) return res.status(400).json({ success: false, message: "Invalid voucher ID" });
    const update: Record<string, unknown> = {};
    for (const key of ["title", "description", "active", "newUsersOnly", "endsAt"]) if (key in req.body) update[key] = req.body[key];
    if ("discountPercent" in req.body) update.discountPercent = Number(req.body.discountPercent);
    if ("minimumOrder" in req.body) update.minimumOrder = Math.max(0, Number(req.body.minimumOrder) || 0);
    const voucher = await Voucher.findByIdAndUpdate(voucherId, { $set: update }, { new: true, runValidators: true });
    if (!voucher) return res.status(404).json({ success: false, message: "Voucher not found" });
    return res.json({ success: true, voucher });
  } catch { return res.status(400).json({ success: false, message: "Unable to update voucher" }); }
}

export async function getSellerVouchers(req: AuthRequest, res: Response) {
  try {
    const store = await Store.findOne({ seller: req.userId }).select("_id");
    if (!store) return res.status(404).json({ success: false, message: "Create your store before managing vouchers" });
    const [vouchers, activations, products] = await Promise.all([
      Voucher.find({ active: true, startsAt: { $lte: new Date() }, $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: new Date() } }] }).sort({ createdAt: -1 }).lean(),
      VoucherActivation.find({ store: store._id }).lean(),
      Product.find({ store: store._id }).select("name price available").sort({ name: 1 }).lean(),
    ]);
    return res.json({ success: true, storeId: store._id, vouchers, activations, products });
  } catch { return res.status(500).json({ success: false, message: "Unable to load seller vouchers" }); }
}

export async function saveSellerVoucherActivation(req: AuthRequest, res: Response) {
  try {
    const voucherId = String(req.params.voucherId);
    if (!isObjectId(voucherId)) return res.status(400).json({ success: false, message: "Invalid voucher ID" });
    const store = await Store.findOne({ seller: req.userId }).select("_id");
    const voucher = await Voucher.findById(voucherId).select("active");
    if (!store || !voucher) return res.status(404).json({ success: false, message: "Store or voucher not found" });
    if (!voucher.active) return res.status(400).json({ success: false, message: "This voucher is inactive" });
    const incomingIds = Array.isArray(req.body.productIds) ? req.body.productIds.filter(isObjectId) : [];
    const validCount = incomingIds.length ? await Product.countDocuments({ _id: { $in: incomingIds }, store: store._id }) : 0;
    if (incomingIds.length && validCount !== incomingIds.length) return res.status(400).json({ success: false, message: "A selected product does not belong to your store" });
    const activation = await VoucherActivation.findOneAndUpdate(
      { voucher: voucherId, store: store._id },
      { $set: { seller: req.userId, enabled: Boolean(req.body.enabled), productIds: incomingIds } },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ success: true, activation });
  } catch { return res.status(400).json({ success: false, message: "Unable to save voucher selection" }); }
}

export async function getCustomerStoreVouchers(req: AuthRequest, res: Response) {
  try {
    const storeId = String(req.params.storeId);
    if (!isObjectId(storeId)) return res.status(400).json({ success: false, message: "Invalid store ID" });
    const productIds = String(req.query.productIds ?? "").split(",").filter(isObjectId);
    const now = new Date();
    const [activations, redeemed, usedOrders] = await Promise.all([
      VoucherActivation.find({ store: storeId, enabled: true }).populate({ path: "voucher", match: { active: true, startsAt: { $lte: now }, $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] } }).lean(),
      VoucherRedemption.find({ customer: req.userId }).select("voucher").lean(),
      Order.find({ customer: req.userId, voucher: { $exists: true, $ne: null } }).select("voucher").lean(),
    ]);
    const redeemedIds = new Set([
      ...redeemed.map((item: any) => String(item.voucher)),
      ...usedOrders.map((item: any) => String(item.voucher)),
    ]);
    const vouchers = activations.filter((activation: any) => activation.voucher && !redeemedIds.has(String(activation.voucher._id)) && (!activation.productIds?.length || activation.productIds.some((id: any) => productIds.includes(String(id))))).map((activation: any) => ({ ...activation.voucher, activationId: activation._id, productIds: activation.productIds }));
    return res.json({ success: true, vouchers });
  } catch { return res.status(500).json({ success: false, message: "Unable to load available vouchers" }); }
}

export async function calculateVoucherForOrder(customerId: string, storeId: string, productLines: Array<{ productId: string; total: number }>, subtotal: number, voucherCode?: string) {
  if (!voucherCode) return null;
  const voucher = await Voucher.findOne({ code: voucherCode.trim().toUpperCase(), active: true });
  if (!voucher || voucher.startsAt > new Date() || (voucher.endsAt && voucher.endsAt < new Date())) throw new Error("This voucher is no longer available");
  if (subtotal < voucher.minimumOrder) throw new Error(`Minimum order is ₱${voucher.minimumOrder.toFixed(2)} for this voucher`);
  const activation = await VoucherActivation.findOne({ voucher: voucher._id, store: storeId, enabled: true });
  if (!activation) throw new Error("This voucher is not enabled by this seller");
  const [redemptionExists, usedOrderExists] = await Promise.all([
    VoucherRedemption.exists({ voucher: voucher._id, customer: customerId }),
    Order.exists({ voucher: voucher._id, customer: customerId }),
  ]);
  const alreadyRedeemed = Boolean(redemptionExists || usedOrderExists);
  if (alreadyRedeemed) throw new Error("This voucher has already been used");
  if (activation.productIds.length && !activation.productIds.some((id) => productLines.some((line) => line.productId === String(id)))) throw new Error("This voucher does not apply to the selected products");
  if (voucher.newUsersOnly) {
    const previousOrders = await Order.countDocuments({ customer: customerId, status: { $ne: "Cancelled" } });
    if (previousOrders > 0) throw new Error("This voucher is for new users only");
  }
  const eligibleSubtotal = activation.productIds.length
    ? productLines.filter((line) => activation.productIds.some((id) => String(id) === line.productId)).reduce((total, line) => total + line.total, 0)
    : subtotal;
  return { voucher, activation, discount: Number((eligibleSubtotal * voucher.discountPercent / 100).toFixed(2)) };
}
