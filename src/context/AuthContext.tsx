import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  clearAuthSession,
  saveAuthSession,
} from "../services/authStorage";

import {
  loginUser,
  verifyOtp as verifyOtpApi,
  VerifyOtpResponse,
} from "../services/api";

import { restoreSession } from "../services/session";

// =====================================================
// TYPES
// =====================================================

export type AuthUser = {
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

// =====================================================
// LOGIN RESULT
// =====================================================

export type LoginResult = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
  role: "client" | "seller" | "admin";
  userId: string;
  email: string;
  expiresIn?: number;
};

// =====================================================
// CONTEXT TYPE
// =====================================================

type AuthContextType = {
  user: AuthUser | null;

  token: string | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  login: (
    username: string,
    password: string,
    rememberMe: boolean
  ) => Promise<LoginResult>;

  verifyOtp: (
    userId: string,
    otp: string
  ) => Promise<VerifyOtpResponse>;

  logout: () => Promise<void>;

  refreshSession: () => Promise<void>;
};

// =====================================================
// CONTEXT
// =====================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // ===================================================
  // LOGOUT / SESSION VERSION
  //
  // Used to prevent an old restoreSession() call
  // from restoring the user AFTER logout.
  // ===================================================

  const [logoutVersion, setLogoutVersion] =
    useState(0);

  // ===================================================
  // INITIALIZE SESSION
  // ===================================================

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        setIsLoading(true);

        const session =
          await restoreSession();

        if (!mounted) {
          return;
        }

        if (
          session?.token &&
          session?.user
        ) {
          setToken(session.token);

          setUser(
            session.user as AuthUser
          );

          console.log(
            "========================================"
          );

          console.log(
            "AUTH SESSION RESTORED"
          );

          console.log(
            "Username:",
            session.user.username
          );

          console.log(
            "Role:",
            session.user.role
          );

          console.log(
            "========================================"
          );
        } else {
          setToken(null);
          setUser(null);

          console.log(
            "No saved authentication session."
          );
        }
      } catch (error) {
        console.error(
          "Initialize session error:",
          error
        );

        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // LOGIN
  // ===================================================

  async function login(
    username: string,
    password: string,
    rememberMe: boolean
  ): Promise<LoginResult> {
    const cleanUsername =
      username.trim();

    if (!cleanUsername) {
      throw new Error(
        "Username or email is required."
      );
    }

    if (!password) {
      throw new Error(
        "Password is required."
      );
    }

    try {
      const data =
        await loginUser(
          cleanUsername,
          password
        );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Login failed."
        );
      }

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      if (!data?.user) {
        throw new Error(
          "Login succeeded but no user information was returned."
        );
      }

      const authenticatedUser: AuthUser = {
        id: String(data.user.id),

        firstName:
          data.user.firstName ?? "",

        lastName:
          data.user.lastName ?? "",

        username:
          data.user.username ?? "",

        email:
          data.user.email ?? "",

        contact:
          data.user.contact,

        role:
          data.user.role,

        status:
          data.user.status,

        createdAt:
          data.user.createdAt,
      };

      // =================================================
      // SAVE SESSION
      // =================================================

      await saveAuthSession(
        data.token,
        authenticatedUser,
        rememberMe
      );

      // =================================================
      // UPDATE AUTH STATE
      // =================================================

      setToken(data.token);

      setUser(
        authenticatedUser
      );

      console.log(
        "========================================"
      );

      console.log(
        "AUTH LOGIN SUCCESS"
      );

      console.log(
        "Username:",
        authenticatedUser.username
      );

      console.log(
        "Role:",
        authenticatedUser.role
      );

      console.log(
        "Remember Me:",
        rememberMe
      );

      console.log(
        rememberMe
          ? "Persistent authentication session saved."
          : "Authentication session is temporary."
      );

      console.log(
        "Login OTP: NOT REQUIRED"
      );

      console.log(
        "========================================"
      );

      return {
        success: true,

        message:
          data.message ||
          "Login successful.",

        token:
          data.token,

        user:
          authenticatedUser,

        role:
          authenticatedUser.role,

        userId:
          authenticatedUser.id,

        email:
          authenticatedUser.email,

        expiresIn:
          data.expiresIn,
      };
    } catch (error) {
      console.error(
        "AuthContext login error:",
        error
      );

      throw error;
    }
  }

  // ===================================================
  // VERIFY REGISTRATION OTP
  // ===================================================

  async function verifyOtp(
    userId: string,
    otp: string
  ): Promise<VerifyOtpResponse> {
    const cleanUserId =
      userId.trim();

    if (!cleanUserId) {
      throw new Error(
        "User ID is missing."
      );
    }

    const cleanOtp =
      otp.trim();

    if (!cleanOtp) {
      throw new Error(
        "OTP is required."
      );
    }

    const data =
      await verifyOtpApi(
        cleanUserId,
        cleanOtp,
        "register"
      );

    return data;
  }

  // ===================================================
  // LOGOUT
  //
  // IMPORTANT:
  // 1. Invalidate current session restoration
  // 2. Clear SecureStore
  // 3. Clear React auth state
  // ===================================================

  async function logout(): Promise<void> {
    console.log(
      "========================================"
    );

    console.log(
      "LOGGING OUT..."
    );

    // Invalidate any session restoration
    // that may still be running.
    setLogoutVersion(
      (current) => current + 1
    );

    // Immediately clear React state.
    // This prevents dashboard guards from
    // seeing the user as authenticated.
    setToken(null);
    setUser(null);

    try {
      // Clear:
      // - token
      // - user
      // - remember-me flag
      await clearAuthSession();

      console.log(
        "AUTH STORAGE CLEARED"
      );
    } catch (error) {
      console.error(
        "Logout storage error:",
        error
      );
    } finally {
      // Make absolutely sure React state
      // is unauthenticated.
      setToken(null);
      setUser(null);

      console.log(
        "AUTH STATE CLEARED"
      );

      console.log(
        "LOGOUT COMPLETE"
      );

      console.log(
        "========================================"
      );
    }
  }

  // ===================================================
  // REFRESH SESSION
  // ===================================================

  async function refreshSession(): Promise<void> {
    const currentLogoutVersion =
      logoutVersion;

    try {
      setIsLoading(true);

      const session =
        await restoreSession();

      // If logout happened while restoreSession()
      // was running, DO NOT restore the old account.
      if (
        currentLogoutVersion !==
        logoutVersion
      ) {
        console.log(
          "Session refresh cancelled because logout occurred."
        );

        return;
      }

      if (
        session?.token &&
        session?.user
      ) {
        const restoredUser: AuthUser = {
          id: String(
            session.user.id
          ),

          firstName:
            session.user.firstName ??
            "",

          lastName:
            session.user.lastName ??
            "",

          username:
            session.user.username ??
            "",

          email:
            session.user.email ??
            "",

          contact:
            session.user.contact,

          role:
            session.user.role,

          status:
            session.user.status,

          createdAt:
            session.user.createdAt,
        };

        setToken(
          session.token
        );

        setUser(
          restoredUser
        );
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error(
        "Refresh session error:",
        error
      );

      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  // ===================================================
  // AUTHENTICATED STATE
  // ===================================================

  const isAuthenticated =
    !!user && !!token;

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        verifyOtp,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}