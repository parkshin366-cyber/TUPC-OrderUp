import dotenv from "dotenv";
import nodemailer from "nodemailer";

// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

// =====================================================
// EMAIL CONFIGURATION CHECK
// =====================================================

console.log("----------------------------------------");
console.log("TUPC-OrderUp Email Service");

if (!EMAIL_USER) {
  console.log("EMAIL_USER: NOT CONFIGURED");
} else {
  console.log(`EMAIL_USER: ${EMAIL_USER}`);
}

if (!EMAIL_APP_PASSWORD) {
  console.log("EMAIL_APP_PASSWORD: NOT CONFIGURED");
} else {
  console.log("EMAIL_APP_PASSWORD: CONFIGURED");
}

console.log("----------------------------------------");

// =====================================================
// SMTP TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
});

// =====================================================
// VERIFY SMTP CONNECTION
// =====================================================

if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter.verify((error) => {
    if (error) {
      console.error(
        "SMTP CONNECTION ERROR:",
        error
      );
    } else {
      console.log(
        "SMTP connection verified successfully"
      );
    }
  });
}

// =====================================================
// SEND OTP EMAIL
// =====================================================

export async function sendOtpEmail(
  recipientEmail: string,
  otp: string
) {
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    throw new Error(
      "Email service is not configured"
    );
  }

  await transporter.sendMail({
    from: `"TUPC-OrderUp" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject:
      "TUPC-OrderUp Verification Code",

    text: `
Your TUPC-OrderUp verification code is ${otp}.

This code expires in 10 minutes.

If you did not request this code, you can safely ignore this email.
    `.trim(),

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          background: #f7f7f8;
        "
      >
        <div
          style="
            background: #ffffff;
            border-radius: 16px;
            padding: 30px;
            border: 1px solid #e5e5e5;
          "
        >

          <h2
            style="
              color: #A6192E;
              margin-bottom: 10px;
            "
          >
            TUPC-OrderUp
          </h2>

          <p
            style="
              color: #171717;
              font-size: 16px;
            "
          >
            Your verification code is:
          </p>

          <div
            style="
              font-size: 34px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #A6192E;
              margin: 25px 0;
            "
          >
            ${otp}
          </div>

          <p
            style="
              color: #737373;
              font-size: 14px;
            "
          >
            This code expires in
            <strong>10 minutes</strong>.
          </p>

          <p
            style="
              color: #737373;
              font-size: 13px;
              margin-top: 20px;
            "
          >
            If you did not request this code,
            you can safely ignore this email.
          </p>

        </div>
      </div>
    `,
  });
}