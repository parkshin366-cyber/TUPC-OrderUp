import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import multer from "multer";
import path from "path";

// =====================================================
// ROUTES
// =====================================================

import authRoutes from "./routes/auth";
import captchaRoutes from "./routes/captcha";
import orderRoutes from "./routes/orders";
import productRoutes from "./routes/products";
import storeRoutes from "./routes/stores";
import userRoutes from "./routes/users";

// =====================================================
// DATABASE
// =====================================================

import { connectDB } from "./config/db";

// =====================================================
// APP
// =====================================================

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =====================================================
// STATIC UPLOADED FILES
// =====================================================
//
// Product images will be saved inside:
//
// uploads/products/
//
// They will be accessible through:
//
// http://YOUR-IP:5000/uploads/products/filename.webp
//
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

// =====================================================
// REQUEST LOGGING
// =====================================================

app.use(
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
  }
);

// =====================================================
// CAPTCHA
// =====================================================

app.use(
  "/captcha",
  captchaRoutes
);

// =====================================================
// AUTH
// =====================================================

// API auth routes
app.use(
  "/api/auth",
  authRoutes
);

// Keep existing /auth routes working
app.use(
  "/auth",
  authRoutes
);

// =====================================================
// USERS
// =====================================================

app.use(
  "/api/users",
  userRoutes
);

// =====================================================
// STORES
// =====================================================
//
// Seller:
// GET /api/stores/me
// PUT /api/stores/me
//
// Client:
// GET /api/stores
// GET /api/stores/:storeId
//

app.use(
  "/api/stores",
  storeRoutes
);

// =====================================================
// PRODUCTS
// =====================================================
//
// Seller:
// GET    /api/products/my
// POST   /api/products
// PUT    /api/products/:productId
// DELETE /api/products/:productId
// PATCH  /api/products/:productId/availability
//
// Client:
// GET /api/products/store/:storeId
//

app.use(
  "/api/products",
  productRoutes
);

// =====================================================
// ORDERS
// =====================================================
//
// Client:
// POST /api/orders
// GET  /api/orders/my
//
// Seller:
// GET   /api/orders/seller
// PATCH /api/orders/:orderId/status
//
// Single Order:
// GET /api/orders/:orderId
//

app.use(
  "/api/orders",
  orderRoutes
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "TUPC-OrderUp API is running",
      timestamp: new Date().toISOString(),
    });
  }
);

// =====================================================
// ROOT
// =====================================================

app.get(
  "/",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "TUPC-OrderUp API",
      status: "running",
    });
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (
    req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
      method: req.method,
    });
  }
);

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: "File upload error",
        error: error.message,
      });
    }

    next(error);
  }
);

// =====================================================
// GENERAL ERROR HANDLER
// =====================================================

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
  try {
    await connectDB();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "=========================================="
        );

        console.log(
          `🚀 TUPC-OrderUp API running on port ${PORT}`
        );

        console.log(
          `🌐 Local: http://localhost:${PORT}`
        );

        console.log(
          `❤️ Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `📦 Orders: http://localhost:${PORT}/api/orders`
        );

        console.log(
          `🛒 Seller Orders: http://localhost:${PORT}/api/orders/seller`
        );

        console.log(
          `🖼️ Uploads: http://localhost:${PORT}/uploads`
        );

        console.log(
          "=========================================="
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}

// =====================================================
// START
// =====================================================

startServer();