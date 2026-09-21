import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// TUP CARDINAL THEME
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const CARDINAL_LIGHT = "#FCECEF";

const BG = "#F7F7F8";
const WHITE = "#FFFFFF";

const TEXT = "#171717";
const MUTED = "#737373";
const LIGHT_MUTED = "#9A9A9A";

const BORDER = "#E7E7E8";
const SUCCESS = "#238636";

const GOLD = "#D8B56A";

// =====================================================
// SCREEN
// =====================================================

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // ===================================================
  // USER INFORMATION
  // ===================================================

  const fullName = useMemo(() => {
    const firstName = user?.firstName?.trim() ?? "";
    const lastName = user?.lastName?.trim() ?? "";

    return `${firstName} ${lastName}`.trim() || "User";
  }, [user]);

  const username = useMemo(() => {
    if (user?.username?.trim()) {
      return `@${user.username.trim()}`;
    }

    return "@username";
  }, [user]);

  const email = useMemo(() => {
    return user?.email?.trim() || "No email available";
  }, [user]);

  const initials = useMemo(() => {
    const first = user?.firstName?.charAt(0) ?? "";
    const last = user?.lastName?.charAt(0) ?? "";

    const value = `${first}${last}`.toUpperCase();

    return value || "U";
  }, [user]);

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
              console.error("Logout error:", error);

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
  // PERSONAL INFORMATION
  // ===================================================

  const handlePersonalInformation = () => {
    setShowAccountModal(true);
  };

  // ===================================================
  // DELIVERY ADDRESSES
  // ===================================================

  const handleAddresses = () => {
    Alert.alert(
      "Campus Pickup Locations",
      "Your saved pickup locations will appear here once address management is connected.",
      [
        {
          text: "Browse Stores",
          onPress: () => router.push("/explore"),
        },
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  // ===================================================
  // FAVORITES
  // ===================================================

  const handleFavorites = () => {
    router.push("/explore");
  };

  // ===================================================
  // SECURITY
  // ===================================================

  const handleSecurity = () => {
    Alert.alert(
      "Security & Privacy",
      "Your account is protected using your registered credentials and verification system.",
      [
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  const handleNotifications = () => {
    setNotificationsEnabled((current) => !current);
  };

  // ===================================================
  // EDIT PROFILE
  // ===================================================

  const handleEditProfile = () => {
    setShowAccountModal(true);
  };

  // ===================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.screen}>
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>TUPC-ORDERUP</Text>

            <Text style={styles.headerTitle}>My Profile</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={handleEditProfile}
          >
            <Ionicons
              name="create-outline"
              size={21}
              color={CARDINAL}
            />
          </Pressable>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* =================================================
              PROFILE HERO
          ================================================= */}

          <View style={styles.profileHero}>
            <View style={styles.profileTop}>
              {/* AVATAR */}

              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                </View>
              </View>

              {/* PROFILE INFO */}

              <View style={styles.profileInfo}>
                <Text
                  style={styles.fullName}
                  numberOfLines={1}
                >
                  {fullName}
                </Text>

                <Text
                  style={styles.username}
                  numberOfLines={1}
                >
                  {username}
                </Text>

                <View style={styles.verifiedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={SUCCESS}
                  />

                  <Text style={styles.verifiedText}>
                    Verified Account
                  </Text>
                </View>
              </View>
            </View>

            {/* EMAIL */}

            <View style={styles.emailBox}>
              <View style={styles.emailIcon}>
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.emailContent}>
                <Text style={styles.emailLabel}>
                  Registered Email
                </Text>

                <Text
                  style={styles.emailText}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
            </View>

            {/* ACCOUNT STATUS */}

            <View style={styles.accountStatus}>
              <View style={styles.statusLeft}>
                <View style={styles.statusIcon}>
                  <Ionicons
                    name="shield-checkmark"
                    size={17}
                    color={SUCCESS}
                  />
                </View>

                <View>
                  <Text style={styles.statusTitle}>
                    Account protected
                  </Text>

                  <Text style={styles.statusSubtitle}>
                    Your account is ready to use
                  </Text>
                </View>
              </View>

              <Ionicons
                name="checkmark-circle"
                size={20}
                color={SUCCESS}
              />
            </View>
          </View>

          {/* =================================================
              ACCOUNT SECTION
          ================================================= */}

          <SectionHeader title="Account" />

          <ProfileOption
            icon="person-outline"
            title="Personal Information"
            subtitle="View your registered account details"
            onPress={handlePersonalInformation}
          />

          <ProfileOption
            icon="location-outline"
            title="Campus Pickup Locations"
            subtitle="Manage your preferred pickup locations"
            onPress={handleAddresses}
          />

          <ProfileOption
            icon="heart-outline"
            title="Favorites"
            subtitle="Browse your saved stores and products"
            onPress={handleFavorites}
          />

          {/* =================================================
              SECURITY SECTION
          ================================================= */}

          <SectionHeader title="Security & Preferences" />

          <ProfileOption
            icon="shield-checkmark-outline"
            title="Security & Privacy"
            subtitle="Review your account security settings"
            onPress={handleSecurity}
          />

          {/* NOTIFICATIONS */}

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceLeft}>
              <View style={styles.optionIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  Notifications
                </Text>

                <Text style={styles.optionSubtitle}>
                  Order updates and important account alerts
                </Text>
              </View>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotifications}
              trackColor={{
                false: "#D7D7D7",
                true: "#DFA0AA",
              }}
              thumbColor={
                notificationsEnabled
                  ? CARDINAL
                  : "#F4F4F4"
              }
              ios_backgroundColor="#D7D7D7"
            />
          </View>

          {/* =================================================
              APP INFORMATION
          ================================================= */}

          <SectionHeader title="About" />

          <View style={styles.aboutCard}>
            <View style={styles.aboutLogo}>
              <Ionicons
                name="school-outline"
                size={25}
                color={WHITE}
              />
            </View>

            <View style={styles.aboutContent}>
              <Text style={styles.aboutTitle}>
                TUPC-OrderUp
              </Text>

              <Text style={styles.aboutSubtitle}>
                Campus ordering made simple.
              </Text>

              <Text style={styles.aboutVersion}>
                Version 1.0.0
              </Text>
            </View>

            <View style={styles.aboutBadge}>
              <Ionicons
                name="checkmark"
                size={14}
                color={SUCCESS}
              />

              <Text style={styles.aboutBadgeText}>
                Official
              </Text>
            </View>
          </View>

          {/* =================================================
              SIGN OUT
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
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

            <View style={styles.logoutContent}>
              <Text style={styles.logoutTitle}>
                Sign Out
              </Text>

              <Text style={styles.logoutSubtitle}>
                Sign out from this account
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#B0B0B0"
            />
          </Pressable>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <View style={styles.footerBrand}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={MUTED}
              />

              <Text style={styles.footerText}>
                Secure campus ordering
              </Text>
            </View>

            <Text style={styles.footerVersion}>
              TUPC-OrderUp • v1.0.0
            </Text>
          </View>
        </ScrollView>

        {/* =================================================
            ACCOUNT INFORMATION MODAL
        ================================================= */}

        <Modal
          visible={showAccountModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAccountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowAccountModal(false)}
            />

            <View style={styles.modalCard}>
              {/* MODAL HANDLE */}

              <View style={styles.modalHandle} />

              {/* MODAL HEADER */}

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>
                    ACCOUNT
                  </Text>

                  <Text style={styles.modalTitle}>
                    Personal Information
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalClose,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setShowAccountModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={TEXT}
                  />
                </Pressable>
              </View>

              {/* AVATAR */}

              <View style={styles.modalProfile}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {initials}
                  </Text>
                </View>

                <View style={styles.modalProfileInfo}>
                  <Text style={styles.modalName}>
                    {fullName}
                  </Text>

                  <Text style={styles.modalUsername}>
                    {username}
                  </Text>
                </View>
              </View>

              {/* DETAILS */}

              <View style={styles.detailsContainer}>
                <AccountDetail
                  icon="person-outline"
                  label="Full Name"
                  value={fullName}
                />

                <AccountDetail
                  icon="at-outline"
                  label="Username"
                  value={username}
                />

                <AccountDetail
                  icon="mail-outline"
                  label="Email"
                  value={email}
                />
              </View>

              {/* VERIFIED */}

              <View style={styles.modalVerified}>
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={SUCCESS}
                />

                <View style={styles.modalVerifiedContent}>
                  <Text style={styles.modalVerifiedTitle}>
                    Verified Account
                  </Text>

                  <Text style={styles.modalVerifiedText}>
                    Your account information is securely
                    associated with your TUPC-OrderUp
                    account.
                  </Text>
                </View>
              </View>

              {/* CLOSE */}

              <Pressable
                style={({ pressed }) => [
                  styles.modalDoneButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.modalDoneText}>
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
}: {
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        pressed && styles.optionPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={CARDINAL}
        />
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>
          {title}
        </Text>

        <Text
          style={styles.optionSubtitle}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.optionArrow}>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#A8A8A8"
        />
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={CARDINAL}
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={2}
        >
          {value}
        </Text>
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
    backgroundColor: BG,
  },

  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    minHeight: 70,
    paddingHorizontal: 20,
    paddingTop: 7,
    paddingBottom: 9,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: CARDINAL,
  },

  headerTitle: {
    marginTop: 3,
    fontSize: 23,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: CARDINAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // SCROLL
  // ===================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 17,

    // Extra space for the bottom tab bar.
    paddingBottom: 125,
  },

  // ===================================================
  // PROFILE HERO
  // ===================================================

  profileHero: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: CARDINAL_LIGHT,
    borderWidth: 2,
    borderColor: "#F2D5DA",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: CARDINAL,
  },

  onlineBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: SUCCESS,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  fullName: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  username: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },

  verifiedRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "800",
    color: SUCCESS,
  },

  // ===================================================
  // EMAIL
  // ===================================================

  emailBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  emailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CARDINAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  emailContent: {
    flex: 1,
    marginLeft: 10,
  },

  emailLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: LIGHT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  emailText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },

  // ===================================================
  // ACCOUNT STATUS
  // ===================================================

  accountStatus: {
    marginTop: 11,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F5FBF6",
    borderWidth: 1,
    borderColor: "#DCEFE0",
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
    backgroundColor: "#E7F5EA",
    alignItems: "center",
    justifyContent: "center",
  },

  statusTitle: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  statusSubtitle: {
    marginLeft: 10,
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  // ===================================================
  // SECTIONS
  // ===================================================

  sectionHeader: {
    marginTop: 23,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  // ===================================================
  // OPTIONS
  // ===================================================

  option: {
    minHeight: 72,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: CARDINAL_LIGHT,
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
    color: TEXT,
  },

  optionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  optionArrow: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // PREFERENCE
  // ===================================================

  preferenceCard: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  aboutLogo: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: CARDINAL,
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
    color: TEXT,
  },

  aboutSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  aboutVersion: {
    marginTop: 5,
    fontSize: 9,
    color: LIGHT_MUTED,
    fontWeight: "700",
  },

  aboutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F0F8F1",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  aboutBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: SUCCESS,
  },

  // ===================================================
  // LOGOUT
  // ===================================================

  logoutButton: {
    minHeight: 67,
    marginTop: 23,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#F0CDD2",
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
    backgroundColor: CARDINAL_LIGHT,
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
    color: CARDINAL,
  },

  logoutSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
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
    backgroundColor: BORDER,
    marginBottom: 15,
  },

  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    marginLeft: 5,
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  footerVersion: {
    marginTop: 5,
    fontSize: 9,
    color: LIGHT_MUTED,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
  },

  modalCard: {
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
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5D5D5",
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: CARDINAL,
  },

  modalTitle: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  modalProfile: {
    marginTop: 20,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CARDINAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  modalAvatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: CARDINAL,
  },

  modalProfileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  modalName: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  modalUsername: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
  },

  // ===================================================
  // DETAILS
  // ===================================================

  detailsContainer: {
    marginTop: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  detailRow: {
    minHeight: 62,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: CARDINAL_LIGHT,
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
    color: LIGHT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },

  // ===================================================
  // MODAL VERIFIED
  // ===================================================

  modalVerified: {
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#F5FBF6",
    borderWidth: 1,
    borderColor: "#DCEFE0",
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
    color: SUCCESS,
  },

  modalVerifiedText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  // ===================================================
  // MODAL BUTTON
  // ===================================================

  modalDoneButton: {
    height: 50,
    marginTop: 17,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  modalDoneText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "900",
  },

  // ===================================================
  // PRESS STATES
  // ===================================================

  pressed: {
    opacity: 0.72,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
