import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import {
  getSellerOrders,
  Order,
  OrderStatus,
  updateOrderStatus,
} from "../../services/api";

const CARDINAL = "#A6192E";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const BORDER = "#E7E7E8";

type Filter = "All" | OrderStatus;

const FILTERS: Filter[] = [
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

    case "Cancelled":
      return "#FDECEC";
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

    case "Cancelled":
      return "#B42318";
  }
}

function getNextStatus(
  status: OrderStatus
): OrderStatus | null {
  switch (status) {
    case "Pending":
      return "Preparing";

    case "Preparing":
      return "Ready";

    case "Ready":
      return "Completed";

    default:
      return null;
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

    case "Cancelled":
      return "Cancelled";
  }
}

function getCustomerName(order: Order) {
  if (
    typeof order.customer === "object" &&
    order.customer !== null
  ) {
    const firstName = order.customer.firstName ?? "";
    const lastName = order.customer.lastName ?? "";

    const fullName =
      `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    return (
      order.customer.username ||
      order.customer.email ||
      "Customer"
    );
  }

  return order.customer || "Customer";
}

function getOrderItemSummary(order: Order) {
  if (!order.items || order.items.length === 0) {
    return {
      itemName: "No items",
      quantity: 0,
    };
  }

  if (order.items.length === 1) {
    return {
      itemName: order.items[0].name,
      quantity: order.items[0].quantity,
    };
  }

  return {
    itemName: `${order.items[0].name} + ${
      order.items.length - 1
    } more`,
    quantity: order.items.reduce(
      (total, item) => total + item.quantity,
      0
    ),
  };
}

function formatOrderTime(createdAt: string) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(
    diffMs / (1000 * 60)
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${
      diffMinutes !== 1 ? "s" : ""
    } ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60
  );

  if (diffHours < 24) {
    return `${diffHours} hour${
      diffHours !== 1 ? "s" : ""
    } ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24
  );

  if (diffDays < 7) {
    return `${diffDays} day${
      diffDays !== 1 ? "s" : ""
    } ago`;
  }

  return date.toLocaleDateString();
}

function formatPaymentMethod(
  paymentMethod: Order["paymentMethod"]
) {
  switch (paymentMethod) {
    case "gcash":
      return "GCash";

    case "cash":
      return "Cash Payment";

    default:
      return "Payment";
  }
}

export default function SellerOrders() {
  const { token } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<Filter>("All");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const loadOrders = useCallback(
    async (showLoader = true) => {
      if (!token) {
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const sellerOrders =
          await getSellerOrders(token);

        setOrders(sellerOrders);
      } catch (error) {
        console.error(
          "LOAD SELLER ORDERS ERROR:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load seller orders.";

        Alert.alert(
          "Unable to Load Orders",
          message
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(false);
  }, [loadOrders]);

  /*
   * Load real orders from MongoDB
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    loadOrders();
  });

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "All") {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.status === selectedFilter
    );
  }, [orders, selectedFilter]);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const activeCount = orders.filter(
    (order) =>
      order.status === "Preparing" ||
      order.status === "Ready"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const handleOrderAction = async (
    order: Order
  ) => {
    const nextStatus =
      getNextStatus(order.status);

    if (!nextStatus) {
      return;
    }

    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please log in again."
      );
      return;
    }

    try {
      setUpdatingOrderId(order._id);

      const updatedOrder =
        await updateOrderStatus(
          token,
          order._id,
          nextStatus
        );

      setOrders((currentOrders) =>
        currentOrders.map(
          (currentOrder) =>
            currentOrder._id ===
            updatedOrder._id
              ? updatedOrder
              : currentOrder
        )
      );

      Alert.alert(
        "Order Updated",
        `Order #${order._id.slice(
          -6
        )} is now ${updatedOrder.status}.`
      );
    } catch (error) {
      console.error(
        "UPDATE ORDER STATUS ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update order status.";

      Alert.alert(
        "Update Failed",
        message
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderOrder = (order: Order) => {
    const statusBackground =
      getStatusBackground(order.status);

    const statusColor =
      getStatusColor(order.status);

    const {
      itemName,
      quantity,
    } = getOrderItemSummary(order);

    const isUpdating =
      updatingOrderId === order._id;

    const isCompleted =
      order.status === "Completed";

    const isCancelled =
      order.status === "Cancelled";

    return (
      <View
        key={order._id}
        style={styles.orderCard}
      >
        {/* ORDER HEADER */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>
              #{order._id.slice(-6).toUpperCase()}
            </Text>

            <Text style={styles.orderTime}>
              {formatOrderTime(order.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusBackground,
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
              {getCustomerName(order)}
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
            <Text
              style={styles.itemName}
              numberOfLines={1}
            >
              {itemName}
            </Text>

            <Text style={styles.quantity}>
              Quantity: {quantity}
            </Text>
          </View>

          <Text style={styles.itemAmount}>
            ₱{Number(order.total).toLocaleString()}
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
              {formatPaymentMethod(
                order.paymentMethod
              )}
            </Text>
          </View>

          <Text style={styles.totalLabel}>
            Total:{" "}
            <Text style={styles.totalAmount}>
              ₱
              {Number(
                order.total
              ).toLocaleString()}
            </Text>
          </Text>
        </View>

        {/* PICKUP LOCATION */}
        {!!order.pickupLocation && (
          <View style={styles.pickupRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={MUTED}
            />

            <Text
              style={styles.pickupText}
              numberOfLines={1}
            >
              {order.pickupLocation}
            </Text>
          </View>
        )}

        {/* ACTION */}
        {!isCompleted &&
        !isCancelled ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isUpdating &&
                styles.actionButtonDisabled,
            ]}
            onPress={() =>
              handleOrderAction(order)
            }
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={styles.actionButtonText}
                >
                  Updating...
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={styles.actionButtonText}
                >
                  {getNextAction(
                    order.status
                  )}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>
        ) : isCompleted ? (
          <View
            style={styles.completedButton}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#28794D"
            />

            <Text
              style={
                styles.completedButtonText
              }
            >
              Order Completed
            </Text>
          </View>
        ) : (
          <View style={styles.cancelledButton}>
            <Ionicons
              name="close-circle"
              size={18}
              color="#B42318"
            />

            <Text
              style={
                styles.cancelledButtonText
              }
            >
              Order Cancelled
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
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
            Loading orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={CARDINAL}
          />
        }
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
              Manage and process your customer
              orders.
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

          <View
            style={styles.summaryDivider}
          />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {activeCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Active
            </Text>
          </View>

          <View
            style={styles.summaryDivider}
          />

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
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          {FILTERS.map((filter) => {
            const selected =
              selectedFilter === filter;

            const count =
              filter === "All"
                ? orders.length
                : orders.filter(
                    (order) =>
                      order.status === filter
                  ).length;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selected &&
                    styles.filterButtonActive,
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

        {/* ORDER LIST HEADER */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedFilter === "All"
              ? "All Orders"
              : `${selectedFilter} Orders`}
          </Text>

          <Text style={styles.listCount}>
            {filteredOrders.length} order
            {filteredOrders.length !== 1
              ? "s"
              : ""}
          </Text>
        </View>

        {/* ORDER LIST */}
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
              There are no orders under this
              status yet.
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

  orderHeaderLeft: {
    flex: 1,
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

  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    gap: 5,
  },

  pickupText: {
    flex: 1,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
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

  actionButtonDisabled: {
    opacity: 0.65,
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

  cancelledButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  cancelledButtonText: {
    fontSize: 12,
    color: "#B42318",
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },

  bottomSpace: {
    height: 20,
  },
});