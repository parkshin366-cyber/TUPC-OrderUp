import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
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
const DANGER = "#C62828";

const SOFT_RED = "#FCECEF";
const SOFT_GREEN = "#EAF7EE";
const SOFT_YELLOW = "#FFF8E7";
const SOFT_GRAY = "#F4F4F5";

// =====================================================
// STORAGE
// IMPORTANT:
// Your checkout/place-order flow should save orders
// using this same key.
// =====================================================

export const ORDERS_STORAGE_KEY = "@tuporderup_orders";

// =====================================================
// TYPES
// =====================================================

type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

type OrderItem = {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: string;
};

type Order = {
  id: string;
  store: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
  time: string;
  createdAt?: string;
  pickupMethod?: string;
  paymentMethod?: string;
  notes?: string;
};

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (amount: number) => {
  return `₱${Number(amount || 0).toFixed(2)}`;
};

const getItemCount = (items: OrderItem[]) => {
  return items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
};

const normalizeStatus = (status: unknown): OrderStatus => {
  const value = String(status || "").trim().toLowerCase();

  if (value === "pending") return "Pending";
  if (value === "preparing") return "Preparing";
  if (value === "ready") return "Ready for Pickup";
  if (value === "ready for pickup") return "Ready for Pickup";
  if (value === "completed") return "Completed";
  if (value === "cancelled" || value === "canceled") return "Cancelled";

  return "Pending";
};

const normalizeOrders = (raw: unknown): Order[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: any, index): Order | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const rawItems =
        Array.isArray(item.items)
          ? item.items
          : Array.isArray(item.orderItems)
          ? item.orderItems
          : [];

      const normalizedItems: OrderItem[] = rawItems.map(
        (product: any, productIndex: number) => ({
          id: String(
            product?.id ??
              product?.productId ??
              `item-${productIndex}`
          ),
          name:
            product?.name ??
            product?.productName ??
            "Campus Item",
          quantity: Number(
            product?.quantity ??
              product?.qty ??
              1
          ),
          price: Number(
            product?.price ??
              product?.unitPrice ??
              0
          ),
          image:
            product?.image ??
            product?.imageUrl ??
            undefined,
          variant:
            product?.variant ??
            product?.size ??
            undefined,
        })
      );

      const createdAt =
        item.createdAt ??
        item.placedAt ??
        item.created_at ??
        new Date().toISOString();

      const parsedDate = new Date(createdAt);

      const date =
        item.date ??
        (Number.isNaN(parsedDate.getTime())
          ? "Recently placed"
          : parsedDate.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }));

      const time =
        item.time ??
        (Number.isNaN(parsedDate.getTime())
          ? ""
          : parsedDate.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
            }));

      return {
        id: String(
          item.id ??
            item.orderId ??
            `ORD-${Date.now()}-${index}`
        ),
        store:
          item.store ??
          item.storeName ??
          item.sellerName ??
          "Campus Store",
        items: normalizedItems,
        total: Number(
          item.total ??
            item.grandTotal ??
            item.amount ??
            0
        ),
        status: normalizeStatus(item.status),
        date,
        time,
        createdAt,
        pickupMethod:
          item.pickupMethod ??
          item.deliveryMethod ??
          "Campus Pickup",
        paymentMethod:
          item.paymentMethod ??
          "Cash on Pickup",
        notes: item.notes ?? "",
      };
    })
    .filter(Boolean) as Order[];
};

// =====================================================
// STATUS CONFIG
// =====================================================

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "Pending":
      return {
        icon: "time-outline" as const,
        color: WARNING,
        background: SOFT_YELLOW,
        description: "Waiting for the store to confirm your order.",
      };

    case "Preparing":
      return {
        icon: "restaurant-outline" as const,
        color: WARNING,
        background: SOFT_YELLOW,
        description: "The store is preparing your order.",
      };

    case "Ready for Pickup":
      return {
        icon: "checkmark-circle-outline" as const,
        color: SUCCESS,
        background: SOFT_GREEN,
        description: "Your order is ready for pickup.",
      };

    case "Completed":
      return {
        icon: "checkmark-done-outline" as const,
        color: SUCCESS,
        background: SOFT_GREEN,
        description: "This order has been completed.",
      };

    case "Cancelled":
      return {
        icon: "close-circle-outline" as const,
        color: DANGER,
        background: SOFT_RED,
        description: "This order was cancelled.",
      };

    default:
      return {
        icon: "ellipse-outline" as const,
        color: MUTED,
        background: SOFT_GRAY,
        description: "",
      };
  }
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===================================================
  // LOAD ORDERS
  // ===================================================

  const loadOrders = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(
        ORDERS_STORAGE_KEY
      );

      if (!stored) {
        setOrders([]);
        return;
      }

      const parsed = JSON.parse(stored);
      const normalized = normalizeOrders(parsed);

      normalized.sort((a, b) => {
        const aTime = new Date(
          a.createdAt || 0
        ).getTime();

        const bTime = new Date(
          b.createdAt || 0
        ).getTime();

        return bTime - aTime;
      });

      setOrders(normalized);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REFRESH WHEN SCREEN BECOMES ACTIVE
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  // ===================================================
  // PULL TO REFRESH
  // ===================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadOrders();

    setRefreshing(false);
  };

  // ===================================================
  // FILTER
  // ===================================================

  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") {
      return orders;
    }

    if (activeFilter === "Active") {
      return orders.filter(
        (order) =>
          order.status === "Pending" ||
          order.status === "Preparing" ||
          order.status === "Ready for Pickup"
      );
    }

    return orders.filter(
      (order) => order.status === "Completed"
    );
  }, [orders, activeFilter]);

  // ===================================================
  // COUNTS
  // ===================================================

  const activeCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "Pending" ||
          order.status === "Preparing" ||
          order.status === "Ready for Pickup"
      ).length,
    [orders]
  );

  const completedCount = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Completed"
      ).length,
    [orders]
  );

  // ===================================================
  // CANCEL ORDER
  // ===================================================

  const canCancelOrder = (order: Order) => {
    return (
      order.status === "Pending" ||
      order.status === "Preparing"
    );
  };

  const cancelOrder = (order: Order) => {
    if (!canCancelOrder(order)) {
      Alert.alert(
        "Order Cannot Be Cancelled",
        "This order can no longer be cancelled."
      );
      return;
    }

    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel ${order.id}?`,
      [
        {
          text: "Keep Order",
          style: "cancel",
        },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedOrders = orders.map(
                (currentOrder) =>
                  currentOrder.id === order.id
                    ? {
                        ...currentOrder,
                        status: "Cancelled" as OrderStatus,
                      }
                    : currentOrder
              );

              await AsyncStorage.setItem(
                ORDERS_STORAGE_KEY,
                JSON.stringify(updatedOrders)
              );

              setOrders(updatedOrders);

              setSelectedOrder((current) =>
                current?.id === order.id
                  ? {
                      ...current,
                      status: "Cancelled",
                    }
                  : current
              );

              Alert.alert(
                "Order Cancelled",
                "Your order has been cancelled."
              );
            } catch {
              Alert.alert(
                "Something went wrong",
                "We couldn't update your order. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // ===================================================
  // STATUS TIMELINE
  // ===================================================

  const renderTimeline = (status: OrderStatus) => {
    const steps: {
      key: OrderStatus;
      title: string;
      icon: keyof typeof Ionicons.glyphMap;
    }[] = [
      {
        key: "Pending",
        title: "Order Placed",
        icon: "receipt-outline",
      },
      {
        key: "Preparing",
        title: "Preparing",
        icon: "restaurant-outline",
      },
      {
        key: "Ready for Pickup",
        title: "Ready for Pickup",
        icon: "bag-check-outline",
      },
      {
        key: "Completed",
        title: "Completed",
        icon: "checkmark-done-outline",
      },
    ];

    const statusIndex =
      status === "Cancelled"
        ? -1
        : steps.findIndex((step) => step.key === status);

    return (
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const completed =
            statusIndex >= index;

          const isCurrent =
            statusIndex === index;

          return (
            <View
              key={step.key}
              style={styles.timelineRow}
            >
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    completed &&
                      styles.timelineDotCompleted,
                    isCurrent &&
                      styles.timelineDotCurrent,
                  ]}
                >
                  <Ionicons
                    name={
                      completed
                        ? "checkmark"
                        : step.icon
                    }
                    size={14}
                    color={
                      completed
                        ? WHITE
                        : MUTED
                    }
                  />
                </View>

                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      statusIndex > index &&
                        styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    completed &&
                      styles.timelineTitleCompleted,
                  ]}
                >
                  {step.title}
                </Text>

                {isCurrent && (
                  <Text style={styles.timelineCurrent}>
                    Current status
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {status === "Cancelled" && (
          <View style={styles.cancelledTimeline}>
            <View style={styles.cancelledDot}>
              <Ionicons
                name="close"
                size={15}
                color={WHITE}
              />
            </View>

            <View>
              <Text style={styles.cancelledTitle}>
                Order Cancelled
              </Text>

              <Text style={styles.cancelledText}>
                This order is no longer active.
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ===================================================
  // ORDER CARD
  // ===================================================

  const renderOrderCard = (order: Order) => {
    const status = getStatusConfig(order.status);
    const itemCount = getItemCount(order.items);

    return (
      <Pressable
        key={order.id}
        onPress={() => setSelectedOrder(order)}
        style={({ pressed }) => [
          styles.orderCard,
          pressed && styles.orderCardPressed,
        ]}
      >
        <View style={styles.orderCardHeader}>
          <View style={styles.storeIcon}>
            <Ionicons
              name="storefront-outline"
              size={21}
              color={CARDINAL}
            />
          </View>

          <View style={styles.orderMainInfo}>
            <Text
              style={styles.storeName}
              numberOfLines={1}
            >
              {order.store}
            </Text>

            <Text style={styles.orderId}>
              {order.id}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status.background,
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
                { color: status.color },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.orderMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="cube-outline"
              size={15}
              color={MUTED}
            />

            <Text style={styles.metaText}>
              {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={MUTED}
            />

            <Text style={styles.metaText}>
              {order.date}
            </Text>
          </View>

          {!!order.time && (
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={15}
                color={MUTED}
              />

              <Text style={styles.metaText}>
                {order.time}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalAmount}>
              {formatCurrency(order.total)}
            </Text>
          </View>

          <View style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>
              View Details
            </Text>

            <Ionicons
              name="chevron-forward"
              size={15}
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
      "Orders you place from campus stores will appear here.";

    if (activeFilter === "Active") {
      title = "No Active Orders";
      description =
        "You don't have any orders currently being processed.";
    }

    if (activeFilter === "Completed") {
      title = "No Completed Orders";
      description =
        "Your completed campus orders will appear here.";
    }

    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="receipt-outline"
            size={42}
            color={CARDINAL}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {title}
        </Text>

        <Text style={styles.emptyDescription}>
          {description}
        </Text>

        <Pressable
          onPress={() => {
            // Keep navigation simple and compatible
            // with the existing client tab structure.
            const { router } = require("expo-router");
            router.push("/explore");
          }}
          style={({ pressed }) => [
            styles.shopButton,
            pressed && styles.shopButtonPressed,
          ]}
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
  // ORDER DETAILS MODAL
  // ===================================================

  const renderOrderModal = () => {
    if (!selectedOrder) return null;

    const status = getStatusConfig(
      selectedOrder.status
    );

    return (
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setSelectedOrder(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Order Details
                </Text>

                <Text style={styles.modalOrderId}>
                  {selectedOrder.id}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectedOrder(null)
                }
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={TEXT}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalScrollContent
              }
            >
              {/* STATUS */}
              <View
                style={[
                  styles.modalStatusCard,
                  {
                    backgroundColor:
                      status.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modalStatusIcon,
                    {
                      backgroundColor:
                        WHITE,
                    },
                  ]}
                >
                  <Ionicons
                    name={status.icon}
                    size={22}
                    color={status.color}
                  />
                </View>

                <View style={styles.modalStatusInfo}>
                  <Text
                    style={[
                      styles.modalStatusTitle,
                      {
                        color: status.color,
                      },
                    ]}
                  >
                    {selectedOrder.status}
                  </Text>

                  <Text style={styles.modalStatusDescription}>
                    {status.description}
                  </Text>
                </View>
              </View>

              {/* STORE */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Store
                </Text>

                <View style={styles.storeDetailRow}>
                  <View style={styles.storeDetailIcon}>
                    <Ionicons
                      name="storefront-outline"
                      size={20}
                      color={CARDINAL}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailStoreName}>
                      {selectedOrder.store}
                    </Text>

                    <Text style={styles.detailMuted}>
                      {selectedOrder.date}
                      {selectedOrder.time
                        ? ` • ${selectedOrder.time}`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>

              {/* TIMELINE */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Order Status
                </Text>

                {renderTimeline(
                  selectedOrder.status
                )}
              </View>

              {/* ITEMS */}
              <View style={styles.detailSection}>
                <View style={styles.sectionTitleRow}>
                  <Text
                    style={styles.detailSectionTitle}
                  >
                    Items
                  </Text>

                  <Text style={styles.itemCountLabel}>
                    {getItemCount(
                      selectedOrder.items
                    )}{" "}
                    {getItemCount(
                      selectedOrder.items
                    ) === 1
                      ? "item"
                      : "items"}
                  </Text>
                </View>

                <View style={styles.itemsCard}>
                  {selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map(
                      (item, index) => (
                        <View
                          key={`${item.id}-${index}`}
                          style={[
                            styles.orderItemRow,
                            index <
                              selectedOrder.items
                                .length -
                                1 &&
                              styles.orderItemBorder,
                          ]}
                        >
                          <View style={styles.quantityBox}>
                            <Text
                              style={
                                styles.quantityText
                              }
                            >
                              {item.quantity}×
                            </Text>
                          </View>

                          <View
                            style={
                              styles.orderItemInfo
                            }
                          >
                            <Text
                              style={
                                styles.orderItemName
                              }
                              numberOfLines={2}
                            >
                              {item.name}
                            </Text>

                            {!!item.variant && (
                              <Text
                                style={
                                  styles.orderItemVariant
                                }
                              >
                                {item.variant}
                              </Text>
                            )}

                            <Text
                              style={
                                styles.orderItemPrice
                              }
                            >
                              {formatCurrency(
                                item.price
                              )}{" "}
                              each
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.orderItemTotal
                            }
                          >
                            {formatCurrency(
                              item.price *
                                item.quantity
                            )}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <View
                      style={
                        styles.noItemsContainer
                      }
                    >
                      <Text
                        style={
                          styles.noItemsText
                        }
                      >
                        Item details are not
                        available.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ORDER INFORMATION */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Order Information
                </Text>

                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View
                      style={styles.infoIcon}
                    >
                      <Ionicons
                        name="bag-handle-outline"
                        size={17}
                        color={MUTED}
                      />
                    </View>

                    <View style={styles.infoText}>
                      <Text
                        style={styles.infoLabel}
                      >
                        Pickup Method
                      </Text>

                      <Text
                        style={styles.infoValue}
                      >
                        {selectedOrder.pickupMethod ||
                          "Campus Pickup"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoRow}>
                    <View
                      style={styles.infoIcon}
                    >
                      <Ionicons
                        name="card-outline"
                        size={17}
                        color={MUTED}
                      />
                    </View>

                    <View style={styles.infoText}>
                      <Text
                        style={styles.infoLabel}
                      >
                        Payment Method
                      </Text>

                      <Text
                        style={styles.infoValue}
                      >
                        {selectedOrder.paymentMethod ||
                          "Cash on Pickup"}
                      </Text>
                    </View>
                  </View>

                  {!!selectedOrder.notes && (
                    <>
                      <View
                        style={
                          styles.infoDivider
                        }
                      />

                      <View style={styles.infoRow}>
                        <View
                          style={styles.infoIcon}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={17}
                            color={MUTED}
                          />
                        </View>

                        <View
                          style={styles.infoText}
                        >
                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            Notes
                          </Text>

                          <Text
                            style={
                              styles.infoValue
                            }
                          >
                            {selectedOrder.notes}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* TOTAL */}
              <View style={styles.totalCard}>
                <View>
                  <Text style={styles.totalCardLabel}>
                    Order Total
                  </Text>

                  <Text
                    style={styles.totalCardAmount}
                  >
                    {formatCurrency(
                      selectedOrder.total
                    )}
                  </Text>
                </View>

                <View style={styles.totalCheck}>
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={CARDINAL}
                  />
                </View>
              </View>

              {/* CANCEL */}
              {canCancelOrder(selectedOrder) && (
                <Pressable
                  onPress={() =>
                    cancelOrder(selectedOrder)
                  }
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed &&
                      styles.cancelButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={DANGER}
                  />

                  <Text
                    style={styles.cancelButtonText}
                  >
                    Cancel Order
                  </Text>
                </Pressable>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="receipt-outline"
              size={28}
              color={CARDINAL}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={CARDINAL}
            style={{ marginTop: 18 }}
          />

          <Text style={styles.loadingText}>
            Loading your orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={CARDINAL}
            colors={[CARDINAL]}
          />
        }
        contentContainerStyle={styles.container}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              My Orders
            </Text>

            <Text style={styles.subtitle}>
              Track your campus orders and view
              their latest status.
            </Text>
          </View>
        </View>

        {/* =================================================
            SUMMARY
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
                  backgroundColor:
                    SOFT_YELLOW,
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
                  backgroundColor:
                    SOFT_GREEN,
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
          {(
            ["All", "Active", "Completed"] as const
          ).map((filter) => {
            const isActive =
              activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() =>
                  setActiveFilter(filter)
                }
                style={({ pressed }) => [
                  styles.filterButton,
                  isActive &&
                    styles.filterButtonActive,
                  pressed &&
                    styles.filterButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =================================================
            SECTION
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

          <Ionicons
            name="receipt-outline"
            size={19}
            color={MUTED}
          />
        </View>

        {/* =================================================
            ORDERS
        ================================================= */}

        {filteredOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {filteredOrders.map(
              renderOrderCard
            )}
          </View>
        ) : (
          renderEmptyState()
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {renderOrderModal()}
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

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

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    paddingTop: 3,
  },

  headerTextContainer: {
    maxWidth: 350,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: CARDINAL_DARK,
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    marginTop: 22,
    minHeight: 84,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 19,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    marginHorizontal: 4,
  },

  // ===================================================
  // FILTER
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
    minHeight: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: CARDINAL,
  },

  filterButtonPressed: {
    opacity: 0.75,
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
    marginTop: 23,
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
    fontWeight: "500",
  },

  // ===================================================
  // ORDERS
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  orderCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },

  orderCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  storeIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  orderMainInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
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
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "900",
  },

  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },

  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "600",
  },

  cardBottom: {
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

  detailsButton: {
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

  detailsButtonText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyCard: {
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

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5D5DC",
  },

  emptyTitle: {
    marginTop: 21,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 9,
    maxWidth: 310,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },

  shopButton: {
    marginTop: 24,
    minHeight: 47,
    paddingHorizontal: 19,
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
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    maxHeight: "92%",
    backgroundColor: BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  modalHandle: {
    alignSelf: "center",
    marginTop: 10,
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#D4D4D8",
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
  },

  modalOrderId: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "700",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SOFT_GRAY,
    alignItems: "center",
    justifyContent: "center",
  },

  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ===================================================
  // MODAL STATUS
  // ===================================================

  modalStatusCard: {
    padding: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  modalStatusIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  modalStatusInfo: {
    flex: 1,
    marginLeft: 11,
  },

  modalStatusTitle: {
    fontSize: 14,
    fontWeight: "900",
  },

  modalStatusDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
  },

  // ===================================================
  // DETAIL SECTIONS
  // ===================================================

  detailSection: {
    marginTop: 20,
  },

  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemCountLabel: {
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "700",
  },

  // ===================================================
  // STORE
  // ===================================================

  storeDetailRow: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  storeDetailIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  detailStoreName: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  detailMuted: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
  },

  // ===================================================
  // TIMELINE
  // ===================================================

  timeline: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  timelineRow: {
    minHeight: 48,
    flexDirection: "row",
  },

  timelineLeft: {
    width: 34,
    alignItems: "center",
  },

  timelineDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: SOFT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  timelineDotCompleted: {
    backgroundColor: SUCCESS,
    borderColor: SUCCESS,
  },

  timelineDotCurrent: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: BORDER,
  },

  timelineLineCompleted: {
    backgroundColor: SUCCESS,
  },

  timelineContent: {
    paddingLeft: 9,
    paddingTop: 4,
    flex: 1,
  },

  timelineTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: MUTED,
  },

  timelineTitleCompleted: {
    color: TEXT,
    fontWeight: "900",
  },

  timelineCurrent: {
    marginTop: 2,
    fontSize: 9.5,
    color: CARDINAL,
    fontWeight: "800",
  },

  cancelledTimeline: {
    marginTop: 5,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  cancelledDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: DANGER,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelledTitle: {
    marginLeft: 9,
    fontSize: 11.5,
    color: DANGER,
    fontWeight: "900",
  },

  cancelledText: {
    marginLeft: 9,
    marginTop: 2,
    fontSize: 9.5,
    color: MUTED,
  },

  // ===================================================
  // ITEMS
  // ===================================================

  itemsCard: {
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  orderItemRow: {
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  quantityBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    fontSize: 10,
    color: CARDINAL,
    fontWeight: "900",
  },

  orderItemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  orderItemName: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT,
    fontWeight: "800",
  },

  orderItemVariant: {
    marginTop: 2,
    fontSize: 9.5,
    color: MUTED,
  },

  orderItemPrice: {
    marginTop: 3,
    fontSize: 9.5,
    color: MUTED,
  },

  orderItemTotal: {
    fontSize: 11.5,
    color: TEXT,
    fontWeight: "900",
  },

  noItemsContainer: {
    padding: 18,
    alignItems: "center",
  },

  noItemsText: {
    fontSize: 11,
    color: MUTED,
  },

  // ===================================================
  // INFORMATION
  // ===================================================

  infoCard: {
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  infoRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: SOFT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  infoText: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  infoValue: {
    marginTop: 2,
    fontSize: 11.5,
    color: TEXT,
    fontWeight: "800",
  },

  infoDivider: {
    height: 1,
    backgroundColor: BORDER,
  },

  // ===================================================
  // TOTAL
  // ===================================================

  totalCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalCardLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  totalCardAmount: {
    marginTop: 3,
    fontSize: 23,
    color: CARDINAL_DARK,
    fontWeight: "900",
  },

  totalCheck: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // CANCEL
  // ===================================================

  cancelButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#F2CCCC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  cancelButtonPressed: {
    opacity: 0.7,
  },

  cancelButtonText: {
    fontSize: 11.5,
    color: DANGER,
    fontWeight: "900",
  },
});
