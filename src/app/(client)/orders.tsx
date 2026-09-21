import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// =====================================================
// COLORS
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const WHITE = "#FFFFFF";
const SUCCESS = "#238636";
const WARNING = "#B7791F";
const SOFT_RED = "#FCECEF";
const SOFT_GREEN = "#EAF7EE";
const SOFT_YELLOW = "#FFF8E7";

// =====================================================
// TYPES
// =====================================================

type OrderStatus =
  | "Preparing"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

type Order = {
  id: string;
  store: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  time: string;
};

// =====================================================
// TEMPORARY ORDER DATA
// =====================================================
// Later, this can be replaced with orders from MongoDB/API.
// Keeping the structure ready now makes backend integration easier.
// =====================================================

const orders: Order[] = [
  // Example:
  // {
  //   id: "ORD-2026-0001",
  //   store: "TUPC Food Hub",
  //   items: 3,
  //   total: 243,
  //   status: "Preparing",
  //   date: "Sep 21, 2026",
  //   time: "10:42 AM",
  // },
];

// =====================================================
// SCREEN
// =====================================================

export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");

  // ===================================================
  // FILTER ORDERS
  // ===================================================

  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") {
      return orders;
    }

    if (activeFilter === "Active") {
      return orders.filter(
        (order) =>
          order.status === "Preparing" ||
          order.status === "Ready for Pickup"
      );
    }

    return orders.filter((order) => order.status === "Completed");
  }, [activeFilter]);

  // ===================================================
  // COUNTS
  // ===================================================

  const activeCount = orders.filter(
    (order) =>
      order.status === "Preparing" ||
      order.status === "Ready for Pickup"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  // ===================================================
  // STATUS CONFIG
  // ===================================================

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "Preparing":
        return {
          icon: "restaurant-outline" as const,
          color: WARNING,
          background: SOFT_YELLOW,
        };

      case "Ready for Pickup":
        return {
          icon: "checkmark-circle-outline" as const,
          color: SUCCESS,
          background: SOFT_GREEN,
        };

      case "Completed":
        return {
          icon: "checkmark-done-outline" as const,
          color: SUCCESS,
          background: SOFT_GREEN,
        };

      case "Cancelled":
        return {
          icon: "close-circle-outline" as const,
          color: CARDINAL,
          background: SOFT_RED,
        };

      default:
        return {
          icon: "ellipse-outline" as const,
          color: MUTED,
          background: "#F3F3F3",
        };
    }
  };

  // ===================================================
  // ORDER CARD
  // ===================================================

  const renderOrderCard = (order: Order) => {
    const status = getStatusConfig(order.status);

    return (
      <Pressable
        key={order.id}
        style={({ pressed }) => [
          styles.orderCard,
          pressed && styles.orderCardPressed,
        ]}
        onPress={() => {
          // Ready for future order details route.
          // Example:
          // router.push(`/order/${order.id}`);
        }}
      >
        {/* TOP ROW */}
        <View style={styles.orderTopRow}>
          <View style={styles.orderIconContainer}>
            <Ionicons
              name="receipt-outline"
              size={22}
              color={CARDINAL}
            />
          </View>

          <View style={styles.orderHeaderInfo}>
            <Text style={styles.storeName} numberOfLines={1}>
              {order.store}
            </Text>

            <Text style={styles.orderId}>{order.id}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: status.background,
              },
            ]}
          >
            <Ionicons
              name={status.icon}
              size={13}
              color={status.color}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: status.color,
                },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* ORDER DETAILS */}
        <View style={styles.orderDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name="cube-outline"
              size={16}
              color={MUTED}
            />

            <Text style={styles.detailText}>
              {order.items} {order.items === 1 ? "item" : "items"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={MUTED}
            />

            <Text style={styles.detailText}>
              {order.date}
            </Text>
          </View>
        </View>

        {/* BOTTOM */}
        <View style={styles.orderBottomRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.totalAmount}>
              ₱{order.total.toFixed(2)}
            </Text>
          </View>

          <View style={styles.viewOrderButton}>
            <Text style={styles.viewOrderText}>
              View Order
            </Text>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={CARDINAL}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  // ===================================================
  // EMPTY STATE
  // ===================================================

  const renderEmptyState = () => {
    let title = "No Orders Yet";
    let description =
      "Your orders will appear here once you place an order from one of our campus stores.";

    if (activeFilter === "Active") {
      title = "No Active Orders";
      description =
        "You don't have any orders currently being prepared or waiting for pickup.";
    }

    if (activeFilter === "Completed") {
      title = "No Completed Orders";
      description =
        "Your completed orders will appear here after you finish a campus order.";
    }

    return (
      <View style={styles.emptyCard}>
        {/* ICON */}
        <View style={styles.emptyIconOuter}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="receipt-outline"
              size={42}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* TEXT */}
        <Text style={styles.emptyTitle}>{title}</Text>

        <Text style={styles.emptyText}>
          {description}
        </Text>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.shopButton,
            pressed && styles.shopButtonPressed,
          ]}
          onPress={() => router.push("/explore")}
        >
          <Ionicons
            name="bag-handle-outline"
            size={18}
            color={WHITE}
          />

          <Text style={styles.shopButtonText}>
            Browse Campus Stores
          </Text>
        </Pressable>
      </View>
    );
  };

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.eyebrow}>
              TUPC • ORDERUP
            </Text>

            <Text style={styles.title}>
              My Orders
            </Text>

            <Text style={styles.subtitle}>
              Track and manage your campus orders.
            </Text>
          </View>

          {/* ORDER ICON */}
          <View style={styles.headerIcon}>
            <Ionicons
              name="receipt"
              size={23}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* =================================================
            QUICK SUMMARY
        ================================================= */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="layers-outline"
                size={19}
                color={CARDINAL}
              />
            </View>

            <View>
              <Text style={styles.summaryValue}>
                {orders.length}
              </Text>

              <Text style={styles.summaryLabel}>
                Total Orders
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: SOFT_YELLOW,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={19}
                color={WARNING}
              />
            </View>

            <View>
              <Text style={styles.summaryValue}>
                {activeCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Active
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: SOFT_GREEN,
                },
              ]}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={19}
                color={SUCCESS}
              />
            </View>

            <View>
              <Text style={styles.summaryValue}>
                {completedCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            FILTERS
        ================================================= */}

        <View style={styles.filterContainer}>
          {(["All", "Active", "Completed"] as const).map(
            (filter) => {
              const isActive = activeFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={({ pressed }) => [
                    styles.filterButton,
                    isActive && styles.filterButtonActive,
                    pressed && styles.filterButtonPressed,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {activeFilter === "All"
                ? "All Orders"
                : `${activeFilter} Orders`}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredOrders.length === 0
                ? "Nothing to show"
                : `${filteredOrders.length} ${
                    filteredOrders.length === 1
                      ? "order"
                      : "orders"
                  }`}
            </Text>
          </View>

          {filteredOrders.length > 0 && (
            <Ionicons
              name="options-outline"
              size={20}
              color={MUTED}
            />
          )}
        </View>

        {/* =================================================
            ORDERS / EMPTY STATE
        ================================================= */}

        {filteredOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {filteredOrders.map(renderOrderCard)}
          </View>
        ) : (
          renderEmptyState()
        )}

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <View style={styles.footerNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={MUTED}
          />

          <Text style={styles.footerText}>
            Order information is securely managed by
            TUPC-OrderUp.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // SCREEN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 15,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: CARDINAL,
  },

  title: {
    marginTop: 5,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5D5DC",
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    marginTop: 22,
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValue: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  summaryLabel: {
    marginTop: 1,
    fontSize: 9.5,
    fontWeight: "600",
    color: MUTED,
  },

  summaryDivider: {
    width: 1,
    height: 35,
    backgroundColor: BORDER,
    marginHorizontal: 5,
  },

  // ===================================================
  // FILTERS
  // ===================================================

  filterContainer: {
    marginTop: 18,
    padding: 4,
    borderRadius: 15,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
  },

  filterButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: CARDINAL,
  },

  filterButtonPressed: {
    opacity: 0.78,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  filterTextActive: {
    color: WHITE,
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    marginTop: 22,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
  },

  // ===================================================
  // ORDER LIST
  // ===================================================

  ordersList: {
    gap: 12,
  },

  orderCard: {
    padding: 15,
    borderRadius: 19,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  orderCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },

  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  orderIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  orderHeaderInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  orderId: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  statusBadge: {
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },

  orderDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  orderBottomRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  totalAmount: {
    marginTop: 1,
    fontSize: 18,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  viewOrderButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#F2D6DB",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  viewOrderText: {
    fontSize: 11,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ===================================================
  // EMPTY STATE
  // ===================================================

  emptyCard: {
    marginTop: 2,
    minHeight: 430,
    paddingHorizontal: 28,
    paddingVertical: 35,
    borderRadius: 23,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#FFF6F7",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5D5DC",
  },

  emptyTitle: {
    marginTop: 22,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 9,
    maxWidth: 310,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },

  shopButton: {
    marginTop: 24,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },

  shopButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  shopButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "900",
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footerNote: {
    marginTop: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  footerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
    textAlign: "center",
  },
});

