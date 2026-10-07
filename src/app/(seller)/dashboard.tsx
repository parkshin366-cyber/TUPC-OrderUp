import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
import { LIGHT_COLORS, useAppTheme } from "../../context/ThemeContext";
import {
  getMyProducts,
  getMyStore,
  getSellerOrders,
  Order,
  OrderStatus,
  Product,
  Store,
} from "../../services/api";
import {
  computeDashboard,
  describeChange,
  describeItems,
  formatChange,
  formatOrderCode,
  getCustomerName,
} from "../../app/../services/sellerAnalytics";

// =====================================================
// COLORS
// =====================================================

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const BORDER = "#E7E7E8";
const GREEN = "#35A56A";
const RED = "#B91C1C";

// =====================================================
// HELPERS
// =====================================================

const formatPeso = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// =====================================================
// TYPES
// =====================================================

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  iconColor?: string;
};

type OrderRowProps = {
  order: string;
  customer: string;
  item: string;
  amount: string;
  status: OrderStatus;
};

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
  detail,
  iconColor = CARDINAL,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor: `${iconColor}12`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={iconColor}
          />
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={18}
          color="#A0A0A0"
        />
      </View>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statDetail}>
        {detail}
      </Text>
    </View>
  );
}

// =====================================================
// ORDER ROW
// =====================================================

function OrderRow({
  order,
  customer,
  item,
  amount,
  status,
}: OrderRowProps) {
  let statusStyle = styles.statusPreparing;
  let statusTextStyle =
    styles.statusPreparingText;

  if (status === "Pending") {
    statusStyle = styles.statusPending;
    statusTextStyle = styles.statusPendingText;
  }

  if (status === "Ready") {
    statusStyle = styles.statusReady;
    statusTextStyle = styles.statusReadyText;
  }

  if (status === "Completed") {
    statusStyle = styles.statusCompleted;
    statusTextStyle =
      styles.statusCompletedText;
  }

  if (status === "Cancelled") {
    statusStyle = styles.statusCancelled;
    statusTextStyle =
      styles.statusCancelledText;
  }

  return (
    <View style={styles.orderRow}>
      <View style={styles.orderLeft}>
        <View style={styles.orderIcon}>
          <Ionicons
            name="receipt-outline"
            size={18}
            color={CARDINAL}
          />
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>
            {order}
          </Text>

          <Text style={styles.customer}>
            {customer}
          </Text>

          <Text
            style={styles.orderItem}
            numberOfLines={1}
          >
            {item}
          </Text>
        </View>
      </View>

      <View style={styles.orderRight}>
        <Text style={styles.amount}>
          {amount}
        </Text>

        <View
          style={[
            styles.statusBadge,
            statusStyle,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusTextStyle,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// SELLER DASHBOARD
// =====================================================

export default function SellerDashboard() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const { user, token } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setProducts([]);
      setStore(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Orders are required. Products and store only fill in
      // extra details, so the dashboard still works without them.
      const [ordersResult, productsResult, storeResult] =
        await Promise.allSettled([
          getSellerOrders(token),
          getMyProducts(token),
          getMyStore(token),
        ]);

      if (ordersResult.status === "rejected") {
        throw ordersResult.reason;
      }

      setOrders(ordersResult.value);

      setProducts(
        productsResult.status === "fulfilled"
          ? productsResult.value
          : []
      );

      setStore(
        storeResult.status === "fulfilled"
          ? storeResult.value
          : null
      );
    } catch (error) {
      console.error(
        "LOAD DASHBOARD ERROR:",
        error
      );

      Alert.alert(
        "Unable to Load Dashboard",
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Reload whenever the tab is opened so numbers stay current.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ===================================================
  // NUMBERS
  // ===================================================

  const summary = useMemo(
    () => computeDashboard(orders, products),
    [orders, products]
  );

  const weekMax = Math.max(...summary.week.chart, 0);

  // ===================================================
  // NAVIGATION
  // ===================================================

  const handleOrders = () => {
    router.push("/(seller)/orders");
  };

  const handleProducts = () => {
    router.push("/(seller)/products");
  };

  const handleInventory = () => {
    router.push("/(seller)/inventory");
  };

  const handleStore = () => {
    router.push("/(seller)/store");
  };

  // ===================================================
  // STORE NAME
  // ===================================================
  // Supports common auth shapes without changing your AuthContext type.
  const userData = user as typeof user & {
    storeName?: string;
    store?: { name?: string };
  };

  const storeName =
    store?.name?.trim() ||
    userData?.storeName?.trim() ||
    userData?.store?.name?.trim() ||
    "My Store";

  const storeIsOpen = store ? store.isOpen !== false : null;

  const storeStatusText =
    storeIsOpen === null
      ? "Store not set up yet"
      : storeIsOpen
      ? "Store is currently open"
      : "Store is currently closed";

  const storeStatusColor =
    storeIsOpen === null
      ? MUTED
      : storeIsOpen
      ? GREEN
      : RED;

  // ===================================================
  // WEEKLY GROWTH
  // ===================================================

  const weekPercent = summary.week.changePercent;
  const weekDown = weekPercent !== null && weekPercent < 0;

  // ===================================================
  // LOADING
  // ===================================================

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
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // UI
  // ===================================================

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
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              SELLER CENTER
            </Text>

            <Text style={styles.title}>
              Welcome to {storeName}
            </Text>

            <Text style={styles.subtitle}>
              Here's what's happening with your
              store today.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={TEXT}
            />

            <View
              style={styles.notificationDot}
            />
          </TouchableOpacity>
        </View>

        {/* =================================================
            ACCOUNT STATUS
        ================================================= */}

        <View style={styles.accountStatus}>
          <View style={styles.accountStatusLeft}>
            <View style={styles.accountAvatar}>
              <Ionicons
                name="person-outline"
                size={21}
                color={CARDINAL}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {user?.firstName || "Seller"}{" "}
                {user?.lastName || ""}
              </Text>

              <Text style={styles.accountUsername}>
                @{user?.username || "seller"}
              </Text>
            </View>
          </View>

          <View style={styles.approvedBadge}>
            <View style={styles.approvedDot} />

            <Text style={styles.approvedText}>
              {user?.status === "approved"
                ? "Approved"
                : "Pending"}
            </Text>
          </View>
        </View>

        {/* =================================================
            STORE STATUS
        ================================================= */}

        <View style={styles.storeStatus}>
          <View style={styles.storeStatusLeft}>
            <View style={styles.storeAvatar}>
              <Ionicons
                name="storefront"
                size={22}
                color={CARDINAL}
              />
            </View>

            <View>
              <Text
                style={styles.storeName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {storeName}
              </Text>

              <View style={styles.onlineRow}>
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor:
                        storeStatusColor,
                    },
                  ]}
                />

                <Text style={styles.onlineText}>
                  {storeStatusText}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStore}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={21}
              color={MUTED}
            />
          </TouchableOpacity>
        </View>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <Text style={styles.dateText}>
            Today
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            label="Today's Sales"
            value={formatPeso(summary.today.total)}
            detail={describeChange(
              summary.today.changePercent,
              summary.today.total,
              "yesterday"
            )}
            iconColor={CARDINAL}
          />

          <StatCard
            icon="receipt-outline"
            label="Orders Today"
            value={String(summary.ordersToday)}
            detail={`${summary.inProgress} in progress`}
            iconColor={GOLD}
          />

          <StatCard
            icon="fast-food-outline"
            label="Products"
            value={String(summary.productCount)}
            detail={
              summary.attentionCount > 0
                ? `${summary.attentionCount} need attention`
                : "Everything looks good"
            }
            iconColor="#5B7C99"
          />

          <StatCard
            icon="alert-circle-outline"
            label="Low Stock"
            value={String(summary.lowStockCount)}
            detail={
              summary.lowStockCount > 0
                ? "Items running low"
                : "Stock levels look good"
            }
            iconColor="#C47A22"
          />
        </View>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.quickGrid}>
          {/* ADD PRODUCT */}

          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleProducts}
            activeOpacity={0.85}
          >
            <View style={styles.quickIcon}>
              <Ionicons
                name="add"
                size={23}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.quickTitle}>
              Add Product
            </Text>

            <Text style={styles.quickSubtitle}>
              Create a new item
            </Text>
          </TouchableOpacity>

          {/* INVENTORY */}

          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleInventory}
            activeOpacity={0.85}
          >
            <View style={styles.quickIcon}>
              <Ionicons
                name="cube-outline"
                size={22}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.quickTitle}>
              Inventory
            </Text>

            <Text style={styles.quickSubtitle}>
              Check stock levels
            </Text>
          </TouchableOpacity>

          {/* ORDERS */}

          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleOrders}
            activeOpacity={0.85}
          >
            <View style={styles.quickIcon}>
              <Ionicons
                name="receipt-outline"
                size={22}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.quickTitle}>
              Orders
            </Text>

            <Text style={styles.quickSubtitle}>
              Manage incoming orders
            </Text>
          </TouchableOpacity>

          {/* STORE */}

          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleStore}
            activeOpacity={0.85}
          >
            <View style={styles.quickIcon}>
              <Ionicons
                name="storefront-outline"
                size={22}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.quickTitle}>
              My Store
            </Text>

            <Text style={styles.quickSubtitle}>
              Manage store details
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recent Orders
          </Text>

          <TouchableOpacity
            onPress={handleOrders}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {summary.recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No orders yet
            </Text>

            <Text style={styles.emptyText}>
              New customer orders will show up
              here.
            </Text>
          </View>
        ) : (
          <View style={styles.ordersCard}>
            {summary.recent.map((order, index) => (
              <View key={order._id}>
                {index > 0 && (
                  <View style={styles.divider} />
                )}

                <OrderRow
                  order={formatOrderCode(order)}
                  customer={getCustomerName(order)}
                  item={describeItems(order)}
                  amount={formatPeso(
                    Number(order.total) || 0
                  )}
                  status={order.status}
                />
              </View>
            ))}
          </View>
        )}

        {/* =================================================
            STORE PERFORMANCE
        ================================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Store Performance
          </Text>
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceTop}>
            <View>
              <Text
                style={styles.performanceLabel}
              >
                Weekly Revenue
              </Text>

              <Text
                style={styles.performanceValue}
              >
                {formatPeso(summary.week.total)}
              </Text>
            </View>

            <View style={styles.growthBadge}>
              {weekPercent !== null && (
                <Ionicons
                  name={
                    weekDown
                      ? "trending-down"
                      : "trending-up"
                  }
                  size={15}
                  color={CARDINAL}
                  style={styles.growthIcon}
                />
              )}

              <Text style={styles.growthText}>
                {formatChange(
                  weekPercent,
                  summary.week.total
                )}
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {summary.week.chart.map(
              (value, index) => (
                <View
                  key={index}
                  style={styles.chartColumn}
                >
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height:
                          weekMax > 0
                            ? (value / weekMax) * 90
                            : 0,
                        opacity:
                          index ===
                          summary.week.chart.length - 1
                            ? 1
                            : 0.55,
                      },
                    ]}
                  />

                  <Text
                    style={styles.chartLabel}
                  >
                    {summary.week.labels[index]?.charAt(0)}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* =================================================
            FOOTER SPACE
        ================================================= */}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.cardinal,
    marginBottom: 5,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 5,
    lineHeight: 19,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.cardinal,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  // ===================================================
  // ACCOUNT STATUS
  // ===================================================

  accountStatus: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },

  accountStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  accountAvatar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  accountInfo: {
    flex: 1,
  },

  accountName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  accountUsername: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },

  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBg,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  approvedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#35A56A",
    marginRight: 5,
  },

  approvedText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
  },

  // ===================================================
  // STORE STATUS
  // ===================================================

  storeStatus: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },

  storeStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  storeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  storeName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#35A56A",
    marginRight: 6,
  },

  onlineText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },

  dateText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "700",
  },

  viewAll: {
    fontSize: 12,
    color: colors.cardinal,
    fontWeight: "800",
  },

  // ===================================================
  // STATS
  // ===================================================

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "48.5%",
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },

  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "700",
  },

  statValue: {
    fontSize: 23,
    color: colors.text,
    fontWeight: "900",
    marginTop: 3,
  },

  statDetail: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 5,
    lineHeight: 14,
  },

  // ===================================================
  // QUICK ACTIONS
  // ===================================================

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  quickCard: {
    width: "48.5%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },

  quickSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 3,
  },

  // ===================================================
  // ORDERS
  // ===================================================

  ordersCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 25,
  },

  orderRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  orderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  orderInfo: {
    flex: 1,
  },

  orderNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },

  customer: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  orderItem: {
    fontSize: 10,
    color: colors.lightMuted,
    marginTop: 3,
  },

  orderRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  amount: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  statusPreparing: {
    backgroundColor: colors.warningBg,
  },

  statusReady: {
    backgroundColor: colors.surfaceSecondary,
  },

  statusCompleted: {
    backgroundColor: colors.successBg,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  statusPreparingText: {
    color: colors.warning,
  },

  statusReadyText: {
    color: "#77508C",
  },

  statusCompletedText: {
    color: colors.success,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ===================================================
  // PERFORMANCE
  // ===================================================

  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
  },

  performanceTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  performanceLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "700",
  },

  performanceValue: {
    fontSize: 25,
    color: colors.text,
    fontWeight: "900",
    marginTop: 4,
  },

  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softRed,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  growthText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.cardinal,
    marginLeft: 4,
  },

  chart: {
    height: 125,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  chartColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    width: 27,
  },

  chartBar: {
    width: 18,
    borderRadius: 7,
    backgroundColor: colors.cardinal,
    minHeight: 10,
  },

  chartLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "700",
    marginTop: 7,
  },

  footerSpace: {
    height: 15,
  },

  statusPending: {
    backgroundColor: colors.warningBg,
  },

  statusPendingText: {
    color: colors.warning,
  },

  statusCancelled: {
    backgroundColor: colors.dangerBg,
  },

  statusCancelledText: {
    color: colors.danger,
  },

  growthIcon: {
    marginRight: 0,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 25,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
  },
});

let styles = createStyles(LIGHT_COLORS);
