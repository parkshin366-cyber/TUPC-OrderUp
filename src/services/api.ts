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

export type UserRole =
  | "client"
  | "seller"
  | "admin";

export type UserStatus =
  | "pending"
  | "approved"
  | "rejected";

export type OtpPurpose =
  | "register"
  | "login"
  | "reset-password";

// =====================================================
// USER
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
// LOGIN
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
  requiresOtp: boolean;
};

// =====================================================
// IMAGE
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
  password: string;
  confirmPassword: string;
  role: "client" | "seller";

  tupAffiliation?: "student" | "others";
  tupcId?: string;
  tupcIdFront?: RegisterImage;

  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdFront?: RegisterImage;

  biometricEnabled?: boolean;
  captchaToken: string;

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
// OTP
// =====================================================

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token?: string;
  registrationVerified?: boolean;
  requiresApproval?: boolean;
  user: ApiUser;
};

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
// FORGOT PASSWORD
// =====================================================

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  expiresIn?: number;
};

export type VerifyResetOtpResponse = {
  success: boolean;
  message: string;
  userId?: string;
  resetVerified?: boolean;
};

export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

// =====================================================
// CURRENT USER
// =====================================================

export type CurrentUserResponse = {
  success: boolean;
  message?: string;
  user: ApiUser;
};

// =====================================================
// USERNAME AVAILABILITY
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
  const rawText = await response.text();

  console.log("========================================");
  console.log("API RESPONSE");
  console.log("STATUS:", response.status);
  console.log("OK:", response.ok);
  console.log("URL:", response.url);
  console.log("RAW RESPONSE:", rawText);
  console.log("========================================");

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty server response. HTTP ${response.status}.`,
    };
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      success: false,
      message: `Invalid server response. HTTP ${response.status}.`,
      rawResponse: rawText,
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

  if (!API_URL) {
    throw new Error(
      "API URL is not configured. Check your EXPO_PUBLIC_API_URL in .env."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
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
        typeof data?.message === "string"
          ? data.message
          : `Login failed. HTTP ${response.status}.`
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error(
        "Server returned an invalid login response."
      );
    }

    if (data.success === false) {
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
// CHECK USERNAME
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

  if (!API_URL) {
    throw new Error(
      "API URL is not configured."
    );
  }

  try {
    const url =
      `${API_URL}/auth/check-username` +
      `?username=${encodeURIComponent(
        cleanUsername
      )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await parseResponse(response);

    if (response.status === 404) {
      return {
        success: true,
        available: true,
        message:
          "Username format accepted. Availability will be verified when you create your account.",
      };
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          `Unable to check username availability. HTTP ${response.status}.`
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

  // FIXED REGEX
  if (
    lastPart &&
    /\.[a-zA-Z0-9]+$/.test(lastPart)
  ) {
    return lastPart;
  }

  return fallback;
}

// =====================================================
// MIME TYPE
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
        uri: image.uri,
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

    if (!API_URL) {
      throw new Error(
        "API URL is not configured."
      );
    }

    const formData = new FormData();

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

    if (
      typeof data.storeName === "string"
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

    formData.append(
      "password",
      data.password
    );

    formData.append(
      "confirmPassword",
      data.confirmPassword
    );

    formData.append(
      "role",
      data.role
    );

    if (data.tupAffiliation) {
      formData.append(
        "tupAffiliation",
        data.tupAffiliation
      );
    }

    if (data.tupcId) {
      formData.append(
        "tupcId",
        data.tupcId
      );
    }

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

    formData.append(
      "biometricEnabled",
      String(
        data.biometricEnabled === true
      )
    );

    formData.append(
      "captchaToken",
      String(data.captchaToken)
    );

    await appendImage(
      formData,
      "tupcIdFront",
      data.tupcIdFront
    );

    await appendImage(
      formData,
      "governmentIdFront",
      data.governmentIdFront
    );

    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Unable to create account."
      );
    }

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
// SEND OTP
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
          Accept: "application/json",
          "Content-Type": "application/json",
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
        data?.message ||
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
          Accept: "application/json",
          "Content-Type": "application/json",
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
        data?.message ||
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
          Accept: "application/json",
          "Content-Type": "application/json",
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
        data?.message ||
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
// VERIFY RESET OTP
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
          Accept: "application/json",
          "Content-Type": "application/json",
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
        data?.message ||
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
          Accept: "application/json",
          "Content-Type": "application/json",
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
        data?.message ||
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
          Accept: "application/json",
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
        data?.message ||
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

// =====================================================
// STORE TYPES
// =====================================================

export type Store = {
  _id: string;
  seller: string;
  name: string;
  description: string;
  location: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  pickupEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// =====================================================
// PRODUCT CATEGORY
// =====================================================

export type ProductCategory =
  | "Meals"
  | "Snacks"
  | "Drinks"
  | "Desserts"
  | "Clothing"
  | "Accessories"
  | "School Supplies"
  | "Gadgets and Electronics"
  | "Gifts and Souvenirs"
  | "Others";

// =====================================================
// PRODUCT NUTRITION
// =====================================================

export type ProductNutrition = {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  servingSize: string;
  estimated: boolean;
};

// =====================================================
// NORMALIZE CATEGORY
// =====================================================

export function normalizeProductCategory(
  category: string
): ProductCategory {
  const value = String(category ?? "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "meal":
    case "meals":
      return "Meals";

    case "snack":
    case "snacks":
      return "Snacks";

    case "drink":
    case "drinks":
      return "Drinks";

    case "dessert":
    case "desserts":
      return "Desserts";

    case "clothing":
      return "Clothing";

    case "accessory":
    case "accessories":
      return "Accessories";

    case "school supply":
    case "school supplies":
      return "School Supplies";

    case "gadget and electronics":
    case "gadgets and electronics":
      return "Gadgets and Electronics";

    case "gift and souvenir":
    case "gifts and souvenirs":
      return "Gifts and Souvenirs";

    case "other":
    case "others":
      return "Others";

    default:
      throw new Error(
        "Invalid product category. Please select a valid product category."
      );
  }
}

// =====================================================
// PRODUCT
// =====================================================

export type Product = {
  _id: string;
  store: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  available: boolean;
  image?: string;
  imageUrl?: string;
  photoUrl?: string;
  nutrition?: ProductNutrition;
  createdAt?: string;
  updatedAt?: string;
};

// =====================================================
// ORDER TYPES
// =====================================================

export type PaymentMethod =
  | "cash"
  | "gcash";

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type OrderItem = {
  product:
    | string
    | {
        _id: string;
        name?: string;
        category?: ProductCategory;
        price?: number;
        stock?: number;
        available?: boolean;
        image?: string;
        nutrition?: ProductNutrition;
      };

  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type Order = {
  _id: string;

  customer:
    | string
    | ApiUser;

  seller:
    | string
    | ApiUser;

  store:
    | string
    | Store;

  items: OrderItem[];

  subtotal: number;
  total: number;

  pickupLocation: string;

  paymentMethod:
    PaymentMethod;

  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
};

export type CreateOrderItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  storeId: string;
  items: CreateOrderItem[];
  pickupLocation: string;
  paymentMethod: PaymentMethod;
};

// =====================================================
// AUTH HEADERS
// =====================================================

function getAuthHeaders(
  token: string
) {
  return {
    Accept: "application/json",
    "Content-Type":
      "application/json",
    Authorization:
      `Bearer ${token}`,
  };
}

// =====================================================
// GET MY STORE
// =====================================================

export async function getMyStore(
  token: string
): Promise<Store | null> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/stores/me`,
      {
        method: "GET",
        headers:
          getAuthHeaders(token),
      }
    );

    if (response.status === 404) {
      return null;
    }

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load store."
      );
    }

    return data.store as Store;
  } catch (error) {
    console.error(
      "GET MY STORE ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load store."
    );
  }
}

// =====================================================
// SAVE MY STORE
// =====================================================

export async function saveMyStore(
  token: string,
  store: {
    name: string;
    description?: string;
    location?: string;
    openTime?: string;
    closeTime?: string;
    isOpen?: boolean;
    pickupEnabled?: boolean;
  }
): Promise<Store> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!store.name.trim()) {
    throw new Error(
      "Store name is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/stores/me`,
      {
        method: "PUT",
        headers:
          getAuthHeaders(token),
        body: JSON.stringify({
          name: store.name.trim(),
          description:
            store.description ?? "",
          location:
            store.location ?? "",
          openTime:
            store.openTime ??
            "7:00 AM",
          closeTime:
            store.closeTime ??
            "6:00 PM",
          isOpen:
            store.isOpen ?? true,
          pickupEnabled:
            store.pickupEnabled ??
            true,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to save store."
      );
    }

    return data.store as Store;
  } catch (error) {
    console.error(
      "SAVE MY STORE ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to save store."
    );
  }
}

// =====================================================
// GET MY PRODUCTS
// =====================================================

export async function getMyProducts(
  token: string
): Promise<Product[]> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/products/my`,
      {
        method: "GET",
        headers:
          getAuthHeaders(token),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load products."
      );
    }

    if (Array.isArray(data)) {
      return data as Product[];
    }

    if (
      data &&
      Array.isArray(data.products)
    ) {
      return data.products as Product[];
    }

    if (
      data &&
      Array.isArray(data.data)
    ) {
      return data.data as Product[];
    }

    return [];
  } catch (error) {
    console.error(
      "GET MY PRODUCTS ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load products."
    );
  }
}

// =====================================================
// CREATE PRODUCT
// =====================================================

export async function createProduct(
  token: string,
  product: {
    name: string;
    category: ProductCategory;
    price: number;
    stock: number;
    available?: boolean;
    image?: RegisterImage;
    nutrition?: ProductNutrition;
  }
): Promise<Product> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!product.name.trim()) {
    throw new Error(
      "Product name is required."
    );
  }

  if (!API_URL) {
    throw new Error(
      "API URL is not configured."
    );
  }

  try {
    const normalizedCategory =
      normalizeProductCategory(
        product.category
      );

    const hasImage =
      !!product.image?.uri;

    let response: Response;

    if (hasImage) {
      const formData =
        new FormData();

      formData.append(
        "name",
        product.name.trim()
      );

      formData.append(
        "category",
        normalizedCategory
      );

      formData.append(
        "price",
        String(Number(product.price))
      );

      formData.append(
        "stock",
        String(Number(product.stock))
      );

      formData.append(
        "available",
        String(
          product.available ?? true
        )
      );

      // =================================================
      // USDA / NUTRITION DATA
      // =================================================

      if (product.nutrition) {
        formData.append(
          "nutrition",
          JSON.stringify(
            product.nutrition
          )
        );
      }

      await appendImage(
        formData,
        "image",
        product.image
      );

      response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );
    } else {
      response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",
          headers:
            getAuthHeaders(token),
          body: JSON.stringify({
            name:
              product.name.trim(),

            category:
              normalizedCategory,

            price:
              Number(product.price),

            stock:
              Number(product.stock),

            available:
              product.available ?? true,

            nutrition:
              product.nutrition ??
              undefined,
          }),
        }
      );
    }

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to create product."
      );
    }

    const createdProduct =
      data?.product ??
      data?.data?.product ??
      data?.data ??
      data?.createdProduct ??
      data?.result ??
      data;

    if (
      !createdProduct ||
      typeof createdProduct !==
        "object" ||
      !createdProduct._id
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Server did not return the created product."
      );
    }

    return createdProduct as Product;
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to create product."
    );
  }
}

// =====================================================
// UPDATE PRODUCT
// =====================================================

export async function updateProduct(
  token: string,
  productId: string,
  product: {
    name: string;
    category: ProductCategory;
    price: number;
    stock: number;
    available: boolean;
    image?: RegisterImage;
    removeImage?: boolean;
    nutrition?: ProductNutrition;
  }
): Promise<Product> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (!product.name.trim()) {
    throw new Error(
      "Product name is required."
    );
  }

  if (!API_URL) {
    throw new Error(
      "API URL is not configured."
    );
  }

  try {
    const normalizedCategory =
      normalizeProductCategory(
        product.category
      );

    const hasNewImage =
      !!product.image?.uri;

    const removeImage =
      product.removeImage === true;

    let response: Response;

    if (
      hasNewImage ||
      removeImage
    ) {
      const formData =
        new FormData();

      formData.append(
        "name",
        product.name.trim()
      );

      formData.append(
        "category",
        normalizedCategory
      );

      formData.append(
        "price",
        String(Number(product.price))
      );

      formData.append(
        "stock",
        String(Number(product.stock))
      );

      formData.append(
        "available",
        String(product.available)
      );

      formData.append(
        "removeImage",
        String(removeImage)
      );

      if (product.nutrition) {
        formData.append(
          "nutrition",
          JSON.stringify(
            product.nutrition
          )
        );
      }

      if (hasNewImage) {
        await appendImage(
          formData,
          "image",
          product.image
        );
      }

      response = await fetch(
        `${API_URL}/api/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: "PUT",
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );
    } else {
      response = await fetch(
        `${API_URL}/api/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: "PUT",
          headers:
            getAuthHeaders(token),
          body: JSON.stringify({
            name:
              product.name.trim(),

            category:
              normalizedCategory,

            price:
              Number(product.price),

            stock:
              Number(product.stock),

            available:
              product.available,

            nutrition:
              product.nutrition ??
              undefined,
          }),
        }
      );
    }

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to update product."
      );
    }

    const updatedProduct =
      data?.product ??
      data?.data?.product ??
      data?.data ??
      data?.updatedProduct ??
      data?.result ??
      data;

    if (
      !updatedProduct ||
      typeof updatedProduct !==
        "object" ||
      !updatedProduct._id
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Server did not return the updated product."
      );
    }

    return updatedProduct as Product;
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to update product."
    );
  }
}

// =====================================================
// DELETE PRODUCT
// =====================================================

export async function deleteProduct(
  token: string,
  productId: string
): Promise<void> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/products/${encodeURIComponent(
        productId
      )}`,
      {
        method: "DELETE",
        headers:
          getAuthHeaders(token),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to delete product."
      );
    }
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to delete product."
    );
  }
}

// =====================================================
// UPDATE PRODUCT AVAILABILITY
// =====================================================

export async function updateProductAvailability(
  token: string,
  productId: string,
  available: boolean
): Promise<Product> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/products/${encodeURIComponent(
        productId
      )}/availability`,
      {
        method: "PATCH",
        headers:
          getAuthHeaders(token),
        body: JSON.stringify({
          available,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to update product availability."
      );
    }

    const updatedProduct =
      data?.product ??
      data?.data?.product ??
      data?.data ??
      data;

    if (
      !updatedProduct ||
      typeof updatedProduct !==
        "object" ||
      !updatedProduct._id
    ) {
      throw new Error(
        data?.message ||
          "Server did not return the updated product."
      );
    }

    return updatedProduct as Product;
  } catch (error) {
    console.error(
      "UPDATE PRODUCT AVAILABILITY ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to update product availability."
    );
  }
}

// =====================================================
// PUBLIC STORES
// =====================================================

export async function getPublicStores(): Promise<
  Store[]
> {
  try {
    const response = await fetch(
      `${API_URL}/api/stores`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load stores."
      );
    }

    if (Array.isArray(data)) {
      return data as Store[];
    }

    return (
      data?.stores ?? []
    ) as Store[];
  } catch (error) {
    console.error(
      "GET PUBLIC STORES ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load stores."
    );
  }
}

// =====================================================
// PUBLIC STORE
// =====================================================

export async function getPublicStore(
  storeId: string
): Promise<Store> {
  if (!storeId) {
    throw new Error(
      "Store ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/stores/${encodeURIComponent(
        storeId
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load store."
      );
    }

    return data.store as Store;
  } catch (error) {
    console.error(
      "GET PUBLIC STORE ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load store."
    );
  }
}

// =====================================================
// PUBLIC PRODUCTS BY STORE
// =====================================================

export async function getStoreProducts(
  storeId: string
): Promise<Product[]> {
  if (!storeId) {
    throw new Error(
      "Store ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/products/store/${encodeURIComponent(
        storeId
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load store products."
      );
    }

    if (Array.isArray(data)) {
      return data as Product[];
    }

    return (
      data?.products ?? []
    ) as Product[];
  } catch (error) {
    console.error(
      "GET STORE PRODUCTS ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load store products."
    );
  }
}

// =====================================================
// PUBLIC PRODUCT BY ID
// =====================================================

export async function getPublicProduct(
  productId: string
): Promise<{
  product: Product;
  store: Store;
}> {
  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/products/${encodeURIComponent(
        productId
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to load product."
      );
    }

    if (
      data &&
      data.product
    ) {
      return {
        product:
          data.product as Product,
        store:
          data.store as Store,
      };
    }

    if (
      data &&
      data._id
    ) {
      return {
        product:
          data as Product,
        store:
          data.store as Store,
      };
    }

    throw new Error(
      data?.message ||
        "Product not found."
    );
  } catch (error) {
    console.error(
      "GET PUBLIC PRODUCT ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load product."
    );
  }
}

// =====================================================
// CREATE ORDER
// =====================================================

export async function createOrder(
  token: string,
  payload: CreateOrderPayload
): Promise<Order> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!payload.storeId) {
    throw new Error(
      "Store ID is required."
    );
  }

  if (
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    throw new Error(
      "Order must contain at least one item."
    );
  }

  if (
    !payload.pickupLocation.trim()
  ) {
    throw new Error(
      "Pickup location is required."
    );
  }

  if (
    payload.paymentMethod !==
      "cash" &&
    payload.paymentMethod !==
      "gcash"
  ) {
    throw new Error(
      "Invalid payment method."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/orders`,
      {
        method: "POST",
        headers:
          getAuthHeaders(token),
        body: JSON.stringify(payload),
      }
    );

    const data =
      await parseResponse(response);

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Failed to create order."
      );
    }

    return data.order as Order;
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to create order."
    );
  }
}

// =====================================================
// GET MY ORDERS
// =====================================================

export async function getMyOrders(
  token: string
): Promise<Order[]> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/orders/my`,
      {
        method: "GET",
        headers:
          getAuthHeaders(token),
      }
    );

    const data =
      await parseResponse(response);

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Failed to get orders."
      );
    }

    return (
      data.orders ?? []
    ) as Order[];
  } catch (error) {
    console.error(
      "GET MY ORDERS ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load your orders."
    );
  }
}

// =====================================================
// GET SELLER ORDERS
// =====================================================

export async function getSellerOrders(
  token: string
): Promise<Order[]> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/orders/seller`,
      {
        method: "GET",
        headers:
          getAuthHeaders(token),
      }
    );

    const data =
      await parseResponse(response);

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Failed to get seller orders."
      );
    }

    return (
      data.orders ?? []
    ) as Order[];
  } catch (error) {
    console.error(
      "GET SELLER ORDERS ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load seller orders."
    );
  }
}

// =====================================================
// GET SINGLE ORDER
// =====================================================

export async function getOrder(
  token: string,
  orderId: string
): Promise<Order> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!orderId) {
    throw new Error(
      "Order ID is required."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/orders/${encodeURIComponent(
        orderId
      )}`,
      {
        method: "GET",
        headers:
          getAuthHeaders(token),
      }
    );

    const data =
      await parseResponse(response);

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Failed to get order."
      );
    }

    return data.order as Order;
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to load order."
    );
  }
}

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  if (!orderId) {
    throw new Error(
      "Order ID is required."
    );
  }

  const validStatuses: OrderStatus[] =
    [
      "Pending",
      "Preparing",
      "Ready",
      "Completed",
      "Cancelled",
    ];

  if (
    !validStatuses.includes(status)
  ) {
    throw new Error(
      "Invalid order status."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/orders/${encodeURIComponent(
        orderId
      )}/status`,
      {
        method: "PATCH",
        headers:
          getAuthHeaders(token),
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data =
      await parseResponse(response);

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Failed to update order status."
      );
    }

    return data.order as Order;
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Unable to update order status."
    );
  }
}