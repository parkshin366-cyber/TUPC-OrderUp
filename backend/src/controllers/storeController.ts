import { Response } from "express";
import fs from "fs/promises";
import { Types } from "mongoose";
import path from "path";
import sharp from "sharp";

import { AuthRequest } from "../middleware/auth";
import Store from "../models/Store";
import User from "../models/User";

const STORE_UPLOAD_DIR = path.join(process.cwd(), "uploads", "stores");

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

async function saveStoreImage(req: AuthRequest, file: Express.Multer.File | undefined, kind: "profile" | "banner") {
  if (!file) return undefined;
  await fs.mkdir(STORE_UPLOAD_DIR, { recursive: true });
  const filename = `${req.userId}-${kind}-${Date.now()}.webp`;
  const width = kind === "banner" ? 1400 : 500;
  const height = kind === "banner" ? 560 : 500;
  await sharp(file.buffer)
    .rotate()
    .resize(width, height, {
      fit: kind === "profile" ? "contain" : "cover",
      background: kind === "profile" ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined,
      withoutEnlargement: true,
    })
    .webp({ quality: 86 })
    .toFile(path.join(STORE_UPLOAD_DIR, filename));
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0].trim();
  return `${protocol}://${host}/uploads/stores/${filename}`;
}

// =====================================================
// HELPER
// =====================================================

function getParam(
  value: string | string[] | undefined
): string | null {
  if (typeof value === "string") {
    return value;
  }

  return null;
}

// =====================================================
// GET MY STORE
// =====================================================

export async function getMyStore(
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

    const store = await Store.findOne({
      seller: req.userId,
    }).lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store has not been created yet",
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error(
      "Get my store error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load store",
    });
  }
}

// =====================================================
// CREATE / UPDATE MY STORE
// =====================================================

export async function saveMyStore(
  req: AuthRequest,
  res: Response
) {
  try {
    // =================================================
    // AUTHENTICATION
    // =================================================

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      name,
      description,
      location,
      openTime,
      closeTime,
      isOpen,
      pickupEnabled,
      deliveryEnabled,
      gcashEnabled,
      gcashName,
      gcashNumber,
    } = req.body;

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const profileImage = await saveStoreImage(req, files?.profileImage?.[0], "profile");
    const bannerImage = await saveStoreImage(req, files?.bannerImage?.[0], "banner");
    const existingStore = await Store.findOne({ seller: req.userId }).lean();
    const resolvedGcashEnabled = parseBoolean(gcashEnabled, existingStore?.gcashEnabled ?? false);
    const resolvedGcashName = typeof gcashName === "string" ? gcashName.trim() : existingStore?.gcashName ?? "";
    const resolvedGcashNumber = typeof gcashNumber === "string" ? gcashNumber.replace(/\s+/g, "") : existingStore?.gcashNumber ?? "";

    if (resolvedGcashEnabled && (!resolvedGcashName || !/^09\d{9}$/.test(resolvedGcashNumber))) {
      return res.status(400).json({
        success: false,
        message: "Enter the GCash account name and a valid 11-digit mobile number before enabling GCash.",
      });
    }

    // =================================================
    // VALIDATE STORE NAME
    // =================================================

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    // =================================================
    // VERIFY SELLER ACCOUNT
    // =================================================

    const seller = await User.findById(
      req.userId
    ).select("role status");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller account not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller account required",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Seller account is not approved",
      });
    }

    // =================================================
    // CREATE OR UPDATE STORE
    // =================================================
    //
    // IMPORTANT:
    // findOneAndUpdate + upsert guarantees that
    // the store is created if it does not exist,
    // or updated if it already exists.
    //
    // The store is ALWAYS linked to req.userId.
    // =================================================

    const store = await Store.findOneAndUpdate(
      {
        seller: req.userId,
      },
      {
        $set: {
          seller: req.userId,

          name: name.trim(),

          description:
            typeof description === "string"
              ? description.trim()
              : "",

          location:
            typeof location === "string"
              ? location.trim()
              : "",

          openTime:
            typeof openTime === "string"
              ? openTime.trim()
              : "7:00 AM",

          closeTime:
            typeof closeTime === "string"
              ? closeTime.trim()
              : "6:00 PM",

          isOpen: parseBoolean(isOpen, true),

          pickupEnabled: parseBoolean(pickupEnabled, true),

          deliveryEnabled: parseBoolean(deliveryEnabled, false),
          ...(profileImage ? { profileImage } : {}),
          ...(bannerImage ? { bannerImage } : {}),
          gcashEnabled: resolvedGcashEnabled,
          gcashName: resolvedGcashName,
          gcashNumber: resolvedGcashNumber,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // =================================================
    // STORE SAVE FAILED
    // =================================================

    if (!store) {
      return res.status(500).json({
        success: false,
        message: "Unable to save store",
      });
    }

    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "STORE SAVED:",
      {
        storeId: store._id,
        sellerId: store.seller,
        name: store.name,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Store saved successfully",
      store,
    });
  } catch (error) {
    console.error(
      "Save store error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save store",
    });
  }
}

// =====================================================
// GET PUBLIC STORES
// =====================================================

export async function getPublicStores(
  _req: AuthRequest,
  res: Response
) {
  try {
    const stores = await Store.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "sellerUser",
        },
      },

      {
        $unwind: "$sellerUser",
      },

      {
        $match: {
          "sellerUser.role": "seller",
          "sellerUser.status": "approved",
        },
      },

      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          location: 1,
          openTime: 1,
          closeTime: 1,
          isOpen: 1,
          pickupEnabled: 1,
          deliveryEnabled: 1,
          profileImage: 1,
          bannerImage: 1,
          gcashEnabled: 1,
          gcashName: 1,
          gcashNumber: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },

      {
        $sort: {
          name: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stores,
    });
  } catch (error) {
    console.error(
      "Get public stores error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load stores",
    });
  }
}

// =====================================================
// GET PUBLIC STORE BY ID
// =====================================================

export async function getPublicStoreById(
  req: AuthRequest,
  res: Response
) {
  try {
    // =================================================
    // GET STORE ID SAFELY
    // =================================================

    const storeId = getParam(
      req.params.storeId
    );

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    // =================================================
    // VALIDATE OBJECT ID
    // =================================================

    if (!Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    // =================================================
    // FIND PUBLIC STORE
    // =================================================

    const stores = await Store.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(storeId),
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "sellerUser",
        },
      },

      {
        $unwind: "$sellerUser",
      },

      {
        $match: {
          "sellerUser.role": "seller",
          "sellerUser.status": "approved",
        },
      },

      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          location: 1,
          openTime: 1,
          closeTime: 1,
          isOpen: 1,
          pickupEnabled: 1,
          deliveryEnabled: 1,
          profileImage: 1,
          bannerImage: 1,
          gcashEnabled: 1,
          gcashName: 1,
          gcashNumber: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    // =================================================
    // STORE NOT FOUND
    // =================================================

    if (!stores.length) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,
      store: stores[0],
    });
  } catch (error) {
    console.error(
      "Get public store error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load store",
    });
  }
}
