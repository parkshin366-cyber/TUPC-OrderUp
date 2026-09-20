import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  getRememberMe,
  saveAuthSession,
} from "./authStorage";

import { getCurrentUser } from "./api";

// =====================================================
// RESTORE SESSION
//
// Restores a previously persisted session.
//
// This only works when Remember Me was enabled.
// =====================================================

export async function restoreSession() {
  try {
    // ===================================================
    // GET SAVED TOKEN
    // ===================================================

    const token = await getAuthToken();

    if (!token) {
      return null;
    }

    // ===================================================
    // GET REMEMBER ME STATE
    // ===================================================

    const rememberMe = await getRememberMe();

    if (!rememberMe) {
      return null;
    }

    // ===================================================
    // VALIDATE TOKEN WITH SERVER
    // ===================================================

    const data = await getCurrentUser(token);

    // ===================================================
    // MAKE SURE SERVER RETURNED A USER
    // ===================================================

    if (!data?.user) {
      await clearAuthSession();

      return null;
    }

    // ===================================================
    // REFRESH STORED USER INFORMATION
    //
    // Keep Remember Me enabled while updating the
    // stored user information.
    // ===================================================

    await saveAuthSession(
      token,
      data.user,
      true
    );

    // ===================================================
    // RETURN RESTORED SESSION
    // ===================================================

    return {
      token,
      user: data.user,
    };
  } catch (error) {
    console.log(
      "Session restore failed:",
      error
    );

    // ===================================================
    // INVALID / EXPIRED SESSION
    //
    // Remove the persisted session so the app does not
    // repeatedly attempt to restore a bad token.
    // ===================================================

    try {
      await clearAuthSession();
    } catch (clearError) {
      console.error(
        "Failed to clear invalid auth session:",
        clearError
      );
    }

    return null;
  }
}

// =====================================================
// GET STORED SESSION
//
// Reads the currently persisted token + user without
// making a server request.
//
// Returns null when Remember Me is disabled.
// =====================================================

export async function getStoredSession() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return null;
    }

    const user = await getAuthUser();

    if (!user) {
      return null;
    }

    return {
      token,
      user,
    };
  } catch (error) {
    console.log(
      "Get stored session failed:",
      error
    );

    return null;
  }
}