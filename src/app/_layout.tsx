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
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

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

    if (!isAuthenticated || !user) {
      // A cleared session must never remain inside a protected tab group.
      // This also handles logout from nested admin tabs reliably.
      if (inClientGroup || inSellerGroup || inAdminGroup) {
        router.replace("/");
      }
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
    router.replace("/(admin)/dashboard");
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
  const { colors } = useAppTheme();

  return (
    <>
      <RouteGuard />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: colors.background,
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
      <ThemeProvider>
        <CartProvider>
          <ThemedApp />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function ThemedApp() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppNavigator />
    </>
  );
}
