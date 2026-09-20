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

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

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
        setUsername(
          savedCredentials.username
        );

        setPassword(
          savedCredentials.password
        );

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
    const trimmedUsername =
      username.trim();

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
      // LOGIN REQUEST FIRST
      // =================================================
      //
      // We only save credentials AFTER successful login.
      // This prevents invalid credentials from being stored.
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
          data?.message ||
            "Login failed."
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

      console.log(
        "Login successful."
      );

      console.log(
        "Remember Me:",
        rememberMe
      );

      // =================================================
      // GO TO SECURITY
      // =================================================

      router.replace({
        pathname:
          "/(auth)/security",

        params: {
          role:
            data.role ??
            "client",

          rememberMe:
            rememberMe
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
          error.message ||
          message;
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

    // ===================================================
    // If user manually turns Remember Me OFF,
    // immediately remove the saved credentials.
    // ===================================================

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
        style={styles.safeArea}
      >
        <View
          style={
            styles.initialLoadingContainer
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.cardinal}
          />
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
          {/* =====================================================
              BRAND HEADER
          ===================================================== */}

          <View
            style={styles.brandSection}
          >
            <View
              style={styles.logoOuter}
            >
              <View
                style={styles.logoInner}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={34}
                  color={COLORS.white}
                />
              </View>
            </View>

            <Text
              style={styles.brandTitle}
            >
              TUPC-OrderUp
            </Text>

            <Text
              style={styles.brandSubtitle}
            >
              Campus ordering made simple.
            </Text>
          </View>

          {/* =====================================================
              LOGIN CARD
          ===================================================== */}

          <View style={styles.card}>
            <Text
              style={styles.welcome}
            >
              Welcome back
            </Text>

            <Text
              style={styles.loginSubtitle}
            >
              Sign in to continue to your account
            </Text>

            {/* =================================================
                USERNAME / EMAIL
            ================================================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.label}
              >
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
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.muted}
                />

                <TextInput
                  value={username}
                  onChangeText={
                    setUsername
                  }
                  placeholder="Enter your username or email"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  keyboardType="default"
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              {/* =================================================
                  REMEMBERED CREDENTIALS INDICATOR
              ================================================= */}

              {username.length > 0 &&
                rememberMe && (
                  <View
                    style={
                      styles.rememberedHint
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={
                        COLORS.cardinal
                      }
                    />

                    <Text
                      style={
                        styles.rememberedHintText
                      }
                    >
                      Remembered credentials
                    </Text>
                  </View>
                )}
            </View>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.label}
              >
                Password
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.muted}
                />

                <TextInput
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  placeholder="Enter your password"
                  placeholderTextColor="#A3A3A3"
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
                    color={
                      COLORS.muted
                    }
                  />
                </Pressable>
              </View>
            </View>

            {/* =================================================
                REMEMBER ME + FORGOT PASSWORD
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
                      size={15}
                      color={
                        COLORS.white
                      }
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
              style={({
                pressed,
              }) => [
                styles.loginButton,

                pressed &&
                  !isLoading &&
                  styles.buttonPressed,

                isLoading &&
                  styles.loginButtonDisabled,
              ]}
              onPress={
                handleLogin
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Ionicons
                    name="sync-outline"
                    size={20}
                    color={
                      COLORS.white
                    }
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

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={
                      COLORS.white
                    }
                  />
                </>
              )}
            </Pressable>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <View
              style={
                styles.dividerRow
              }
            >
              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.dividerText
                }
              >
                OR
              </Text>

              <View
                style={
                  styles.divider
                }
              />
            </View>

            {/* =================================================
                SIGNUP
            ================================================= */}

            <View
              style={styles.signupRow}
            >
              <Text
                style={
                  styles.signupText
                }
              >
                Don't have an account?
              </Text>

              <Pressable
                onPress={
                  handleRegister
                }
                disabled={isLoading}
              >
                <Text
                  style={
                    styles.signupLink
                  }
                >
                  {" "}Create one
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <View
            style={styles.footer}
          >
            <View
              style={styles.footerLine}
            >
              <View
                style={styles.goldLine}
              />

              <Text
                style={
                  styles.footerText
                }
              >
                TECHNOLOGICAL UNIVERSITY OF
                {"\n"}
                THE PHILIPPINES
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
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  initialLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 30,
  },

  // ===================================================
  // BRAND
  // ===================================================

  brandSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoOuter: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor:
      COLORS.cardinalDark,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        rotate: "45deg",
      },
    ],
    marginBottom: 20,
  },

  logoInner: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor:
      COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        rotate: "-45deg",
      },
    ],
  },

  brandTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.cardinalDark,
    letterSpacing: -0.7,
  },

  brandSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.muted,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor:
      COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },

  welcome: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },

  loginSubtitle: {
    marginTop: 7,
    marginBottom: 25,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },

  // ===================================================
  // INPUT
  // ===================================================

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  inputWrapper: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#FAFAFA",
  },

  inputWrapperRemembered: {
    borderColor: "#DDB6BE",
    backgroundColor: "#FFF9FA",
  },

  input: {
    flex: 1,
    marginLeft: 11,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },

  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 5,
  },

  // ===================================================
  // REMEMBERED CREDENTIALS
  // ===================================================

  rememberedHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 3,
  },

  rememberedHintText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.cardinal,
  },

  // ===================================================
  // REMEMBER ME / FORGOT PASSWORD
  // ===================================================

  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 22,
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
    borderColor: "#CFCFCF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.white,
  },

  checkboxActive: {
    backgroundColor:
      COLORS.cardinal,
    borderColor:
      COLORS.cardinal,
  },

  rememberText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.muted,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.cardinal,
  },

  // ===================================================
  // BUTTON
  // ===================================================

  loginButton: {
    height: 55,
    borderRadius: 15,
    backgroundColor:
      COLORS.cardinal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,

    shadowColor:
      COLORS.cardinal,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  // ===================================================
  // DIVIDER
  // ===================================================

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 23,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor:
      COLORS.border,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#A3A3A3",
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
    fontSize: 14,
    color: COLORS.muted,
  },

  signupLink: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    alignItems: "center",
    marginTop: 28,
  },

  footerLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  goldLine: {
    flex: 1,
    maxWidth: 35,
    height: 1,
    backgroundColor:
      COLORS.gold,
  },

  footerText: {
    marginHorizontal: 9,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#8A8A8A",
    textAlign: "center",
  },

  version: {
    marginTop: 8,
    fontSize: 10,
    color: "#A3A3A3",
  },
});
