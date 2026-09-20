import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

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

type Period = "Today" | "7 Days" | "30 Days";

type Sale = {
  id: string;
  customer: string;
  item: string;
  amount: number;
  payment: "Cash" | "GCash";
  status: "Completed" | "Pending";
  time: string;
};

const salesData: Record<
  Period,
  {
    total: number;
    orders: number;
    average: number;
    change: string;
    chart: number[];
    labels: string[];
  }
> = {
  Today: {
    total: 4280,
    orders: 24,
    average: 178.33,
    change: "+12.5%",
    chart: [28, 42, 35, 55, 48, 72, 64, 86],
    labels: ["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM"],
  },
  "7 Days": {
    total: 28640,
    orders: 164,
    average: 174.63,
    change: "+18.2%",
    chart: [42, 58, 51, 74, 63, 82, 70, 94],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", ""],
  },
  "30 Days": {
    total: 112480,
    orders: 648,
    average: 173.58,
    change: "+21.7%",
    chart: [35, 48, 44, 61, 54, 72, 66, 91],
    labels: ["1", "5", "10", "15", "20", "25", "28", "30"],
  },
};

const recentSales: Sale[] = [
  {
    id: "#ORD-1048",
    customer: "Joshua B.",
    item: "Chicken Rice Meal",
    amount: 149,
    payment: "GCash",
    status: "Completed",
    time: "2 min ago",
  },
  {
    id: "#ORD-1047",
    customer: "Maria S.",
    item: "Iced Coffee + Fries",
    amount: 135,
    payment: "Cash",
    status: "Completed",
    time: "8 min ago",
  },
  {
    id: "#ORD-1046",
    customer: "Kevin R.",
    item: "Beef Tapa Meal",
    amount: 169,
    payment: "GCash",
    status: "Completed",
    time: "14 min ago",
  },
  {
    id: "#ORD-1045",
    customer: "Angela M.",
    item: "Burger Meal",
    amount: 129,
    payment: "Cash",
    status: "Completed",
    time: "22 min ago",
  },
  {
    id: "#ORD-1044",
    customer: "Daniel C.",
    item: "Chicken Rice Meal",
    amount: 149,
    payment: "GCash",
    status: "Pending",
    time: "31 min ago",
  },
];

const topProducts = [
  {
    name: "Chicken Rice Meal",
    category: "Meals",
    sold: 184,
    revenue: 27416,
  },
  {
    name: "Iced Coffee",
    category: "Drinks",
    sold: 142,
    revenue: 11360,
  },
  {
    name: "Beef Tapa Meal",
    category: "Meals",
    sold: 96,
    revenue: 16224,
  },
  {
    name: "Burger Meal",
    category: "Meals",
    sold: 81,
    revenue: 10449,
  },
];

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function SellerSalesScreen() {
  const [period, setPeriod] = useState<Period>("Today");

  const currentData = salesData[period];

  const paymentSummary = useMemo(() => {
    const cash = recentSales
      .filter((sale) => sale.payment === "Cash")
      .reduce((sum, sale) => sum + sale.amount, 0);

    const gcash = recentSales
      .filter((sale) => sale.payment === "GCash")
      .reduce((sum, sale) => sum + sale.amount, 0);

    const total = cash + gcash;

    return {
      cash,
      gcash,
      total,
      cashPercent: total ? Math.round((cash / total) * 100) : 0,
      gcashPercent: total ? Math.round((gcash / total) * 100) : 0,
    };
  }, []);

  const handleExport = () => {
    Alert.alert(
      "Export Sales",
      `Your ${period.toLowerCase()} sales report is ready to export.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          {(["Today", "7 Days", "30 Days"] as Period[]).map((item) => {
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
            value={formatCurrency(currentData.total)}
            detail={currentData.change}
            positive
          />

          <SummaryCard
            icon="receipt-outline"
            label="Orders"
            value={currentData.orders.toString()}
            detail="Completed orders"
          />

          <SummaryCard
            icon="trending-up-outline"
            label="Avg. Order"
            value={formatCurrency(currentData.average)}
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
                {formatCurrency(currentData.total)}
              </Text>
              <View style={styles.growthRow}>
                <Ionicons
                  name="arrow-up"
                  size={14}
                  color={GREEN}
                />
                <Text style={styles.growthText}>
                  {currentData.change} from previous period
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
              {currentData.chart.map((value, index) => (
                <View style={styles.barColumn} key={`${value}-${index}`}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${value}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.barLabel}>
                    {currentData.labels[index]}
                  </Text>
                </View>
              ))}
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

          <Pressable
            onPress={() => Alert.alert("Products", "Product analytics coming soon.")}
          >
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.productsCard}>
          {topProducts.map((product, index) => (
            <View
              key={product.name}
              style={[
                styles.productRow,
                index === topProducts.length - 1 && styles.lastRow,
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

        {/* PAYMENT METHODS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.sectionSubtitle}>
              Recent payment distribution
            </Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <PaymentRow
            icon="cash-outline"
            label="Cash"
            amount={paymentSummary.cash}
            percent={paymentSummary.cashPercent}
          />

          <View style={styles.paymentDivider} />

          <PaymentRow
            icon="phone-portrait-outline"
            label="GCash"
            amount={paymentSummary.gcash}
            percent={paymentSummary.gcashPercent}
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

          <Pressable
            onPress={() => Alert.alert("Transactions", "Transaction history coming soon.")}
          >
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.transactionsCard}>
          {recentSales.map((sale, index) => (
            <View
              key={sale.id}
              style={[
                styles.transactionRow,
                index === recentSales.length - 1 && styles.lastRow,
              ]}
            >
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={
                    sale.payment === "GCash"
                      ? "phone-portrait-outline"
                      : "cash-outline"
                  }
                  size={19}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCustomer}>
                  {sale.customer}
                </Text>
                <Text style={styles.transactionItem} numberOfLines={1}>
                  {sale.item}
                </Text>
                <Text style={styles.transactionMeta}>
                  {sale.id} · {sale.time}
                </Text>
              </View>

              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  {formatCurrency(sale.amount)}
                </Text>

                <View
                  style={[
                    styles.statusPill,
                    sale.status === "Completed"
                      ? styles.completedPill
                      : styles.pendingPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      sale.status === "Completed"
                        ? styles.completedText
                        : styles.pendingText,
                    ]}
                  >
                    {sale.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER NOTE */}
        <View style={styles.footerNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={MUTED}
          />
          <Text style={styles.footerText}>
            Sales data shown here is sample data. It will be connected to your
            MongoDB backend later.
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
  positive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={19} color={CARDINAL} />
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>

      <View style={styles.summaryDetailRow}>
        {positive ? (
          <Ionicons name="trending-up" size={13} color={GREEN} />
        ) : null}

        <Text
          style={[
            styles.summaryDetail,
            positive && styles.summaryPositive,
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
                width: `${Math.max(percent, 4)}%`,
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
});

