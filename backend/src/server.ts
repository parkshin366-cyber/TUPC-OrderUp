import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import multer from "multer";
import captchaRoutes from "./routes/captcha";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

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
   CAPTCHA ROUTES
========================================================= */

app.use("/captcha", captchaRoutes);

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
   API ROUTES
========================================================= */

/*
   Main API route

   Example:
   /api/auth/login
   /api/auth/register
   /api/auth/check-username
*/
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

/* =========================================================
   AUTH COMPATIBILITY ROUTE
========================================================= */

/*
   Your mobile app is currently calling:

   /auth/check-username

   while the backend normally uses:

   /api/auth/check-username

   This alias allows BOTH URLs to work.

   Existing:
   /api/auth/...

   Also supported:
   /auth/...
*/
app.use("/auth", authRoutes);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (_req: Request, res: Response) => {
    res.status(200).json({
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
   404 HANDLER
========================================================= */

app.use(
  (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "API route not found",
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
       FILE TYPE / CUSTOM MULTER ERROR
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
       PASS OTHER ERRORS TO FINAL HANDLER
    ===================================================== */

    next(error);
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
      "Unhandled server error:",
      error
    );

    if (error instanceof Error) {
      console.error(
        "Error message:",
        error.message
      );

      if (error.stack) {
        console.error(error.stack);
      }
    }

    res.status(500).json({
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
          "----------------------------------------"
        );

        console.log(
          "TUPC-OrderUp Backend"
        );

        console.log(
          `Local: http://localhost:${PORT}`
        );

        console.log(
          `Network: http://YOUR-PC-IP:${PORT}`
        );

        console.log(
          `API: http://localhost:${PORT}/api`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Auth API: http://localhost:${PORT}/api/auth`
        );

        console.log(
          `Auth Alias: http://localhost:${PORT}/auth`
        );

        console.log(
          `Email: ${
            process.env.EMAIL_USER
              ? "Configured"
              : "NOT CONFIGURED"
          }`
        );

        console.log(
          "----------------------------------------"
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
