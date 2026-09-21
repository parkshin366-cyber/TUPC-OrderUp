import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

import User from "../models/User";
import { sendOtpEmail } from "../services/emailService";
import { generateToken } from "../utils/generateToken";
import {
  extractTextFromIdImages,
  verifyIdIdentity,
} from "../utils/idVerification";

/* =========================================================
   TYPES
========================================================= */

type UploadedFile = Express.Multer.File;

type UploadedFiles = {
  [fieldname: string]: UploadedFile[];
};

/* =========================================================
   CONSTANTS
========================================================= */

const OTP_EXPIRATION_MINUTES = 10;

const UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "uploads",
  "id-documents"
);

/* =========================================================
   GOVERNMENT ID FORMATS
========================================================= */

const GOVERNMENT_ID_PATTERNS: Record<string, RegExp> = {
  "National ID":
    /^\d{4}-\d{4}-\d{4}-\d{4}$/,

  "Driver's License":
    /^[A-Z0-9]{1,3}-\d{2}-\d{6}$/,

  Passport:
    /^[A-Z0-9]{6,9}$/,

  "SSS ID":
    /^\d{2}-\d{7}-\d$/,

  UMID:
    /^[A-Z0-9]+-\d{4}-\d{7}-\d$/,

  "PhilHealth ID":
    /^\d{2}-\d{9}-\d$/,

  "Pag-IBIG ID":
    /^\d{4}-\d{4}-\d{4}$/,

  TIN:
    /^\d{3}-\d{3}-\d{3}-\d{5}$/,

  "PRC ID":
    /^\d{7}$/,

  "Postal ID":
    /^[A-Z0-9]{10}$/,
};

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function generateOtp(): string {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function hashOtp(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

function normalizeText(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeEmail(
  value: unknown
): string {
  return normalizeText(value).toLowerCase();
}

function normalizeUsername(
  value: unknown
): string {
  return normalizeText(value).toLowerCase();
}

function normalizeName(
  value: unknown
): string {
  return normalizeText(value).toLowerCase();
}

function normalizeContact(
  value: unknown
): string {
  return String(value ?? "").replace(
    /\D/g,
    ""
  );
}

function normalizeTupcId(
  value: unknown
): string {
  return normalizeText(value).toUpperCase();
}

function normalizeGovernmentIdNumber(
  value: unknown
): string {
  return normalizeText(value).toUpperCase();
}

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/* =========================================================
   STUDENT GSFE EMAIL REQUIREMENT
========================================================= */

function isValidStudentGsfeEmail(
  email: string
): boolean {
  return /^[^\s@]+@gsfe\.tupcavite\.edu\.ph$/i.test(
    email
  );
}

/* =========================================================
   USERNAME VALIDATION
========================================================= */

function isValidUsername(
  username: string
): boolean {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(
    username
  );
}

/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function isValidPassword(
  password: string
): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/* =========================================================
   PIN VALIDATION
========================================================= */

function isValidPin(
  pin: string
): boolean {
  return /^\d{6}$/.test(pin);
}

/* =========================================================
   PHILIPPINE CONTACT NORMALIZATION
========================================================= */

function normalizePhilippineContact(
  value: unknown
): string {
  let contact = normalizeContact(value);

  if (contact.startsWith("63")) {
    contact = contact.slice(2);
  }

  if (contact.startsWith("0")) {
    contact = contact.slice(1);
  }

  return contact;
}

function isValidPhilippineContact(
  contact: string
): boolean {
  return /^9\d{9}$/.test(contact);
}

/* =========================================================
   TUPC ID VALIDATION
========================================================= */

function isValidTupcId(
  tupcId: string
): boolean {
  return /^TUPC-\d{2}-\d{4}$/.test(
    tupcId
  );
}

/* =========================================================
   GOVERNMENT ID VALIDATION
========================================================= */

function isValidGovernmentId(
  idType: string,
  idNumber: string
): boolean {
  const pattern =
    GOVERNMENT_ID_PATTERNS[idType];

  if (!pattern) {
    return false;
  }

  return pattern.test(idNumber);
}

/* =========================================================
   FILE HELPERS
========================================================= */

function getUploadedFiles(
  req: Request
): UploadedFiles {
  if (!req.files) {
    return {};
  }

  if (Array.isArray(req.files)) {
    return {};
  }

  return req.files as UploadedFiles;
}

function getSingleUploadedFile(
  files: UploadedFiles,
  fieldName: string
): UploadedFile | undefined {
  const field = files[fieldName];

  if (!field || field.length === 0) {
    return undefined;
  }

  return field[0];
}

/* =========================================================
   IMAGE EXTENSION
========================================================= */

function getSafeImageExtension(
  file: UploadedFile
): string {
  const mimeType = String(
    file.mimetype || ""
  ).toLowerCase();

  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    case "image/heic":
      return ".heic";

    case "image/heif":
      return ".heif";

    default:
      return ".jpg";
  }
}

/* =========================================================
   SAVE ID IMAGES
========================================================= */

async function saveIdImages(
  frontFile: UploadedFile,
  backFile: UploadedFile
): Promise<{
  frontPath: string;
  backPath: string;
}> {
  await fs.mkdir(
    UPLOAD_DIRECTORY,
    {
      recursive: true,
    }
  );

  const frontExtension =
    getSafeImageExtension(
      frontFile
    );

  const backExtension =
    getSafeImageExtension(
      backFile
    );

  const frontFileName =
    `${crypto.randomUUID()}-front${frontExtension}`;

  const backFileName =
    `${crypto.randomUUID()}-back${backExtension}`;

  const frontPath =
    path.join(
      UPLOAD_DIRECTORY,
      frontFileName
    );

  const backPath =
    path.join(
      UPLOAD_DIRECTORY,
      backFileName
    );

  await fs.writeFile(
    frontPath,
    frontFile.buffer
  );

  await fs.writeFile(
    backPath,
    backFile.buffer
  );

  console.log(
    "ID FRONT IMAGE SAVED:"
  );
  console.log(frontPath);

  console.log(
    "ID BACK IMAGE SAVED:"
  );
  console.log(backPath);

  return {
    frontPath,
    backPath,
  };
}

/* =========================================================
   DELETE FILE
========================================================= */

async function deleteFileIfExists(
  filePath?: string
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);

    console.log(
      "Deleted uploaded file:",
      filePath
    );
  } catch {
    // Ignore if file does not exist.
  }
}

/* =========================================================
   CHECK USERNAME AVAILABILITY
========================================================= */

export async function checkUsernameAvailability(
  req: Request,
  res: Response
) {
  try {
    const normalizedUsername =
      normalizeUsername(
        req.query.username
      );

    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,
        available: false,
        message:
          "Username is required.",
      });
    }

    if (
      !isValidUsername(
        normalizedUsername
      )
    ) {
      return res.status(400).json({
        success: false,
        available: false,
        message:
          "Username must be 3-30 characters and may only contain letters, numbers, dots, underscores, or hyphens.",
      });
    }

    const existingUser =
      await User.findOne({
        username:
          normalizedUsername,
      }).select(
        "_id username"
      );

    if (existingUser) {
      return res.status(200).json({
        success: true,
        available: false,
        message:
          "Username is already registered.",
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message:
        "Username is available.",
    });
  } catch (error) {
    console.error(
      "Username availability check error:",
      error
    );

    return res.status(500).json({
      success: false,
      available: false,
      message:
        "Unable to check username availability.",
    });
  }
}

/* =========================================================
   REGISTER
========================================================= */

export async function register(
  req: Request,
  res: Response
) {
  let savedFrontPath:
    | string
    | undefined;

  let savedBackPath:
    | string
    | undefined;

  let createdUserId:
    | string
    | undefined;

  try {
    const {
      firstName,
      lastName,
      username,
      email,
      contact,
      password,
      confirmPassword,
      role,
      tupAffiliation,
      affiliation,
      tupcId,
      governmentIdType,
      governmentIdNumber,
      biometricEnabled,
      pin,
      confirmPin,
      captchaToken,
    } = req.body;

    const normalizedFirstName =
      normalizeName(firstName);

    const normalizedLastName =
      normalizeName(lastName);

    const normalizedUsername =
      normalizeUsername(username);

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedContact =
      normalizePhilippineContact(
        contact
      );

    const normalizedTupcId =
      normalizeTupcId(tupcId);

    const normalizedGovernmentIdNumber =
      normalizeGovernmentIdNumber(
        governmentIdNumber
      );

    const normalizedRole =
      normalizeText(role).toLowerCase();

    const normalizedAffiliation =
      normalizeText(
        affiliation ?? tupAffiliation
      ).toLowerCase();

    const normalizedGovernmentIdType =
      normalizeText(
        governmentIdType
      );

    /* =====================================================
       PASSWORD
    ===================================================== */

    const cleanPassword =
      String(password ?? "");

    const cleanConfirmPassword =
      String(confirmPassword ?? "");

    /* =====================================================
       PIN
    ===================================================== */

    const cleanPin =
      String(pin ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    const cleanConfirmPin =
      String(confirmPin ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    /* =====================================================
       REQUIRED NAME
    ===================================================== */

    if (
      !normalizedFirstName ||
      !normalizedLastName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name and last name are required.",
      });
    }

    /* =====================================================
       ROLE
    ===================================================== */

    if (
      normalizedRole !== "client" &&
      normalizedRole !== "seller"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid registration role.",
      });
    }

    /* =====================================================
       USERNAME
    ===================================================== */

    if (
      !isValidUsername(
        normalizedUsername
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters and may only contain letters, numbers, dots, underscores, or hyphens.",
      });
    }

    /* =====================================================
       EMAIL
    ===================================================== */

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    /* =====================================================
       AFFILIATION
    ===================================================== */

    if (
      normalizedAffiliation !==
        "student" &&
      normalizedAffiliation !==
        "others"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid affiliation.",
      });
    }

    /* =====================================================
       STUDENT GSFE EMAIL
    ===================================================== */

    if (
      normalizedAffiliation ===
        "student" &&
      !isValidStudentGsfeEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student accounts must use a valid TUP Cavite GSFE email ending in @gsfe.tupcavite.edu.ph.",
      });
    }

    /* =====================================================
       CONTACT
    ===================================================== */

    if (
      !isValidPhilippineContact(
        normalizedContact
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Philippine mobile number.",
      });
    }

    /* =====================================================
       PASSWORD
    ===================================================== */

    if (
      !isValidPassword(
        cleanPassword
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.",
      });
    }

    if (
      cleanPassword !==
      cleanConfirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    /* =====================================================
       CAPTCHA
    ===================================================== */

    if (
      !normalizeText(
        captchaToken
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "CAPTCHA verification is required.",
      });
    }

    /* =====================================================
       BIOMETRIC
    ===================================================== */

    const biometricIsEnabled =
      biometricEnabled === true ||
      biometricEnabled === "true";

    if (!biometricIsEnabled) {
      return res.status(400).json({
        success: false,
        message:
          "Fingerprint registration is required.",
      });
    }

    /* =====================================================
       PIN
    ===================================================== */

    if (!cleanPin) {
      return res.status(400).json({
        success: false,
        message:
          "PIN is required.",
      });
    }

    if (!cleanConfirmPin) {
      return res.status(400).json({
        success: false,
        message:
          "Confirm PIN is required.",
      });
    }

    if (
      !isValidPin(cleanPin)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "PIN must be exactly 6 digits.",
      });
    }

    if (
      !isValidPin(cleanConfirmPin)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Confirm PIN must be exactly 6 digits.",
      });
    }

    if (
      cleanPin !==
      cleanConfirmPin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "PINs do not match.",
      });
    }

    /* =====================================================
       AFFILIATION-SPECIFIC VALIDATION
    ===================================================== */

    if (
      normalizedAffiliation ===
      "student"
    ) {
      if (
        !isValidTupcId(
          normalizedTupcId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid TUPC-ID format. Use TUPC-YY-NNNN.",
        });
      }
    }

    if (
      normalizedAffiliation ===
      "others"
    ) {
      if (
        !normalizedGovernmentIdType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government ID type is required.",
        });
      }

      if (
        !normalizedGovernmentIdNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government ID number is required.",
        });
      }

      if (
        !isValidGovernmentId(
          normalizedGovernmentIdType,
          normalizedGovernmentIdNumber
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government ID number does not match the selected ID format.",
        });
      }
    }

    /* =====================================================
       GET UPLOADED IMAGES
    ===================================================== */

    const uploadedFiles =
      getUploadedFiles(req);

    let frontFile:
      | UploadedFile
      | undefined;

    let backFile:
      | UploadedFile
      | undefined;

    if (
      normalizedAffiliation ===
      "student"
    ) {
      frontFile =
        getSingleUploadedFile(
          uploadedFiles,
          "tupcIdFront"
        );

      backFile =
        getSingleUploadedFile(
          uploadedFiles,
          "tupcIdBack"
        );
    } else {
      frontFile =
        getSingleUploadedFile(
          uploadedFiles,
          "governmentIdFront"
        );

      backFile =
        getSingleUploadedFile(
          uploadedFiles,
          "governmentIdBack"
        );
    }

    if (!frontFile) {
      return res.status(400).json({
        success: false,
        message:
          "Front ID image is required.",
      });
    }

    if (!backFile) {
      return res.status(400).json({
        success: false,
        message:
          "Back ID image is required.",
      });
    }

    /* =====================================================
       IMAGE DEBUG
    ===================================================== */

    console.log(
      "========================================"
    );

    console.log(
      "UPLOADED ID IMAGES"
    );

    console.log(
      "Front:",
      frontFile.originalname,
      frontFile.mimetype,
      frontFile.size
    );

    console.log(
      "Back:",
      backFile.originalname,
      backFile.mimetype,
      backFile.size
    );

    console.log(
      "========================================"
    );

    /* =====================================================
       DETERMINE ID ORIENTATION
    ===================================================== */

    const idOrientation =
      normalizedAffiliation ===
      "student"
        ? "portrait"
        : "landscape";

    console.log(
      "========================================"
    );

    console.log(
      "ID OCR VERIFICATION"
    );

    console.log(
      `Affiliation: ${normalizedAffiliation}`
    );

    console.log(
      `Expected ID orientation: ${idOrientation}`
    );

    console.log(
      "========================================"
    );

    /* =====================================================
       ID NUMBER FOR VERIFICATION
    ===================================================== */

    const idNumberForVerification =
      normalizedAffiliation ===
      "student"
        ? normalizedTupcId
        : normalizedGovernmentIdNumber;

    /* =====================================================
       OCR
    ===================================================== */

    const ocrText =
      await extractTextFromIdImages(
        frontFile.buffer,
        backFile.buffer,
        idOrientation
      );

    console.log(
      "OCR TEXT:"
    );

    console.log(
      ocrText
    );

    /* =====================================================
       IDENTITY VERIFICATION
    ===================================================== */

    const verification =
      verifyIdIdentity(
        ocrText,
        normalizedFirstName,
        normalizedLastName,
        idNumberForVerification
      );

    console.log(
      "ID VERIFICATION RESULT:",
      verification
    );

    if (
      !verification.passed
    ) {
      return res.status(422).json({
        success: false,
        message:
          "ID verification failed. None of the submitted identity details matched the information detected from the ID images.",
        verification: {
          passed: false,
          matchCount:
            verification.matchCount,
          matchedFields:
            verification.matchedFields,
        },
      });
    }

    /* =====================================================
       DUPLICATE USER CHECK
    ===================================================== */

    const existingUser =
      await User.findOne({
        $or: [
          {
            username:
              normalizedUsername,
          },
          {
            email:
              normalizedEmail,
          },
        ],
      });

    if (existingUser) {
      if (
        existingUser.username ===
        normalizedUsername
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Username is already registered.",
        });
      }

      if (
        existingUser.email ===
        normalizedEmail
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Email is already registered.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "An account with these details already exists.",
      });
    }

    /* =====================================================
       HASH PASSWORD + PIN
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(
        cleanPassword,
        12
      );

    const pinHash =
      await bcrypt.hash(
        cleanPin,
        12
      );

    /* =====================================================
       GENERATE REGISTRATION OTP
    ===================================================== */

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    /* =====================================================
       SAVE ID IMAGES
    ===================================================== */

    const savedImages =
      await saveIdImages(
        frontFile,
        backFile
      );

    savedFrontPath =
      savedImages.frontPath;

    savedBackPath =
      savedImages.backPath;

    /* =====================================================
       CREATE USER
    ===================================================== */

    const user =
      await User.create({
        firstName:
          normalizedFirstName,

        lastName:
          normalizedLastName,

        username:
          normalizedUsername,

        email:
          normalizedEmail,

        contact:
          normalizedContact,

        password:
          passwordHash,

        role:
          normalizedRole,

        status:
          "pending",

        tupAffiliation:
          normalizedAffiliation,

        ...(normalizedAffiliation ===
        "student"
          ? {
              tupcId:
                normalizedTupcId,
            }
          : {
              governmentIdType:
                normalizedGovernmentIdType,

              governmentIdNumber:
                normalizedGovernmentIdNumber,
            }),

        biometricEnabled:
          true,

        pinHash,

        otpHash,

        otpExpiresAt,

        idVerification: {
          status:
            "verified",

          matchCount:
            verification.matchCount,

          matchedFields:
            verification.matchedFields,

          idType:
            normalizedAffiliation ===
            "student"
              ? "TUPC ID"
              : normalizedGovernmentIdType,

          frontImagePath:
            savedFrontPath,

          backImagePath:
            savedBackPath,

          verifiedAt:
            new Date(),
        },
      });

    createdUserId =
      user._id.toString();

    /* =====================================================
       SEND REGISTRATION OTP EMAIL
    ===================================================== */

    try {
      await sendOtpEmail(
        normalizedEmail,
        otp
      );
    } catch (emailError) {
      console.error(
        "OTP email failed:",
        emailError
      );

      await User.findByIdAndDelete(
        user._id
      );

      await deleteFileIfExists(
        savedFrontPath
      );

      await deleteFileIfExists(
        savedBackPath
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration could not be completed because the verification email could not be sent.",
      });
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Registration successful. Please verify your email using the OTP.",

      requiresOtp:
        true,

      userId:
        user._id.toString(),

      email:
        user.email,

      verification: {
        passed: true,

        matchCount:
          verification.matchCount,

        matchedFields:
          verification.matchedFields,
      },

      user: {
        id:
          user._id.toString(),

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        username:
          user.username,

        email:
          user.email,

        role:
          user.role,

        status:
          user.status,

        tupAffiliation:
          user.tupAffiliation,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    if (createdUserId) {
      try {
        await User.findByIdAndDelete(
          createdUserId
        );
      } catch {
        // Ignore cleanup error.
      }
    }

    await deleteFileIfExists(
      savedFrontPath
    );

    await deleteFileIfExists(
      savedBackPath
    );

    return res.status(500).json({
      success: false,
      message:
        "Registration failed. Please try again.",
    });
  }
}

/* =========================================================
   LOGIN
========================================================= */

export async function login(
  req: Request,
  res: Response
) {
  try {
    const {
      username,
      password,
    } = req.body;

    const cleanUsername =
      normalizeUsername(username);

    const cleanPassword =
      String(password ?? "");

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !cleanUsername ||
      !cleanPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required.",
      });
    }

    /* =====================================================
       FIND USER
    =====================================================
    
    password is NOT select:false
    in the current User.ts.

    +password is harmless here and also
    keeps this login compatible if the
    schema is later changed to select:false.
    ===================================================== */

    const user =
      await User.findOne({
        username:
          cleanUsername,
      }).select(
        "+password"
      );

    /* =====================================================
       USER NOT FOUND
    ===================================================== */

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });
    }

    /* =====================================================
       PASSWORD HASH CHECK
    ===================================================== */

    if (
      !user.password ||
      typeof user.password !==
        "string"
    ) {
      console.error(
        "LOGIN ERROR: Password hash is missing for user:",
        user.username
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify account credentials.",
      });
    }

    /* =====================================================
       COMPARE PASSWORD
    ===================================================== */

    let passwordMatches =
      false;

    try {
      passwordMatches =
        await bcrypt.compare(
          cleanPassword,
          user.password
        );
    } catch (passwordError) {
      console.error(
        "LOGIN PASSWORD COMPARE ERROR:",
        passwordError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify account credentials.",
      });
    }

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });
    }

    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    if (
      user.status ===
      "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been rejected.",
        status:
          user.status,
      });
    }

    if (
      user.status ===
      "pending"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is still pending approval.",
        status:
          user.status,
      });
    }

    /* =====================================================
       GENERATE JWT
    ===================================================== */

    const token =
      generateToken(
        user._id.toString()
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      requiresOtp:
        false,

      user: {
        id:
          user._id.toString(),

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        username:
          user.username,

        email:
          user.email,

        contact:
          user.contact,

        role:
          user.role,

        status:
          user.status,

        tupAffiliation:
          user.tupAffiliation,

        biometricEnabled:
          user.biometricEnabled,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed. Please try again.",
    });
  }
}

/* =========================================================
   GET CURRENT USER
========================================================= */

export async function getMe(
  req: Request,
  res: Response
) {
  try {
    const userId =
      (
        req as Request & {
          userId?: string;
        }
      ).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(
        userId
      ).select(
        "-password -pinHash -otpHash -otpExpiresAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve user.",
    });
  }
}

/* =========================================================
   SEND / RESEND REGISTRATION OTP
========================================================= */

export async function sendOtp(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
    } = req.body;

    const cleanUserId =
      normalizeText(userId);

    if (!cleanUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(
        cleanUserId
      ).select(
        "+otpHash +otpExpiresAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      user.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP can only be sent for pending registration accounts.",
      });
    }

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    user.otpHash =
      otpHash;

    user.otpExpiresAt =
      otpExpiresAt;

    await user.save();

    try {
      await sendOtpEmail(
        user.email,
        otp
      );
    } catch (emailError) {
      console.error(
        "Resend OTP email failed:",
        emailError
      );

      user.otpHash =
        undefined;

      user.otpExpiresAt =
        undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "A new OTP has been sent to your email.",

      expiresIn:
        OTP_EXPIRATION_MINUTES,

      otpPurpose:
        "register",
    });
  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send OTP.",
    });
  }
}

/* =========================================================
   VERIFY REGISTRATION OTP
========================================================= */

export async function verifyOtp(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
      otp,
      purpose,
    } = req.body;

    const cleanUserId =
      normalizeText(userId);

    const cleanOtp =
      String(otp ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!cleanUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (
      !/^\d{6}$/.test(
        cleanOtp
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be exactly 6 digits.",
      });
    }

    /* =====================================================
       REGISTRATION ONLY
    ===================================================== */

    if (
      purpose ===
      "reset-password"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please use the password reset OTP verification endpoint.",
      });
    }

    const user =
      await User.findById(
        cleanUserId
      ).select(
        "+otpHash +otpExpiresAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (!user.otpHash) {
      return res.status(400).json({
        success: false,
        message:
          "No active OTP was found. Please request a new OTP.",
      });
    }

    if (!user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message:
          "OTP expiration information is missing. Please request a new OTP.",
      });
    }

    if (
      user.otpExpiresAt.getTime() <
      Date.now()
    ) {
      user.otpHash =
        undefined;

      user.otpExpiresAt =
        undefined;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    const submittedOtpHash =
      hashOtp(cleanOtp);

    const otpMatches =
      submittedOtpHash ===
      user.otpHash;

    if (!otpMatches) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP.",
      });
    }

    user.otpHash =
      undefined;

    user.otpExpiresAt =
      undefined;

    await user.save();

    const token =
      generateToken(
        user._id.toString()
      );

    return res.status(200).json({
      success: true,

      message:
        "Email verification successful.",

      token,

      registrationVerified:
        true,

      requiresApproval:
        user.status ===
        "pending",

      user: {
        id:
          user._id.toString(),

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        username:
          user.username,

        email:
          user.email,

        contact:
          user.contact,

        role:
          user.role,

        status:
          user.status,

        tupAffiliation:
          user.tupAffiliation,

        biometricEnabled:
          user.biometricEnabled,
      },
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "OTP verification failed. Please try again.",
    });
  }
}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const {
      emailOrUsername,
    } = req.body;

    const value =
      normalizeText(
        emailOrUsername
      );

    if (!value) {
      return res.status(400).json({
        success: false,
        message:
          "Email or username is required.",
      });
    }

    const normalizedEmail =
      normalizeEmail(value);

    const normalizedUsername =
      normalizeUsername(value);

    let user;

    if (
      isValidEmail(
        normalizedEmail
      )
    ) {
      user =
        await User.findOne({
          email:
            normalizedEmail,
        }).select(
          "+otpHash +otpExpiresAt"
        );
    } else {
      user =
        await User.findOne({
          username:
            normalizedUsername,
        }).select(
          "+otpHash +otpExpiresAt"
        );
    }

    /* =====================================================
       DO NOT REVEAL ACCOUNT EXISTENCE
    ===================================================== */

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account matches the information provided, a password reset OTP has been sent.",
      });
    }

    /* =====================================================
       REJECTED ACCOUNTS
    ===================================================== */

    if (
      user.status ===
      "rejected"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "If an account matches the information provided, a password reset OTP has been sent.",
      });
    }

    /* =====================================================
       GENERATE OTP
    ===================================================== */

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    /* =====================================================
       SAVE OTP
    ===================================================== */

    user.otpHash =
      otpHash;

    user.otpExpiresAt =
      otpExpiresAt;

    await user.save();

    /* =====================================================
       SEND OTP EMAIL
    ===================================================== */

    try {
      await sendOtpEmail(
        user.email,
        otp
      );
    } catch (emailError) {
      console.error(
        "Password reset OTP email failed:",
        emailError
      );

      user.otpHash =
        undefined;

      user.otpExpiresAt =
        undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset OTP. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "A password reset OTP has been sent to your registered email.",

      userId:
        user._id.toString(),

      email:
        user.email,

      expiresIn:
        OTP_EXPIRATION_MINUTES,

      otpPurpose:
        "reset-password",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset. Please try again.",
    });
  }
}

/* =========================================================
   VERIFY RESET PASSWORD OTP
========================================================= */

export async function verifyResetOtp(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
      otp,
    } = req.body;

    const cleanUserId =
      normalizeText(userId);

    const cleanOtp =
      String(otp ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!cleanUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (
      !/^\d{6}$/.test(
        cleanOtp
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be exactly 6 digits.",
      });
    }

    const user =
      await User.findById(
        cleanUserId
      ).select(
        "+otpHash +otpExpiresAt"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset OTP.",
      });
    }

    /* =====================================================
       REJECTED ACCOUNTS
    ===================================================== */

    if (
      user.status ===
      "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset OTP.",
      });
    }

    if (!user.otpHash) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset OTP.",
      });
    }

    if (!user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset OTP.",
      });
    }

    /* =====================================================
       CHECK EXPIRATION
    ===================================================== */

    if (
      user.otpExpiresAt.getTime() <
      Date.now()
    ) {
      user.otpHash =
        undefined;

      user.otpExpiresAt =
        undefined;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new password reset OTP.",
      });
    }

    /* =====================================================
       COMPARE OTP
    ===================================================== */

    const submittedOtpHash =
      hashOtp(cleanOtp);

    const otpMatches =
      submittedOtpHash ===
      user.otpHash;

    if (!otpMatches) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset OTP.",
      });
    }

    /* =====================================================
       OTP REMAINS ACTIVE UNTIL PASSWORD RESET
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "OTP verified successfully. You may now create a new password.",

      userId:
        user._id.toString(),

      resetVerified:
        true,
    });
  } catch (error) {
    console.error(
      "Verify reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify password reset OTP.",
    });
  }
}

/* =========================================================
   RESET PASSWORD
========================================================= */

export async function resetPassword(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    const cleanUserId =
      normalizeText(userId);

    const cleanOtp =
      String(otp ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    const cleanNewPassword =
      String(
        newPassword ?? ""
      );

    const cleanConfirmPassword =
      String(
        confirmPassword ?? ""
      );

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!cleanUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (
      !/^\d{6}$/.test(
        cleanOtp
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be exactly 6 digits.",
      });
    }

    if (!cleanNewPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password is required.",
      });
    }

    if (!cleanConfirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Please confirm your new password.",
      });
    }

    /* =====================================================
       PASSWORD REQUIREMENTS
    ===================================================== */

    if (
      !isValidPassword(
        cleanNewPassword
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.",
      });
    }

    if (
      cleanNewPassword !==
      cleanConfirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    const user =
      await User.findById(
        cleanUserId
      ).select(
        "+otpHash +otpExpiresAt +password"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    /* =====================================================
       REJECTED ACCOUNTS
    ===================================================== */

    if (
      user.status ===
      "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    /* =====================================================
       CHECK OTP
    ===================================================== */

    if (!user.otpHash) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    if (!user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    if (
      user.otpExpiresAt.getTime() <
      Date.now()
    ) {
      user.otpHash =
        undefined;

      user.otpExpiresAt =
        undefined;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new password reset OTP.",
      });
    }

    /* =====================================================
       VERIFY OTP AGAIN
    ===================================================== */

    const submittedOtpHash =
      hashOtp(cleanOtp);

    const otpMatches =
      submittedOtpHash ===
      user.otpHash;

    if (!otpMatches) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset OTP.",
      });
    }

    /* =====================================================
       PREVENT SAME PASSWORD
    ===================================================== */

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to verify the current password.",
      });
    }

    const samePassword =
      await bcrypt.compare(
        cleanNewPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "Your new password must be different from your current password.",
      });
    }

    /* =====================================================
       HASH NEW PASSWORD
    ===================================================== */

    const newPasswordHash =
      await bcrypt.hash(
        cleanNewPassword,
        12
      );

    /* =====================================================
       UPDATE PASSWORD
    ===================================================== */

    user.password =
      newPasswordHash;

    /* =====================================================
       INVALIDATE OTP
    ===================================================== */

    user.otpHash =
      undefined;

    user.otpExpiresAt =
      undefined;

    await user.save();

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in using your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password. Please try again.",
    });
  }
}

