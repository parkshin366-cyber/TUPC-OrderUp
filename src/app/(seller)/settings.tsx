import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import {
  getMyStore,
  saveMyStore,
  type Store,
} from "../../services/api";

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

  const { token, logout } = useAuth();

  // =====================================================
  // STORE
  // =====================================================

  const [store, setStore] = useState<Store | null>(null);

  const [loadingStore, setLoadingStore] =
    useState(true);

  const [savingStore, setSavingStore] =
    useState(false);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] =
    useState("");
  const [location, setLocation] =
    useState("");
  const [openTime, setOpenTime] =
    useState("7:00 AM");
  const [closeTime, setCloseTime] =
    useState("6:00 PM");
  const [isOpen, setIsOpen] = useState(true);
  const [pickupEnabled, setPickupEnabled] =
    useState(true);

  // =====================================================
  // MODALS
  // =====================================================

  const [storeModalVisible, setStoreModalVisible] =
    useState(false);

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);

  // =====================================================
  // PASSWORD UI
  // =====================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // LOAD STORE
  // =====================================================

  const loadStore = async () => {
    if (!token) {
      setLoadingStore(false);
      return;
    }

    try {
      setLoadingStore(true);

      const result = await getMyStore(token);

      if (!result) {
        setStore(null);

        setStoreName("");
        setDescription("");
        setLocation("");
        setOpenTime("7:00 AM");
        setCloseTime("6:00 PM");
        setIsOpen(true);
        setPickupEnabled(true);

        return;
      }

      setStore(result);

      setStoreName(result.name ?? "");
      setDescription(result.description ?? "");
      setLocation(result.location ?? "");
      setOpenTime(result.openTime ?? "7:00 AM");
      setCloseTime(result.closeTime ?? "6:00 PM");
      setIsOpen(result.isOpen ?? true);
      setPickupEnabled(
        result.pickupEnabled ?? true
      );
    } catch (error) {
      console.error(
        "Load seller store error:",
        error
      );

      Alert.alert(
        "Unable to Load Store",
        error instanceof Error
          ? error.message
          : "Unable to load your store information."
      );
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, [token]);

  // =====================================================
  // SAVE STORE
  // =====================================================

  const handleSaveStore = async () => {
    if (!token) {
      Alert.alert(
        "Authentication Required",
        "Please log in again."
      );
      return;
    }

    if (!storeName.trim()) {
      Alert.alert(
        "Store Name Required",
        "Please enter your store name."
      );
      return;
    }

    try {
      setSavingStore(true);

      const savedStore = await saveMyStore(
        token,
        {
          name: storeName.trim(),
          description: description.trim(),
          location: location.trim(),
          openTime: openTime.trim(),
          closeTime: closeTime.trim(),
          isOpen,
          pickupEnabled,
        }
      );

      setStore(savedStore);

      setStoreName(savedStore.name);
      setDescription(
        savedStore.description ?? ""
      );
      setLocation(savedStore.location ?? "");
      setOpenTime(
        savedStore.openTime ?? "7:00 AM"
      );
      setCloseTime(
        savedStore.closeTime ?? "6:00 PM"
      );
      setIsOpen(savedStore.isOpen);
      setPickupEnabled(
        savedStore.pickupEnabled
      );

      setStoreModalVisible(false);

      Alert.alert(
        "Store Updated",
        "Your store settings have been saved to the database."
      );
    } catch (error) {
      console.error(
        "Save seller store error:",
        error
      );

      Alert.alert(
        "Save Failed",
        error instanceof Error
          ? error.message
          : "Unable to save your store settings."
      );
    } finally {
      setSavingStore(false);
    }
  };

  // =====================================================
  // STORE ONLINE / OFFLINE
  // =====================================================

  const handleStoreStatus = async (
    value: boolean
  ) => {
    if (!token) {
      return;
    }

    // Update UI immediately.
    setIsOpen(value);

    try {
      const savedStore = await saveMyStore(
        token,
        {
          name: storeName.trim(),
          description,
          location,
          openTime,
          closeTime,
          isOpen: value,
          pickupEnabled,
        }
      );

      setStore(savedStore);

      setIsOpen(savedStore.isOpen);
    } catch (error) {
      // Revert if backend save fails.
      setIsOpen(!value);

      console.error(
        "Update store status error:",
        error
      );

      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Unable to update store status."
      );
    }
  };

  // =====================================================
  // PICKUP
  // =====================================================

  const handlePickupToggle = async (
    value: boolean
  ) => {
    if (!token) {
      return;
    }

    setPickupEnabled(value);

    try {
      const savedStore = await saveMyStore(
        token,
        {
          name: storeName.trim(),
          description,
          location,
          openTime,
          closeTime,
          isOpen,
          pickupEnabled: value,
        }
      );

      setStore(savedStore);

      setPickupEnabled(
        savedStore.pickupEnabled
      );
    } catch (error) {
      setPickupEnabled(!value);

      console.error(
        "Update pickup setting error:",
        error
      );

      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Unable to update pickup setting."
      );
    }
  };

  // =====================================================
  // PASSWORD
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

    /*
     * IMPORTANT:
     * We are not pretending this changed the database.
     * Password API is not included in the current backend
     * code we have connected.
     */

    Alert.alert(
      "Not Connected Yet",
      "Password change needs a backend password endpoint before it can safely update MongoDB."
    );
  };

  // =====================================================
  // LOGOUT
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
              await logout();

              router.replace("/");
            } catch (error) {
              console.error(
                "Seller logout error:",
                error
              );

              Alert.alert(
                "Logout Failed",
                "Unable to sign out right now."
              );
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loadingStore) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={CARDINAL}
          />

          <Text style={styles.loadingText}>
            Loading your store...
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
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* =====================================================
              STORE CARD
          ===================================================== */}

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="storefront"
                size={25}
                color={WHITE}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text
                style={styles.accountName}
                numberOfLines={1}
              >
                {store?.name ||
                  "Store Not Created"}
              </Text>

              <Text
                style={styles.accountUsername}
                numberOfLines={2}
              >
                {store?.location ||
                  "No store location yet"}
              </Text>

              <View style={styles.verifiedRow}>
                <Ionicons
                  name={
                    store
                      ? "checkmark-circle"
                      : "alert-circle"
                  }
                  size={15}
                  color={
                    store ? GREEN : RED
                  }
                />

                <Text
                  style={[
                    styles.verifiedText,
                    {
                      color: store
                        ? GREEN
                        : RED,
                    },
                  ]}
                >
                  {store
                    ? "Store Connected"
                    : "Store Not Created"}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.editButton}
              onPress={() =>
                setStoreModalVisible(true)
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
                isOpen
                  ? "Customers can currently view and order from your store."
                  : "Your store is currently offline."
              }
              right={
                <Switch
                  value={isOpen}
                  onValueChange={
                    handleStoreStatus
                  }
                  disabled={
                    savingStore ||
                    !store
                  }
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    isOpen
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
              }
            />

            <Divider />

            <SettingRow
              icon="bag-handle-outline"
              iconBackground="#FFF6E4"
              iconColor="#B57A00"
              title="Pickup Available"
              description={
                pickupEnabled
                  ? "Customers can choose pickup for their orders."
                  : "Pickup is currently disabled."
              }
              right={
                <Switch
                  value={pickupEnabled}
                  onValueChange={
                    handlePickupToggle
                  }
                  disabled={
                    savingStore ||
                    !store
                  }
                  trackColor={{
                    false: "#D6D6D6",
                    true: "#D98A98",
                  }}
                  thumbColor={
                    pickupEnabled
                      ? CARDINAL
                      : "#F4F4F4"
                  }
                />
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
              description={
                store
                  ? "Manage your store name, location, schedule and pickup."
                  : "Create and configure your store."
              }
              onPress={() =>
                setStoreModalVisible(true)
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
              description="Manage your seller account information"
              onPress={() =>
                Alert.alert(
                  "Account Information",
                  "Your seller account is managed through the account system."
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
              LOGOUT
          ===================================================== */}

          <SectionTitle
            icon="log-out-outline"
            title="Session"
          />

          <View style={styles.dangerCard}>
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
          STORE SETTINGS MODAL
      ===================================================== */}

      <Modal
        visible={storeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setStoreModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() =>
              setStoreModalVisible(false)
            }
          />

          <View style={styles.storeModalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  STORE MANAGEMENT
                </Text>

                <Text style={styles.modalTitle}>
                  Store Settings
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setStoreModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={TEXT}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <InputField
                label="Store Name"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Enter store name"
              />

              <InputField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your store"
                multiline
              />

              <InputField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Enter store location"
              />

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <InputField
                    label="Opening Time"
                    value={openTime}
                    onChangeText={setOpenTime}
                    placeholder="7:00 AM"
                  />
                </View>

                <View
                  style={styles.timeFieldSpacing}
                />

                <View style={styles.timeField}>
                  <InputField
                    label="Closing Time"
                    value={closeTime}
                    onChangeText={setCloseTime}
                    placeholder="6:00 PM"
                  />
                </View>
              </View>

              <SettingRow
                icon="radio-outline"
                iconBackground="#EAF7F0"
                iconColor={GREEN}
                title="Store Online"
                description={
                  isOpen
                    ? "Customers can order from your store."
                    : "Customers cannot order while offline."
                }
                right={
                  <Switch
                    value={isOpen}
                    onValueChange={setIsOpen}
                    trackColor={{
                      false: "#D6D6D6",
                      true: "#D98A98",
                    }}
                    thumbColor={
                      isOpen
                        ? CARDINAL
                        : "#F4F4F4"
                    }
                  />
                }
              />

              <SettingRow
                icon="bag-handle-outline"
                iconBackground="#FFF6E4"
                iconColor="#B57A00"
                title="Pickup Available"
                description="Allow customers to choose pickup."
                right={
                  <Switch
                    value={pickupEnabled}
                    onValueChange={
                      setPickupEnabled
                    }
                    trackColor={{
                      false: "#D6D6D6",
                      true: "#D98A98",
                    }}
                    thumbColor={
                      pickupEnabled
                        ? CARDINAL
                        : "#F4F4F4"
                    }
                  />
                }
              />

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleSaveStore}
                disabled={savingStore}
              >
                {savingStore ? (
                  <ActivityIndicator
                    color={WHITE}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color={WHITE}
                    />

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Save Store Settings
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          PASSWORD MODAL
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

            <Text
              style={styles.modalDescription}
            >
              Password change requires the backend
              password endpoint.
            </Text>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={
                setCurrentPassword
              }
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
              onChangeText={
                setConfirmPassword
              }
              secure={!showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(
                  (current) => !current
                )
              }
              placeholder="Re-enter new password"
              show={showConfirmPassword}
            />

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSavePassword}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={WHITE}
              />

              <Text
                style={styles.saveButtonText}
              >
                Update Password
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// SECTION TITLE
// =====================================================

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

// =====================================================
// SETTING ROW
// =====================================================

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
            backgroundColor:
              iconBackground,
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

        <Text
          style={styles.settingDescription}
        >
          {description}
        </Text>
      </View>

      <View style={styles.settingRight}>
        {right}
      </View>
    </View>
  );
}

// =====================================================
// ACTION ROW
// =====================================================

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

      <View
        style={styles.actionTextContainer}
      >
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text
          style={styles.actionDescription}
        >
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

// =====================================================
// INPUT FIELD
// =====================================================

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A5A5A5"
        multiline={multiline}
        textAlignVertical={
          multiline ? "top" : "center"
        }
        style={[
          styles.textInput,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

// =====================================================
// PASSWORD FIELD
// =====================================================

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

// =====================================================
// DIVIDER
// =====================================================

function Divider() {
  return <View style={styles.divider} />;
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKGROUND,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: MUTED,
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
  },

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

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  storeModalContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    maxHeight: "90%",
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
    marginBottom: 16,
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

  inputContainer: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 7,
  },

  textInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    fontSize: 13,
    color: TEXT,
  },

  multilineInput: {
    minHeight: 85,
    paddingTop: 13,
  },

  timeRow: {
    flexDirection: "row",
  },

  timeField: {
    flex: 1,
  },

  timeFieldSpacing: {
    width: 10,
  },

  saveButton: {
    minHeight: 49,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 10,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: WHITE,
  },

  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    marginBottom: 17,
  },

  passwordFieldContainer: {
    marginBottom: 13,
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
});