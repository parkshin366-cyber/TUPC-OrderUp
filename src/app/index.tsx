import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";

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

import { useAuth } from "../context/AuthContext";

import {
  clearRememberedCredentials,
  getRememberedCredentials,
  saveRememberedCredentials,
} from "../services/authStorage";

// =====================================================
// TUPC CARDINAL COLORS
// =====================================================

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",
  cardinalLight: "#C52A42",

  gold: "#D8B56A",
  goldLight: "#E8D39D",

  white: "#FFFFFF",
  offWhite: "#FAFAFA",

  text: "#1A1A1A",
  muted: "#737373",
  border: "#E6E6E6",

  inputBackground: "#F8F8F8",
  error: "#C62828",
};

// =====================================================
// LOGIN SCREEN
// =====================================================

export default function LoginScreen() {
  const { login } = useAuth();

  // ===================================================
  // FORM STATE
  // ===================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [
    loadingRememberedCredentials,
    setLoadingRememberedCredentials,
  ] = useState(true);

  // =====================================================
  // LOAD REMEMBERED CREDENTIALS
  // =====================================================

  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  async function loadRememberedCredentials() {
    try {
      const savedCredentials =
        await getRememberedCredentials();

      if (
        savedCredentials &&
        savedCredentials.username &&
        savedCredentials.password
      ) {
        setUsername(savedCredentials.username);
        setPassword(savedCredentials.password);
        setRememberMe(true);

        console.log(
          "Remembered credentials loaded."
        );
      } else {
        setRememberMe(false);
      }
    } catch (error) {
      console.error(
        "Failed to load remembered credentials:",
        error
      );

      setRememberMe(false);
    } finally {
      setLoadingRememberedCredentials(false);
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {
    const trimmedUsername = username.trim();

    // ===================================================
    // VALIDATE USERNAME
    // ===================================================

    if (!trimmedUsername) {
      Alert.alert(
        "Username Required",
        "Please enter your username or email."
      );

      return;
    }

    // ===================================================
    // VALIDATE PASSWORD
    // ===================================================

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password."
      );

      return;
    }

    try {
      setIsLoading(true);

      // =================================================
      // LOGIN REQUEST
      // =================================================

      const data = await login(
        trimmedUsername,
        password,
        rememberMe
      );

      // =================================================
      // DEBUG LOG
      // =================================================

      console.log("LOGIN RESULT:", {
        success: data?.success,
        role: data?.role,
        hasToken: !!data?.token,
        rememberMe,
      });

      // =================================================
      // CHECK LOGIN RESULT
      // =================================================

      if (!data?.success) {
        throw new Error(
          data?.message || "Login failed."
        );
      }

      // =================================================
      // CHECK AUTH TOKEN
      // =================================================

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no authentication token was received."
        );
      }

      // =================================================
      // SAVE / CLEAR REMEMBERED CREDENTIALS
      // =================================================

      if (rememberMe) {
        await saveRememberedCredentials(
          trimmedUsername,
          password
        );

        console.log(
          "Remembered username and password saved."
        );
      } else {
        await clearRememberedCredentials();

        console.log(
          "Remembered credentials cleared."
        );
      }

      // =================================================
      // LOGIN SUCCESS
      // =================================================

      console.log("Login successful.");

      // =================================================
      // GO TO SECURITY
      // =================================================

      router.replace({
        pathname: "/(auth)/security",

        params: {
          role: data.role ?? "client",

          rememberMe: rememberMe
            ? "true"
            : "false",
        },
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      let message =
        "Unable to connect to the server.";

      if (error instanceof Error) {
        message =
          error.message || message;
      }

      Alert.alert(
        "Login Failed",
        message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = () => {
    if (isLoading) {
      return;
    }

    router.push(
      "/(auth)/forgot-password"
    );
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = () => {
    if (isLoading) {
      return;
    }

    router.push(
      "/(auth)/register"
    );
  };

  // =====================================================
  // REMEMBER ME
  // =====================================================

  const handleRememberMe = async () => {
    if (isLoading) {
      return;
    }

    const nextValue = !rememberMe;

    setRememberMe(nextValue);

    if (!nextValue) {
      try {
        await clearRememberedCredentials();

        console.log(
          "Remembered credentials cleared."
        );
      } catch (error) {
        console.error(
          "Failed to clear remembered credentials:",
          error
        );
      }
    }
  };

  // =====================================================
  // TOGGLE PASSWORD
  // =====================================================

  const handleTogglePassword = () => {
    if (isLoading) {
      return;
    }

    setShowPassword(
      (current) => !current
    );
  };

  // =====================================================
  // INITIAL LOADING
  // =====================================================

  if (loadingRememberedCredentials) {
    return (
      <SafeAreaView
        style={styles.loadingSafeArea}
      >
        <View
          style={styles.initialLoadingContainer}
        >
          <View style={styles.loadingLogo}>
            <Ionicons
              name="school-outline"
              size={30}
              color={COLORS.white}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={COLORS.white}
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingText}>
            TUPC-OrderUp
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "bottom",
        "left",
        "right",
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
        >

          {/* =================================================
              TOP BRAND AREA
          ================================================= */}

          <View style={styles.brandSection}>

            {/* TUPC Badge */}

            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons
                  name="school-outline"
                  size={36}
                  color={COLORS.cardinal}
                />
              </View>
            </View>

            <Text style={styles.universityName}>
              TECHNOLOGICAL UNIVERSITY
            </Text>

            <Text style={styles.universitySubName}>
              OF THE PHILIPPINES
            </Text>

            <View style={styles.goldDivider}>
              <View
                style={styles.goldDividerLine}
              />

              <View
                style={styles.goldDiamond}
              />

              <View
                style={styles.goldDividerLine}
              />
            </View>

            <Text style={styles.appName}>
              TUPC-OrderUp
            </Text>

            <Text style={styles.appSubtitle}>
              Campus Ordering System
            </Text>

          </View>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <View style={styles.card}>

            {/* Card Header */}

            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.welcome}>
                  Welcome Back
                </Text>

                <Text style={styles.loginSubtitle}>
                  Sign in to continue to your account
                </Text>
              </View>

              <View style={styles.headerIcon}>
                <Ionicons
                  name="log-in-outline"
                  size={24}
                  color={COLORS.cardinal}
                />
              </View>
            </View>

            {/* =================================================
                USERNAME / EMAIL
            ================================================= */}

            <View style={styles.inputGroup}>

              <Text style={styles.label}>
                Username or Email
              </Text>

              <View
                style={[
                  styles.inputWrapper,

                  username.length > 0 &&
                    rememberMe &&
                    styles.inputWrapperRemembered,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={
                      username.length > 0
                        ? COLORS.cardinal
                        : COLORS.muted
                    }
                  />
                </View>

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username or email"
                  placeholderTextColor="#A6A6A6"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  keyboardType="default"
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              {/* Remembered Credentials */}

              {username.length > 0 &&
                rememberMe && (
                  <View
                    style={
                      styles.rememberedHint
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={COLORS.cardinal}
                    />

                    <Text
                      style={
                        styles.rememberedHintText
                      }
                    >
                      Saved credentials
                    </Text>
                  </View>
                )}

            </View>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <View style={styles.inputGroup}>

              <Text style={styles.label}>
                Password
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <View style={styles.inputIcon}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={
                      password.length > 0
                        ? COLORS.cardinal
                        : COLORS.muted
                    }
                  />
                </View>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#A6A6A6"
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleLogin
                  }
                  style={styles.input}
                />

                <Pressable
                  onPress={
                    handleTogglePassword
                  }
                  hitSlop={10}
                  disabled={isLoading}
                  style={
                    styles.eyeButton
                  }
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

            </View>

            {/* =================================================
                OPTIONS
            ================================================= */}

            <View
              style={styles.optionsRow}
            >

              <Pressable
                style={
                  styles.rememberContainer
                }
                onPress={
                  handleRememberMe
                }
                disabled={isLoading}
                hitSlop={5}
              >
                <View
                  style={[
                    styles.checkbox,

                    rememberMe &&
                      styles.checkboxActive,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={COLORS.white}
                    />
                  )}
                </View>

                <Text
                  style={
                    styles.rememberText
                  }
                >
                  Remember me
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  handleForgotPassword
                }
                disabled={isLoading}
                hitSlop={8}
              >
                <Text
                  style={
                    styles.forgotText
                  }
                >
                  Forgot password?
                </Text>
              </Pressable>

            </View>

            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,

                pressed &&
                  !isLoading &&
                  styles.buttonPressed,

                isLoading &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />

                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Sign In
                  </Text>

                  <View
                    style={
                      styles.buttonIcon
                    }
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={COLORS.cardinal}
                    />
                  </View>
                </>
              )}
            </Pressable>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <View
              style={styles.dividerRow}
            >
              <View
                style={styles.divider}
              />

              <Text
                style={styles.dividerText}
              >
                OR
              </Text>

              <View
                style={styles.divider}
              />
            </View>

            {/* =================================================
                REGISTER
            ================================================= */}

            <View
              style={styles.signupRow}
            >
              <Text
                style={styles.signupText}
              >
                Don't have an account?
              </Text>

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                hitSlop={8}
              >
                <Text
                  style={styles.signupLink}
                >
                  {" "}Create one
                </Text>
              </Pressable>
            </View>

          </View>

          {/* =================================================
              SECURITY NOTICE
          ================================================= */}

          <View style={styles.securityNotice}>

            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={COLORS.white}
            />

            <Text
              style={styles.securityText}
            >
              Secure TUPC account authentication
            </Text>

          </View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>

            <View
              style={styles.footerLine}
            >
              <View
                style={styles.goldLine}
              />

              <Text
                style={styles.footerText}
              >
                TUP CAVITE
              </Text>

              <View
                style={styles.goldLine}
              />
            </View>

            <Text
              style={styles.version}
            >
              TUPC-OrderUp • Campus Edition
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

  // ===================================================
  // MAIN SCREEN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.cardinal,
  },

  loadingSafeArea: {
    flex: 1,
    backgroundColor: COLORS.cardinal,
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 28,
  },

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  initialLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingIndicator: {
    marginBottom: 12,
  },

  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ===================================================
  // BRAND
  // ===================================================

  brandSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  logoContainer: {
    marginBottom: 14,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 7,
  },

  universityName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "center",
  },

  universitySubName: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 3,
    textAlign: "center",
  },

  goldDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 13,
  },

  goldDividerLine: {
    width: 34,
    height: 1,
    backgroundColor: COLORS.gold,
  },

  goldDiamond: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.gold,
    transform: [
      {
        rotate: "45deg",
      },
    ],
    marginHorizontal: 9,
  },

  appName: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  appSubtitle: {
    color: "#F2DDE1",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.4,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 23,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 9,
  },

  // ===================================================
  // CARD HEADER
  // ===================================================

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  welcome: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.4,
  },

  loginSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FFF1F3",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // INPUT
  // ===================================================

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  inputWrapper: {
    minHeight: 55,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 13,

    backgroundColor:
      COLORS.inputBackground,
  },

  inputWrapperRemembered: {
    borderColor: "#D6AAB3",
    backgroundColor: "#FFF8F9",
  },

  inputIcon: {
    width: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    marginLeft: 7,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
    minHeight: 52,
  },

  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 6,
  },

  // ===================================================
  // REMEMBERED CREDENTIALS
  // ===================================================

  rememberedHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 2,
  },

  rememberedHintText: {
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.cardinal,
  },

  // ===================================================
  // REMEMBER ME
  // ===================================================

  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    marginBottom: 21,
    minHeight: 24,
  },

  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  checkboxActive: {
    backgroundColor: COLORS.cardinal,
    borderColor: COLORS.cardinal,
  },

  rememberText: {
    marginLeft: 8,
    fontSize: 12.5,
    color: COLORS.muted,
    fontWeight: "600",
  },

  forgotText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  // ===================================================
  // LOGIN BUTTON
  // ===================================================

  loginButton: {
    height: 56,
    borderRadius: 15,

    backgroundColor: COLORS.cardinal,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 18,

    shadowColor: COLORS.cardinal,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },

  loginButtonDisabled: {
    opacity: 0.72,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  buttonIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // ===================================================
  // DIVIDER
  // ===================================================

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: "800",
    color: "#A0A0A0",
    letterSpacing: 0.7,
  },

  // ===================================================
  // SIGNUP
  // ===================================================

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signupText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  signupLink: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.cardinal,
  },

  // ===================================================
  // SECURITY NOTICE
  // ===================================================

  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 17,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  securityText: {
    marginLeft: 6,
    color: "#F7DDE2",
    fontSize: 10.5,
    fontWeight: "600",
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    alignItems: "center",
    marginTop: 7,
  },

  footerLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  goldLine: {
    flex: 1,
    maxWidth: 38,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.75,
  },

  footerText: {
    marginHorizontal: 10,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.goldLight,
    textAlign: "center",
  },

  version: {
    marginTop: 7,
    fontSize: 9,
    color: "#E8C9CF",
    fontWeight: "500",
  },
});