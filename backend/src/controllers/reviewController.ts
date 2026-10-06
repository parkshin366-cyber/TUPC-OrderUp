import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import Order from "../models/Order";
import Review from "../models/Review";

export async function createReview(req: AuthRequest, res: Response) {
  try {
    const orderId = String(req.body?.orderId || "");
    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order." });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Choose a star rating from 1 to 5." });
    if (comment.length < 3 || comment.length > 1000) return res.status(400).json({ success: false, message: "A review comment must be 3 to 1000 characters." });
    const order = await Order.findOne({ _id: orderId, customer: req.userId, status: "Completed" });
    if (!order) return res.status(403).json({ success: false, message: "Only your completed orders can be reviewed." });
    const review = await Review.create({ order: order._id, client: req.userId, seller: order.seller, rating, comment });
    return res.status(201).json({ success: true, review });
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "You have already reviewed this order." });
    console.error("Create review error:", error);
    return res.status(500).json({ success: false, message: "Unable to submit review." });
  }
}

export async function getSellerReviews(req: AuthRequest, res: Response) {
  try {
    const sellerId = String(req.params.sellerId || req.userId);
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return res.status(400).json({ success: false, message: "Invalid seller." });
    const [reviews, summary] = await Promise.all([
      Review.find({ seller: sellerId }).populate("client", "firstName lastName username").sort({ createdAt: -1 }),
      Review.aggregate([{ $match: { seller: new mongoose.Types.ObjectId(sellerId) } }, { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }]),
    ]);
    return res.json({ success: true, reviews, averageRating: summary[0]?.averageRating ?? 0, reviewCount: summary[0]?.reviewCount ?? 0 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return res.status(500).json({ success: false, message: "Unable to load reviews." });
  }
}

export async function getMyReviews(req: AuthRequest, res: Response) {
  try {
    const reviews = await Review.find({ client: req.userId }).select("order rating comment createdAt");
    return res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get my reviews error:", error);
    return res.status(500).json({ success: false, message: "Unable to load your reviews." });
  }
}
