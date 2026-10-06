import { Request, Response } from "express";
import mongoose from "mongoose";
import Rent, { RentStatus } from "../models/Rent";
import Stall from "../models/Stall";
import User from "../models/User";

const rentStatuses: RentStatus[] = ["Paid", "Due", "Overdue", "For verification"];

export async function getAdminFinance(_req: Request, res: Response) {
  try {
    const [stalls, rents, pendingSellerCount] = await Promise.all([
      Stall.find().populate("seller", "firstName lastName username").sort({ code: 1 }).lean(),
      Rent.find().populate("seller", "firstName lastName username").populate("stall", "code location").sort({ dueDate: 1 }).lean(),
      User.countDocuments({ role: "seller", status: "pending" }),
    ]);
    return res.json({ success: true, stalls, rents, pendingSellerCount });
  } catch (error) {
    console.error("getAdminFinance error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin finance data" });
  }
}

export async function createStall(req: Request, res: Response) {
  try {
    const { code, location, monthlyRent } = req.body;
    const stall = await Stall.create({ code, location, monthlyRent: Number(monthlyRent) });
    return res.status(201).json({ success: true, stall });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create stall" });
  }
}

export async function updateStall(req: Request, res: Response) {
  try {
    const stallId = String(req.params.stallId);
    if (!mongoose.Types.ObjectId.isValid(stallId)) return res.status(400).json({ success: false, message: "Invalid stall ID" });
    const { sellerId, location, monthlyRent } = req.body;
    const update: Record<string, unknown> = {};
    if (sellerId === null || sellerId === "") update.seller = null;
    if (typeof sellerId === "string" && mongoose.Types.ObjectId.isValid(sellerId)) update.seller = sellerId;
    if (typeof location === "string") update.location = location.trim();
    if (monthlyRent !== undefined) update.monthlyRent = Number(monthlyRent);
    const stall = await Stall.findByIdAndUpdate(stallId, { $set: update }, { new: true, runValidators: true }).populate("seller", "firstName lastName username");
    if (!stall) return res.status(404).json({ success: false, message: "Stall not found" });
    return res.json({ success: true, stall });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update stall" });
  }
}

export async function createRent(req: Request, res: Response) {
  try {
    const { sellerId, stallId, amount, dueDate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return res.status(400).json({ success: false, message: "A valid seller is required" });
    const rent = await Rent.create({ seller: sellerId, stall: mongoose.Types.ObjectId.isValid(stallId) ? stallId : undefined, amount: Number(amount), dueDate, status: "Due" });
    await rent.populate(["seller", "stall"]);
    return res.status(201).json({ success: true, rent });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create rent record" });
  }
}

export async function updateRentStatus(req: Request, res: Response) {
  try {
    const rentId = String(req.params.rentId);
    const { status, paymentReference } = req.body;
    if (!mongoose.Types.ObjectId.isValid(rentId)) return res.status(400).json({ success: false, message: "Invalid rent ID" });
    if (!rentStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid rent status" });
    const rent = await Rent.findByIdAndUpdate(rentId, { $set: { status, paymentReference } }, { new: true, runValidators: true }).populate(["seller", "stall"]);
    if (!rent) return res.status(404).json({ success: false, message: "Rent record not found" });
    return res.json({ success: true, rent });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update rent" });
  }
}
