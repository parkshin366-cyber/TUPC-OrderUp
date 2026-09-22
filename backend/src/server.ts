import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import multer from "multer";

import authRoutes from "./routes/auth";
import captchaRoutes from "./routes/captcha";
import userRoutes from "./routes/users";

import { connectDB } from "./config/db";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

/* =========================================================
   CORS
========================================================= */

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

/* =========================================================
   BODY PARSERS
========================================================= */

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

/* =========================================================
   CAPTCHA ROUTES
========================================================= */

app.use("/captcha", captchaRoutes);

/* =========================================================
   API ROUTES
========================================================= */

/*
   MAIN AUTH API

   Examples:

   POST /api/auth/login
   POST /api/auth/register
   POST /api/auth/send-otp
   POST /api/auth/verify-otp
   GET  /api/auth/me
*/

app.use("/api/auth", authRoutes);

/*
   AUTH COMPATIBILITY ALIAS

   Examples:

   POST /auth/login
   POST /auth/register
   POST /auth/send-otp
   POST /auth/verify-otp
   GET  /auth/me
*/

app.use("/auth", authRoutes);

/*
   USER API

   Examples:

   GET  /api/users
   GET  /api/users/:id
   PUT  /api/users/:id
*/

app.use("/api/users", userRoutes);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "TUPC-OrderUp API is running",
      database: "MongoDB",
      emailConfigured: Boolean(
        process.env.EMAIL_USER &&
          process.env.EMAIL_APP_PASSWORD
      ),
    });
  }
);

/* =========================================================
   ROOT CHECK
========================================================= */

app.get(
  "/",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "TUPC-OrderUp Backend is running",
      api: "/api",
      health: "/api/health",
      auth: "/api/auth",
    });
  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (req: Request, res: Response) => {
    console.log(
      "404 ROUTE NOT FOUND:",
      req.method,
      req.originalUrl
    );

    return res.status(404).json({
      success: false,
      message: "API route not found",
      method: req.method,
      path: req.originalUrl,
    });
  }
);

/* =========================================================
   MULTER / UPLOAD ERROR HANDLER
========================================================= */

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    /* =====================================================
       MULTER ERRORS
    ===================================================== */

    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case "LIMIT_FILE_SIZE":
          return res.status(413).json({
            success: false,
            message:
              "ID image is too large. Maximum file size is 5MB per image.",
          });

        case "LIMIT_FILE_COUNT":
          return res.status(400).json({
            success: false,
            message:
              "Too many ID images were uploaded.",
          });

        case "LIMIT_UNEXPECTED_FILE":
          return res.status(400).json({
            success: false,
            message:
              `Unexpected image field: ${
                error.field || "unknown"
              }.`,
          });

        case "LIMIT_PART_COUNT":
          return res.status(400).json({
            success: false,
            message:
              "Too many form-data parts were submitted.",
          });

        default:
          return res.status(400).json({
            success: false,
            message:
              `File upload error: ${error.message}`,
          });
      }
    }

    /* =====================================================
       CUSTOM FILE TYPE ERROR
    ===================================================== */

    if (error instanceof Error) {
      const uploadErrorMessages = [
        "Only JPG",
        "Only JPEG",
        "Only PNG",
        "Only WEBP",
        "Only HEIC",
        "Only HEIF",
      ];

      const isUploadError =
        uploadErrorMessages.some((text) =>
          error.message.includes(text)
        );

      if (isUploadError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    /* =====================================================
       PASS OTHER ERRORS
    ===================================================== */

    return next(error);
  }
);

/* =========================================================
   GENERAL ERROR HANDLER
========================================================= */

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "========================================"
    );

    console.error(
      "UNHANDLED SERVER ERROR"
    );

    console.error(
      "========================================"
    );

    console.error(error);

    if (error instanceof Error) {
      console.error(
        "Error message:",
        error.message
      );

      if (error.stack) {
        console.error(error.stack);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await connectDB();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "========================================"
        );

        console.log(
          "TUPC-OrderUp Backend"
        );

        console.log(
          "========================================"
        );

        console.log(
          `Local:   http://localhost:${PORT}`
        );

        console.log(
          `Network: http://YOUR-PC-IP:${PORT}`
        );

        console.log(
          `API:     http://localhost:${PORT}/api`
        );

        console.log(
          `Health:  http://localhost:${PORT}/api/health`
        );

        console.log(
          `Auth:    http://localhost:${PORT}/api/auth`
        );

        console.log(
          `Alias:   http://localhost:${PORT}/auth`
        );

        console.log(
          `Email:   ${
            process.env.EMAIL_USER
              ? "Configured"
              : "NOT CONFIGURED"
          }`
        );

        console.log(
          "========================================"
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start TUPC-OrderUp backend:",
      error
    );

    process.exit(1);
  }
}

startServer();