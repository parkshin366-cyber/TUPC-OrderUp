import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "tupc_orderup_token";
const USER_KEY = "tupc_orderup_user";
const REMEMBER_ME_KEY = "tupc_orderup_remember_me";

// =====================================================
// REMEMBERED LOGIN CREDENTIALS
// =====================================================

const REMEMBERED_USERNAME_KEY =
  "tupc_orderup_remembered_username";

const REMEMBERED_PASSWORD_KEY =
  "tupc_orderup_remembered_password";

// =====================================================
// TYPES
// =====================================================

export type StoredAuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contact?: string;
  role: "client" | "seller" | "admin";
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export type RememberedCredentials = {
  username: string;
  password: string;
};

// =====================================================
// SAVE AUTH SESSION
// =====================================================

export async function saveAuthSession(
  token: string,
  user: StoredAuthUser,
  rememberMe: boolean
): Promise<void> {
  if (!token) {
    throw new Error(
      "Cannot save authentication session without a token."
    );
  }

  if (!user) {
    throw new Error(
      "Cannot save authentication session without user information."
    );
  }

  if (rememberMe) {
    await SecureStore.setItemAsync(
      TOKEN_KEY,
      token
    );

    await SecureStore.setItemAsync(
      USER_KEY,
      JSON.stringify(user)
    );

    await SecureStore.setItemAsync(
      REMEMBER_ME_KEY,
      "true"
    );

    console.log(
      "Persistent authentication session saved."
    );

    return;
  }

  // Remember Me disabled.
  await clearStoredAuthSession();

  console.log(
    "Remember Me disabled. No persistent auth session saved."
  );
}

// =====================================================
// GET AUTH TOKEN
// =====================================================

export async function getAuthToken(): Promise<string | null> {
  const rememberMe = await getRememberMe();

  if (!rememberMe) {
    return null;
  }

  return await SecureStore.getItemAsync(
    TOKEN_KEY
  );
}

// =====================================================
// GET AUTH USER
// =====================================================

export async function getAuthUser(): Promise<StoredAuthUser | null> {
  const rememberMe = await getRememberMe();

  if (!rememberMe) {
    return null;
  }

  const user = await SecureStore.getItemAsync(
    USER_KEY
  );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as StoredAuthUser;
  } catch (error) {
    console.error(
      "Failed to parse stored auth user:",
      error
    );

    await clearStoredAuthSession();

    return null;
  }
}

// =====================================================
// GET REMEMBER ME
// =====================================================

export async function getRememberMe(): Promise<boolean> {
  const value =
    await SecureStore.getItemAsync(
      REMEMBER_ME_KEY
    );

  return value === "true";
}

// =====================================================
// SAVE REMEMBERED CREDENTIALS
// =====================================================

export async function saveRememberedCredentials(
  username: string,
  password: string
): Promise<void> {
  const trimmedUsername =
    username.trim();

  if (!trimmedUsername || !password) {
    await clearRememberedCredentials();
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(
      REMEMBERED_USERNAME_KEY,
      trimmedUsername
    ),

    SecureStore.setItemAsync(
      REMEMBERED_PASSWORD_KEY,
      password
    ),

    SecureStore.setItemAsync(
      REMEMBER_ME_KEY,
      "true"
    ),
  ]);

  console.log(
    "Remembered username and password saved."
  );
}

// =====================================================
// GET REMEMBERED CREDENTIALS
// =====================================================

export async function getRememberedCredentials(): Promise<RememberedCredentials | null> {
  const [
    username,
    password,
  ] = await Promise.all([
    SecureStore.getItemAsync(
      REMEMBERED_USERNAME_KEY
    ),

    SecureStore.getItemAsync(
      REMEMBERED_PASSWORD_KEY
    ),
  ]);

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
  };
}

// =====================================================
// SAVE REMEMBERED USERNAME
// =====================================================
// Optional compatibility function.
// You can still use this elsewhere if needed.

export async function saveRememberedUsername(
  username: string
): Promise<void> {
  const trimmedUsername =
    username.trim();

  if (!trimmedUsername) {
    await clearRememberedUsername();
    return;
  }

  await SecureStore.setItemAsync(
    REMEMBERED_USERNAME_KEY,
    trimmedUsername
  );

  console.log(
    "Remembered username saved."
  );
}

// =====================================================
// GET REMEMBERED USERNAME
// =====================================================

export async function getRememberedUsername(): Promise<string | null> {
  return await SecureStore.getItemAsync(
    REMEMBERED_USERNAME_KEY
  );
}

// =====================================================
// CLEAR REMEMBERED USERNAME
// =====================================================

export async function clearRememberedUsername(): Promise<void> {
  await SecureStore.deleteItemAsync(
    REMEMBERED_USERNAME_KEY
  );

  console.log(
    "Remembered username cleared."
  );
}

// =====================================================
// CLEAR REMEMBERED PASSWORD
// =====================================================

export async function clearRememberedPassword(): Promise<void> {
  await SecureStore.deleteItemAsync(
    REMEMBERED_PASSWORD_KEY
  );

  console.log(
    "Remembered password cleared."
  );
}

// =====================================================
// CLEAR REMEMBERED CREDENTIALS
// =====================================================

export async function clearRememberedCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(
      REMEMBERED_USERNAME_KEY
    ),

    SecureStore.deleteItemAsync(
      REMEMBERED_PASSWORD_KEY
    ),
  ]);

  console.log(
    "Remembered username and password cleared."
  );
}

// =====================================================
// CLEAR STORED AUTH SESSION
// =====================================================
//
// IMPORTANT:
// This clears the LOGIN SESSION only.
//
// It intentionally DOES NOT clear:
// - remembered username
// - remembered password
//
// Therefore, logout will NOT remove the saved
// login credentials when Remember Me is enabled.
// =====================================================

export async function clearStoredAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(
      TOKEN_KEY
    ),

    SecureStore.deleteItemAsync(
      USER_KEY
    ),

    SecureStore.deleteItemAsync(
      REMEMBER_ME_KEY
    ),
  ]);
}

// =====================================================
// CLEAR AUTH SESSION / LOGOUT
// =====================================================
//
// This only logs the user out.
// Remembered credentials remain available.
// =====================================================

export async function clearAuthSession(): Promise<void> {
  try {
    await clearStoredAuthSession();

    console.log(
      "Authentication session cleared."
    );
  } catch (error) {
    console.error(
      "Failed to clear authentication session:",
      error
    );

    throw error;
  }
}

// =====================================================
// CLEAR EVERYTHING
// =====================================================
//
// Use this only when the user explicitly chooses
// something like "Forget this account" or when
// Remember Me is unchecked.
// =====================================================

export async function clearAllAuthData(): Promise<void> {
  await Promise.all([
    clearStoredAuthSession(),
    clearRememberedCredentials(),
  ]);

  console.log(
    "All authentication data cleared."
  );
}