import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  loading?: boolean;
  accountLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutConfirmModal({ visible, loading = false, accountLabel = "your account", onCancel, onConfirm }: Props) {
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={loading ? undefined : onCancel}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} disabled={loading} onPress={onCancel} />
      <View style={styles.card}>
        <View style={styles.icon}><Ionicons name="log-out-outline" size={28} color="#B42318" /></View>
        <Text style={styles.title}>Log out?</Text>
        <Text style={styles.message}>You will be returned to the login screen. You can sign in again anytime.</Text>
        <View style={styles.accountPill}><Ionicons name="person-circle-outline" size={17} color="#737373" /><Text style={styles.accountText} numberOfLines={1}>{accountLabel}</Text></View>
        <View style={styles.actions}>
          <Pressable disabled={loading} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]} onPress={onCancel}><Text style={styles.cancelText}>Stay Logged In</Text></Pressable>
          <Pressable disabled={loading} style={({ pressed }) => [styles.logout, pressed && styles.pressed, loading && styles.disabled]} onPress={onConfirm}>
            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Ionicons name="log-out-outline" size={17} color="#FFFFFF" /><Text style={styles.logoutText}>Log Out</Text></>}
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, paddingHorizontal: 24, backgroundColor: "rgba(16,16,18,0.56)", alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 410, padding: 21, borderRadius: 23, backgroundColor: "#FFFFFF", alignItems: "center", shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: .18, shadowRadius: 18, elevation: 15 },
  icon: { width: 58, height: 58, borderRadius: 19, backgroundColor: "#FFF0F0", alignItems: "center", justifyContent: "center" },
  title: { marginTop: 14, fontSize: 20, fontWeight: "900", color: "#171717" },
  message: { marginTop: 7, maxWidth: 300, fontSize: 11.5, lineHeight: 18, color: "#737373", textAlign: "center" },
  accountPill: { width: "100%", minHeight: 42, marginTop: 16, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#F6F6F7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  accountText: { flexShrink: 1, fontSize: 10.5, fontWeight: "800", color: "#555555" },
  actions: { width: "100%", marginTop: 17, flexDirection: "row", gap: 10 },
  cancel: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: "#E1E1E3", alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 11, fontWeight: "900", color: "#333333" },
  logout: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#B42318", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  logoutText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  pressed: { opacity: .75 }, disabled: { opacity: .65 },
});
