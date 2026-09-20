import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARDINAL = "#A6192E";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const BORDER = "#E7E7E8";

type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed";

type Order = {
  id: string;
  customer: string;
  item: string;
  quantity: number;
  amount: number;
  time: string;
  status: OrderStatus;
};

const INITIAL_ORDERS: Order[] = [
  {
    id: "#ORD-1029",
    customer: "Joshua Belen",
    item: "Chicken Rice Meal",
    quantity: 2,
    amount: 240,
    time: "2 mins ago",
    status: "Pending",
  },
  {
    id: "#ORD-1028",
    customer: "Juan Dela Cruz",
    item: "Chicken Rice Meal",
    quantity: 2,
    amount: 240,
    time: "8 mins ago",
    status: "Preparing",
  },
  {
    id: "#ORD-1027",
    customer: "Maria Santos",
    item: "Iced Coffee",
    quantity: 1,
    amount: 95,
    time: "15 mins ago",
    status: "Ready",
  },
  {
    id: "#ORD-1026",
    customer: "Kevin Ramos",
    item: "Burger Meal",
    quantity: 1,
    amount: 175,
    time: "32 mins ago",
    status: "Completed",
  },
  {
    id: "#ORD-1025",
    customer: "Angela Reyes",
    item: "Fries + Iced Tea",
    quantity: 1,
    amount: 130,
    time: "48 mins ago",
    status: "Completed",
  },
];

const FILTERS: Array<"All" | OrderStatus> = [
  "All",
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
];

function getStatusBackground(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return "#FFF3E3";
    case "Preparing":
      return "#F1EAF6";
    case "Ready":
      return "#E8F3FA";
    case "Completed":
      return "#E9F7EF";
  }
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return "#A86616";
    case "Preparing":
      return "#77508C";
    case "Ready":
      return "#39708E";
    case "Completed":
      return "#28794D";
  }
}

function getNextAction(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return "Accept Order";
    case "Preparing":
      return "Mark as Ready";
    case "Ready":
      return "Complete Order";
    case "Completed":
      return "Completed";
  }
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedFilter, setSelectedFilter] =
    useState<"All" | OrderStatus>("All");

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "All") {
      return orders;
    }

    return orders.filter(
      (order) => order.status === selectedFilter,
    );
  }, [orders, selectedFilter]);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending",
  ).length;

  const activeCount = orders.filter(
    (order) =>
      order.status === "Preparing" ||
      order.status === "Ready",
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Completed",
  ).length;

  const handleOrderAction = (orderId: string) => {
    const currentOrder = orders.find(
      (order) => order.id === orderId,
    );

    if (!currentOrder) {
      return;
    }

    if (currentOrder.status === "Completed") {
      return;
    }

    let nextStatus: OrderStatus;

    switch (currentOrder.status) {
      case "Pending":
        nextStatus = "Preparing";
        break;

      case "Preparing":
        nextStatus = "Ready";
        break;

      case "Ready":
        nextStatus = "Completed";
        break;

      default:
        return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
            }
          : order,
      ),
    );

    Alert.alert(
      "Order Updated",
      `${currentOrder.id} is now ${nextStatus}.`,
    );
  };

  const renderOrder = (order: Order) => {
    const statusBackground = getStatusBackground(
      order.status,
    );

    const statusColor = getStatusColor(order.status);

    return (
      <View key={order.id} style={styles.orderCard}>
        {/* ORDER HEADER */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{order.id}</Text>

            <Text style={styles.orderTime}>
              {order.time}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* CUSTOMER */}
        <View style={styles.customerRow}>
          <View style={styles.customerIcon}>
            <Ionicons
              name="person-outline"
              size={17}
              color={CARDINAL}
            />
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerLabel}>
              Customer
            </Text>

            <Text style={styles.customerName}>
              {order.customer}
            </Text>
          </View>
        </View>

        {/* ITEM */}
        <View style={styles.itemBox}>
          <View style={styles.foodIcon}>
            <Ionicons
              name="fast-food-outline"
              size={21}
              color={CARDINAL}
            />
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>
              {order.item}
            </Text>

            <Text style={styles.quantity}>
              Quantity: {order.quantity}
            </Text>
          </View>

          <Text style={styles.itemAmount}>
            ₱{order.amount.toLocaleString()}
          </Text>
        </View>

        {/* PAYMENT */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Ionicons
              name="wallet-outline"
              size={16}
              color={MUTED}
            />

            <Text style={styles.paymentText}>
              Cash Payment
            </Text>
          </View>

          <Text style={styles.totalLabel}>
            Total:{" "}
            <Text style={styles.totalAmount}>
              ₱{order.amount.toLocaleString()}
            </Text>
          </Text>
        </View>

        {/* ACTION */}
        {order.status !== "Completed" ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOrderAction(order.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>
              {getNextAction(order.status)}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButton}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#28794D"
            />

            <Text style={styles.completedButtonText}>
              Order Completed
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              SELLER CENTER
            </Text>

            <Text style={styles.title}>
              Orders
            </Text>

            <Text style={styles.subtitle}>
              Manage and process your customer orders.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="receipt"
              size={23}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {pendingCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Pending
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {activeCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Active
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {completedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Completed
            </Text>
          </View>
        </View>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => {
            const selected = selectedFilter === filter;

            const count =
              filter === "All"
                ? orders.length
                : orders.filter(
                    (order) => order.status === filter,
                  ).length;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedFilter(filter)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>

                <View
                  style={[
                    styles.filterCount,
                    selected &&
                      styles.filterCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      selected &&
                        styles.filterCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ORDER LIST */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedFilter === "All"
              ? "All Orders"
              : `${selectedFilter} Orders`}
          </Text>

          <Text style={styles.listCount}>
            {filteredOrders.length} order
            {filteredOrders.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrder)
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={30}
                color={MUTED}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No orders found
            </Text>

            <Text style={styles.emptyText}>
              There are no orders under this status yet.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: CARDINAL,
    marginBottom: 5,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: TEXT,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    maxWidth: 300,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#F7E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    backgroundColor: CARDINAL,
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  summaryLabel: {
    color: "#F5DDE1",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#FFFFFF35",
  },

  filterContainer: {
    paddingBottom: 18,
    gap: 8,
  },

  filterButton: {
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  filterButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#F1F1F2",
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountActive: {
    backgroundColor: "#FFFFFF25",
  },

  filterCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: MUTED,
  },

  filterCountTextActive: {
    color: "#FFFFFF",
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  listTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  listCount: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginBottom: 12,
  },

  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  orderId: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  orderTime: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 13,
  },

  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  customerIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#F7E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  customerInfo: {
    flex: 1,
  },

  customerLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
  },

  customerName: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "800",
    marginTop: 2,
  },

  itemBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 13,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  foodIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#F7E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  quantity: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  itemAmount: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    marginBottom: 13,
  },

  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
  },

  paymentText: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
    marginLeft: 5,
  },

  totalLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  totalAmount: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  actionButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  completedButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#E9F7EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  completedButtonText: {
    fontSize: 12,
    color: "#28794D",
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F1F1F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  emptyText: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 250,
  },

  bottomSpace: {
    height: 20,
  },
});

