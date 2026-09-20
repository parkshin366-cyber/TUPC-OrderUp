import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    "User";

  const username = user?.username
    ? `@${user.username}`
    : "@username";

  const initials =
    `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`
      .toUpperCase() || "U";

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your account?",
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
              // Clear authentication state and stored session
              await logout();

              // Go back to the root entry point.
              // src/app/index.tsx will handle redirecting
              // the user to the Login screen.
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

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.eyebrow}>ACCOUNT</Text>

        <Text style={styles.title}>My Profile</Text>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>

            <Text style={styles.username} numberOfLines={1}>
              {username}
            </Text>

            <View style={styles.verified}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#2E8B57"
              />

              <Text style={styles.verifiedText}>
                Verified Account
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={CARDINAL}
            />
          </Pressable>
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>Account</Text>

        <ProfileOption
          icon="person-outline"
          title="Personal Information"
          subtitle="Manage your account details"
        />

        <ProfileOption
          icon="location-outline"
          title="Delivery Addresses"
          subtitle="Manage saved campus locations"
        />

        <ProfileOption
          icon="heart-outline"
          title="Favorites"
          subtitle="Your saved stores and products"
        />

        {/* SECURITY */}
        <Text style={styles.sectionTitle}>Security</Text>

        <ProfileOption
          icon="shield-checkmark-outline"
          title="Security & Privacy"
          subtitle="Password and biometric settings"
        />

        <ProfileOption
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage notification preferences"
        />

        {/* LOGOUT */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={CARDINAL}
          />

          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>
          TUPC-OrderUp v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileOption({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.optionIcon}>
        <Ionicons
          name={icon as any}
          size={21}
          color={CARDINAL}
        />
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>

        <Text style={styles.optionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#AAAAAA"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: CARDINAL,
  },

  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  profileCard: {
    marginTop: 22,
    padding: 17,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "900",
    color: CARDINAL,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  name: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  username: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
  },

  verified: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#2E8B57",
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 11,
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  option: {
    minHeight: 70,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  optionContent: {
    flex: 1,
    marginLeft: 12,
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  optionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  logoutButton: {
    height: 52,
    marginTop: 25,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0CDD2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutPressed: {
    opacity: 0.7,
  },

  logoutText: {
    fontSize: 13,
    fontWeight: "800",
    color: CARDINAL,
  },

  version: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 10,
    color: MUTED,
  },
});