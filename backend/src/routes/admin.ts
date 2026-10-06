import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { createRent, createStall, getAdminFinance, updateRentStatus, updateStall } from "../controllers/adminController";
import { createAdminVoucher, getAdminVouchers, updateAdminVoucher } from "../controllers/voucherController";

const router = Router();
router.use(authenticate, requireAdmin);
router.get("/finance", getAdminFinance);
router.post("/stalls", createStall);
router.patch("/stalls/:stallId", updateStall);
router.post("/rents", createRent);
router.patch("/rents/:rentId/status", updateRentStatus);
router.get("/vouchers", getAdminVouchers);
router.post("/vouchers", createAdminVoucher);
router.patch("/vouchers/:voucherId", updateAdminVoucher);
export default router;
