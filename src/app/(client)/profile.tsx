import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

const TUP_LOGO = require("../../../assets/LOGO.png");

import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// STORAGE
// =====================================================

const THEME_STORAGE_KEY = "@tuporderup_theme";
const NOTIFICATIONS_STORAGE_KEY =
  "@tuporderup_notifications";
const PROFILE_IMAGE_STORAGE_KEY =
  "@tuporderup_profile_image";

// =====================================================
// TYPES
// =====================================================

type ThemeMode = "light" | "dark";

// =====================================================
// LIGHT THEME
// =====================================================

const LIGHT = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",

  background: "#F7F7F8",
  surface: "#FFFFFF",
  surfaceSecondary: "#FAFAFA",
  input: "#F4F4F5",

  text: "#171717",
  textSecondary: "#404040",
  muted: "#737373",
  lightMuted: "#9A9A9A",

  border: "#E7E7E8",
  borderStrong: "#DADADC",

  softRed: "#FCECEF",
  softRedBorder: "#F2D5DA",

  success: "#238636",
  successBg: "#F0F8F1",
  successBorder: "#DCEFE0",

  warning: "#B7791F",
  warningBg: "#FFF8E7",

  gold: "#D8B56A",

  danger: "#C62828",
  dangerBg: "#FFF3F3",
  dangerBorder: "#F0CDD2",

  overlay: "rgba(0,0,0,0.45)",
};

// =====================================================
// DARK THEME
// =====================================================

const DARK = {
  cardinal: "#D12B45",
  cardinalDark: "#E24A61",
  cardinalDeep: "#A6192E",

  background: "#0F1012",
  surface: "#18191C",
  surfaceSecondary: "#202126",
  input: "#24252A",

  text: "#F5F5F5",
  textSecondary: "#D4D4D8",
  muted: "#A1A1AA",
  lightMuted: "#71717A",

  border: "#2D2E34",
  borderStrong: "#3A3B42",

  softRed: "#32151C",
  softRedBorder: "#56232D",

  success: "#43A85C",
  successBg: "#14251A",
  successBorder: "#23482D",

  warning: "#D39B37",
  warningBg: "#2C2413",

  gold: "#D8B56A",

  danger: "#E05252",
  dangerBg: "#2A1717",
  dangerBorder: "#542727",

  overlay: "rgba(0,0,0,0.70)",
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [themeMode, setThemeMode] =
    useState<ThemeMode>("light");

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [showAccountModal, setShowAccountModal] =
    useState(false);

  const [showAppearanceModal, setShowAppearanceModal] =
    useState(false);

  const [showSecurityModal, setShowSecurityModal] =
    useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [showAboutModal, setShowAboutModal] =
    useState(false);

  const [loadingSettings, setLoadingSettings] =
    useState(true);

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  // ===================================================
  // THEME
  // ===================================================

  const colors =
    themeMode === "dark" ? DARK : LIGHT;

  const isDark = themeMode === "dark";

  // ===================================================
  // LOAD SETTINGS
  // ===================================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        storedTheme,
        storedNotifications,
        storedProfileImage,
      ] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        ),
        AsyncStorage.getItem(
          PROFILE_IMAGE_STORAGE_KEY
        ),
      ]);

      if (
        storedTheme === "light" ||
        storedTheme === "dark"
      ) {
        setThemeMode(storedTheme);
      }

      if (storedNotifications !== null) {
        setNotificationsEnabled(
          storedNotifications === "true"
        );
      }

      if (storedProfileImage) {
        setProfileImage(storedProfileImage);
      }
    } catch (error) {
      console.error(
        "Failed to load profile settings:",
        error
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  // ===================================================
  // CHANGE THEME
  // ===================================================

  const handleThemeChange = async (
    mode: ThemeMode
  ) => {
    try {
      setThemeMode(mode);

      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        mode
      );

      setShowAppearanceModal(false);
    } catch (error) {
      console.error(
        "Failed to save theme:",
        error
      );

      Alert.alert(
        "Unable to save theme",
        "Your theme preference could not be saved. Please try again."
      );
    }
  };

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  const handleNotifications = async (
    value: boolean
  ) => {
    try {
      setNotificationsEnabled(value);

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        String(value)
      );
    } catch (error) {
      console.error(
        "Failed to save notifications:",
        error
      );

      setNotificationsEnabled(!value);

      Alert.alert(
        "Unable to save setting",
        "Your notification preference could not be saved."
      );
    }
  };

  // ===================================================
  // USER INFORMATION
  // ===================================================

  const formatName = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

  const fullName = useMemo(() => {
    const firstName = formatName(user?.firstName ?? "");
    const lastName = formatName(user?.lastName ?? "");

    return `${firstName} ${lastName}`.trim() || "User";
  }, [user]);

  const username = useMemo(() => {
    if (user?.username?.trim()) {
      return `@${user.username.trim()}`;
    }

    return "@username";
  }, [user]);

  const email = useMemo(() => {
    return (
      user?.email?.trim() ||
      "No email available"
    );
  }, [user]);

  const initials = useMemo(() => {
    const first =
      user?.firstName?.charAt(0) ?? "";

    const last =
      user?.lastName?.charAt(0) ?? "";

    const value =
      `${first}${last}`.toUpperCase();

    return value || "U";
  }, [user]);

  // ===================================================
  // PROFILE PHOTO
  // ===================================================

  const handleChangeProfilePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo Permission Needed",
          "Please allow photo library access so you can choose a profile picture."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;
      setProfileImage(uri);

      await AsyncStorage.setItem(
        PROFILE_IMAGE_STORAGE_KEY,
        uri
      );
    } catch (error) {
      console.error(
        "Failed to update profile photo:",
        error
      );

      Alert.alert(
        "Unable to update photo",
        "Something went wrong while selecting your profile picture. Please try again."
      );
    }
  };

  const handleRemoveProfilePhoto = () => {
    if (!profileImage) {
      handleChangeProfilePhoto();
      return;
    }

    Alert.alert(
      "Remove Profile Photo",
      "Do you want to remove your current profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                PROFILE_IMAGE_STORAGE_KEY
              );
              setProfileImage(null);
            } catch (error) {
              console.error(
                "Failed to remove profile photo:",
                error
              );
              Alert.alert(
                "Unable to remove photo",
                "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleProfilePhotoPress = () => {
    Alert.alert(
      "Profile Photo",
      profileImage
        ? "Choose what you want to do with your profile picture."
        : "Add a profile picture to personalize your account.",
      [
        {
          text: "Choose Photo",
          onPress: handleChangeProfilePhoto,
        },
        ...(profileImage
          ? [
              {
                text: "Remove Photo",
                style: "destructive" as const,
                onPress: handleRemoveProfilePhoto,
              },
            ]
          : []),
        {
          text: "Cancel",
          style: "cancel" as const,
        },
      ]
    );
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your TUPC-OrderUp account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();

              router.replace("/");
            } catch (error) {
              console.error(
                "Logout error:",
                error
              );

              Alert.alert(
                "Logout Failed",
                "Unable to sign out right now. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // ===================================================
  // PASSWORD AUTHENTICATION / REQUIREMENTS
  // ===================================================

  const passwordChecks = useMemo(() => ({
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmNewPassword,
  }), [newPassword, confirmNewPassword]);

  const passwordIsValid =
    passwordChecks.minLength &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special &&
    passwordChecks.matches;

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(
        "Incomplete Details",
        "Please fill in all password fields."
      );
      return;
    }

    if (!passwordIsValid) {
      Alert.alert(
        "Password Requirements Not Met",
        "Your new password must meet all of the requirements shown below."
      );
      return;
    }

    // The UI and validation are ready. Connect this handler to your
    // backend change-password endpoint when that endpoint is available.
    Alert.alert(
      "Password Ready",
      "Your new password passed the required checks. Connect this action to the backend change-password endpoint to save it securely.",
      [
        {
          text: "OK",
          onPress: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setShowChangePasswordModal(false);
          },
        },
      ]
    );
  };

  // ===================================================
  // SECURITY
  // ===================================================

  const handleSecurity = () => {
    setShowSecurityModal(true);
  };

  // ===================================================
  // PICKUP LOCATIONS
  // ===================================================

  const handleAddresses = () => {
    Alert.alert(
      "Campus Pickup Locations",
      "Manage where you want to collect your campus orders.",
      [
        {
          text: "Browse Stores",
          onPress: () =>
            router.push("/explore"),
        },
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  // ===================================================
  // ACCOUNT
  // ===================================================

  const handlePersonalInformation = () => {
    setShowAccountModal(true);
  };

  // ===================================================
  // APPEARANCE LABEL
  // ===================================================

  const appearanceLabel =
    themeMode === "dark"
      ? "Dark Mode"
      : "Light Mode";

  // ===================================================
  // LOADING
  // ===================================================

  if (loadingSettings) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.loadingIcon,
              {
                backgroundColor:
                  colors.softRed,
              },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={28}
              color={colors.cardinal}
            />
          </View>

          <Text
            style={[
              styles.loadingTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Loading Settings
          </Text>

          <Text
            style={[
              styles.loadingSubtitle,
              {
                color: colors.muted,
              },
            ]}
          >
            Preparing your preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      edges={["top", "left", "right"]}
    >
      <View
        style={[
          styles.screen,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* PAGE HEADER */}
          <View style={styles.pageHeader}>
  
            <Text
              style={[styles.pageTitle, { color: colors.text }]}
            >
              Profile
            </Text>
            <Text
              style={[styles.pageSubtitle, { color: colors.muted }]}
            >
              Manage your account, security, and preferences
            </Text>
          </View>

          {/* =================================================
              PROFILE CARD
          ================================================= */}

          <View
            style={[
              styles.profileHero,
              {
                backgroundColor:
                  colors.surface,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <View style={styles.profileTop}>
              <Pressable
                onPress={handleProfilePhotoPress}
                style={({ pressed }) => [
                  styles.avatarWrapper,
                  pressed && styles.avatarPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                {profileImage ||
                (user as any)?.profileImage ||
                (user as any)?.avatarUrl ||
                (user as any)?.photoURL ? (
                  <Image
                    source={{
                      uri:
                        profileImage ||
                        (user as any)?.profileImage ||
                        (user as any)?.avatarUrl ||
                        (user as any)?.photoURL,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          colors.softRed,
                        borderColor:
                          colors.softRedBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        {
                          color:
                            colors.cardinal,
                        },
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.onlineBadge,
                    {
                      backgroundColor:
                        colors.surface,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.onlineDot,
                      {
                        backgroundColor:
                          colors.success,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: colors.cardinal },
                  ]}
                >
                  <Ionicons
                    name="camera"
                    size={11}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>

              <View
                style={styles.profileInfo}
              >
                <Text
                  style={[
                    styles.fullName,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {fullName}
                </Text>

                <Text
                  style={[
                    styles.username,
                    {
                      color: colors.muted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {username}
                </Text>

                <View
                  style={styles.verifiedRow}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={colors.success}
                  />

                  <Text
                    style={[
                      styles.verifiedText,
                      {
                        color:
                          colors.success,
                      },
                    ]}
                  >
                    Verified Account
                  </Text>
                </View>

                <Pressable
                  onPress={handleProfilePhotoPress}
                  style={({ pressed }) => [
                    styles.photoHint,
                    pressed && styles.photoHintPressed,
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={13}
                    color={colors.cardinal}
                  />
                  <Text
                    style={[
                      styles.photoHintText,
                      { color: colors.cardinal },
                    ]}
                  >
                    {profileImage
                      ? "Change profile photo"
                      : "Add profile photo"}
                  </Text>
                </Pressable>
              </View>


            </View>

            {/* EMAIL */}

            <View
              style={[
                styles.emailBox,
                {
                  backgroundColor:
                    colors.surfaceSecondary,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emailIcon,
                  {
                    backgroundColor:
                      colors.softRed,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={colors.cardinal}
                />
              </View>

              <View
                style={styles.emailContent}
              >
                <Text
                  style={[
                    styles.emailLabel,
                    {
                      color:
                        colors.lightMuted,
                    },
                  ]}
                >
                  Registered Email
                </Text>

                <Text
                  style={[
                    styles.emailText,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
            </View>

            {/* ACCOUNT STATUS */}

            <View
              style={[
                styles.accountStatus,
                {
                  backgroundColor:
                    colors.successBg,
                  borderColor:
                    colors.successBorder,
                },
              ]}
            >
              <View
                style={styles.statusLeft}
              >
                <View
                  style={[
                    styles.statusIcon,
                    {
                      backgroundColor:
                        colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={17}
                    color={colors.success}
                  />
                </View>

                <View
                  style={styles.statusContent}
                >
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Account Protected
                  </Text>

                  <Text
                    style={[
                      styles.statusSubtitle,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    Your account is active and secure
                  </Text>
                </View>
              </View>

              <Ionicons
                name="checkmark-circle"
                size={21}
                color={colors.success}
              />
            </View>
          </View>

          {/* =================================================
              ACCOUNT
          ================================================= */}

          <SectionHeader
            title="Account"
            colors={colors}
          />

          <ProfileOption
            colors={colors}
            icon="person-outline"
            title="Personal Information"
            subtitle="View your registered account details"
            onPress={
              handlePersonalInformation
            }
          />

          <ProfileOption
            colors={colors}
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password securely"
            onPress={() => setShowChangePasswordModal(true)}
          />

          <ProfileOption
            colors={colors}
            icon="location-outline"
            title="Campus Pickup Locations"
            subtitle="Manage your preferred pickup locations"
            onPress={handleAddresses}
          />




          {/* =================================================
              SETTINGS
          ================================================= */}

          <SectionHeader
            title="Settings"
            colors={colors}
          />

          {/* APPEARANCE */}

          <Pressable
            onPress={() =>
              setShowAppearanceModal(true)
            }
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor:
                  colors.surface,
                borderColor:
                  colors.border,
              },
              pressed &&
                styles.optionPressed,
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                {
                  backgroundColor:
                    colors.softRed,
                },
              ]}
            >
              <Ionicons
                name={
                  isDark
                    ? "moon"
                    : "sunny-outline"
                }
                size={21}
                color={colors.cardinal}
              />
            </View>

            <View
              style={styles.optionContent}
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Appearance
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                Change between light and dark mode
              </Text>
            </View>

            <View
              style={[
                styles.settingValue,
                {
                  backgroundColor:
                    colors.input,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.settingValueText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {appearanceLabel}
              </Text>
            </View>
          </Pressable>

          {/* NOTIFICATIONS */}

          <View
            style={[
              styles.preferenceCard,
              {
                backgroundColor:
                  colors.surface,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={styles.preferenceLeft}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      colors.softRed,
                  },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color={colors.cardinal}
                />
              </View>

              <View
                style={styles.optionContent}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Notifications
                </Text>

                <Text
                  style={[
                    styles.optionSubtitle,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  Order updates and important account alerts
                </Text>
              </View>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={
                handleNotifications
              }
              trackColor={{
                false:
                  themeMode === "dark"
                    ? "#3A3B42"
                    : "#D7D7D7",
                true:
                  themeMode === "dark"
                    ? "#8F2437"
                    : "#DFA0AA",
              }}
              thumbColor={
                notificationsEnabled
                  ? colors.cardinal
                  : themeMode === "dark"
                  ? "#A1A1AA"
                  : "#F4F4F4"
              }
              ios_backgroundColor={
                themeMode === "dark"
                  ? "#3A3B42"
                  : "#D7D7D7"
              }
            />
          </View>

          {/* SECURITY */}

          <ProfileOption
            colors={colors}
            icon="shield-checkmark-outline"
            title="Security & Privacy"
            subtitle="Review your account security settings"
            onPress={handleSecurity}
          />

          {/* =================================================
              ABOUT
          ================================================= */}

          <SectionHeader
            title="About"
            colors={colors}
          />

          <Pressable
            onPress={() =>
              setShowAboutModal(true)
            }
            style={({ pressed }) => [
              styles.aboutCard,
              {
                backgroundColor:
                  colors.surface,
                borderColor:
                  colors.border,
              },
              pressed &&
                styles.optionPressed,
            ]}
          >
            <View
              style={[
                styles.aboutLogo,
                {
                  backgroundColor:
                    colors.cardinal,
                },
              ]}
            >
              <Ionicons
                name="school-outline"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View
              style={styles.aboutContent}
            >
              <Text
                style={[
                  styles.aboutTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                TUPC-OrderUp
              </Text>

              <Text
                style={[
                  styles.aboutSubtitle,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                Campus ordering made simple.
              </Text>

              <Text
                style={[
                  styles.aboutVersion,
                  {
                    color:
                      colors.lightMuted,
                  },
                ]}
              >
                Version 1.0.0
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.lightMuted}
            />
          </Pressable>

          {/* =================================================
              SIGN OUT
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor:
                  colors.surface,
                borderColor:
                  colors.dangerBorder,
              },
              pressed &&
                styles.logoutPressed,
            ]}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.logoutIcon,
                {
                  backgroundColor:
                    colors.dangerBg,
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={21}
                color={colors.danger}
              />
            </View>

            <View
              style={styles.logoutContent}
            >
              <Text
                style={[
                  styles.logoutTitle,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Sign Out
              </Text>

              <Text
                style={[
                  styles.logoutSubtitle,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                Sign out from this account
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.lightMuted}
            />
          </Pressable>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>
            <View
              style={[
                styles.footerLine,
                { backgroundColor: colors.border },
              ]}
            />
            <Image
              source={TUP_LOGO}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={[styles.footerCopyright, { color: colors.muted }]}>
              @2026 Technological University of the Philippines - Cavite Campus
            </Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* =================================================
            APPEARANCE MODAL
        ================================================= */}

        <Modal
          visible={showAppearanceModal}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowAppearanceModal(false)
          }
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor:
                  colors.overlay,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() =>
                setShowAppearanceModal(false)
              }
            />

            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  {
                    backgroundColor:
                      colors.borderStrong,
                  },
                ]}
              />

              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={[
                      styles.modalEyebrow,
                      {
                        color:
                          colors.cardinal,
                      },
                    ]}
                  >
                    DISPLAY
                  </Text>

                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Appearance
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    Choose how TUPC-OrderUp looks on your device.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowAppearanceModal(
                      false
                    )
                  }
                  style={[
                    styles.modalClose,
                    {
                      backgroundColor:
                        colors.input,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View
                style={styles.themeOptions}
              >
                {/* LIGHT */}

                <ThemeOption
                  colors={colors}
                  active={
                    themeMode === "light"
                  }
                  icon="sunny-outline"
                  title="Light Mode"
                  subtitle="Clean and bright"
                  onPress={() =>
                    handleThemeChange(
                      "light"
                    )
                  }
                />

                {/* DARK */}

                <ThemeOption
                  colors={colors}
                  active={
                    themeMode === "dark"
                  }
                  icon="moon-outline"
                  title="Dark Mode"
                  subtitle="Comfortable in low light"
                  onPress={() =>
                    handleThemeChange(
                      "dark"
                    )
                  }
                />
              </View>

              <View
                style={[
                  styles.themeInfo,
                  {
                    backgroundColor:
                      colors.input,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.muted}
                />

                <Text
                  style={[
                    styles.themeInfoText,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  Your preference is saved automatically and will be restored the next time you open the app.
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* =================================================
            ACCOUNT MODAL
        ================================================= */}

        <Modal
          visible={showAccountModal}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowAccountModal(false)
          }
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor:
                  colors.overlay,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() =>
                setShowAccountModal(false)
              }
            />

            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  {
                    backgroundColor:
                      colors.borderStrong,
                  },
                ]}
              />

              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={[
                      styles.modalEyebrow,
                      {
                        color:
                          colors.cardinal,
                      },
                    ]}
                  >
                    ACCOUNT
                  </Text>

                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Personal Information
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowAccountModal(
                      false
                    )
                  }
                  style={[
                    styles.modalClose,
                    {
                      backgroundColor:
                        colors.input,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              {/* PROFILE */}

              <View
                style={[
                  styles.modalProfile,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Pressable
                  onPress={handleProfilePhotoPress}
                  style={({ pressed }) => [
                    styles.modalAvatar,
                    { backgroundColor: colors.softRed },
                    pressed && styles.avatarPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  {profileImage ||
                  (user as any)?.profileImage ||
                  (user as any)?.avatarUrl ||
                  (user as any)?.photoURL ? (
                    <Image
                      source={{
                        uri:
                          profileImage ||
                          (user as any)?.profileImage ||
                          (user as any)?.avatarUrl ||
                          (user as any)?.photoURL,
                      }}
                      style={styles.modalAvatarImage}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.modalAvatarText,
                        { color: colors.cardinal },
                      ]}
                    >
                      {initials}
                    </Text>
                  )}

                  <View
                    style={[
                      styles.modalAvatarEdit,
                      { backgroundColor: colors.cardinal },
                    ]}
                  >
                    <Ionicons
                      name="camera"
                      size={10}
                      color="#FFFFFF"
                    />
                  </View>
                </Pressable>

                <View
                  style={
                    styles.modalProfileInfo
                  }
                >
                  <Text
                    style={[
                      styles.modalName,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {fullName}
                  </Text>

                  <Text
                    style={[
                      styles.modalUsername,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    {username}
                  </Text>
                </View>
              </View>

              {/* DETAILS */}

              <View
                style={[
                  styles.detailsContainer,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <AccountDetail
                  colors={colors}
                  icon="person-outline"
                  label="Full Name"
                  value={fullName}
                />

                <AccountDetail
                  colors={colors}
                  icon="at-outline"
                  label="Username"
                  value={username}
                />

                <AccountDetail
                  colors={colors}
                  icon="mail-outline"
                  label="Email"
                  value={email}
                  last
                />
              </View>

              {/* VERIFIED */}

              <View
                style={[
                  styles.modalVerified,
                  {
                    backgroundColor:
                      colors.successBg,
                    borderColor:
                      colors.successBorder,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={colors.success}
                />

                <View
                  style={
                    styles.modalVerifiedContent
                  }
                >
                  <Text
                    style={[
                      styles.modalVerifiedTitle,
                      {
                        color:
                          colors.success,
                      },
                    ]}
                  >
                    Verified Account
                  </Text>

                  <Text
                    style={[
                      styles.modalVerifiedText,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    Your account information is associated with your TUPC-OrderUp account.
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.modalDoneButton,
                  {
                    backgroundColor:
                      colors.cardinal,
                  },
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  setShowAccountModal(false)
                }
              >
                <Text
                  style={styles.modalDoneText}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* =================================================
            CHANGE PASSWORD MODAL
        ================================================= */}

        <Modal
          visible={showChangePasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowChangePasswordModal(false)
          }
        >
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.overlay },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowChangePasswordModal(false)}
            />

            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  { backgroundColor: colors.borderStrong },
                ]}
              />

              <View style={styles.modalHeader}>
                <View style={styles.changePasswordHeaderText}>
                  <Text
                    style={[
                      styles.modalEyebrow,
                      { color: colors.cardinal },
                    ]}
                  >
                    ACCOUNT SECURITY
                  </Text>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: colors.text },
                    ]}
                  >
                    Change Password
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: colors.muted },
                    ]}
                  >
                    Use a strong password to keep your account protected.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowChangePasswordModal(false)}
                  style={[
                    styles.modalClose,
                    { backgroundColor: colors.input },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View style={styles.passwordForm}>
                <PasswordField
                  colors={colors}
                  icon="lock-closed-outline"
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  onToggleSecure={() => setShowCurrentPassword((v) => !v)}
                />

                <PasswordField
                  colors={colors}
                  icon="key-outline"
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  onToggleSecure={() => setShowNewPassword((v) => !v)}
                />

                {newPassword.length > 0 && (
                  <PasswordRequirements
                    colors={colors}
                    checks={passwordChecks}
                  />
                )}

                <PasswordField
                  colors={colors}
                  icon="checkmark-circle-outline"
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry={!showConfirmPassword}
                  onToggleSecure={() => setShowConfirmPassword((v) => !v)}
                />
              </View>

              <View
                style={[
                  styles.passwordHint,
                  {
                    backgroundColor: passwordIsValid ? colors.successBg : colors.input,
                    borderColor: passwordIsValid ? colors.successBorder : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={passwordIsValid ? "shield-checkmark" : "information-circle-outline"}
                  size={18}
                  color={passwordIsValid ? colors.success : colors.muted}
                />
                <Text
                  style={[
                    styles.passwordHintText,
                    { color: passwordIsValid ? colors.success : colors.muted },
                  ]}
                >
                  {passwordIsValid
                    ? "Password authenticated. All security requirements are satisfied."
                    : "Password authentication will update as you meet each requirement."}
                </Text>
              </View>

              <Pressable
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.modalDoneButton,
                  { backgroundColor: colors.cardinal },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.changePasswordButtonText}>
                  Update Password
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* =================================================
            SECURITY MODAL
        ================================================= */}

        <Modal
          visible={showSecurityModal}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowSecurityModal(false)
          }
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor:
                  colors.overlay,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() =>
                setShowSecurityModal(false)
              }
            />

            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  {
                    backgroundColor:
                      colors.borderStrong,
                  },
                ]}
              />

              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={[
                      styles.modalEyebrow,
                      {
                        color:
                          colors.cardinal,
                      },
                    ]}
                  >
                    SECURITY
                  </Text>

                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Security & Privacy
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowSecurityModal(
                      false
                    )
                  }
                  style={[
                    styles.modalClose,
                    {
                      backgroundColor:
                        colors.input,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View
                style={[
                  styles.securityHero,
                  {
                    backgroundColor:
                      colors.successBg,
                    borderColor:
                      colors.successBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.securityHeroIcon,
                    {
                      backgroundColor:
                        colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={28}
                    color={colors.success}
                  />
                </View>

                <Text
                  style={[
                    styles.securityHeroTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Account Security
                </Text>

                <Text
                  style={[
                    styles.securityHeroText,
                    {
                      color:
                        colors.muted,
                    },
                  ]}
                >
                  Your account uses the authentication and verification methods configured for TUPC-OrderUp.
                </Text>
              </View>

              <SecurityRow
                colors={colors}
                icon="lock-closed-outline"
                title="Password Protected"
                description="Your account requires valid credentials."
              />

              <SecurityRow
                colors={colors}
                icon="shield-checkmark-outline"
                title="Account Verification"
                description="Your account verification status is maintained by the system."
              />

              <SecurityRow
                colors={colors}
                icon="notifications-outline"
                title="Security Alerts"
                description={
                  notificationsEnabled
                    ? "Important account alerts are enabled."
                    : "Notifications are currently disabled."
                }
              />

              <Pressable
                style={({ pressed }) => [
                  styles.modalDoneButton,
                  {
                    backgroundColor:
                      colors.cardinal,
                  },
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  setShowSecurityModal(false)
                }
              >
                <Text
                  style={styles.modalDoneText}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* =================================================
            ABOUT MODAL
        ================================================= */}

        <Modal
          visible={showAboutModal}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowAboutModal(false)
          }
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor:
                  colors.overlay,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() =>
                setShowAboutModal(false)
              }
            />

            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  {
                    backgroundColor:
                      colors.borderStrong,
                  },
                ]}
              />

              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={[
                      styles.modalEyebrow,
                      {
                        color:
                          colors.cardinal,
                      },
                    ]}
                  >
                    ABOUT
                  </Text>

                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    TUPC-OrderUp
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowAboutModal(false)
                  }
                  style={[
                    styles.modalClose,
                    {
                      backgroundColor:
                        colors.input,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View
                style={[
                  styles.aboutModalHero,
                  {
                    backgroundColor:
                      colors.softRed,
                    borderColor:
                      colors.softRedBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.aboutModalLogo,
                    {
                      backgroundColor:
                        colors.cardinal,
                    },
                  ]}
                >
                  <Ionicons
                    name="school-outline"
                    size={31}
                    color="#FFFFFF"
                  />
                </View>

                <Text
                  style={[
                    styles.aboutModalTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  TUPC-OrderUp
                </Text>

                <Text
                  style={[
                    styles.aboutModalSubtitle,
                    {
                      color:
                        colors.muted,
                    },
                  ]}
                >
                  Campus Ordering System
                </Text>

                <View
                  style={[
                    styles.versionBadge,
                    {
                      backgroundColor:
                        colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.versionBadgeText,
                      {
                        color:
                          colors.cardinal,
                      },
                    ]}
                  >
                    VERSION 1.0.0
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.aboutDescription,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                TUPC-OrderUp is a campus ordering platform designed to make ordering from participating campus stores simpler and more organized.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.modalDoneButton,
                  {
                    backgroundColor:
                      colors.cardinal,
                  },
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  setShowAboutModal(false)
                }
              >
                <Text
                  style={styles.modalDoneText}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: typeof LIGHT;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

// =====================================================
// PROFILE OPTION
// =====================================================

function ProfileOption({
  icon,
  title,
  subtitle,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: typeof LIGHT;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },
        pressed &&
          styles.optionPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor:
              colors.softRed,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={colors.cardinal}
        />
      </View>

      <View
        style={styles.optionContent}
      >
        <Text
          style={[
            styles.optionTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.optionSubtitle,
            {
              color: colors.muted,
            },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.optionArrow,
          {
            backgroundColor:
              colors.input,
          },
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={17}
          color={colors.lightMuted}
        />
      </View>
    </Pressable>
  );
}

// =====================================================
// THEME OPTION
// =====================================================

function ThemeOption({
  colors,
  active,
  icon,
  title,
  subtitle,
  onPress,
}: {
  colors: typeof LIGHT;
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeOption,
        {
          backgroundColor:
            active
              ? colors.softRed
              : colors.surfaceSecondary,
          borderColor:
            active
              ? colors.cardinal
              : colors.border,
        },
        pressed &&
          styles.optionPressed,
      ]}
    >
      <View
        style={[
          styles.themeIcon,
          {
            backgroundColor:
              active
                ? colors.cardinal
                : colors.input,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            active
              ? "#FFFFFF"
              : colors.cardinal
          }
        />
      </View>

      <View
        style={styles.themeContent}
      >
        <Text
          style={[
            styles.themeTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.themeSubtitle,
            {
              color: colors.muted,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          {
            borderColor:
              active
                ? colors.cardinal
                : colors.borderStrong,
          },
        ]}
      >
        {active && (
          <View
            style={[
              styles.radioActive,
              {
                backgroundColor:
                  colors.cardinal,
              },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

// =====================================================
// ACCOUNT DETAIL
// =====================================================

function AccountDetail({
  icon,
  label,
  value,
  colors,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof LIGHT;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        {
          backgroundColor:
            colors.surface,
          borderBottomColor:
            colors.border,
          borderBottomWidth:
            last ? 0 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.detailIcon,
          {
            backgroundColor:
              colors.softRed,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.cardinal}
        />
      </View>

      <View
        style={styles.detailContent}
      >
        <Text
          style={[
            styles.detailLabel,
            {
              color:
                colors.lightMuted,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.detailValue,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// SECURITY ROW
// =====================================================

function SecurityRow({
  colors,
  icon,
  title,
  description,
}: {
  colors: typeof LIGHT;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View
      style={[
        styles.securityRow,
        {
          backgroundColor:
            colors.surfaceSecondary,
          borderColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.securityRowIcon,
          {
            backgroundColor:
              colors.softRed,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={colors.cardinal}
        />
      </View>

      <View
        style={styles.securityRowContent}
      >
        <Text
          style={[
            styles.securityRowTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.securityRowDescription,
            {
              color: colors.muted,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="checkmark-circle"
        size={19}
        color={colors.success}
      />
    </View>
  );
}

// =====================================================
// PASSWORD FIELD
// =====================================================

function PasswordField({
  colors,
  icon,
  label,
  value,
  onChangeText,
  secureTextEntry,
  onToggleSecure,
}: {
  colors: typeof LIGHT;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggleSecure: () => void;
}) {
  return (
    <View
      style={[
        styles.passwordField,
        {
          backgroundColor: colors.input,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.passwordFieldIcon,
          { backgroundColor: colors.softRed },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.cardinal}
        />
      </View>
      <View style={styles.passwordFieldContent}>
        <Text
          style={[
            styles.passwordFieldLabel,
            { color: colors.lightMuted },
          ]}
        >
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="••••••••"
          placeholderTextColor={colors.lightMuted}
        />
      </View>
      <Pressable
        onPress={onToggleSecure}
        hitSlop={10}
        style={styles.passwordEye}
      >
        <Ionicons
          name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
          size={19}
          color={colors.muted}
        />
      </Pressable>
    </View>
  );
}

// =====================================================
// PASSWORD REQUIREMENTS
// =====================================================

function PasswordRequirements({
  colors,
  checks,
}: {
  colors: typeof LIGHT;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    matches: boolean;
  };
}) {
  const items = [
    [checks.minLength, "At least 8 characters"],
    [checks.uppercase, "One uppercase letter"],
    [checks.lowercase, "One lowercase letter"],
    [checks.number, "One number"],
    [checks.special, "One special character"],
    [checks.matches, "Passwords match"],
  ] as const;

  return (
    <View
      style={[
        styles.passwordRequirements,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.passwordRequirementsHeader}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.cardinal} />
        <Text style={[styles.passwordRequirementsTitle, { color: colors.text }]}>
          Password Authentication
        </Text>
      </View>
      <View style={styles.passwordRequirementsGrid}>
        {items.map(([valid, label]) => (
          <View key={label} style={styles.passwordRequirementItem}>
            <Ionicons
              name={valid ? "checkmark-circle" : "ellipse-outline"}
              size={15}
              color={valid ? colors.success : colors.lightMuted}
            />
            <Text
              style={[
                styles.passwordRequirementText,
                { color: valid ? colors.success : colors.muted },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  screen: {
    flex: 1,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    marginTop: 17,
    fontSize: 17,
    fontWeight: "900",
  },

  loadingSubtitle: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "500",
  },

  // ===================================================
  // HEADER
  // ===================================================






  pageHeader: {
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 4,
  },

  pageHeaderLogoWrap: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  pageHeaderLogo: {
    width: 54,
    height: 54,
  },

  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },

  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    textAlign: "center",
  },

  // ===================================================
  // SCROLL
  // ===================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 120,
  },

  // ===================================================
  // PROFILE HERO
  // ===================================================

  profileHero: {
    padding: 17,
    borderRadius: 22,
    borderWidth: 1,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 72,
    height: 72,
    position: "relative",
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#E7E7E8",
  },

  avatarPressed: {
    opacity: 0.82,
  },

  avatarEditBadge: {
    position: "absolute",
    right: 1,
    top: 1,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "900",
  },

  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },

  fullName: {
    fontSize: 18,
    fontWeight: "900",
  },

  username: {
    marginTop: 3,
    fontSize: 11.5,
    fontWeight: "600",
  },

  verifiedRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  photoHint: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 7,
    gap: 5,
  },

  photoHintPressed: {
    opacity: 0.65,
  },

  photoHintText: {
    fontSize: 10,
    fontWeight: "800",
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "800",
  },


  // ===================================================
  // EMAIL
  // ===================================================

  emailBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  emailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emailContent: {
    flex: 1,
    marginLeft: 10,
  },

  emailLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  emailText: {
    marginTop: 3,
    fontSize: 11.5,
    fontWeight: "700",
  },

  // ===================================================
  // STATUS
  // ===================================================

  accountStatus: {
    marginTop: 11,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  statusTitle: {
    fontSize: 12,
    fontWeight: "900",
  },

  statusSubtitle: {
    marginTop: 2,
    fontSize: 9.5,
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    marginTop: 23,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },

  // ===================================================
  // OPTION
  // ===================================================

  option: {
    minHeight: 72,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  optionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  optionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: "900",
  },

  optionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
  },

  optionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // SETTING VALUE
  // ===================================================

  settingValue: {
    maxWidth: 105,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },

  settingValueText: {
    fontSize: 9,
    fontWeight: "800",
  },

  // ===================================================
  // PREFERENCE
  // ===================================================

  preferenceCard: {
    minHeight: 72,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  preferenceLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  // ===================================================
  // ABOUT
  // ===================================================

  aboutCard: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  aboutLogo: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  aboutContent: {
    flex: 1,
    marginLeft: 12,
  },

  aboutTitle: {
    fontSize: 14,
    fontWeight: "900",
  },

  aboutSubtitle: {
    marginTop: 2,
    fontSize: 10,
  },

  aboutVersion: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "700",
  },

  // ===================================================
  // LOGOUT
  // ===================================================

  logoutButton: {
    minHeight: 67,
    marginTop: 23,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  logoutPressed: {
    opacity: 0.72,
  },

  logoutIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutContent: {
    flex: 1,
    marginLeft: 12,
  },

  logoutTitle: {
    fontSize: 13,
    fontWeight: "900",
  },

  logoutSubtitle: {
    marginTop: 3,
    fontSize: 10,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  footerLine: {
    width: "100%",
    height: 1,
    marginBottom: 15,
  },

  footerCopyright: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },

  footerLogo: {
    width: 70,
    height: 38,
    marginTop: 14,
  },

  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "700",
  },

  footerVersion: {
    marginTop: 5,
    fontSize: 9,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  modalTitle: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 5,
    maxWidth: 290,
    fontSize: 10.5,
    lineHeight: 16,
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // THEME MODAL
  // ===================================================

  themeOptions: {
    marginTop: 20,
    gap: 10,
  },

  themeOption: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  themeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  themeContent: {
    flex: 1,
    marginLeft: 12,
  },

  themeTitle: {
    fontSize: 13,
    fontWeight: "900",
  },

  themeSubtitle: {
    marginTop: 3,
    fontSize: 10,
  },

  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  radioActive: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  themeInfo: {
    marginTop: 13,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  themeInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
  },

  // ===================================================
  // ACCOUNT MODAL
  // ===================================================

  modalProfile: {
    marginTop: 20,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  modalAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  modalAvatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  modalAvatarText: {
    fontSize: 18,
    fontWeight: "900",
  },

  modalProfileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  modalName: {
    fontSize: 15,
    fontWeight: "900",
  },

  modalUsername: {
    marginTop: 3,
    fontSize: 11,
  },

  detailsContainer: {
    marginTop: 16,
    borderRadius: 17,
    borderWidth: 1,
    overflow: "hidden",
  },

  detailRow: {
    minHeight: 62,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  detailContent: {
    flex: 1,
    marginLeft: 11,
  },

  detailLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },

  modalVerified: {
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  modalVerifiedContent: {
    flex: 1,
    marginLeft: 9,
  },

  modalVerifiedTitle: {
    fontSize: 12,
    fontWeight: "900",
  },

  modalVerifiedText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
  },

  // ===================================================
  // SECURITY MODAL
  // ===================================================

  securityHero: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },

  securityHeroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  securityHeroTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "900",
  },

  securityHeroText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
  },

  securityRow: {
    minHeight: 65,
    marginTop: 10,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  securityRowIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  securityRowContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  securityRowTitle: {
    fontSize: 11.5,
    fontWeight: "900",
  },

  securityRowDescription: {
    marginTop: 2,
    fontSize: 9.5,
    lineHeight: 14,
  },

  // ===================================================
  // ABOUT MODAL
  // ===================================================

  aboutModalHero: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },

  aboutModalLogo: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  aboutModalTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
  },

  aboutModalSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
  },

  versionBadge: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },

  versionBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  aboutDescription: {
    marginTop: 17,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  changePasswordHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  passwordForm: {
    marginTop: 20,
    gap: 10,
  },

  passwordField: {
    minHeight: 66,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordFieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordFieldContent: {
    flex: 1,
    marginLeft: 10,
  },

  passwordFieldLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  passwordInput: {
    marginTop: 1,
    padding: 0,
    minHeight: 25,
    fontSize: 13,
    fontWeight: "700",
  },

  passwordEye: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordRequirements: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -2,
  },

  passwordRequirementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  passwordRequirementsTitle: {
    marginLeft: 7,
    fontSize: 10.5,
    fontWeight: "900",
  },

  passwordRequirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 7,
    columnGap: 8,
  },

  passwordRequirementItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
  },

  passwordRequirementText: {
    marginLeft: 5,
    fontSize: 9.5,
    flexShrink: 1,
  },

  passwordHint: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  passwordHintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
  },

  changePasswordButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  // ===================================================
  // MODAL BUTTON
  // ===================================================

  modalDoneButton: {
    height: 50,
    marginTop: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  modalDoneText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  // ===================================================
  // PRESS
  // ===================================================

  pressed: {
    opacity: 0.72,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});