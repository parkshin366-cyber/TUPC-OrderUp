import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
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

import { useAuth } from "../../context/AuthContext";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../context/ThemeContext";
import { createThemedStyleSheet } from "../../utils/themeStyles";
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
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const { token, user } = useAuth();

  const [period, setPeriod] = useState<Period>("Today");

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

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
  const completedTransactions = useMemo(
    () => getRecentOrders(orders.filter((order) => order.status === "Completed"), 10),
    [orders]
  );

  const trend = getTrend(sales.changePercent);

  const chartMax = Math.max(...sales.chart, 0);

  const handleExport = () => {
    setExportVisible(true);
  };

  const escapeHtml = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const exportPdf = async () => {
    try {
      setExporting(true);
      const generatedAt = new Date();
      const sellerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Seller";
      const productsHtml = sales.topProducts.length
        ? sales.topProducts.map((product, index) => `<tr><td>${index + 1}</td><td><strong>${escapeHtml(product.name)}</strong><br><span>${escapeHtml(product.category)}</span></td><td>${product.sold}</td><td>&#8369;${product.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>`).join("")
        : `<tr><td colspan="4" class="empty">No completed product sales for this period.</td></tr>`;
      const transactions = completedTransactions;
      const transactionsHtml = transactions.length
        ? transactions.map((order) => `<tr><td>${escapeHtml(formatOrderCode(order))}</td><td>${escapeHtml(getCustomerName(order))}</td><td>${escapeHtml(describeItems(order))}</td><td>${escapeHtml(order.paymentMethod === "gcash" ? "GCash" : "Cash")}</td><td>&#8369;${Number(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>`).join("")
        : `<tr><td colspan="5" class="empty">No completed recent transactions.</td></tr>`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        @page{size:A4;margin:34px}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#222;margin:0;font-size:11px}.header{background:#7D1021;color:#fff;padding:24px;border-radius:12px}.brand{font-size:10px;letter-spacing:1.5px;color:#E7C77C;font-weight:700}.title{font-size:25px;font-weight:800;margin:5px 0}.meta{color:"#F2DDE1"}.section{margin-top:22px}.section h2{font-size:15px;margin:0 0 9px;color:"#7D1021"}.cards{display:flex;gap:10px;margin-top:16px}.card{flex:1;border:1px solid #E4E4E4;border-radius:10px;padding:13px}.label{font-size:9px;color:#777;text-transform:uppercase;letter-spacing:.6px}.value{font-size:18px;font-weight:800;margin-top:5px}.sub{font-size:9px;color:#777;margin-top:3px}table{width:100%;border-collapse:collapse}th{background:#F7EEF0;color:#7D1021;text-align:left;padding:9px;font-size:9px;text-transform:uppercase}td{padding:9px;border-bottom:1px solid #ECECEC;vertical-align:top}td span{color:#777;font-size:9px}.empty{text-align:center;color:#777;padding:18px}.payments{display:flex;gap:10px}.payment{flex:1;padding:12px;border-radius:9px;background:"#F7F7F8"}.footer{margin-top:24px;padding-top:10px;border-top:1px solid #DDD;color:#777;font-size:9px;display:flex;justify-content:space-between}</style></head><body>
        <div class="header"><div class="brand">TUPC-ORDERUP · SELLER CENTER</div><div class="title">Sales Report</div><div class="meta">${escapeHtml(period)} · ${escapeHtml(sellerName)} · Generated ${generatedAt.toLocaleString("en-PH")}</div></div>
        <div class="cards"><div class="card"><div class="label">Total Sales</div><div class="value">&#8369;${sales.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div><div class="sub">Completed orders only</div></div><div class="card"><div class="label">Orders</div><div class="value">${sales.orderCount}</div><div class="sub">Completed transactions</div></div><div class="card"><div class="label">Average Order</div><div class="value">&#8369;${sales.average.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div><div class="sub">Per transaction</div></div></div>
        <div class="section"><h2>Payment Summary</h2><div class="payments"><div class="payment"><div class="label">Cash · ${sales.payment.cashPercent}%</div><div class="value">&#8369;${sales.payment.cash.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div></div><div class="payment"><div class="label">GCash · ${sales.payment.gcashPercent}%</div><div class="value">&#8369;${sales.payment.gcash.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div></div></div></div>
        <div class="section"><h2>Top Products</h2><table><thead><tr><th>#</th><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead><tbody>${productsHtml}</tbody></table></div>
        <div class="section"><h2>Recent Completed Transactions</h2><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead><tbody>${transactionsHtml}</tbody></table></div>
        <div class="footer"><span>Sales exclude cancelled and non-completed orders.</span><span>TUPC-OrderUp</span></div>
      </body></html>`;

      const result = await Print.printToFileAsync({ html, base64: false });
      const safePeriod = period.toLowerCase().replace(/\s+/g, "-");
      const fileName = `TUPC-OrderUp-Sales-${safePeriod}-${generatedAt.toISOString().slice(0, 10)}.pdf`;
      const finalUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: result.uri, to: finalUri });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(finalUri, { mimeType: "application/pdf", dialogTitle: "Save or share sales report", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("PDF Created", `The report was created at ${finalUri}`);
      }
      setExportVisible(false);
    } catch (error) {
      Alert.alert("Export Failed", error instanceof Error ? error.message : "Unable to create the PDF report.");
    } finally {
      setExporting(false);
    }
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

      <Modal visible={exportVisible} transparent animationType="slide" onRequestClose={() => !exporting && setExportVisible(false)}>
        <View style={styles.exportOverlay}>
          <Pressable style={StyleSheet.absoluteFill} disabled={exporting} onPress={() => setExportVisible(false)} />
          <View style={styles.exportSheet}>
            <View style={styles.exportHandle} />
            <View style={styles.exportHeader}>
              <View style={styles.exportHeaderIcon}><Ionicons name="document-text-outline" size={23} color={CARDINAL} /></View>
              <View style={styles.exportHeaderCopy}><Text style={styles.exportTitle}>Sales Report Overview</Text><Text style={styles.exportSubtitle}>Review the information before creating your PDF.</Text></View>
              <Pressable disabled={exporting} style={styles.exportClose} onPress={() => setExportVisible(false)}><Ionicons name="close" size={21} color={TEXT} /></Pressable>
            </View>

            <View style={styles.previewPeriod}><Text style={styles.previewPeriodLabel}>REPORT PERIOD</Text><Text style={styles.previewPeriodValue}>{period}</Text></View>
            <View style={styles.previewGrid}>
              <View style={styles.previewStat}><Text style={styles.previewLabel}>Total Sales</Text><Text style={styles.previewValue}>{formatCurrency(sales.total)}</Text></View>
              <View style={styles.previewStat}><Text style={styles.previewLabel}>Orders</Text><Text style={styles.previewValue}>{sales.orderCount}</Text></View>
              <View style={styles.previewStat}><Text style={styles.previewLabel}>Average</Text><Text style={styles.previewValue}>{formatCurrency(sales.average)}</Text></View>
            </View>

            <View style={styles.previewSection}>
              <View style={styles.previewRow}><View style={styles.previewRowIcon}><Ionicons name="cash-outline" size={17} color={GREEN} /></View><Text style={styles.previewRowLabel}>Cash payments</Text><Text style={styles.previewRowValue}>{formatCurrency(sales.payment.cash)} · {sales.payment.cashPercent}%</Text></View>
              <View style={styles.previewDivider} />
              <View style={styles.previewRow}><View style={styles.previewRowIcon}><Ionicons name="phone-portrait-outline" size={17} color={CARDINAL} /></View><Text style={styles.previewRowLabel}>GCash payments</Text><Text style={styles.previewRowValue}>{formatCurrency(sales.payment.gcash)} · {sales.payment.gcashPercent}%</Text></View>
            </View>

            <View style={styles.previewIncludes}>
              <Text style={styles.previewIncludesTitle}>PDF includes</Text>
              <Text style={styles.previewIncludesText}>Sales summary, payment breakdown, top products, and recent completed transactions.</Text>
            </View>

            <View style={styles.exportActions}>
              <Pressable disabled={exporting} style={styles.exportCancel} onPress={() => setExportVisible(false)}><Text style={styles.exportCancelText}>Cancel</Text></Pressable>
              <Pressable disabled={exporting} style={[styles.exportPdfButton, exporting && styles.exportDisabled]} onPress={() => void exportPdf()}>
                {exporting ? <ActivityIndicator size="small" color={WHITE} /> : <><Ionicons name="download-outline" size={17} color={WHITE} /><Text style={styles.exportPdfText}>Create PDF</Text></>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
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
    color: "#171717",
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#737373",
    lineHeight: 19,
  },

  exportButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2CFA4",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  exportText: {
    color: "#A6192E",
    fontSize: 12,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.7,
  },

  periodCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    backgroundColor: "#A6192E",
  },

  periodText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#737373",
  },

  periodTextActive: {
    color: "#FFFFFF",
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    minHeight: 146,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#737373",
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },

  summaryDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },

  summaryDetail: {
    fontSize: 9,
    color: "#737373",
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
    color: "#171717",
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#737373",
  },

  viewAll: {
    color: "#A6192E",
    fontSize: 11,
    fontWeight: "800",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#171717",
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
    backgroundColor: "#A6192E",
  },

  barLabel: {
    marginTop: 7,
    fontSize: 8,
    color: "#737373",
    fontWeight: "600",
  },

  productsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#A6192E",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
  },

  productCategory: {
    marginTop: 3,
    fontSize: 10,
    color: "#737373",
  },

  productRevenue: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  revenueText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#171717",
  },

  revenueLabel: {
    marginTop: 2,
    fontSize: 9,
    color: "#737373",
  },

  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#171717",
  },

  paymentPercent: {
    fontSize: 10,
    color: "#737373",
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
    backgroundColor: "#A6192E",
  },

  paymentAmount: {
    width: 75,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
    color: "#171717",
  },

  paymentDivider: {
    height: 1,
    backgroundColor: "#F0F0F1",
    marginVertical: 8,
  },

  transactionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E8",
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
    color: "#171717",
  },

  transactionItem: {
    marginTop: 2,
    fontSize: 10,
    color: "#737373",
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
    color: "#171717",
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
    color: "#737373",
  },

  summaryNegative: {
    color: RED,
  },

  growthTextDown: {
    color: RED,
  },

  growthTextFlat: {
    color: "#737373",
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

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E8",
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: "#737373",
    textAlign: "center",
  },

  exportOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16,16,18,0.54)" },
  exportSheet: { paddingTop: 9, paddingHorizontal: 18, paddingBottom: 22, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: "#FFFFFF" },
  exportHandle: { width: 42, height: 4, marginBottom: 16, borderRadius: 2, backgroundColor: "#D3D3D5", alignSelf: "center" },
  exportHeader: { flexDirection: "row", alignItems: "center" },
  exportHeaderIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#FBECEF", alignItems: "center", justifyContent: "center" },
  exportHeaderCopy: { flex: 1, marginLeft: 11, marginRight: 8 },
  exportTitle: { fontSize: 17, fontWeight: "900", color: "#171717" },
  exportSubtitle: { marginTop: 3, fontSize: 10, lineHeight: 14, color: "#737373" },
  exportClose: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#F3F3F4", alignItems: "center", justifyContent: "center" },
  previewPeriod: { marginTop: 17, padding: 12, borderRadius: 13, backgroundColor: "#7D1021", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewPeriodLabel: { fontSize: 9, fontWeight: "900", letterSpacing: .8, color: "#F4CDD4" },
  previewPeriodValue: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  previewGrid: { marginTop: 10, flexDirection: "row", gap: 8 },
  previewStat: { flex: 1, minHeight: 72, padding: 10, borderRadius: 13, borderWidth: 1, borderColor: "#E7E7E8", backgroundColor: "#FAFAFB", justifyContent: "center" },
  previewLabel: { fontSize: 8.5, fontWeight: "700", color: "#737373" },
  previewValue: { marginTop: 5, fontSize: 13, fontWeight: "900", color: "#171717" },
  previewSection: { marginTop: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: "#E7E7E8" },
  previewRow: { minHeight: 48, flexDirection: "row", alignItems: "center" },
  previewRowIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#F6F6F7", alignItems: "center", justifyContent: "center" },
  previewRowLabel: { flex: 1, marginLeft: 9, fontSize: 10.5, fontWeight: "700", color: "#171717" },
  previewRowValue: { fontSize: 10, fontWeight: "900", color: "#A6192E" },
  previewDivider: { height: 1, backgroundColor: "#E7E7E8" },
  previewIncludes: { marginTop: 10, padding: 12, borderRadius: 13, backgroundColor: "#FFF8E7" },
  previewIncludesTitle: { fontSize: 10, fontWeight: "900", color: "#8A650E" },
  previewIncludesText: { marginTop: 3, fontSize: 9.5, lineHeight: 14, color: "#735E2A" },
  exportActions: { marginTop: 14, flexDirection: "row", gap: 10 },
  exportCancel: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: "#E7E7E8", alignItems: "center", justifyContent: "center" },
  exportCancelText: { fontSize: 11, fontWeight: "900", color: "#171717" },
  exportPdfButton: { flex: 1.35, height: 48, borderRadius: 14, backgroundColor: "#A6192E", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  exportPdfText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  exportDisabled: { opacity: .65 },
});

let styles = createStyles(LIGHT_COLORS);
