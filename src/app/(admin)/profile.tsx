import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "../../components/logout-confirm-modal";

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const BG = "#F7F7F8";
const WHITE = "#FFFFFF";

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Administrator";
  const initials = `${user?.firstName?.[0] ?? "A"}${user?.lastName?.[0] ?? "D"}`.toUpperCase();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setLogoutVisible(false);
      router.replace("/");
    } catch {
      Alert.alert("Unable to Log Out", "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>MASTER ADMIN</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your administrator account and platform controls.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={styles.profileCopy}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.username} numberOfLines={1}>@{user?.username ?? "admin"}</Text>
            <View style={styles.rolePill}><Ionicons name="shield-checkmark" size={13} color={CARDINAL} /><Text style={styles.roleText}>ADMINISTRATOR</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Platform Controls</Text>
        <View style={styles.menuCard}>
          <ProfileRow icon="ticket-outline" title="Vouchers" subtitle="Create and manage platform promotions" onPress={() => router.push("/(admin)/vouchers")} />
          <ProfileRow icon="settings-outline" title="Settings" subtitle="Platform configuration and preferences" onPress={() => router.push("/(admin)/settings")} />
          <ProfileRow icon="shield-checkmark-outline" title="Security" subtitle="Review account and access controls" onPress={() => router.push("/(admin)/security")} />
          <ProfileRow icon="server-outline" title="Database" subtitle="View platform data and backup tools" onPress={() => router.push("/(admin)/database")} last />
        </View>

        <Text style={styles.sectionTitle}>Session</Text>
        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#B42318" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
      <LogoutConfirmModal visible={logoutVisible} loading={loggingOut} accountLabel={user?.email || user?.username || "Administrator account"} onCancel={() => setLogoutVisible(false)} onConfirm={() => void confirmLogout()} />
    </SafeAreaView>
  );
}

function ProfileRow({ icon, title, subtitle, onPress, last = false }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  return <Pressable style={({ pressed }) => [styles.menuRow, !last && styles.menuDivider, pressed && styles.pressed]} onPress={onPress}>
    <View style={styles.menuIcon}><Ionicons name={icon} size={20} color={CARDINAL} /></View>
    <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View>
    <Ionicons name="chevron-forward" size={19} color="#A5A5A5" />
  </Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F7F8" }, content: { padding: 20, paddingBottom: 34 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.4, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: "900", color: "#171717", letterSpacing: -0.7 },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#737373" },
  profileCard: { marginTop: 22, padding: 17, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E7E8", flexDirection: "row", alignItems: "center" },
  avatar: { width: 66, height: 66, borderRadius: 21, backgroundColor: "#A6192E", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" }, profileCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  name: { color: "#171717", fontSize: 18, fontWeight: "900" }, username: { marginTop: 2, color: "#737373", fontSize: 12 },
  rolePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: "#F8EDF0" },
  roleText: { color: "#A6192E", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  sectionTitle: { marginTop: 25, marginBottom: 9, color: "#171717", fontSize: 15, fontWeight: "900" },
  menuCard: { borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E7E8", overflow: "hidden" },
  menuRow: { minHeight: 75, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }, menuDivider: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  menuIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F8EDF0", alignItems: "center", justifyContent: "center" },
  menuCopy: { flex: 1, marginLeft: 11, marginRight: 8 }, menuTitle: { color: "#171717", fontSize: 13, fontWeight: "800" }, menuSubtitle: { marginTop: 2, color: "#737373", fontSize: 10.5 },
  logoutButton: { height: 54, borderWidth: 1, borderColor: "#F0CACA", borderRadius: 16, backgroundColor: "#FFF8F8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: "#B42318", fontSize: 14, fontWeight: "900" }, pressed: { opacity: 0.75 },
});

