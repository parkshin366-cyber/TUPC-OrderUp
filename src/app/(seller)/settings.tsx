import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const BACKGROUND = "#F7F7F8";
const WHITE = "#FFFFFF";
const GREEN = "#18864B";
const RED = "#C62828";

export default function SellerSettings() {
  // =====================================================
  // AUTH
  // =====================================================

  const { logout } = useAuth();

  // =====================================================
  // SETTINGS STATE
  // =====================================================

  const [notifications, setNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  // =====================================================
  // PASSWORD STATE
  // =====================================================

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // BIOMETRIC
  // =====================================================

  const handleBiometricToggle = (value: boolean) => {
    if (!value) {
      setBiometric(false);
      return;
    }

    Alert.alert(
      "Enable Biometric Login",
      "Use your device fingerprint or Face ID to sign in faster and securely.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Enable",
          onPress: () => {
            setBiometric(true);

            Alert.alert(
              "Biometric Enabled",
              "Biometric login has been enabled for this seller account."
            );
          },
        },
      ]
    );
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleSavePassword = () => {
    if (!currentPassword.trim()) {
      Alert.alert(
        "Required",
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        "Required",
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password Too Short",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure your new passwords match."
      );
      return;
    }

    setPasswordModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    Alert.alert(
      "Password Updated",
      "Your seller account password has been updated successfully."
    );
  };

  // =====================================================
  // LOGOUT
  //
  // Clears AuthContext + SecureStore session,
  // then returns to src/app/index.tsx.
  // =====================================================

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your seller account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              // -------------------------------------------
              // CLEAR AUTH SESSION
              //
              // This should clear:
              // - React auth state
              // - stored token
              // - stored user
              // - Remember Me flag
              // -------------------------------------------

              await logout();

              // -------------------------------------------
              // RETURN TO THE ACTUAL LOGIN SCREEN
              //
              // src/app/index.tsx
              // -------------------------------------------

              router.replace("/");
            } catch (error) {
              console.error(
                "Seller logout error:",
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

  // =====================================================
  // DEACTIVATE ACCOUNT
  // =====================================================

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Seller Account",
      "Your store will no longer be visible to customers while your account is deactivated.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => {
            setOnlineStatus(false);

            Alert.alert(
              "Account Deactivated",
              "Your seller account has been marked for deactivation."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.container}>
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              SELLER CENTER
            </Text>

            <Text style={styles.title}>
              Settings
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={CARDINAL}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* =====================================================
              ACCOUNT CARD
          ===================================================== */}

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                JS
              </Text>
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                Juan's Food Hub
              </Text>

              <Text style={styles.accountUsername}>
                @juansfoodhub
              </Text>

              <View style={styles.verifiedRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={GREEN}
                />

                <Text style={styles.verifiedText}>
                  Verified Seller
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.editButton}
              onPress={() =>
                Alert.alert(
                  "Edit Profile",
                  "Seller profile editing will be connected to the backend later."
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={CARDINAL}
              />
            </Pressable>
          </View>

          {/* =====================================================
              STORE STATUS
          ===================================================== */}

          <SectionTitle
            icon="storefront-outline"
            title="Store Status"
          />

          <View style={styles.card}>
            <SettingRow
              icon="radio-outline"
              iconBackground="#EAF7F0"
              iconColor={GREEN}
              title="Store Online"
              description={
                onlineStatus
                  ? "Customers can currently view and order from your store."
                  : "Your store is currently offline."
              }
              right={
                <Switch
                  value={onlineStatus}
                  onValueChange={setOnlineStatus}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    onlineStatus
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />

            <Divider />

            <SettingRow
              icon="flash-outline"
              iconBackground="#FFF6E4"
              iconColor="#B57A00"
              title="Auto Accept Orders"
              description="Automatically accept incoming orders."
              right={
                <Switch
                  value={autoAccept}
                  onValueChange={setAutoAccept}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    autoAccept
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />
          </View>

          {/* =====================================================
              ACCOUNT
          ===================================================== */}

          <SectionTitle
            icon="person-outline"
            title="Account"
          />

          <View style={styles.card}>
            <ActionRow
              icon="person-circle-outline"
              title="Account Information"
              description="Name, username, email and contact details"
              onPress={() =>
                Alert.alert(
                  "Account Information",
                  "Seller account information will be editable here."
                )
              }
            />

            <Divider />

            <ActionRow
              icon="lock-closed-outline"
              title="Change Password"
              description="Update your seller account password"
              onPress={() =>
                setPasswordModalVisible(true)
              }
            />

            <Divider />

            <ActionRow
              icon="shield-checkmark-outline"
              title="Security"
              description="Manage account security and verification"
              onPress={() =>
                Alert.alert(
                  "Security",
                  "Additional seller security controls will be connected here."
                )
              }
            />
          </View>

          {/* =====================================================
              NOTIFICATIONS
          ===================================================== */}

          <SectionTitle
            icon="notifications-outline"
            title="Notifications"
          />

          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              iconBackground="#FBECEE"
              iconColor={CARDINAL}
              title="Push Notifications"
              description="Receive important seller notifications."
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    notifications
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />

            <Divider />

            <SettingRow
              icon="receipt-outline"
              iconBackground="#F3EDF7"
              iconColor="#72558A"
              title="Order Alerts"
              description="Get notified when customers place orders."
              right={
                <Switch
                  value={orderAlerts}
                  onValueChange={setOrderAlerts}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    orderAlerts
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />

            <Divider />

            <SettingRow
              icon="volume-high-outline"
              iconBackground="#EEF4FB"
              iconColor="#386A9F"
              title="Sound Alerts"
              description="Play a sound for new order notifications."
              right={
                <Switch
                  value={soundAlerts}
                  onValueChange={setSoundAlerts}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    soundAlerts
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />
          </View>

          {/* =====================================================
              LOGIN & SECURITY
          ===================================================== */}

          <SectionTitle
            icon="finger-print-outline"
            title="Login & Security"
          />

          <View style={styles.card}>
            <SettingRow
              icon="finger-print-outline"
              iconBackground="#FBECEE"
              iconColor={CARDINAL}
              title="Biometric Login"
              description="Use fingerprint or Face ID for faster login."
              right={
                <Switch
                  value={biometric}
                  onValueChange={handleBiometricToggle}
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    biometric
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />

            <Divider />

            <ActionRow
              icon="key-outline"
              title="Password & Authentication"
              description="Manage your password and authentication methods"
              onPress={() =>
                setPasswordModalVisible(true)
              }
            />

            <Divider />

            <ActionRow
              icon="phone-portrait-outline"
              title="Trusted Devices"
              description="View devices currently signed in to your account"
              onPress={() =>
                Alert.alert(
                  "Trusted Devices",
                  "Device management will be connected to the backend later."
                )
              }
            />
          </View>

          {/* =====================================================
              STORE MANAGEMENT
          ===================================================== */}

          <SectionTitle
            icon="settings-outline"
            title="Store Management"
          />

          <View style={styles.card}>
            <ActionRow
              icon="storefront-outline"
              title="Store Settings"
              description="Manage your store information and appearance"
              onPress={() =>
                router.push(
                  "/(seller)/store"
                )
              }
            />

            <Divider />

            <ActionRow
              icon="cube-outline"
              title="Inventory"
              description="Manage stock and inventory levels"
              onPress={() =>
                router.push(
                  "/(seller)/inventory"
                )
              }
            />

            <Divider />

            <ActionRow
              icon="fast-food-outline"
              title="Products"
              description="Add, edit and manage your products"
              onPress={() =>
                router.push(
                  "/(seller)/products"
                )
              }
            />
          </View>

          {/* =====================================================
              SUPPORT
          ===================================================== */}

          <SectionTitle
            icon="help-circle-outline"
            title="Support"
          />

          <View style={styles.card}>
            <ActionRow
              icon="help-buoy-outline"
              title="Help Center"
              description="Get help with your seller account"
              onPress={() =>
                Alert.alert(
                  "Help Center",
                  "Seller support resources will be available here."
                )
              }
            />

            <Divider />

            <ActionRow
              icon="chatbubble-ellipses-outline"
              title="Contact Support"
              description="Contact the TUPC-OrderUp support team"
              onPress={() =>
                Alert.alert(
                  "Contact Support",
                  "Support contact options will be connected later."
                )
              }
            />

            <Divider />

            <ActionRow
              icon="document-text-outline"
              title="Terms & Policies"
              description="Review seller terms and policies"
              onPress={() =>
                Alert.alert(
                  "Terms & Policies",
                  "Terms and policies will be displayed here."
                )
              }
            />
          </View>

          {/* =====================================================
              DANGER ZONE
          ===================================================== */}

          <SectionTitle
            icon="warning-outline"
            title="Account"
          />

          <View style={styles.dangerCard}>
            {/* DEACTIVATE */}

            <Pressable
              style={({ pressed }) => [
                styles.dangerRow,
                pressed && styles.pressed,
              ]}
              onPress={handleDeactivate}
            >
              <View style={styles.dangerIcon}>
                <Ionicons
                  name="pause-circle-outline"
                  size={21}
                  color={RED}
                />
              </View>

              <View
                style={styles.dangerTextContainer}
              >
                <Text style={styles.dangerTitle}>
                  Deactivate Seller Account
                </Text>

                <Text
                  style={styles.dangerDescription}
                >
                  Temporarily disable your seller account and store.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#B9B9B9"
              />
            </Pressable>

            <View style={styles.dangerDivider} />

            {/* LOGOUT */}

            <Pressable
              style={({ pressed }) => [
                styles.dangerRow,
                pressed && styles.pressed,
              ]}
              onPress={handleLogout}
            >
              <View style={styles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={CARDINAL}
                />
              </View>

              <View
                style={styles.dangerTextContainer}
              >
                <Text style={styles.logoutTitle}>
                  Log Out
                </Text>

                <Text
                  style={styles.dangerDescription}
                >
                  Sign out from your seller account.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#B9B9B9"
              />
            </Pressable>
          </View>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <View style={styles.footer}>
            <View style={styles.footerLogo}>
              <Ionicons
                name="bag-handle"
                size={17}
                color={WHITE}
              />
            </View>

            <Text style={styles.footerBrand}>
              TUPC-OrderUp
            </Text>

            <Text style={styles.footerVersion}>
              Seller Center • v1.0.0
            </Text>

            <Text style={styles.footerCopyright}>
              Powered for TUP Campus Commerce
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPasswordModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() =>
              setPasswordModalVisible(false)
            }
          />

          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  ACCOUNT SECURITY
                </Text>

                <Text style={styles.modalTitle}>
                  Change Password
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setPasswordModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={TEXT}
                />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Create a strong password with at least 8 characters.
            </Text>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secure={!showCurrentPassword}
              onToggle={() =>
                setShowCurrentPassword(
                  (current) => !current
                )
              }
              placeholder="Enter current password"
              show={showCurrentPassword}
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secure={!showNewPassword}
              onToggle={() =>
                setShowNewPassword(
                  (current) => !current
                )
              }
              placeholder="Enter new password"
              show={showNewPassword}
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure={!showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(
                  (current) => !current
                )
              }
              placeholder="Re-enter new password"
              show={showConfirmPassword}
            />

            <View style={styles.passwordHint}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={CARDINAL}
              />

              <Text style={styles.passwordHintText}>
                Use a password that you do not use on other accounts.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setPasswordModalVisible(false)
                }
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.updateButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleSavePassword}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={WHITE}
                />

                <Text style={styles.updateButtonText}>
                  Update Password
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons
        name={icon}
        size={17}
        color={CARDINAL}
      />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

/* =====================================================
   SETTING ROW
===================================================== */

function SettingRow({
  icon,
  iconBackground,
  iconColor,
  title,
  description,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  title: string;
  description: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View
        style={[
          styles.settingIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.settingRight}>
        {right}
      </View>
    </View>
  );
}

/* =====================================================
   ACTION ROW
===================================================== */

function ActionRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={CARDINAL}
        />
      </View>

      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#B9B9B9"
      />
    </Pressable>
  );
}

/* =====================================================
   DIVIDER
===================================================== */

function Divider() {
  return <View style={styles.divider} />;
}

/* =====================================================
   PASSWORD FIELD
===================================================== */

function PasswordField({
  label,
  value,
  onChangeText,
  secure,
  onToggle,
  placeholder,
  show,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure: boolean;
  onToggle: () => void;
  placeholder: string;
  show: boolean;
}) {
  return (
    <View style={styles.passwordFieldContainer}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View style={styles.passwordInputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={MUTED}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A5A5A5"
          secureTextEntry={secure}
          autoCapitalize="none"
          style={styles.passwordInput}
        />

        <Pressable
          onPress={onToggle}
          hitSlop={8}
        >
          <Ionicons
            name={
              show
                ? "eye-outline"
                : "eye-off-outline"
            }
            size={20}
            color={MUTED}
          />
        </Pressable>
      </View>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: CARDINAL,
    marginBottom: 2,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -0.5,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FBECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  /* ACCOUNT */

  accountCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F4DDE1",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: WHITE,
  },

  accountInfo: {
    flex: 1,
    marginLeft: 13,
  },

  accountName: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  accountUsername: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: GREEN,
    marginLeft: 4,
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FBECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  /* SECTION */

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
    marginLeft: 7,
    letterSpacing: 0.1,
  },

  /* CARD */

  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 21,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F1",
    marginLeft: 68,
  },

  /* SETTING */

  settingRow: {
    minHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },

  settingDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    marginTop: 3,
  },

  settingRight: {
    marginLeft: 5,
  },

  /* ACTION */

  actionRow: {
    minHeight: 75,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FBECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },

  actionDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    marginTop: 3,
  },

  pressed: {
    opacity: 0.7,
  },

  /* DANGER */

  dangerCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0D9DC",
    overflow: "hidden",
    marginBottom: 22,
  },

  dangerRow: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  dangerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FBECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  dangerTextContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  dangerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: RED,
  },

  logoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: CARDINAL,
  },

  dangerDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    marginTop: 3,
  },

  dangerDivider: {
    height: 1,
    backgroundColor: "#F2E4E6",
    marginLeft: 68,
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
  },

  footerLogo: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  footerVersion: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
    marginTop: 3,
  },

  footerCopyright: {
    fontSize: 9,
    color: "#A0A0A0",
    marginTop: 4,
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  modalContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 10,
    backgroundColor: "#D6D6D6",
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: CARDINAL,
    marginBottom: 3,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: TEXT,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F2F2F3",
    alignItems: "center",
    justifyContent: "center",
  },

  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    marginTop: 8,
    marginBottom: 17,
  },

  passwordFieldContainer: {
    marginBottom: 13,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 7,
  },

  passwordInputWrapper: {
    height: 49,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: TEXT,
    marginLeft: 9,
  },

  passwordHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FBECEE",
    borderRadius: 12,
    padding: 11,
    marginTop: 2,
    marginBottom: 18,
  },

  passwordHintText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: CARDINAL_DARK,
    marginLeft: 7,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 49,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },

  updateButton: {
    flex: 1.45,
    height: 49,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  updateButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: WHITE,
  },
});