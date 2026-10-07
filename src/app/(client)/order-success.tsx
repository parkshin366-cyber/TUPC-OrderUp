import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../context/ThemeContext";
import { createThemedStyleSheet } from "../../utils/themeStyles";

const CARDINAL = "#A6192E";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function OrderSuccessScreen() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const params = useLocalSearchParams<{ orderId?: string; storeName?: string; itemCount?: string; total?: string }>();
  const itemCount = Math.max(0, Number(params.itemCount) || 0);
  const total = Math.max(0, Number(params.total) || 0);
  const shortOrderId = params.orderId ? params.orderId.slice(-6).toUpperCase() : "NEW";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.successIcon}><Ionicons name="checkmark" size={42} color="#FFFFFF" /></View>
        <Text style={styles.title}>Order confirmed</Text>
        <Text style={styles.subtitle}>Your order was sent to {params.storeName || "the store"}. Follow its preparation time and status in My Orders.</Text>

        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.label}>Order number</Text><Text style={styles.value}>#{shortOrderId}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Items</Text><Text style={styles.value}>{itemCount}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Amount</Text><Text style={styles.total}>₱{total.toFixed(2)}</Text></View>
        </View>

        <View style={styles.info}><Ionicons name="time-outline" size={19} color={CARDINAL} /><Text style={styles.infoText}>The seller will post an estimated ready time after accepting your order.</Text></View>

        <Pressable onPress={() => router.replace("/(client)/orders")} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Track My Order</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={() => router.replace("/(client)/store")} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Browse More Stores</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
  safe: { flex: 1, backgroundColor: "#F7F7F8" },
  content: { flex: 1, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: CARDINAL, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  title: { color: TEXT, fontSize: 27, fontWeight: "900", textAlign: "center" },
  subtitle: { maxWidth: 360, marginTop: 8, color: MUTED, fontSize: 13, lineHeight: 20, textAlign: "center" },
  card: { width: "100%", maxWidth: 430, marginTop: 25, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF" },
  row: { minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  divider: { height: 1, backgroundColor: BORDER },
  label: { color: MUTED, fontSize: 12, fontWeight: "700" },
  value: { color: TEXT, fontSize: 13, fontWeight: "900" },
  total: { color: CARDINAL, fontSize: 17, fontWeight: "900" },
  info: { width: "100%", maxWidth: 430, marginTop: 13, padding: 13, borderRadius: 14, backgroundColor: "#FBECEF", flexDirection: "row", alignItems: "center", gap: 9 },
  infoText: { flex: 1, color: "#6E2733", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  primary: { width: "100%", maxWidth: 430, height: 52, marginTop: 22, borderRadius: 14, backgroundColor: CARDINAL, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  secondary: { width: "100%", maxWidth: 430, height: 48, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: CARDINAL, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  secondaryText: { color: CARDINAL, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.82 },
});
let styles = createStyles(LIGHT_COLORS);
