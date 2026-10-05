import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import {
  getMyProducts,
  getSellerOrders,
  Order,
  Product,
} from "../../services/api";
import {
  computeSales,
  describeChange,
  describeItems,
  formatChange,
  formatOrderCode,
  formatTimeAgo,
  getCustomerName,
  getRecentOrders,
  Period,
} from "../../services/sellerAnalytics";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const BG = "#F7F7F8";
const WHITE = "#FFFFFF";
const GREEN = "#2E7D32";
const RED = "#C62828";

type Trend = "up" | "down" | "flat";

const PERIODS: Period[] = ["Today", "7 Days", "30 Days", "All Time"];

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getTrend = (percent: number | null): Trend => {
  if (percent === null) {
    return "flat";
  }

  return percent >= 0 ? "up" : "down";
};

export default function SellerSalesScreen() {
  const { token } = useAuth();

  const [period, setPeriod] = useState<Period>("Today");

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // LOAD ORDERS AND PRODUCTS
  // =====================================================

  const loadData = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Orders are required. Products only add category/price details,
      // so sales still show if the product request fails.
      const [ordersResult, productsResult] = await Promise.allSettled([
        getSellerOrders(token),
        getMyProducts(token),
      ]);

      if (ordersResult.status === "rejected") {
        throw ordersResult.reason;
      }

      setOrders(ordersResult.value);

      setProducts(
        productsResult.status === "fulfilled" ? productsResult.value : []
      );
    } catch (error) {
      console.error("LOAD SALES ERROR:", error);

      Alert.alert(
        "Unable to Load Sales",
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your sales."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Reload whenever the tab is opened so new orders show up.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // =====================================================
  // NUMBERS
  // =====================================================

  const sales = useMemo(
    () => computeSales(orders, products, period),
    [orders, products, period]
  );

  const recentOrders = useMemo(() => getRecentOrders(orders, 5), [orders]);

  const trend = getTrend(sales.changePercent);

  const chartMax = Math.max(...sales.chart, 0);

  const handleExport = () => {
    Alert.alert(
      "Export Sales",
      `Your ${period.toLowerCase()} sales report is ready to export.`
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CARDINAL} />

          <Text style={styles.loadingText}>Loading sales...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>SELLER CENTER</Text>
            <Text style={styles.title}>Sales</Text>
            <Text style={styles.subtitle}>
              Track your store performance and revenue.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.exportButton,
              pressed && styles.pressed,
            ]}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={18} color={CARDINAL} />
            <Text style={styles.exportText}>Export</Text>
          </Pressable>
        </View>

        {/* PERIOD FILTER */}
        <View style={styles.periodCard}>
          {PERIODS.map((item) => {
            const active = period === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.periodButton,
                  active && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod(item)}
              >
                <Text
                  style={[
                    styles.periodText,
                    active && styles.periodTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="cash-outline"
            label="Total Sales"
            value={formatCurrency(sales.total)}
            detail={formatChange(sales.changePercent, sales.total)}
            trend={trend}
          />

          <SummaryCard
            icon="receipt-outline"
            label="Orders"
            value={sales.orderCount.toString()}
            detail="Completed orders"
          />

          <SummaryCard
            icon="trending-up-outline"
            label="Avg. Order"
            value={formatCurrency(sales.average)}
            detail="Per transaction"
          />
        </View>

        {/* SALES OVERVIEW */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Sales Overview</Text>
            <Text style={styles.sectionSubtitle}>
              Revenue performance for {period.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartTop}>
            <View>
              <Text style={styles.chartAmount}>
                {formatCurrency(sales.total)}
              </Text>

              <View style={styles.growthRow}>
                {trend !== "flat" && (
                  <Ionicons
                    name={trend === "up" ? "arrow-up" : "arrow-down"}
                    size={14}
                    color={trend === "up" ? GREEN : RED}
                  />
                )}

                <Text
                  style={[
                    styles.growthText,
                    trend === "down" && styles.growthTextDown,
                    trend === "flat" && styles.growthTextFlat,
                  ]}
                >
                  {describeChange(
                    sales.changePercent,
                    sales.total,
                    "previous period"
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.chartBadge}>
              <Ionicons name="analytics-outline" size={17} color={CARDINAL} />
            </View>
          </View>

          <View style={styles.chart}>
            <View style={styles.chartGridLine} />
            <View style={[styles.chartGridLine, { top: "33%" }]} />
            <View style={[styles.chartGridLine, { top: "66%" }]} />

            <View style={styles.barsRow}>
              {sales.chart.map((value, index) => {
                const heightPercent =
                  chartMax > 0 && value > 0
                    ? Math.max((value / chartMax) * 100, 4)
                    : 0;

                return (
                  <View style={styles.barColumn} key={`${index}`}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.barLabel}>
                      {sales.labels[index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* TOP PRODUCTS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Top Products</Text>
            <Text style={styles.sectionSubtitle}>
              Your best-performing products
            </Text>
          </View>
        </View>

        {sales.topProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No product sales yet</Text>
            <Text style={styles.emptyText}>
              Products will appear here once orders are completed in this
              period.
            </Text>
          </View>
        ) : (
          <View style={styles.productsCard}>
            {sales.topProducts.map((product, index) => (
              <View
                key={product.name}
                style={[
                  styles.productRow,
                  index === sales.topProducts.length - 1 && styles.lastRow,
                ]}
              >
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>
                    {product.category} · {product.sold} sold
                  </Text>
                </View>

                <View style={styles.productRevenue}>
                  <Text style={styles.revenueText}>
                    {formatCurrency(product.revenue)}
                  </Text>
                  <Text style={styles.revenueLabel}>revenue</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PAYMENT METHODS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.sectionSubtitle}>
              Payment distribution for {period.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <PaymentRow
            icon="cash-outline"
            label="Cash"
            amount={sales.payment.cash}
            percent={sales.payment.cashPercent}
          />

          <View style={styles.paymentDivider} />

          <PaymentRow
            icon="phone-portrait-outline"
            label="GCash"
            amount={sales.payment.gcash}
            percent={sales.payment.gcashPercent}
          />
        </View>

        {/* RECENT TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>
              Latest activity from your store
            </Text>
          </View>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              New customer orders will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsCard}>
            {recentOrders.map((order, index) => {
              const completed = order.status === "Completed";

              return (
                <View
                  key={order._id}
                  style={[
                    styles.transactionRow,
                    index === recentOrders.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={
                        order.paymentMethod === "gcash"
                          ? "phone-portrait-outline"
                          : "cash-outline"
                      }
                      size={19}
                      color={CARDINAL}
                    />
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCustomer}>
                      {getCustomerName(order)}
                    </Text>
                    <Text style={styles.transactionItem} numberOfLines={1}>
                      {describeItems(order)}
                    </Text>
                    <Text style={styles.transactionMeta}>
                      {formatOrderCode(order)} · {formatTimeAgo(order.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(Number(order.total) || 0)}
                    </Text>

                    <View
                      style={[
                        styles.statusPill,
                        completed ? styles.completedPill : styles.pendingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          completed
                            ? styles.completedText
                            : styles.pendingText,
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* FOOTER NOTE */}
        <View style={styles.footerNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={MUTED}
          />
          <Text style={styles.footerText}>
            Sales are counted from completed orders. Cancelled orders are
            excluded. Pull down to refresh.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  trend,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  trend?: Trend;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={19} color={CARDINAL} />
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>

      <View style={styles.summaryDetailRow}>
        {trend === "up" && (
          <Ionicons name="trending-up" size={13} color={GREEN} />
        )}

        {trend === "down" && (
          <Ionicons name="trending-down" size={13} color={RED} />
        )}

        <Text
          style={[
            styles.summaryDetail,
            trend === "up" && styles.summaryPositive,
            trend === "down" && styles.summaryNegative,
          ]}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}

function PaymentRow({
  icon,
  label,
  amount,
  percent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  amount: number;
  percent: number;
}) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentIcon}>
        <Ionicons name={icon} size={19} color={CARDINAL} />
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.paymentTitleRow}>
          <Text style={styles.paymentLabel}>{label}</Text>
          <Text style={styles.paymentPercent}>{percent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent > 0 ? Math.max(percent, 4) : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.paymentAmount}>{formatCurrency(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },

  exportButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2CFA4",
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  exportText: {
    color: CARDINAL,
    fontSize: 12,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.7,
  },

  periodCard: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },

  periodButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  periodButtonActive: {
    backgroundColor: CARDINAL,
  },

  periodText: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },

  periodTextActive: {
    color: WHITE,
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    minHeight: 146,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  summaryDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },

  summaryDetail: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  summaryPositive: {
    color: GREEN,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
  },

  viewAll: {
    color: CARDINAL,
    fontSize: 11,
    fontWeight: "800",
  },

  chartCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
  },

  chartTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chartAmount: {
    fontSize: 25,
    fontWeight: "800",
    color: TEXT,
  },

  growthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  growthText: {
    fontSize: 10,
    color: GREEN,
    fontWeight: "600",
  },

  chartBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  chart: {
    height: 190,
    marginTop: 20,
    position: "relative",
  },

  chartGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "#F0F0F1",
  },

  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 3,
  },

  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  barTrack: {
    width: 18,
    height: "84%",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#F7EDEF",
  },

  bar: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: CARDINAL,
  },

  barLabel: {
    marginTop: 7,
    fontSize: 8,
    color: MUTED,
    fontWeight: "600",
  },

  productsCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
    overflow: "hidden",
  },

  productRow: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F1",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rankCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  rankText: {
    fontSize: 12,
    fontWeight: "800",
    color: CARDINAL,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },

  productCategory: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  productRevenue: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  revenueText: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  revenueLabel: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
  },

  paymentCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginBottom: 22,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },

  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },

  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  paymentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },

  paymentPercent: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#F0F0F1",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: CARDINAL,
  },

  paymentAmount: {
    width: 75,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
  },

  paymentDivider: {
    height: 1,
    backgroundColor: "#F0F0F1",
    marginVertical: 8,
  },

  transactionsCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  transactionRow: {
    minHeight: 88,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F1",
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionCustomer: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  transactionItem: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  transactionMeta: {
    marginTop: 4,
    fontSize: 9,
    color: "#9A9A9A",
  },

  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  transactionAmount: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  statusPill: {
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },

  completedPill: {
    backgroundColor: "#E8F5E9",
  },

  pendingPill: {
    backgroundColor: "#FFF4E5",
  },

  statusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  completedText: {
    color: GREEN,
  },

  pendingText: {
    color: "#B26A00",
  },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    paddingHorizontal: 4,
    gap: 7,
  },

  footerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  summaryNegative: {
    color: RED,
  },

  growthTextDown: {
    color: RED,
  },

  growthTextFlat: {
    color: MUTED,
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

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    textAlign: "center",
  },
});