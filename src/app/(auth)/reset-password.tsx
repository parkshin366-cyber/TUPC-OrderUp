import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { resetPassword } from "../../services/api";

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",

  background: "#F7F7F8",
  white: "#FFFFFF",

  text: "#171717",
  muted: "#737373",
  border: "#E5E5E5",

  input: "#FAFAFA",

  success: "#218739",
  successBg: "#EEF8F0",

  error: "#C62828",
  errorBg: "#FFF1F1",
};

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    userId?: string;
    otp?: string;
    email?: string;
  }>();

  const userId = params.userId ?? "";
  const otp = params.otp ?? "";
  const email = params.email ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  const hasMinLength = newPassword.length >= 8;

  const hasUppercase = /[A-Z]/.test(newPassword);

  const hasLowercase = /[a-z]/.test(newPassword);

  const hasNumber = /\d/.test(newPassword);

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const isPasswordValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber;

  const canSubmit =
    !loading &&
    !!userId &&
    !!otp &&
    isPasswordValid &&
    passwordsMatch;

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleResetPassword = async () => {
    if (loading) {
      return;
    }

    if (!userId || !otp) {
      Alert.alert(
        "Reset Information Missing",
        "Your password reset session is incomplete. Please request a new password reset code."
      );
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        "Weak Password",
        "Your new password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both password fields contain the same password."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await resetPassword(
        userId,
        otp,
        newPassword,
        confirmPassword
      );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to reset your password."
        );
      }

      Alert.alert(
        "Password Reset Successful",
        "Your password has been changed successfully. You can now sign in using your new password.",
        [
          {
            text: "Go to Sign In",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      Alert.alert(
        "Password Reset Failed",
        error instanceof Error
          ? error.message
          : "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
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
                03 / 03
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
                name="lock-open-outline"
                size={28}
                color={COLORS.cardinal}
              />
            </View>

            <Text style={styles.eyebrow}>
              NEW PASSWORD
            </Text>

            <Text style={styles.title}>
              Create a new password
            </Text>

            <Text style={styles.description}>
              Choose a strong password for your
              TUPC-OrderUp account.
            </Text>

            {email ? (
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
                  {email}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ============================================
              PASSWORD CARD
          ============================================ */}

          <View style={styles.card}>
            {/* New Password */}

            <Text style={styles.label}>
              New Password
            </Text>

            <View
              style={[
                styles.inputWrapper,
                newPassword.length > 0 &&
                  !isPasswordValid &&
                  styles.inputError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.muted}
              />

              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />

              <Pressable
                onPress={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                hitSlop={10}
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {/* Password Requirements */}

            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>
                Password requirements
              </Text>

              <Requirement
                valid={hasMinLength}
                text="At least 8 characters"
              />

              <Requirement
                valid={hasUppercase}
                text="At least one uppercase letter"
              />

              <Requirement
                valid={hasLowercase}
                text="At least one lowercase letter"
              />

              <Requirement
                valid={hasNumber}
                text="At least one number"
              />
            </View>

            {/* Confirm Password */}

            <Text
              style={[
                styles.label,
                styles.confirmLabel,
              ]}
            >
              Confirm New Password
            </Text>

            <View
              style={[
                styles.inputWrapper,
                confirmPassword.length > 0 &&
                  !passwordsMatch &&
                  styles.inputError,
                passwordsMatch &&
                  styles.inputSuccess,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.muted}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry={
                  !showConfirmPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                hitSlop={10}
              >
                <Ionicons
                  name={
                    showConfirmPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {confirmPassword.length > 0 && (
              <View style={styles.matchMessage}>
                <Ionicons
                  name={
                    passwordsMatch
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={16}
                  color={
                    passwordsMatch
                      ? COLORS.success
                      : COLORS.error
                  }
                />

                <Text
                  style={[
                    styles.matchText,
                    {
                      color: passwordsMatch
                        ? COLORS.success
                        : COLORS.error,
                    },
                  ]}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              </View>
            )}

            {/* ==========================================
                RESET BUTTON
            ========================================== */}

            <Pressable
              style={[
                styles.resetButton,
                !canSubmit &&
                  styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.white}
                  />

                  <Text
                    style={styles.resetButtonText}
                  >
                    Reset Password
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* ============================================
              SECURITY NOTE
          ============================================ */}

          <View style={styles.securityNote}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={COLORS.success}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Your password is secure
              </Text>

              <Text style={styles.securityText}>
                After changing your password, use
                your new password the next time you
                sign in to TUPC-OrderUp.
              </Text>
            </View>
          </View>

          {/* ============================================
              BACK TO LOGIN
          ============================================ */}

          <Pressable
            style={styles.loginLink}
            onPress={() => router.replace("/")}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={COLORS.cardinal}
            />

            <Text style={styles.loginText}>
              Back to Sign In
            </Text>
          </Pressable>

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
// REQUIREMENT COMPONENT
// =====================================================

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <View style={styles.requirementRow}>
      <Ionicons
        name={
          valid
            ? "checkmark-circle"
            : "ellipse-outline"
        }
        size={16}
        color={
          valid
            ? COLORS.success
            : "#A3A3A3"
        }
      />

      <Text
        style={[
          styles.requirementText,
          valid && styles.requirementTextValid,
        ]}
      >
        {text}
      </Text>
    </View>
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
    width: "100%",
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
    fontSize: 31,
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

  // ===================================================
  // INPUTS
  // ===================================================

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  confirmLabel: {
    marginTop: 22,
  },

  inputWrapper: {
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },

  inputSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successBg,
  },

  input: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
    fontSize: 15,
    color: COLORS.text,
  },

  // ===================================================
  // REQUIREMENTS
  // ===================================================

  requirements: {
    marginTop: 15,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  requirementsTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 7,
  },

  requirementText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  requirementTextValid: {
    color: COLORS.success,
    fontWeight: "700",
  },

  // ===================================================
  // PASSWORD MATCH
  // ===================================================

  matchMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  matchText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ===================================================
  // RESET BUTTON
  // ===================================================

  resetButton: {
    height: 55,
    marginTop: 24,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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

  resetButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  resetButtonText: {
    color: COLORS.white,
    fontSize: 15,
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
  // LOGIN
  // ===================================================

  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    gap: 6,
  },

  loginText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.cardinal,
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
    backgroundColor: "#D8B56A",
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