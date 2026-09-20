import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { verifyResetOtp } from "../../services/api";

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

  input: "#FAFAFA",

  success: "#218739",
  successBg: "#EEF8F0",

  warningBg: "#FFF8E8",
  warningBorder: "#EBD9A8",
  warningText: "#6F5A22",

  error: "#C62828",
};

export default function VerifyResetOtpScreen() {
  const params = useLocalSearchParams<{
    userId?: string;
    email?: string;
    expiresIn?: string;
  }>();

  const userId = params.userId ?? "";
  const email = params.email ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRef = useRef<TextInput>(null);

  // =====================================================
  // MASK EMAIL
  // =====================================================

  const maskedEmail = useMemo(() => {
    if (!email) {
      return "your email address";
    }

    const parts = email.split("@");

    if (parts.length !== 2) {
      return email;
    }

    const [name, domain] = parts;

    if (!name) {
      return email;
    }

    if (name.length <= 2) {
      return `${name[0] ?? "*"}***@${domain}`;
    }

    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  // =====================================================
  // COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [countdown]);

  // =====================================================
  // AUTO FOCUS
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // =====================================================
  // OTP CHANGE
  // =====================================================

  const handleOtpChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);

    setOtp(clean);

    if (clean.length === 6) {
      setTimeout(() => {
        handleVerify(clean);
      }, 120);
    }
  };

  // =====================================================
  // VERIFY RESET OTP
  // =====================================================

  const handleVerify = async (submittedOtp?: string) => {
    const cleanOtp = (submittedOtp ?? otp).replace(/\D/g, "");

    if (!userId) {
      Alert.alert(
        "Verification Error",
        "Your password reset information is missing. Please go back and request a new password reset code."
      );
      return;
    }

    if (cleanOtp.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const result = await verifyResetOtp(userId, cleanOtp);

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "The verification code is invalid or has expired."
        );
      }

      /*
       * OTP is verified.
       *
       * We pass the userId and OTP to reset-password.tsx
       * because the backend resetPassword() function
       * requires both values.
       */
      router.replace({
        pathname: "/(auth)/reset-password",
        params: {
          userId,
          otp: cleanOtp,
          email,
        },
      });
    } catch (error) {
      console.error("Reset OTP verification error:", error);

      setOtp("");

      Alert.alert(
        "Verification Failed",
        error instanceof Error
          ? error.message
          : "The verification code is invalid or has expired."
      );

      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // OTP DISPLAY
  // =====================================================

  const otpDigits = Array.from(
    { length: 6 },
    (_, index) => otp[index] ?? ""
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================
              HEADER
          ============================================ */}

          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={21}
                  color={COLORS.cardinal}
                />
              </View>

              <Text style={styles.brandText}>
                TUPC-ORDERUP
              </Text>
            </View>
          </View>

          {/* ============================================
              PROGRESS
          ============================================ */}

          <View style={styles.progressSection}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>
                PASSWORD RESET
              </Text>

              <Text style={styles.progressStep}>
                02 / 03
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* ============================================
              TITLE
          ============================================ */}

          <View style={styles.titleSection}>
            <View style={styles.titleIcon}>
              <Ionicons
                name="key-outline"
                size={27}
                color={COLORS.cardinal}
              />
            </View>

            <Text style={styles.eyebrow}>
              PASSWORD RESET
            </Text>

            <Text style={styles.title}>
              Verify your code
            </Text>

            <Text style={styles.description}>
              We sent a 6-digit password reset code to
              the email address associated with your
              TUPC-OrderUp account.
            </Text>

            <View style={styles.emailPill}>
              <Ionicons
                name="mail"
                size={15}
                color={COLORS.cardinal}
              />

              <Text
                style={styles.emailText}
                numberOfLines={1}
              >
                {maskedEmail}
              </Text>
            </View>
          </View>

          {/* ============================================
              OTP CARD
          ============================================ */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>
                  Enter reset code
                </Text>

                <Text style={styles.cardDescription}>
                  Enter the code from your email.
                </Text>
              </View>

              <View style={styles.timerBadge}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.cardinal}
                />

                <Text style={styles.timerText}>
                  {countdown > 0
                    ? `${countdown}s`
                    : "Expired"}
                </Text>
              </View>
            </View>

            {/* ==========================================
                OTP BOXES
            ========================================== */}

            <Pressable
              style={styles.otpBoxes}
              onPress={() => inputRef.current?.focus()}
              disabled={loading}
            >
              {otpDigits.map((digit, index) => {
                const active =
                  index === otp.length && !loading;

                const filled = digit.length > 0;

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      active && styles.otpBoxActive,
                      filled && styles.otpBoxFilled,
                    ]}
                  >
                    <Text style={styles.otpDigit}>
                      {digit}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            {/* Hidden input */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              style={styles.hiddenInput}
              editable={!loading}
              caretHidden
            />

            <Text style={styles.codeHint}>
              Enter all 6 digits
            </Text>

            {/* ==========================================
                VERIFY BUTTON
            ========================================== */}

            <Pressable
              style={[
                styles.verifyButton,
                (loading || otp.length !== 6) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={
                loading || otp.length !== 6
              }
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={styles.verifyButtonText}
                  >
                    Verify Code
                  </Text>
                </>
              )}
            </Pressable>

            {/* ==========================================
                RESEND INFORMATION
            ========================================== */}

            <View style={styles.resendArea}>
              <Text style={styles.resendQuestion}>
                Didn't receive the code?
              </Text>

              {countdown > 0 ? (
                <Text style={styles.resendDisabled}>
                  You can request a new code after{" "}
                  <Text style={styles.resendCountdown}>
                    {countdown}s
                  </Text>
                </Text>
              ) : (
                <Text style={styles.resendDisabled}>
                  Please go back and request a new
                  password reset code.
                </Text>
              )}
            </View>
          </View>

          {/* ============================================
              SECURITY NOTE
          ============================================ */}

          <View style={styles.securityNote}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="lock-closed"
                size={15}
                color={COLORS.success}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Keep your code private
              </Text>

              <Text style={styles.securityText}>
                TUPC-OrderUp will never ask you to
                share your password reset code with
                another person.
              </Text>
            </View>
          </View>

          {/* ============================================
              FOOTER
          ============================================ */}

          <View style={styles.footer}>
            <View style={styles.goldLine} />

            <Text style={styles.footerBrand}>
              TUPC-OrderUp
            </Text>

            <Text style={styles.footerText}>
              Secure campus password recovery
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  flex: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 32,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  brandIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.text,
  },

  // ===================================================
  // PROGRESS
  // ===================================================

  progressSection: {
    marginTop: 18,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  progressLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.muted,
  },

  progressStep: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  progressTrack: {
    height: 4,
    borderRadius: 20,
    backgroundColor: "#E8E8E8",
    overflow: "hidden",
  },

  progressFill: {
    width: "66%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: COLORS.cardinal,
  },

  // ===================================================
  // TITLE
  // ===================================================

  titleSection: {
    marginTop: 28,
    marginBottom: 22,
  },

  titleIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: COLORS.cardinal,
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    maxWidth: 390,
  },

  emailPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "#FCECEF",
    maxWidth: "100%",
  },

  emailText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.cardinalDark,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 21,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },

  cardDescription: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.muted,
  },

  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#FCECEF",
  },

  timerText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  // ===================================================
  // OTP BOXES
  // ===================================================

  otpBoxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 7,
  },

  otpBox: {
    flex: 1,
    height: 55,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#D9D9DA",
    backgroundColor: COLORS.input,
    alignItems: "center",
    justifyContent: "center",
  },

  otpBoxActive: {
    borderColor: COLORS.cardinal,
    backgroundColor: "#FFF9FA",
    borderWidth: 2,
  },

  otpBoxFilled: {
    borderColor: COLORS.cardinal,
    backgroundColor: "#FCECEF",
  },

  otpDigit: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.cardinalDark,
  },

  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },

  codeHint: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 10,
    fontWeight: "700",
    color: "#A0A0A0",
  },

  // ===================================================
  // VERIFY BUTTON
  // ===================================================

  verifyButton: {
    height: 54,
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    shadowColor: COLORS.cardinal,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  verifyButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  verifyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  // ===================================================
  // RESEND
  // ===================================================

  resendArea: {
    marginTop: 20,
    alignItems: "center",
  },

  resendQuestion: {
    fontSize: 12,
    color: COLORS.muted,
  },

  resendDisabled: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#AAAAAA",
    textAlign: "center",
  },

  resendCountdown: {
    color: COLORS.cardinal,
    fontWeight: "900",
  },

  // ===================================================
  // SECURITY
  // ===================================================

  securityNote: {
    marginTop: 17,
    padding: 14,
    borderRadius: 15,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: "#D8EBDD",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  securityIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  securityText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    marginTop: 34,
    alignItems: "center",
  },

  goldLine: {
    width: 42,
    height: 3,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    marginBottom: 11,
  },

  footerBrand: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  footerText: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.muted,
  },
});