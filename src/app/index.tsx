import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
// TUPC CARDINAL DESIGN SYSTEM
// =====================================================

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",

  gold: "#D8B56A",
  goldLight: "#E9D39B",

  white: "#FFFFFF",
  whiteSoft: "rgba(255,255,255,0.88)",
  whiteMuted: "rgba(255,255,255,0.68)",

  text: "#171717",
  textMuted: "#6F686A",

  glass: "rgba(255,255,255,0.88)",
  glassBorder: "rgba(255,255,255,0.72)",

  inputBackground: "rgba(248,246,246,0.88)",
  inputBorder: "#E7DFE1",

  error: "#B3261E",

  overlay: "rgba(35, 5, 11, 0.58)",
};

// =====================================================
// ASSETS
// =====================================================

const LOGIN_BACKGROUND = require("../../assets/m-bg.jpg");
const TUPC_LOGO = require("../../assets/LOGO.png");

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

  const [focusedField, setFocusedField] = useState<
    "username" | "password" | null
  >(null);

  const [
    loadingRememberedCredentials,
    setLoadingRememberedCredentials,
  ] = useState(true);

  // ===================================================
  // INPUT REFS
  // ===================================================

  const usernameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // ===================================================
  // LOAD REMEMBERED CREDENTIALS
  // ===================================================

  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  async function loadRememberedCredentials() {
    try {
      const savedCredentials = await getRememberedCredentials();

      if (
        savedCredentials &&
        savedCredentials.username &&
        savedCredentials.password
      ) {
        setUsername(savedCredentials.username);
        setPassword(savedCredentials.password);
        setRememberMe(true);
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

  // ===================================================
  // GO TO DASHBOARD
  // ===================================================

  const goToDashboard = (role: string | undefined) => {
    const normalizedRole = String(role ?? "")
      .toLowerCase()
      .trim();

    if (normalizedRole === "client") {
      router.replace({
        pathname: "/(client)/dashboard",
      });

      return;
    }

    if (normalizedRole === "seller") {
      router.replace({
        pathname: "/(seller)/dashboard",
      });

      return;
    }

    if (normalizedRole === "admin") {
      router.replace({
        pathname: "/(admin)",
      });

      return;
    }

    console.error("Unknown user role:", role);

    Alert.alert(
      "Login Error",
      "Your account role is invalid or has not been configured."
    );
  };

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      Alert.alert(
        "Username Required",
        "Please enter the username address associated with your TUPC-OrderUp account."
      );

      usernameInputRef.current?.focus();
      return;
    }

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password to continue."
      );

      passwordInputRef.current?.focus();
      return;
    }

    try {
      setIsLoading(true);

      const data = await login(
        trimmedUsername,
        password,
        rememberMe
      );

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to sign in."
        );
      }

      if (!data?.token) {
        throw new Error(
          "Sign-in was completed, but no authentication token was received."
        );
      }

      if (rememberMe) {
        await saveRememberedCredentials(
          trimmedUsername,
          password
        );
      } else {
        await clearRememberedCredentials();
      }

      goToDashboard(data.role);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      let message =
        "We couldn't connect to the server. Please check your connection and try again.";

      if (error instanceof Error) {
        message =
          error.message ||
          message;
      }

      Alert.alert(
        "Unable to Sign In",
        message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // FORGOT PASSWORD
  // ===================================================

  const handleForgotPassword = () => {
    if (isLoading) return;

    router.push(
      "/(auth)/forgot-password"
    );
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const handleRegister = () => {
    if (isLoading) return;

    router.push(
      "/(auth)/register"
    );
  };

  // ===================================================
  // REMEMBER ME
  // ===================================================

  const handleRememberMe = async () => {
    if (isLoading) return;

    const nextValue = !rememberMe;

    setRememberMe(nextValue);

    if (!nextValue) {
      try {
        await clearRememberedCredentials();
      } catch (error) {
        console.error(
          "Failed to clear remembered credentials:",
          error
        );
      }
    }
  };

  // ===================================================
  // PASSWORD VISIBILITY
  // ===================================================

  const handleTogglePassword = () => {
    if (isLoading) return;

    setShowPassword(
      (current) => !current
    );
  };

  // ===================================================
  // TERMS & CONDITIONS
  // ===================================================

  const handleTerms = () => {
    if (isLoading) return;

    router.push("/(auth)/terms");
  };

  // ===================================================
  // PRIVACY POLICY
  // ===================================================

  const handlePrivacy = () => {
    if (isLoading) return;

    router.push("/(auth)/privacy");
  };

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  if (loadingRememberedCredentials) {
    return (
      <ImageBackground
        source={LOGIN_BACKGROUND}
        style={styles.loadingBackground}
        resizeMode="cover"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>

            <ActivityIndicator
              size="small"
              color={COLORS.white}
              style={styles.loadingIndicator}
            />

            <Text style={styles.loadingTitle}>
              TUPC-OrderUp
            </Text>

            <Text style={styles.loadingSubtitle}>
              Campus Ordering System
            </Text>

          </View>
        </View>
      </ImageBackground>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <ImageBackground
      source={LOGIN_BACKGROUND}
      style={styles.background}
      resizeMode="cover"
    >

      {/* =================================================
          BACKGROUND DARKENING
      ================================================= */}

      <View
        pointerEvents="none"
        style={styles.backgroundOverlay}
      />

      {/* =================================================
          BOTTOM-LEFT TUPC LOGO OVERLAY
      ================================================= */}

      <View
        pointerEvents="none"
        style={styles.logoOverlay}
      >
        <Image
          source={TUPC_LOGO}
          style={styles.overlayLogo}
          resizeMode="contain"
        />

        <View style={styles.logoOverlayShade} />
      </View>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

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

          <View style={styles.mainContainer}>

            {/* =================================================
                TOP / BRAND
            ================================================= */}

            <View style={styles.brandSection}>

              <Text style={styles.brandTitle}>
                TUPC-OrderUp
              </Text>

              <Text style={styles.brandSubtitle}>
                TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES
              </Text>

              <Text style={styles.brandCampus}>
                Cavite Campus
              </Text>

            </View>

            {/* =================================================
                GLASS LOGIN CARD
            ================================================= */}

            <View style={styles.glassCard}>

              <View style={styles.glassHighlight} />

              <View style={styles.cardContent}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <View style={styles.cardHeader}>

                  <Text style={styles.welcome}>
                    Welcome back
                  </Text>

                  <Text style={styles.loginSubtitle}>
                    Sign in to your TUPC-OrderUp account
                    {" "}to continue.
                  </Text>

                </View>

                {/* =================================================
                    USERNAME / EMAIL
                ================================================= */}

                <View style={styles.inputGroup}>

                  <Text style={styles.label}>
                    Username 
                  </Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "username" &&
                        styles.inputWrapperFocused,
                    ]}
                  >

                    <View
                      style={[
                        styles.inputIconContainer,
                        focusedField ===
                          "username" &&
                          styles.inputIconContainerFocused,
                      ]}
                    >

                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={
                          focusedField ===
                            "username" ||
                          username.length > 0
                            ? COLORS.cardinal
                            : COLORS.textMuted
                        }
                      />

                    </View>

                    <TextInput
                      ref={usernameInputRef}
                      value={username}
                      onChangeText={setUsername}

                      onFocus={() => {
                        setFocusedField("username");
                      }}

                      onBlur={() => {
                        setFocusedField(null);
                      }}

                      placeholder="Enter your username"
                      placeholderTextColor="#A69B9E"

                      autoCapitalize="none"
                      autoCorrect={false}
                      // NOTE: autoComplete removed on purpose — on Android,
                      // combining autoComplete="username" here with
                      // autoComplete="password" below can trigger the
                      // Autofill/Google Password Manager UI, which causes
                      // the keyboard to flicker and focus to jump between
                      // the two fields. importantForAutofill="no" disables
                      // that behavior for this field.
                      importantForAutofill="no"
                      keyboardType="email-address"

                      editable={!isLoading}

                      returnKeyType="next"

                      onSubmitEditing={() => {
                        if (!isLoading) {
                          passwordInputRef.current?.focus();
                        }
                      }}

                      blurOnSubmit={false}

                      style={styles.input}
                    />

                    {username.length > 0 && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.cardinal}
                      />
                    )}

                  </View>

                </View>

                {/* =================================================
                    PASSWORD
                ================================================= */}

                <View style={styles.inputGroup}>

                  <View style={styles.labelRow}>

                    <Text style={styles.label}>
                      Password
                    </Text>

                    <Pressable
                      onPress={
                        handleForgotPassword
                      }
                      disabled={isLoading}
                      hitSlop={10}
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

                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "password" &&
                        styles.inputWrapperFocused,
                    ]}
                  >

                    <View
                      style={[
                        styles.inputIconContainer,
                        focusedField ===
                          "password" &&
                          styles.inputIconContainerFocused,
                      ]}
                    >

                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={
                          focusedField ===
                            "password" ||
                          password.length > 0
                            ? COLORS.cardinal
                            : COLORS.textMuted
                        }
                      />

                    </View>

                    <TextInput
                      ref={passwordInputRef}
                      value={password}
                      onChangeText={setPassword}

                      onFocus={() => {
                        setFocusedField("password");
                      }}

                      onBlur={() => {
                        setFocusedField(null);
                      }}

                      placeholder="Enter your password"
                      placeholderTextColor="#A69B9E"

                      secureTextEntry={
                        !showPassword
                      }

                      autoCapitalize="none"
                      autoCorrect={false}
                      // Same reasoning as the username field above.
                      importantForAutofill="no"

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
                      style={styles.eyeButton}
                    >

                      <Ionicons
                        name={
                          showPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={
                          focusedField ===
                          "password"
                            ? COLORS.cardinal
                            : COLORS.textMuted
                        }
                      />

                    </Pressable>

                  </View>

                </View>

                {/* =================================================
                    REMEMBER ME
                ================================================= */}

                <Pressable
                  style={styles.rememberRow}
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
                        size={13}
                        color={COLORS.white}
                      />
                    )}

                  </View>

                  <Text
                    style={styles.rememberText}
                  >
                    Remember me on this device
                  </Text>

                </Pressable>

                {/* =================================================
                    SIGN IN BUTTON
                ================================================= */}

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,

                    pressed &&
                      !isLoading &&
                      styles.loginButtonPressed,

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
                        Sign in
                      </Text>

                      <View
                        style={
                          styles.buttonIcon
                        }
                      >

                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.white}
                        />

                      </View>
                    </>
                  )}

                </Pressable>

                {/* =================================================
                    REGISTER
                ================================================= */}

                <View style={styles.signupRow}>

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
                      Create an account
                    </Text>

                  </Pressable>

                </View>

              </View>

            </View>

            {/* =================================================
                BOTTOM FOOTER
            ================================================= */}

            <View style={styles.footer}>

              <View style={styles.legalRow}>

                <Pressable
                  onPress={handleTerms}
                  disabled={isLoading}
                  hitSlop={8}
                >
                  <Text style={styles.legalLink}>
                    Terms & Conditions
                  </Text>
                </Pressable>

                <View style={styles.legalDivider} />

                <Pressable
                  onPress={handlePrivacy}
                  disabled={isLoading}
                  hitSlop={8}
                >
                  <Text style={styles.legalLink}>
                    Privacy Policy
                  </Text>
                </Pressable>

              </View>

              <Text style={styles.footerCopyright}>
                © 2026 Technological University of the Philippines
                {" "}– Cavite Campus
              </Text>

            </View>

          </View>

        </KeyboardAvoidingView>

      </SafeAreaView>

    </ImageBackground>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  // ===================================================
  // BACKGROUND
  // ===================================================

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
  },

  // ===================================================
  // BOTTOM-LEFT LOGO OVERLAY
  // ===================================================

  logoOverlay: {
    position: "absolute",

    left: -30,
    bottom: -35,

    width: 250,
    height: 255,

    opacity: 0.24,

    alignItems: "center",
    justifyContent: "center",
  },

  overlayLogo: {
    width: "100%",
    height: "100%",
  },

  logoOverlayShade: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    height: 70,

    backgroundColor:
      "rgba(87,11,23,0.12)",

    borderRadius: 80,
  },

  // ===================================================
  // SAFE AREA
  // ===================================================

  safeArea: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
  },

  // ===================================================
  // MAIN CONTAINER
  // ===================================================

  mainContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 20,

    paddingTop: 18,
    paddingBottom: 12,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingBackground: {
    flex: 1,
  },

  loadingOverlay: {
    flex: 1,

    backgroundColor:
      COLORS.overlay,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIndicator: {
    marginBottom: 14,
  },

  loadingTitle: {
    color: COLORS.white,

    fontSize: 17,
    fontWeight: "800",

    letterSpacing: 0.2,
  },

  loadingSubtitle: {
    color: COLORS.whiteMuted,

    fontSize: 11,

    marginTop: 5,

    letterSpacing: 0.5,
  },

  // ===================================================
  // BRAND
  // ===================================================

  brandSection: {
    alignItems: "center",

    paddingHorizontal: 10,

    marginBottom: 8,
  },

  brandTitle: {
    color: COLORS.white,

    fontSize: 37,

    fontWeight: "800",

    letterSpacing: -0.5,

    textAlign: "center",

    textShadowColor:
      "rgba(0,0,0,0.25)",

    textShadowOffset: {
      width: 0,
      height: 2,
    },

    textShadowRadius: 5,
  },

  brandSubtitle: {
    color: COLORS.whiteSoft,

    fontSize: 9.5,

    fontWeight: "700",

    letterSpacing: 1.15,

    marginTop: 6,

    textAlign: "center",
  },

  brandCampus: {
    color: COLORS.goldLight,

    fontSize: 11.5,

    fontWeight: "600",

    letterSpacing: 0.5,

    marginTop: 3,
  },

  // ===================================================
  // GLASS CARD
  // ===================================================

  glassCard: {
    width: "100%",

    maxWidth: 430,

    backgroundColor:
      COLORS.glass,

    borderRadius: 28,

    borderWidth: 1,

    borderColor:
      COLORS.glassBorder,

    overflow: "hidden",

    shadowColor: "#21040A",

    shadowOffset: {
      width: 0,
      height: 18,
    },

    shadowOpacity: 0.32,

    shadowRadius: 30,

    elevation: 14,
  },

  glassHighlight: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 90,

    backgroundColor:
      "rgba(255,255,255,0.24)",
  },

  cardContent: {
    paddingHorizontal: 24,

    paddingTop: 24,

    paddingBottom: 21,
  },

  // ===================================================
  // CARD HEADER
  // ===================================================

  cardHeader: {
    marginBottom: 21,
  },

  welcome: {
    color: COLORS.text,

    fontSize: 24,

    fontWeight: "800",

    letterSpacing: -0.55,
  },

  loginSubtitle: {
    color: COLORS.textMuted,

    fontSize: 13,

    lineHeight: 18,

    marginTop: 5,

    maxWidth: 330,
  },

  // ===================================================
  // INPUTS
  // ===================================================

  inputGroup: {
    marginBottom: 14,
  },

  labelRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 7,
  },

  label: {
    color: COLORS.text,

    fontSize: 12.5,

    fontWeight: "700",

    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 52,

    borderWidth: 1,

    borderColor:
      COLORS.inputBorder,

    borderRadius: 15,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 12,

    backgroundColor:
      COLORS.inputBackground,

    // Shadow/elevation now static (always on) instead of toggling
    // on focus. Toggling elevation on Android mid-touch can shift
    // layout and cause the touch-up event to land on a different
    // element than the touch-down, which looked like focus
    // "jumping" between fields.
    shadowColor:
      COLORS.cardinal,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.10,

    shadowRadius: 8,

    elevation: 2,
  },

  inputWrapperFocused: {
    borderColor:
      COLORS.cardinal,

    backgroundColor:
      "#FFFFFF",
  },

  inputIconContainer: {
    width: 34,

    height: 34,

    borderRadius: 10,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor:
      "rgba(166,25,46,0.055)",

    marginRight: 9,
  },

  inputIconContainerFocused: {
    backgroundColor:
      "rgba(166,25,46,0.10)",
  },

  input: {
    flex: 1,

    minHeight: 48,

    color: COLORS.text,

    fontSize: 14,

    paddingVertical: 0,

    paddingHorizontal: 0,
  },

  eyeButton: {
    width: 38,

    height: 38,

    alignItems: "center",

    justifyContent: "center",

    marginLeft: 4,
  },

  // ===================================================
  // FORGOT PASSWORD
  // ===================================================

  forgotText: {
    color: COLORS.cardinal,

    fontSize: 12,

    fontWeight: "700",
  },

  // ===================================================
  // REMEMBER ME
  // ===================================================

  rememberRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 0,

    marginBottom: 18,
  },

  checkbox: {
    width: 19,

    height: 19,

    borderRadius: 6,

    borderWidth: 1.4,

    borderColor: "#CDBEC1",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor:
      "#FFFFFF",
  },

  checkboxActive: {
    backgroundColor:
      COLORS.cardinal,

    borderColor:
      COLORS.cardinal,
  },

  rememberText: {
    marginLeft: 9,

    color: COLORS.textMuted,

    fontSize: 12.5,

    fontWeight: "500",
  },

  // ===================================================
  // LOGIN BUTTON
  // ===================================================

  loginButton: {
    height: 54,

    borderRadius: 15,

    backgroundColor:
      COLORS.cardinal,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,

    shadowColor:
      COLORS.cardinal,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.28,

    shadowRadius: 15,

    elevation: 6,
  },

  loginButtonPressed: {
    backgroundColor:
      COLORS.cardinalDark,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  loginButtonDisabled: {
    opacity: 0.72,
  },

  loginButtonText: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: "800",

    letterSpacing: 0.15,
  },

  buttonIcon: {
    width: 25,

    height: 25,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.14)",
  },

  // ===================================================
  // REGISTER
  // ===================================================

  signupRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 18,

    flexWrap: "wrap",
  },

  signupText: {
    color: COLORS.textMuted,

    fontSize: 12.5,
  },

  signupLink: {
    color: COLORS.cardinal,

    fontSize: 12.5,

    fontWeight: "800",

    marginLeft: 5,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    width: "100%",

    alignItems: "center",

    justifyContent: "flex-end",

    marginTop: 8,

    paddingHorizontal: 10,

    paddingBottom: 2,
  },

  // ===================================================
  // SECURITY BADGE
  // ===================================================

  securityBadge: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor:
      "rgba(40,5,12,0.38)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.16)",
  },

  securityIcon: {
    marginRight: 6,
  },

  securityText: {
    color: COLORS.whiteSoft,

    fontSize: 10,

    fontWeight: "600",

    letterSpacing: 0.15,
  },

  // ===================================================
  // TERMS / PRIVACY
  // ===================================================

  legalRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 9,
  },

  legalLink: {
    color: COLORS.whiteSoft,

    fontSize: 10.5,

    fontWeight: "700",

    textDecorationLine: "underline",

    textDecorationColor:
      "rgba(255,255,255,0.55)",
  },

  legalDivider: {
    width: 1,

    height: 12,

    backgroundColor:
      "rgba(255,255,255,0.30)",

    marginHorizontal: 10,
  },

  // ===================================================
  // FOOTER SYSTEM NAME
  // ===================================================

  footerText: {
    color:
      "rgba(255,255,255,0.70)",

    fontSize: 10,

    fontWeight: "600",

    marginTop: 8,

    textAlign: "center",
  },

  // ===================================================
  // COPYRIGHT
  // ===================================================

  footerCopyright: {
    color:
      "rgba(255,255,255,0.48)",

    fontSize: 9,

    marginTop: 3,

    textAlign: "center",

    lineHeight: 13,
  },
});