import {
  Stack,
  router,
  useSegments,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

import {
  CartProvider,
} from "../context/CartContext";

type UserRole =
  | "client"
  | "seller"
  | "admin";

// =====================================================
// ROUTE GUARD
// =====================================================

function RouteGuard() {
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const segments = useSegments();

  useEffect(() => {
    // ===================================================
    // WAIT FOR AUTH INITIALIZATION
    // ===================================================

    if (isLoading) {
      return;
    }

    const firstSegment = segments[0];

    const inAuthGroup =
      firstSegment === "(auth)";

    const inClientGroup =
      firstSegment === "(client)";

    const inSellerGroup =
      firstSegment === "(seller)";

    const inAdminGroup =
      firstSegment === "(admin)";

    // ===================================================
    // LOGGED OUT
    // ===================================================

    /*
     * IMPORTANT:
     *
     * Do NOT automatically redirect here when logged out.
     *
     * Logout is handled explicitly by the profile/settings
     * screen:
     *
     *   await logout();
     *   router.replace("/");
     *
     * This prevents the RouteGuard from fighting with the
     * explicit logout navigation while Expo Router is
     * removing the protected navigator.
     */

    if (!isAuthenticated || !user) {
      return;
    }

    // ===================================================
    // AUTH ROUTES
    // ===================================================

    /*
     * Allow auth screens to control their own navigation.
     *
     * Examples:
     * - Login
     * - Security
     * - OTP
     * - Register
     * - Forgot Password
     */

    if (inAuthGroup) {
      return;
    }

    // ===================================================
    // CLIENT PROTECTION
    // ===================================================

    if (
      inClientGroup &&
      user.role !== "client"
    ) {
      navigateByRole(user.role);
      return;
    }

    // ===================================================
    // SELLER PROTECTION
    // ===================================================

    if (
      inSellerGroup &&
      user.role !== "seller"
    ) {
      navigateByRole(user.role);
      return;
    }

    // ===================================================
    // ADMIN PROTECTION
    // ===================================================

    if (
      inAdminGroup &&
      user.role !== "admin"
    ) {
      navigateByRole(user.role);
      return;
    }
  }, [
    user,
    isLoading,
    isAuthenticated,
    segments,
  ]);

  return null;
}

// =====================================================
// ROLE NAVIGATION
// =====================================================

function navigateByRole(role: UserRole) {
  // -----------------------------------------------------
  // ADMIN
  // -----------------------------------------------------

  if (role === "admin") {
    router.replace("/(admin)");
    return;
  }

  // -----------------------------------------------------
  // SELLER
  // -----------------------------------------------------

  if (role === "seller") {
    router.replace("/(seller)/dashboard");
    return;
  }

  // -----------------------------------------------------
  // CLIENT
  // -----------------------------------------------------

  if (role === "client") {
    router.replace("/(client)/dashboard");
    return;
  }
}

// =====================================================
// APP NAVIGATOR
// =====================================================

function AppNavigator() {
  return (
    <>
      <RouteGuard />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: "#F7F7F8",
          },
        }}
      >
        {/* =================================================
            ROOT ROUTE
        ================================================= */}

        <Stack.Screen
          name="index"
        />

        {/* =================================================
            AUTH ROUTES
        ================================================= */}

        <Stack.Screen
          name="(auth)"
        />

        {/* =================================================
            CLIENT ROUTES
        ================================================= */}

        <Stack.Screen
          name="(client)"
        />

        {/* =================================================
            SELLER ROUTES
        ================================================= */}

        <Stack.Screen
          name="(seller)"
        />

        {/* =================================================
            ADMIN ROUTES
        ================================================= */}

        <Stack.Screen
          name="(admin)"
        />
      </Stack>
    </>
  );
}

// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar
          style="dark"
        />

        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}