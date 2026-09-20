import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",
  gold: "#D8B56A",

  background: "#F7F7F8",
  white: "#FFFFFF",

  text: "#171717",
  muted: "#737373",
  border: "#E5E5E5",

  success: "#218739",
  successBackground: "#EEF8F0",

  warning: "#B7791F",
  warningBackground: "#FFF8E8",
  warningBorder: "#EBD9A8",
};

// =====================================================
// TYPES
// =====================================================

type Role = "client" | "seller" | "admin";

// =====================================================
// SCREEN
// =====================================================

export default function SecurityScreen() {
  const params = useLocalSearchParams<{
    role?: Role;
    rememberMe?: string;
  }>();

  const role = params.role ?? "client";

  const [checking, setChecking] = useState(true);
  const [fingerprintAvailable, setFingerprintAvailable] =
    useState(false);
  const [authenticating, setAuthenticating] =
    useState(false);

  // ===================================================
  // CHECK FINGERPRINT
  // ===================================================

  useEffect(() => {
    checkFingerprint();
  }, []);

  async function checkFingerprint() {
    try {
      const hasHardware =
        await LocalAuthentication.hasHardwareAsync();

      const isEnrolled =
        await LocalAuthentication.isEnrolledAsync();

      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      const hasFingerprint =
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        );

      const available =
        hasHardware &&
        isEnrolled &&
        hasFingerprint;

      setFingerprintAvailable(available);
    } catch (error) {
      console.log(
        "Fingerprint check failed:",
        error
      );

      setFingerprintAvailable(false);
    } finally {
      setChecking(false);
    }
  }

  // ===================================================
  // FINGERPRINT AUTHENTICATION
  // ===================================================

  async function handleFingerprintAuthentication() {
    if (!fingerprintAvailable) {
      Alert.alert(
        "Fingerprint Unavailable",
        "No enrolled fingerprint was detected on this device. Please set up a fingerprint in your device security settings first."
      );

      return;
    }

    try {
      setAuthenticating(true);

      const result =
        await LocalAuthentication.authenticateAsync({
          promptMessage:
            "Verify with your fingerprint",
          cancelLabel: "Cancel",
          disableDeviceFallback: true,
        });

      if (result.success) {
        navigateToDashboard();
        return;
      }

      if (
        result.error === "user_cancel" ||
        result.error === "system_cancel"
      ) {
        return;
      }

      Alert.alert(
        "Fingerprint Not Recognized",
        "Your fingerprint could not be verified. Please try again."
      );
    } catch (error) {
      console.log(
        "Fingerprint authentication error:",
        error
      );

      Alert.alert(
        "Security Error",
        "Unable to start fingerprint verification."
      );
    } finally {
      setAuthenticating(false);
    }
  }

  // ===================================================
  // DASHBOARD ROUTING
  // ===================================================

  function navigateToDashboard() {
    console.log(
      "SECURITY: Fingerprint verified."
    );

    console.log(
      "SECURITY: User role:",
      role
    );

    // -------------------------------------------------
    // ADMIN
    // -------------------------------------------------

    if (role === "admin") {
      console.log(
        "SECURITY: Redirecting to admin..."
      );

      router.replace("/(admin)");
      return;
    }

    // -------------------------------------------------
    // SELLER
    // -------------------------------------------------

    if (role === "seller") {
      console.log(
        "SECURITY: Redirecting to seller dashboard..."
      );

      router.replace("/(seller)/dashboard");
      return;
    }

    // -------------------------------------------------
    // CLIENT
    // -------------------------------------------------

    console.log(
      "SECURITY: Redirecting to client dashboard..."
    );

    // IMPORTANT:
    // Client index.tsx was renamed to dashboard.tsx.
    // Therefore the correct route is:
    // /(client)/dashboard

    router.replace("/(client)/dashboard");
  }

  // ===================================================
  // DEVICE SETTINGS
  // ===================================================

  function handleFingerprintSetup() {
    Alert.alert(
      "Fingerprint Required",
      "Please enroll a fingerprint in your device's security settings, then return to TUPC-OrderUp and try again.",
      [
        {
          text: "Try Again",
          onPress: checkFingerprint,
        },
        {
          text: "OK",
          style: "cancel",
        },
      ]
    );
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="finger-print-outline"
              size={32}
              color={COLORS.cardinal}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={COLORS.cardinal}
          />

          <Text style={styles.loadingTitle}>
            Checking fingerprint...
          </Text>

          <Text style={styles.loadingText}>
            Preparing your secure sign-in.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.brandSection}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>
                T
              </Text>
            </View>

            <View>
              <Text style={styles.brandName}>
                TUPC-OrderUp
              </Text>

              <Text style={styles.brandSubtitle}>
                Secure Sign-in
              </Text>
            </View>
          </View>

          <View style={styles.secureBadge}>
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={COLORS.success}
            />

            <Text style={styles.secureBadgeText}>
              SECURE
            </Text>
          </View>
        </View>

        {/* =================================================
            MAIN
        ================================================= */}

        <View style={styles.main}>

          {/* FINGERPRINT ICON */}

          <View style={styles.fingerprintOuter}>
            <View style={styles.fingerprintInner}>
              <Ionicons
                name="finger-print-outline"
                size={65}
                color={COLORS.cardinal}
              />
            </View>
          </View>

          <Text style={styles.eyebrow}>
            IDENTITY VERIFICATION
          </Text>

          <Text style={styles.title}>
            Verify your identity
          </Text>

          <Text style={styles.description}>
            Use your registered fingerprint to
            securely continue to your TUPC-OrderUp
            account.
          </Text>

          {/* =================================================
              FINGERPRINT STATUS
          ================================================= */}

          <View
            style={[
              styles.statusCard,
              fingerprintAvailable
                ? styles.statusCardAvailable
                : styles.statusCardUnavailable,
            ]}
          >
            <View
              style={[
                styles.statusIcon,
                fingerprintAvailable
                  ? styles.statusIconAvailable
                  : styles.statusIconUnavailable,
              ]}
            >
              <Ionicons
                name={
                  fingerprintAvailable
                    ? "finger-print"
                    : "alert-circle-outline"
                }
                size={23}
                color={
                  fingerprintAvailable
                    ? COLORS.success
                    : COLORS.warning
                }
              />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {fingerprintAvailable
                  ? "Fingerprint ready"
                  : "Fingerprint unavailable"}
              </Text>

              <Text style={styles.statusText}>
                {fingerprintAvailable
                  ? "Your enrolled fingerprint can be used for secure sign-in."
                  : "No enrolled fingerprint was detected on this device."}
              </Text>
            </View>

            {fingerprintAvailable && (
              <Ionicons
                name="checkmark-circle"
                size={23}
                color={COLORS.success}
              />
            )}
          </View>

          {/* =================================================
              AUTH BUTTON
          ================================================= */}

          {fingerprintAvailable ? (
            <Pressable
              style={({ pressed }) => [
                styles.authenticateButton,

                pressed &&
                  !authenticating &&
                  styles.buttonPressed,

                authenticating &&
                  styles.authenticateButtonDisabled,
              ]}
              onPress={
                handleFingerprintAuthentication
              }
              disabled={authenticating}
            >
              {authenticating ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />

                  <Text
                    style={styles.authenticateText}
                  >
                    Verifying...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="finger-print"
                    size={25}
                    color={COLORS.white}
                  />

                  <Text
                    style={styles.authenticateText}
                  >
                    Verify with Fingerprint
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={styles.setupButton}
              onPress={handleFingerprintSetup}
            >
              <Ionicons
                name="settings-outline"
                size={21}
                color={COLORS.white}
              />

              <Text style={styles.setupButtonText}>
                Set Up Fingerprint
              </Text>
            </Pressable>
          )}

          {/* =================================================
              SECURITY INFORMATION
          ================================================= */}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="lock-closed"
                size={17}
                color={COLORS.cardinal}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Your fingerprint stays private
              </Text>

              <Text style={styles.securityText}>
                TUPC-OrderUp does not receive or store
                your fingerprint data. Your device
                handles the biometric verification.
              </Text>
            </View>
          </View>

          {/* =================================================
              PIN INFORMATION
          ================================================= */}

          <View style={styles.pinCard}>
            <View style={styles.pinIcon}>
              <Ionicons
                name="keypad-outline"
                size={18}
                color={COLORS.cardinalDark}
              />
            </View>

            <View style={styles.pinContent}>
              <Text style={styles.pinTitle}>
                Security PIN
              </Text>

              <Text style={styles.pinText}>
                Your 6-digit PIN remains your backup
                security method for your account.
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footer}>
          <View style={styles.goldLine} />

          <Text style={styles.footerTitle}>
            Secure Campus Ordering
          </Text>

          <Text style={styles.footerText}>
            TUP Cavite • TUPC-OrderUp
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 21,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  loadingTitle: {
    marginTop: 13,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  loadingText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.muted,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 18,
  },

  brandSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  brandMarkText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },

  brandName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.muted,
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: COLORS.successBackground,
  },

  secureBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.success,
  },

  // ===================================================
  // MAIN
  // ===================================================

  main: {
    flex: 1,
    justifyContent: "center",
  },

  fingerprintOuter: {
    alignSelf: "center",
    width: 118,
    height: 118,
    borderRadius: 40,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  fingerprintInner: {
    width: 92,
    height: 92,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0D8DD",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  eyebrow: {
    textAlign: "center",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: COLORS.cardinal,
    marginBottom: 7,
  },

  title: {
    textAlign: "center",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.6,
  },

  description: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    marginTop: 10,
    paddingHorizontal: 12,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusCard: {
    marginTop: 22,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  statusCardAvailable: {
    backgroundColor: COLORS.successBackground,
    borderColor: "#D8EBDD",
  },

  statusCardUnavailable: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },

  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  statusIconAvailable: {
    backgroundColor: COLORS.white,
  },

  statusIconUnavailable: {
    backgroundColor: COLORS.white,
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  statusText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.muted,
  },

  // ===================================================
  // AUTH BUTTON
  // ===================================================

  authenticateButton: {
    height: 57,
    borderRadius: 16,
    backgroundColor: COLORS.cardinal,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,

    shadowColor: COLORS.cardinal,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  authenticateButtonDisabled: {
    opacity: 0.65,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  authenticateText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  // ===================================================
  // SETUP BUTTON
  // ===================================================

  setupButton: {
    height: 57,
    borderRadius: 16,
    backgroundColor: COLORS.cardinal,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  setupButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  // ===================================================
  // SECURITY CARD
  // ===================================================

  securityCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  securityIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: COLORS.text,
  },

  securityText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.muted,
  },

  // ===================================================
  // PIN CARD
  // ===================================================

  pinCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#F9F1F2",
    borderWidth: 1,
    borderColor: "#ECD9DE",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pinIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  pinContent: {
    flex: 1,
    marginLeft: 10,
  },

  pinTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: COLORS.text,
  },

  pinText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.muted,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    alignItems: "center",
    paddingBottom: 18,
    paddingTop: 12,
  },

  goldLine: {
    width: 42,
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginBottom: 8,
  },

  footerTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: COLORS.cardinalDark,
  },

  footerText: {
    marginTop: 3,
    fontSize: 9.5,
    color: "#999999",
  },
});