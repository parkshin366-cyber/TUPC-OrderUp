import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const BG = "#F7F7F8";

export default function OrderSuccess() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <View style={styles.innerCircle}>
            <Ionicons
              name="checkmark"
              size={54}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Order Placed!</Text>

        <Text style={styles.subtitle}>
          Your order has been successfully placed.
          {"\n"}
          Thank you for ordering with TUPC-OrderUp.
        </Text>

        {/* Order Card */}
        <View style={styles.orderCard}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="receipt-outline"
              size={24}
              color={CARDINAL}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Order Confirmed</Text>

            <Text style={styles.cardDescription}>
              Your order is now being processed by the seller.
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                Order received
              </Text>
            </View>
          </View>
        </View>

        {/* Pickup Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={21}
              color={CARDINAL}
            />

            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Pickup Location</Text>
              <Text style={styles.infoValue}>
                TUPC Main Canteen
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="wallet-outline"
              size={21}
              color={CARDINAL}
            />

            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>
                Payment on Pickup
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/(client)/orders")}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.primaryButtonText}>
            View My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/(client)")}
        >
          <Text style={styles.secondaryButtonText}>
            Continue Shopping
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={MUTED}
          />
          <Text style={styles.footerText}>
            Your order information is securely protected.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 20,
    alignItems: "center",
  },

  successCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#F4DDE1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  innerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CARDINAL_DARK,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 9,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
    textAlign: "center",
    marginBottom: 28,
  },

  orderCard: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F9E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    marginBottom: 9,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2E9B5F",
    marginRight: 7,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E9B5F",
  },

  infoCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: BORDER,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  infoText: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 3,
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
  },

  spacer: {
    flex: 1,
    minHeight: 20,
  },

  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 10,
    shadowColor: CARDINAL_DARK,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: CARDINAL,
    fontSize: 15,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },

  footerText: {
    fontSize: 10,
    color: MUTED,
    marginLeft: 6,
    textAlign: "center",
  },
});