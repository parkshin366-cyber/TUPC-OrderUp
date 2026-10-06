import { Router } from "express";
import { authenticate, requireSeller } from "../middleware/auth";
import { getCustomerStoreVouchers, getSellerVouchers, saveSellerVoucherActivation } from "../controllers/voucherController";

const router = Router();
router.get("/store/:storeId", authenticate, getCustomerStoreVouchers);
router.get("/seller", authenticate, requireSeller, getSellerVouchers);
router.put("/seller/:voucherId", authenticate, requireSeller, saveSellerVoucherActivation);
export default router;
