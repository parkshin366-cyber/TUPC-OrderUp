import express from "express";

import {
  checkUsernameAvailability,
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  sendOtp,
  verifyOtp,
  verifyResetOtp,
} from "../controllers/authController";

import { authenticate } from "../middleware/auth";
import { uploadIdImages } from "../middleware/upload";

const router = express.Router();

// =========================================================
// CHECK USERNAME AVAILABILITY
// =========================================================

router.get(
  "/check-username",
  checkUsernameAvailability
);

// =========================================================
// REGISTER
// =========================================================
//
// Accepted registration images:
//
// Student:
//   - tupcIdFront
//
// Others:
//   - governmentIdFront
//
// NO:
//   - tupcIdBack
//   - governmentIdBack
//   - PIN
// =========================================================

router.post(
  "/register",
  uploadIdImages.fields([
    {
      name: "tupcIdFront",
      maxCount: 1,
    },
    {
      name: "governmentIdFront",
      maxCount: 1,
    },
  ]),
  register
);

// =========================================================
// LOGIN
// =========================================================

router.post(
  "/login",
  login
);

// =========================================================
// SEND / RESEND REGISTRATION OTP
// =========================================================

router.post(
  "/send-otp",
  sendOtp
);

// =========================================================
// VERIFY REGISTRATION OTP
// =========================================================

router.post(
  "/verify-otp",
  verifyOtp
);

// =========================================================
// FORGOT PASSWORD
// =========================================================

router.post(
  "/forgot-password",
  forgotPassword
);

// =========================================================
// VERIFY PASSWORD RESET OTP
// =========================================================

router.post(
  "/verify-reset-otp",
  verifyResetOtp
);

// =========================================================
// RESET PASSWORD
// =========================================================

router.post(
  "/reset-password",
  resetPassword
);

// =========================================================
// CURRENT USER
// =========================================================

router.get(
  "/me",
  authenticate,
  getMe
);

export default router;