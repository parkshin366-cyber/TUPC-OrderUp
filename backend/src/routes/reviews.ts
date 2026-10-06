import { Router } from "express";
import { authenticate, requireSeller } from "../middleware/auth";
import { createReview, getMyReviews, getSellerReviews } from "../controllers/reviewController";

const router = Router();
router.post("/", authenticate, createReview);
router.get("/my", authenticate, getMyReviews);
router.get("/seller/me", authenticate, requireSeller, getSellerReviews);
router.get("/seller/:sellerId", getSellerReviews);
export default router;
