import express from "express";

import {
    getUserById,
    getUsers,
    updateUserStatus,
} from "../controllers/userController";

import {
    authenticate,
    requireAdmin,
} from "../middleware/auth";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  getUsers
);

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getUserById
);

router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  updateUserStatus
);

export default router;