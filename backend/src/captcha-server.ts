import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";

const app = express();

const PORT = Number(process.env.CAPTCHA_PORT) || 5001;

const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY;

app.use(cors());
app.use(express.json());

/*
=====================================================
CAPTCHA PAGE
=====================================================
*/

app.get("/captcha", (_req, res) => {
  const siteKey = process.env.TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body>
          <h2>CAPTCHA Configuration Error</h2>
          <p>TURNSTILE_SITE_KEY is missing.</p>
        </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>

    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>TUPC-OrderUp CAPTCHA</title>

        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        ></script>

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
            font-family: Arial, sans-serif;
            background: #ffffff;
          }

          body {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
          }

          .container {
            width: 100%;
            max-width: 420px;
          }

          .turnstile-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          .message {
            text-align: center;
            color: #737373;
            font-size: 13px;
            margin-bottom: 12px;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="message">
            Complete the security verification below.
          </div>

          <div class="turnstile-wrapper">

            <div
              class="cf-turnstile"
              data-sitekey="${siteKey}"
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpired"
              data-error-callback="onTurnstileError"
              data-theme="light"
            ></div>

          </div>

        </div>

        <script>
          function sendMessage(data) {
            if (
              window.ReactNativeWebView &&
              window.ReactNativeWebView.postMessage
            ) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify(data)
              );
            }
          }

          function onTurnstileSuccess(token) {
            sendMessage({
              type: "captcha-success",
              token: token
            });
          }

          function onTurnstileExpired() {
            sendMessage({
              type: "captcha-expired"
            });
          }

          function onTurnstileError() {
            sendMessage({
              type: "captcha-error",
              message: "Cloudflare CAPTCHA could not be completed."
            });
          }
        </script>
      </body>
    </html>
  `);
});

/*
=====================================================
CLOUDFLARE SERVER-SIDE VERIFICATION
=====================================================
*/

app.post("/verify", async (req, res) => {
  try {
    if (!TURNSTILE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Turnstile secret key is not configured.",
      });
    }

    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA token is required.",
      });
    }

    const formData = new URLSearchParams();

    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const cloudflareResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const result = await cloudflareResponse.json();

    if (!result.success) {
      console.error(
        "TURNSTILE VERIFICATION FAILED:",
        result
      );

      return res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed.",
        errors: result["error-codes"] || [],
      });
    }

    console.log("TURNSTILE VERIFICATION SUCCESS");

    return res.json({
      success: true,
      message: "CAPTCHA verified successfully.",
    });
  } catch (error) {
    console.error(
      "TURNSTILE SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify CAPTCHA.",
    });
  }
});

/*
=====================================================
HEALTH
=====================================================
*/

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "TUPC-OrderUp CAPTCHA Server is running",
  });
});

/*
=====================================================
START SERVER
=====================================================
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log("----------------------------------------");
  console.log("TUPC-OrderUp CAPTCHA Server");
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://API_URL.18.24:${PORT}`);
  console.log(`CAPTCHA: http://API_URL.18.24:${PORT}/captcha`);
  console.log(`Health: http://API_URL.18.24:${PORT}/health`);
  console.log("----------------------------------------");
});