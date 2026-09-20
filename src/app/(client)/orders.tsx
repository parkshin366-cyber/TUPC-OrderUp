import { Ionicons } from "@expo/vector-icons";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.eyebrow}>TUPC-ORDERUP</Text>

        <Text style={styles.title}>My Orders</Text>

        <Text style={styles.subtitle}>
          Track and manage your campus orders.
        </Text>

        {/* FILTERS */}
        <View style={styles.filters}>
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>All</Text>
          </View>

          <View style={styles.filter}>
            <Text style={styles.filterText}>Active</Text>
          </View>

          <View style={styles.filter}>
            <Text style={styles.filterText}>Completed</Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="receipt-outline"
              size={42}
              color={CARDINAL}
            />
          </View>

          <Text style={styles.emptyTitle}>No Orders Yet</Text>

          <Text style={styles.emptyText}>
            Your orders will appear here once you place an order
            from one of our campus stores.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 100,
    flexGrow: 1,
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

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
  },

  filters: {
    marginTop: 24,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },

  activeFilter: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  filter: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  filterText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  emptyCard: {
    flex: 1,
    minHeight: 430,
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },
});