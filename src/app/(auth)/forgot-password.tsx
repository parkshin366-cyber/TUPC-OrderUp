import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { forgotPassword } from "../../services/api";

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  background: "#F7F7F8",
  white: "#FFFFFF",
  text: "#171717",
  muted: "#737373",
  border: "#E5E5E5",
  error: "#C62828",
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();

  const isValidEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const handleContinue = async () => {
    if (isSubmitting) {
      return;
    }

    if (!trimmedEmail) {
      Alert.alert(
        "Email Required",
        "Please enter the email address associated with your TUPC-OrderUp account."
      );
      return;
    }

    if (!isValidEmail) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await forgotPassword(trimmedEmail);

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to start password reset."
        );
      }

      Alert.alert(
        "OTP Sent",
        data.message ||
          "A password reset OTP has been sent to your email.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.push({
                pathname: "/(auth)/verify-reset-otp",
                params: {
                  userId: data.userId ?? "",
                  email: data.email ?? trimmedEmail,
                  expiresIn: String(data.expiresIn ?? ""),
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Forgot password error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.";

      Alert.alert("Password Reset Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="lock-open-outline"
              size={32}
              color={COLORS.white}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Forgot Password?
          </Text>

          <Text style={styles.subtitle}>
            Enter the email address associated with your
            TUPC-OrderUp account and we'll help you reset
            your password.
          </Text>

          {/* Email Label */}
          <Text style={styles.label}>
            Email Address
          </Text>

          {/* Email Input */}
          <View
            style={[
              styles.inputWrapper,
              trimmedEmail.length > 0 &&
                !isValidEmail &&
                styles.inputError,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={
                trimmedEmail.length > 0 && !isValidEmail
                  ? COLORS.error
                  : COLORS.muted
              }
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#A3A3A3"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              style={styles.input}
            />
          </View>

          {/* Validation Message */}
          {trimmedEmail.length > 0 && !isValidEmail && (
            <Text style={styles.errorText}>
              Please enter a valid email address.
            </Text>
          )}

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting
                ? "Please wait..."
                : "Continue"}
            </Text>

            {!isSubmitting && (
              <Ionicons
                name="arrow-forward"
                size={19}
                color={COLORS.white}
              />
            )}

            {isSubmitting && (
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={COLORS.white}
              />
            )}
          </Pressable>

          {/* Back to Sign In */}
          <Pressable
            style={styles.loginLink}
            onPress={() => router.replace("/")}
            disabled={isSubmitting}
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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            TUPC-OrderUp
          </Text>

          <Text style={styles.footerText}>
            Secure campus ordering platform
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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

  content: {
    marginTop: 70,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    marginBottom: 30,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  inputWrapper: {
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    marginLeft: 11,
    fontSize: 15,
    color: COLORS.text,
  },

  errorText: {
    marginTop: 7,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "600",
  },

  button: {
    height: 55,
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  pressed: {
    opacity: 0.82,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

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

  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 30,
  },

  footerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.cardinalDark,
  },

  footerText: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.muted,
  },
});