import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// =====================================================
// COLORS
// =====================================================

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const BORDER = "#E7E7E8";

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
  status: "Preparing" | "Ready" | "Completed";
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

  if (status === "Ready") {
    statusStyle = styles.statusReady;
    statusTextStyle = styles.statusReadyText;
  }

  if (status === "Completed") {
    statusStyle = styles.statusCompleted;
    statusTextStyle =
      styles.statusCompletedText;
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

          <Text style={styles.orderItem}>
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
  const { user } = useAuth();

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
    userData?.storeName?.trim() ||
    userData?.store?.name?.trim() ||
    "My Store";

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
              Welcome to {storeName} 👋
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
                <View style={styles.onlineDot} />

                <Text style={styles.onlineText}>
                  Store is currently open
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
            value="₱4,850"
            detail="+12.5% from yesterday"
            iconColor={CARDINAL}
          />

          <StatCard
            icon="receipt-outline"
            label="Orders Today"
            value="28"
            detail="6 currently active"
            iconColor={GOLD}
          />

          <StatCard
            icon="fast-food-outline"
            label="Products"
            value="42"
            detail="4 need attention"
            iconColor="#5B7C99"
          />

          <StatCard
            icon="alert-circle-outline"
            label="Low Stock"
            value="4"
            detail="Items below threshold"
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

        <View style={styles.ordersCard}>
          <OrderRow
            order="#ORD-1028"
            customer="Juan Dela Cruz"
            item="Chicken Rice Meal × 2"
            amount="₱240"
            status="Preparing"
          />

          <View style={styles.divider} />

          <OrderRow
            order="#ORD-1027"
            customer="Maria Santos"
            item="Iced Coffee × 1"
            amount="₱95"
            status="Ready"
          />

          <View style={styles.divider} />

          <OrderRow
            order="#ORD-1026"
            customer="Kevin Ramos"
            item="Burger Meal × 1"
            amount="₱175"
            status="Completed"
          />

          <View style={styles.divider} />

          <OrderRow
            order="#ORD-1025"
            customer="Angela Reyes"
            item="Fries + Iced Tea"
            amount="₱130"
            status="Completed"
          />
        </View>

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
                ₱28,640
              </Text>
            </View>

            <View style={styles.growthBadge}>
              <Ionicons
                name="trending-up"
                size={15}
                color={CARDINAL}
              />

              <Text style={styles.growthText}>
                18.4%
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {[35, 55, 42, 70, 58, 82, 68].map(
              (height, index) => (
                <View
                  key={index}
                  style={styles.chartColumn}
                >
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height,
                        opacity:
                          index === 6
                            ? 1
                            : 0.55,
                      },
                    ]}
                  />

                  <Text
                    style={styles.chartLabel}
                  >
                    {
                      ["M", "T", "W", "T", "F", "S", "S"][
                        index
                      ]
                    }
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

// =====================================================
// STYLES
// =====================================================

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
    color: CARDINAL,
    marginBottom: 5,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 5,
    lineHeight: 19,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: CARDINAL,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // ===================================================
  // ACCOUNT STATUS
  // ===================================================

  accountStatus: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: "#F7E9EC",
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
    color: TEXT,
  },

  accountUsername: {
    fontSize: 11,
    color: MUTED,
    marginTop: 3,
  },

  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7EF",
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
    color: "#28794D",
  },

  // ===================================================
  // STORE STATUS
  // ===================================================

  storeStatus: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: "#F7E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  storeName: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
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
    color: MUTED,
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
    color: TEXT,
  },

  dateText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },

  viewAll: {
    fontSize: 12,
    color: CARDINAL,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
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
    color: MUTED,
    fontWeight: "700",
  },

  statValue: {
    fontSize: 23,
    color: TEXT,
    fontWeight: "900",
    marginTop: 3,
  },

  statDetail: {
    fontSize: 10,
    color: MUTED,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F7E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  quickSubtitle: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  // ===================================================
  // ORDERS
  // ===================================================

  ordersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: "#F7E9EC",
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
    color: TEXT,
  },

  customer: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },

  orderItem: {
    fontSize: 10,
    color: "#909090",
    marginTop: 3,
  },

  orderRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  amount: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  statusPreparing: {
    backgroundColor: "#FFF3E3",
  },

  statusReady: {
    backgroundColor: "#F1EAF6",
  },

  statusCompleted: {
    backgroundColor: "#E9F7EF",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  statusPreparingText: {
    color: "#A86616",
  },

  statusReadyText: {
    color: "#77508C",
  },

  statusCompletedText: {
    color: "#28794D",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
  },

  // ===================================================
  // PERFORMANCE
  // ===================================================

  performanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
  },

  performanceTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  performanceLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  performanceValue: {
    fontSize: 25,
    color: TEXT,
    fontWeight: "900",
    marginTop: 4,
  },

  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7E9EC",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  growthText: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
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
    backgroundColor: CARDINAL,
    minHeight: 10,
  },

  chartLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
    marginTop: 7,
  },

  footerSpace: {
    height: 15,
  },
});