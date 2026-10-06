import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import {
  getSellerOrders,
  cancelOrderBySeller,
  Order,
  OrderStatus,
  reviewOrderCancellation,
  updateOrderEta,
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
  "On the Way",
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

    case "On the Way":
      return "#E8F0FF";

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

    case "On the Way":
      return "#2867A8";

    case "Completed":
      return "#28794D";

    case "Cancelled":
      return "#B42318";
  }
}

function getNextStatus(
  order: Order
): OrderStatus | null {
  switch (order.status) {
    case "Pending":
      return "Preparing";

    case "Preparing":
      return "Ready";

    case "Ready":
      return order.fulfillmentMethod === "delivery" ? "On the Way" : "Completed";

    case "On the Way":
      return "Completed";

    default:
      return null;
  }
}

function getNextAction(order: Order) {
  switch (order.status) {
    case "Pending":
      return "Accept Order";

    case "Preparing":
      return "Mark as Ready";

    case "Ready":
      return order.fulfillmentMethod === "delivery" ? "Start Delivery" : "Complete Order";

    case "On the Way":
      return "Complete Delivery";

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

function getCustomerId(order: Order) {
  if (typeof order.customer === "object" && order.customer !== null) {
    return String(order.customer._id ?? order.customer.id ?? "");
  }
  return String(order.customer ?? "");
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

  const [reasonModal, setReasonModal] = useState<{ order: Order; mode: "cancel" | "reject" } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const handleEta = async (order: Order, minutes: number) => {
    if (!token) return;
    try {
      setUpdatingOrderId(order._id);
      await updateOrderEta(token, order._id, minutes);
      await loadOrders(false);
    } catch (error) {
      Alert.alert("Unable to update time", error instanceof Error ? error.message : "Please try again.");
    } finally { setUpdatingOrderId(null); }
  };

  const approveCancellation = (order: Order) => {
    Alert.alert("Approve cancellation", "The order will be cancelled and its stock will be restored. The voucher will remain used.", [
      { text: "Keep order", style: "cancel" },
      { text: "Approve", style: "destructive", onPress: async () => {
        if (!token) return;
        try { setUpdatingOrderId(order._id); await reviewOrderCancellation(token, order._id, "approve"); await loadOrders(false); }
        catch (error) { Alert.alert("Unable to approve", error instanceof Error ? error.message : "Please try again."); }
        finally { setUpdatingOrderId(null); }
      } },
    ]);
  };

  const submitReasonAction = async () => {
    if (!token || !reasonModal) return;
    if (reasonText.trim().length < 3) return Alert.alert("Reason required", "Enter at least 3 characters.");
    try {
      setUpdatingOrderId(reasonModal.order._id);
      if (reasonModal.mode === "cancel") await cancelOrderBySeller(token, reasonModal.order._id, reasonText.trim());
      else await reviewOrderCancellation(token, reasonModal.order._id, "reject", reasonText.trim());
      setReasonModal(null); setReasonText(""); await loadOrders(false);
    } catch (error) { Alert.alert("Action failed", error instanceof Error ? error.message : "Please try again."); }
    finally { setUpdatingOrderId(null); }
  };

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
      order.status === "Ready" ||
      order.status === "On the Way"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const handleOrderAction = async (
    order: Order
  ) => {
    const nextStatus =
      getNextStatus(order);

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

        {/* FULFILLMENT LOCATION */}
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
              {order.fulfillmentMethod === "delivery" ? `Deliver to: ${order.deliveryAddress || order.pickupLocation}` : `Pickup: ${order.pickupLocation}`}
            </Text>
          </View>
        )}

        {order.fulfillmentMethod === "delivery" && order.deliveryLatitude != null && order.deliveryLongitude != null ? (
          <View style={styles.pickupRow}>
            <Ionicons name="navigate-outline" size={15} color={CARDINAL} />
            <Text style={styles.pickupText} numberOfLines={1}>
              Pin: {order.deliveryLatitude.toFixed(5)}, {order.deliveryLongitude.toFixed(5)}
            </Text>
          </View>
        ) : null}

        {!!getCustomerId(order) && (
          <TouchableOpacity
            style={styles.messageCustomerButton}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: "/(seller)/messages", params: { recipientId: getCustomerId(order), recipientName: getCustomerName(order) } } as any)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={CARDINAL} />
            <Text style={styles.messageCustomerText}>Message customer</Text>
          </TouchableOpacity>
        )}

        {(order.status === "Pending" || order.status === "Preparing") && (
          <View style={styles.etaSection}>
            <Text style={styles.etaTitle}>Estimated preparation time</Text>
            <View style={styles.etaOptions}>
              {[15, 20, 30, 45].map((minutes) => (
                <TouchableOpacity key={minutes} onPress={() => handleEta(order, minutes)} disabled={isUpdating} style={[styles.etaOption, order.estimatedMinutes === minutes && styles.etaOptionActive]}>
                  <Text style={[styles.etaOptionText, order.estimatedMinutes === minutes && styles.etaOptionTextActive]}>{minutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!!order.estimatedReadyAt && <Text style={styles.etaSaved}>Ready around {new Date(order.estimatedReadyAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}</Text>}
          </View>
        )}

        {order.cancellationStatus === "requested" && (
          <View style={styles.cancelRequestCard}>
            <Text style={styles.cancelRequestTitle}>Customer requested cancellation</Text>
            <Text style={styles.cancelRequestReason}>{order.cancellationReason}</Text>
            <View style={styles.cancelRequestActions}>
              <TouchableOpacity onPress={() => { setReasonModal({ order, mode: "reject" }); setReasonText(""); }} style={styles.rejectButton}><Text style={styles.rejectButtonText}>Reject</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => approveCancellation(order)} style={styles.approveButton}><Text style={styles.approveButtonText}>Approve</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {(order.status === "Pending" || order.status === "Preparing") && order.cancellationStatus !== "requested" && (
          <TouchableOpacity onPress={() => { setReasonModal({ order, mode: "cancel" }); setReasonText(""); }} style={styles.sellerCancelButton}>
            <Ionicons name="close-circle-outline" size={15} color="#B42318" />
            <Text style={styles.sellerCancelText}>Cancel order</Text>
          </TouchableOpacity>
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
                  {getNextAction(order)}
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

          <Pressable onPress={() => router.push("/(seller)/messages" as any)} style={styles.headerIcon}>
            <Ionicons
              name="chatbubbles"
              size={23}
              color={CARDINAL}
            />
          </Pressable>
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
      <TouchableOpacity onPress={() => router.push("/(seller)/messages" as any)} activeOpacity={0.85} style={styles.chatBubble}>
        <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={!!reasonModal} transparent animationType="fade" onRequestClose={() => setReasonModal(null)}>
        <View style={styles.reasonOverlay}><View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>{reasonModal?.mode === "cancel" ? "Cancel order" : "Reject cancellation"}</Text>
          <Text style={styles.reasonSubtitle}>{reasonModal?.mode === "cancel" ? "Tell the customer why the order is being cancelled." : "Tell the customer why preparation must continue."}</Text>
          <TextInput value={reasonText} onChangeText={setReasonText} multiline maxLength={300} placeholder="Enter reason" placeholderTextColor="#999" style={styles.reasonInput} />
          <View style={styles.reasonActions}><Pressable onPress={() => setReasonModal(null)} style={styles.reasonBack}><Text style={styles.reasonBackText}>Back</Text></Pressable><Pressable onPress={submitReasonAction} style={styles.reasonConfirm}><Text style={styles.reasonConfirmText}>Confirm</Text></Pressable></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  chatBubble: {
    position: "absolute",
    right: 20,
    bottom: 18,
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#A6192E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
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
    color: "#A6192E",
    marginBottom: 5,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#171717",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
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
    backgroundColor: "#A6192E",
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
    borderColor: "#E7E7E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  filterButtonActive: {
    backgroundColor: "#A6192E",
    borderColor: "#A6192E",
  },

  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#737373",
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
    color: "#737373",
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
    color: "#171717",
  },

  listCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#737373",
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#171717",
  },

  orderTime: {
    fontSize: 10,
    color: "#737373",
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
    backgroundColor: "#E7E7E8",
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
    color: "#737373",
    fontWeight: "700",
  },

  customerName: {
    fontSize: 12,
    color: "#171717",
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
    color: "#171717",
  },

  quantity: {
    fontSize: 10,
    color: "#737373",
    marginTop: 3,
  },

  itemAmount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#171717",
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
    color: "#737373",
    fontWeight: "600",
    marginLeft: 5,
  },

  totalLabel: {
    fontSize: 10,
    color: "#737373",
    fontWeight: "600",
  },

  totalAmount: {
    fontSize: 13,
    color: "#171717",
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
    color: "#737373",
    fontWeight: "600",
  },

  actionButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#A6192E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  messageCustomerButton: {
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FBECEF",
    borderWidth: 1,
    borderColor: "#F0B7C2",
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  messageCustomerText: { color: "#A6192E", fontSize: 11, fontWeight: "900" },
  etaSection: { padding: 12, borderRadius: 13, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#E7E7E8", marginBottom: 9 },
  etaTitle: { color: "#171717", fontSize: 10, fontWeight: "900", marginBottom: 8 },
  etaOptions: { flexDirection: "row", gap: 6 },
  etaOption: { flex: 1, height: 31, borderRadius: 9, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E7E8", alignItems: "center", justifyContent: "center" },
  etaOptionActive: { backgroundColor: "#A6192E", borderColor: "#A6192E" },
  etaOptionText: { color: "#737373", fontSize: 9, fontWeight: "800" },
  etaOptionTextActive: { color: "#FFFFFF" },
  etaSaved: { marginTop: 7, color: "#A6192E", fontSize: 9, fontWeight: "800" },
  cancelRequestCard: { padding: 12, borderRadius: 13, backgroundColor: "#FFF8E7", marginBottom: 9 },
  cancelRequestTitle: { color: "#A86616", fontSize: 11, fontWeight: "900" },
  cancelRequestReason: { color: "#737373", fontSize: 10, lineHeight: 15, marginTop: 4 },
  cancelRequestActions: { flexDirection: "row", gap: 7, marginTop: 10 },
  rejectButton: { flex: 1, height: 35, borderRadius: 9, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  rejectButtonText: { color: "#737373", fontSize: 10, fontWeight: "900" },
  approveButton: { flex: 1, height: 35, borderRadius: 9, backgroundColor: "#A6192E", alignItems: "center", justifyContent: "center" },
  approveButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  sellerCancelButton: { height: 37, borderRadius: 10, backgroundColor: "#FDECEC", marginBottom: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  sellerCancelText: { color: "#B42318", fontSize: 10, fontWeight: "900" },
  reasonOverlay: { flex: 1, backgroundColor: "#00000070", alignItems: "center", justifyContent: "center", padding: 20 },
  reasonCard: { width: "100%", maxWidth: 440, padding: 20, borderRadius: 21, backgroundColor: "#FFFFFF" },
  reasonTitle: { color: "#171717", fontSize: 19, fontWeight: "900" },
  reasonSubtitle: { color: "#737373", fontSize: 12, lineHeight: 18, marginTop: 5 },
  reasonInput: { minHeight: 95, marginTop: 14, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: "#E7E7E8", color: "#171717", textAlignVertical: "top" },
  reasonActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 14 },
  reasonBack: { height: 41, paddingHorizontal: 14, justifyContent: "center" },
  reasonBackText: { color: "#737373", fontWeight: "800" },
  reasonConfirm: { height: 41, paddingHorizontal: 18, borderRadius: 10, backgroundColor: "#A6192E", justifyContent: "center" },
  reasonConfirmText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },

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
    borderColor: "#E7E7E8",
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
    color: "#171717",
  },

  emptyText: {
    fontSize: 11,
    color: "#737373",
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
    color: "#737373",
    fontWeight: "600",
  },

  bottomSpace: {
    height: 20,
  },
});

