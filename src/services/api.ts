import { File } from "expo-file-system";

// =====================================================
// API CONFIGURATION
// =====================================================

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? ""
).replace(/\/$/, "");

// =====================================================
// TYPES
// =====================================================

export type UserRole = "client" | "seller" | "admin";

export type UserStatus =
  | "pending"
  | "approved"
  | "rejected";

export type OtpPurpose =
  | "register"
  | "login"
  | "reset-password";

// =====================================================
// USER TYPE
// =====================================================

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contact?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
};

// =====================================================
// LOGIN RESPONSE
// =====================================================

export type LoginResponse = {
  success: boolean;
  message: string;
  userId: string;
  email: string;
  role: UserRole;
  expiresIn: number;
  token: string;
  user: ApiUser;
  requiresOtp: false;
};

// =====================================================
// IMAGE TYPE
// =====================================================

export type RegisterImage = {
  uri: string;
  name?: string;
  type?: string;
};

// =====================================================
// REGISTER DATA
// =====================================================

export type RegisterUserData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contact: string;

  // PASSWORD
  password: string;
  confirmPassword: string;

  // ROLE
  role: "client" | "seller";

  // TUP AFFILIATION
  tupAffiliation?: "student" | "others";

  // STUDENT
  tupcId?: string;
  tupcIdFront?: RegisterImage;
  tupcIdBack?: RegisterImage;

  // OTHERS
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdFront?: RegisterImage;
  governmentIdBack?: RegisterImage;

  // SECURITY
  biometricEnabled?: boolean;
  pin?: string;
  confirmPin?: string;

  // CLOUDFLARE TURNSTILE CAPTCHA
  captchaToken: string;

  // SELLER STORE INFORMATION
  storeName?: string;
  storeDescription?: string;
};

// =====================================================
// REGISTER RESPONSE
// =====================================================

export type RegisterResponse = {
  success: boolean;
  message: string;
  requiresOtp: boolean;
  userId: string;
  email: string;
  role: "client" | "seller";
  expiresIn: number;
  otpPurpose?: "register";
  user?: ApiUser;
};

// =====================================================
// VERIFY OTP RESPONSE
// =====================================================

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token?: string;
  registrationVerified?: boolean;
  requiresApproval?: boolean;
  user: ApiUser;
};

// =====================================================
// SEND OTP RESPONSE
// =====================================================

export type SendOtpResponse = {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  expiresIn?: number;
  otpPurpose?:
    | "register"
    | "login"
    | "reset-password";
};

// =====================================================
// FORGOT PASSWORD RESPONSE
// =====================================================

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  expiresIn?: number;
};

// =====================================================
// VERIFY RESET OTP RESPONSE
// =====================================================

export type VerifyResetOtpResponse = {
  success: boolean;
  message: string;
  userId?: string;
  resetVerified?: boolean;
};

// =====================================================
// RESET PASSWORD RESPONSE
// =====================================================

export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

// =====================================================
// CURRENT USER RESPONSE
// =====================================================

export type CurrentUserResponse = {
  success: boolean;
  message?: string;
  user: ApiUser;
};

// =====================================================
// USERNAME AVAILABILITY RESPONSE
// =====================================================

export type UsernameAvailabilityResponse = {
  success: boolean;
  available: boolean;
  message?: string;
};

// =====================================================
// RESPONSE HELPER
// =====================================================

async function parseResponse(
  response: Response
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {
      success: false,
      message: "Invalid server response.",
    };
  }
}

// =====================================================
// LOGIN
// =====================================================

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error("Username is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message || "Login failed."
      );
    }

    return data as LoginResponse;
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to connect to the server."
    );
  }
}

// =====================================================
// CHECK USERNAME AVAILABILITY
// =====================================================

export async function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailabilityResponse> {
  const cleanUsername = username
    .trim()
    .toLowerCase();

  if (!cleanUsername) {
    return {
      success: true,
      available: false,
      message: "",
    };
  }

  try {
    const url =
      `${API_URL}/auth/check-username` +
      `?username=${encodeURIComponent(cleanUsername)}`;

    console.log(
      "CHECK USERNAME URL:",
      url
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await parseResponse(response);

    console.log(
      "CHECK USERNAME RESPONSE:",
      {
        status: response.status,
        data,
      }
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to check username availability."
      );
    }

    return {
      success: data.success !== false,
      available: data.available === true,
      message: data.message,
    };
  } catch (error) {
    console.error(
      "USERNAME AVAILABILITY CHECK ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to check username availability."
    );
  }
}

// =====================================================
// FILE HELPERS
// =====================================================

function getFileName(
  uri: string,
  fallback: string
): string {
  const cleanUri = uri.split("?")[0];

  const lastPart =
    cleanUri.split("/").pop() || "";

  if (
    lastPart &&
    /\.[a-zA-Z0-9]+$/.test(lastPart)
  ) {
    return lastPart;
  }

  return fallback;
}

// =====================================================
// MIME TYPE HELPER
// =====================================================

function getMimeType(
  uri: string
): string {
  const extension = uri
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    case "heic":
      return "image/heic";

    case "heif":
      return "image/heif";

    case "jpg":
    case "jpeg":
      return "image/jpeg";

    default:
      return "image/jpeg";
  }
}

// =====================================================
// APPEND IMAGE
// =====================================================

async function appendImage(
  formData: FormData,
  fieldName: string,
  image?: RegisterImage
): Promise<void> {
  if (!image?.uri) {
    return;
  }

  const fileName =
    image.name ||
    getFileName(
      image.uri,
      `${fieldName}.jpg`
    );

  const mimeType =
    image.type ||
    getMimeType(image.uri);

  try {
    const file = new File(image.uri);

    if (!file.exists) {
      throw new Error(
        `Image file does not exist: ${image.uri}`
      );
    }

    formData.append(
      fieldName,
      file as any
    );

    console.log(
      `IMAGE ATTACHED: ${fieldName}`,
      {
        fileName,
        mimeType,
      }
    );
  } catch (error) {
    console.error(
      `IMAGE ATTACH ERROR: ${fieldName}`,
      error
    );

    throw new Error(
      `Unable to attach ${fieldName} image.`
    );
  }
}

// =====================================================
// REGISTER
// =====================================================

export async function registerUser(
  data: RegisterUserData
): Promise<RegisterResponse> {
  try {
    // =================================================
    // PASSWORD VALIDATION
    // =================================================

    if (
      typeof data.password !== "string" ||
      typeof data.confirmPassword !== "string"
    ) {
      throw new Error(
        "Invalid password data."
      );
    }

    if (
      data.password !==
      data.confirmPassword
    ) {
      throw new Error(
        "Passwords do not match."
      );
    }

    // =================================================
    // PIN VALIDATION
    // =================================================

    const actualPin =
      typeof data.pin === "string"
        ? data.pin.trim()
        : "";

    const actualConfirmPin =
      typeof data.confirmPin === "string"
        ? data.confirmPin.trim()
        : "";

    if (actualPin.length > 0) {
      if (!/^\d{6}$/.test(actualPin)) {
        throw new Error(
          "PIN must be exactly 6 digits."
        );
      }

      if (actualConfirmPin.length === 0) {
        throw new Error(
          "Please confirm your 6-digit PIN."
        );
      }

      if (
        !/^\d{6}$/.test(
          actualConfirmPin
        )
      ) {
        throw new Error(
          "Confirm PIN must be exactly 6 digits."
        );
      }

      if (
        actualPin !==
        actualConfirmPin
      ) {
        throw new Error(
          "PINs do not match."
        );
      }
    }

    // =================================================
    // CREATE FORMDATA
    // =================================================

    const formData = new FormData();

    // =================================================
    // BASIC INFORMATION
    // =================================================

    formData.append(
      "firstName",
      String(data.firstName)
    );

    formData.append(
      "lastName",
      String(data.lastName)
    );

    formData.append(
      "username",
      String(data.username)
    );

    formData.append(
      "email",
      String(data.email)
    );

    formData.append(
      "contact",
      String(data.contact)
    );

    // =================================================
    // STORE INFORMATION
    // =================================================

    if (
      typeof data.storeName ===
      "string"
    ) {
      formData.append(
        "storeName",
        data.storeName
      );
    }

    if (
      typeof data.storeDescription ===
      "string"
    ) {
      formData.append(
        "storeDescription",
        data.storeDescription
      );
    }

    // =================================================
    // PASSWORD
    // =================================================

    formData.append(
      "password",
      data.password
    );

    formData.append(
      "confirmPassword",
      data.confirmPassword
    );

    // =================================================
    // ROLE
    // =================================================

    formData.append(
      "role",
      data.role
    );

    // =================================================
    // TUP AFFILIATION
    // =================================================

    if (data.tupAffiliation) {
      formData.append(
        "tupAffiliation",
        data.tupAffiliation
      );
    }

    // =================================================
    // TUPC ID
    // =================================================

    if (data.tupcId) {
      formData.append(
        "tupcId",
        data.tupcId
      );
    }

    // =================================================
    // GOVERNMENT ID
    // =================================================

    if (data.governmentIdType) {
      formData.append(
        "governmentIdType",
        data.governmentIdType
      );
    }

    if (data.governmentIdNumber) {
      formData.append(
        "governmentIdNumber",
        data.governmentIdNumber
      );
    }

    // =================================================
    // BIOMETRIC
    // =================================================

    formData.append(
      "biometricEnabled",
      String(
        data.biometricEnabled === true
      )
    );

    // =================================================
    // PIN
    // =================================================

    if (actualPin.length > 0) {
      formData.append(
        "pin",
        actualPin
      );

      formData.append(
        "confirmPin",
        actualConfirmPin
      );
    }

    // =================================================
    // CAPTCHA
    // =================================================

    formData.append(
      "captchaToken",
      String(data.captchaToken)
    );

    // =================================================
    // STUDENT ID IMAGES
    // =================================================

    await appendImage(
      formData,
      "tupcIdFront",
      data.tupcIdFront
    );

    await appendImage(
      formData,
      "tupcIdBack",
      data.tupcIdBack
    );

    // =================================================
    // GOVERNMENT ID IMAGES
    // =================================================

    await appendImage(
      formData,
      "governmentIdFront",
      data.governmentIdFront
    );

    await appendImage(
      formData,
      "governmentIdBack",
      data.governmentIdBack
    );

    // =================================================
    // SEND REGISTER REQUEST
    // =================================================

    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",

        // DO NOT manually set Content-Type.
        // fetch automatically creates the
        // multipart/form-data boundary.

        body: formData,
      }
    );

    // =================================================
    // PARSE RESPONSE
    // =================================================

    const result =
      await parseResponse(response);

    // =================================================
    // SERVER ERROR
    // =================================================

    if (!response.ok) {
      console.error(
        "REGISTER SERVER ERROR:",
        {
          status: response.status,
          result,
        }
      );

      throw new Error(
        result.message ||
          "Unable to create account."
      );
    }

    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "REGISTER SUCCESS"
    );

    return result as RegisterResponse;
  } catch (error) {
    console.error(
      "REGISTER REQUEST ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to create account."
    );
  }
}

// =====================================================
// SEND / RESEND OTP
// =====================================================

export async function sendOtp(
  userId: string
): Promise<SendOtpResponse> {
  const cleanUserId = userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "User ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/send-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: cleanUserId,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to send OTP."
      );
    }

    return data as SendOtpResponse;
  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to send OTP."
    );
  }
}

// =====================================================
// VERIFY OTP
// =====================================================

export async function verifyOtp(
  userId: string,
  otp: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResponse> {
  const cleanUserId = userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "User ID is required."
    );
  }

  const cleanOtp = otp
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error(
      "Please enter the 6-digit OTP."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: cleanUserId,
          otp: cleanOtp,
          purpose,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "OTP verification failed."
      );
    }

    return data as VerifyOtpResponse;
  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "OTP verification failed."
    );
  }
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

export async function forgotPassword(
  emailOrUsername: string
): Promise<ForgotPasswordResponse> {
  const value =
    emailOrUsername.trim();

  if (!value) {
    throw new Error(
      "Please enter your email or username."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          emailOrUsername: value,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to start password reset."
      );
    }

    return data as ForgotPasswordResponse;
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to connect to the server."
    );
  }
}

// =====================================================
// VERIFY RESET PASSWORD OTP
// =====================================================

export async function verifyResetOtp(
  userId: string,
  otp: string
): Promise<VerifyResetOtpResponse> {
  const cleanUserId = userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "User ID is required."
    );
  }

  const cleanOtp = otp
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error(
      "Please enter the 6-digit OTP."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/verify-reset-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: cleanUserId,
          otp: cleanOtp,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Invalid or expired OTP."
      );
    }

    return data as VerifyResetOtpResponse;
  } catch (error) {
    console.error(
      "VERIFY RESET OTP ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to verify reset OTP."
    );
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================

export async function resetPassword(
  userId: string,
  otp: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> {
  const cleanUserId = userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "User ID is required."
    );
  }

  const cleanOtp = otp
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error(
      "Please enter the 6-digit OTP."
    );
  }

  if (!newPassword) {
    throw new Error(
      "Please enter your new password."
    );
  }

  if (newPassword.length < 8) {
    throw new Error(
      "Password must be at least 8 characters."
    );
  }

  if (!confirmPassword) {
    throw new Error(
      "Please confirm your new password."
    );
  }

  if (
    newPassword !==
    confirmPassword
  ) {
    throw new Error(
      "Passwords do not match."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId: cleanUserId,
          otp: cleanOtp,
          newPassword,
          confirmPassword,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to reset password."
      );
    }

    return data as ResetPasswordResponse;
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to reset password."
    );
  }
}

// =====================================================
// CURRENT USER
// =====================================================

export async function getCurrentUser(
  token: string
): Promise<CurrentUserResponse> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Session expired."
      );
    }

    return data as CurrentUserResponse;
  } catch (error) {
    console.error(
      "GET CURRENT USER ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to retrieve current user."
    );
  }
}