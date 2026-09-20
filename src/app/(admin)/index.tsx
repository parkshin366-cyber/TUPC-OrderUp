import { Ionicons } from "@expo/vector-icons";
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
const ORANGE = "#B26A00";

const platformStats = [
  {
    label: "Total Users",
    value: "1,248",
    detail: "+84 this month",
    icon: "people-outline" as const,
  },
  {
    label: "Active Users",
    value: "864",
    detail: "69.2% of users",
    icon: "pulse-outline" as const,
  },
  {
    label: "Sellers",
    value: "86",
    detail: "78 active stores",
    icon: "storefront-outline" as const,
  },
  {
    label: "Admins",
    value: "5",
    detail: "All verified",
    icon: "shield-checkmark-outline" as const,
  },
];

const systemHealth = [
  {
    name: "Backend API",
    detail: "Response time 42ms",
    status: "Operational",
    icon: "server-outline" as const,
  },
  {
    name: "MongoDB",
    detail: "Connected · 99.99% uptime",
    status: "Operational",
    icon: "server-outline" as const,
  },
  {
    name: "Authentication",
    detail: "OTP & biometric services",
    status: "Operational",
    icon: "lock-closed-outline" as const,
  },
  {
    name: "Backup",
    detail: "Last backup 2 hours ago",
    status: "Protected",
    icon: "cloud-done-outline" as const,
  },
];

const recentActivity = [
  {
    title: "New seller registration",
    detail: "Campus Bites submitted an application",
    time: "8 min ago",
    icon: "storefront-outline" as const,
  },
  {
    title: "User account approved",
    detail: "A student account was approved",
    time: "21 min ago",
    icon: "person-add-outline" as const,
  },
  {
    title: "Database backup completed",
    detail: "Automatic backup finished successfully",
    time: "2 hrs ago",
    icon: "cloud-done-outline" as const,
  },
  {
    title: "Security verification",
    detail: "Multiple accounts completed OTP verification",
    time: "3 hrs ago",
    icon: "shield-checkmark-outline" as const,
  },
];

const storeActivity = [
  {
    name: "Campus Bites",
    category: "Meals & Drinks",
    orders: 184,
    sales: "₱27,416",
  },
  {
    name: "Cardinal Coffee",
    category: "Coffee & Beverages",
    orders: 142,
    sales: "₱18,920",
  },
  {
    name: "TUPC Snacks",
    category: "Snacks",
    orders: 118,
    sales: "₱14,860",
  },
];

export default function AdminOverviewScreen() {
  const handleQuickAction = (action: string) => {
    Alert.alert(action, `${action} module will be connected to the backend later.`);
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
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MASTER ADMIN</Text>
            <Text style={styles.title}>Overview</Text>
            <Text style={styles.subtitle}>
              Monitor TUPC-OrderUp platform activity.
            </Text>
          </View>

          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark"
              size={21}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* SYSTEM STATUS */}
        <View style={styles.statusBanner}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark-circle" size={21} color={GREEN} />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>All Systems Operational</Text>
            <Text style={styles.statusDescription}>
              No critical platform issues detected.
            </Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* PLATFORM STATISTICS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Platform Statistics</Text>
            <Text style={styles.sectionSubtitle}>
              Current platform overview
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {platformStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statTop}>
                <View style={styles.statIcon}>
                  <Ionicons name={stat.icon} size={19} color={CARDINAL} />
                </View>

                <Ionicons
                  name="ellipsis-horizontal"
                  size={17}
                  color="#B5B5B5"
                />
              </View>

              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statDetail}>{stat.detail}</Text>
            </View>
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Common administrative tasks
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            icon="people-outline"
            label="Manage Users"
            onPress={() => handleQuickAction("Manage Users")}
          />

          <QuickAction
            icon="storefront-outline"
            label="Review Sellers"
            onPress={() => handleQuickAction("Review Sellers")}
          />

          <QuickAction
            icon="shield-outline"
            label="Security"
            onPress={() => handleQuickAction("Security")}
          />

          <QuickAction
            icon="cloud-download-outline"
            label="Backup"
            onPress={() => handleQuickAction("Database Backup")}
          />
        </View>

        {/* SYSTEM HEALTH */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>System Health</Text>
            <Text style={styles.sectionSubtitle}>
              Services and infrastructure
            </Text>
          </View>

          <View style={styles.healthSummary}>
            <View style={styles.healthDot} />
            <Text style={styles.healthSummaryText}>Healthy</Text>
          </View>
        </View>

        <View style={styles.healthCard}>
          {systemHealth.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.healthRow,
                index === systemHealth.length - 1 && styles.lastRow,
              ]}
            >
              <View style={styles.healthIcon}>
                <Ionicons name={item.icon} size={18} color={CARDINAL} />
              </View>

              <View style={styles.healthInfo}>
                <Text style={styles.healthName}>{item.name}</Text>
                <Text style={styles.healthDetail}>{item.detail}</Text>
              </View>

              <View style={styles.healthStatus}>
                <View style={styles.healthStatusDot} />
                <Text style={styles.healthStatusText}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionSubtitle}>
              Latest platform events
            </Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert("Activity", "Full activity history will be available later.")
            }
          >
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.activityCard}>
          {recentActivity.map((activity, index) => (
            <View
              key={`${activity.title}-${index}`}
              style={[
                styles.activityRow,
                index === recentActivity.length - 1 && styles.lastRow,
              ]}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={activity.icon}
                  size={18}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetail}>
                  {activity.detail}
                </Text>
              </View>

              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>

        {/* ACTIVE STORES */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Store Activity</Text>
            <Text style={styles.sectionSubtitle}>
              Current seller performance
            </Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert("Stores", "Store management will be available later.")
            }
          >
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.storeCard}>
          {storeActivity.map((store, index) => (
            <View
              key={store.name}
              style={[
                styles.storeRow,
                index === storeActivity.length - 1 && styles.lastRow,
              ]}
            >
              <View style={styles.storeLogo}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeCategory}>
                  {store.category} · {store.orders} orders
                </Text>
              </View>

              <View style={styles.storeSales}>
                <Text style={styles.storeSalesValue}>{store.sales}</Text>
                <Text style={styles.storeSalesLabel}>sales</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SECURITY SUMMARY */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Security Status</Text>
            <Text style={styles.sectionSubtitle}>
              Account and platform protection
            </Text>
          </View>
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityMain}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={CARDINAL}
              />
            </View>

            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>
                Platform Security
              </Text>
              <Text style={styles.securityDescription}>
                Authentication services are operating normally.
              </Text>
            </View>

            <View style={styles.securePill}>
              <Text style={styles.securePillText}>SECURE</Text>
            </View>
          </View>

          <View style={styles.securityStats}>
            <SecurityMetric label="OTP Verified" value="94.8%" />
            <SecurityMetric label="Biometric Enabled" value="72.4%" />
            <SecurityMetric label="Blocked Today" value="3" />
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>TU</Text>
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerTitle}>TUPC-OrderUp Admin</Text>
            <Text style={styles.footerText}>
              Master administration console
            </Text>
          </View>

          <Text style={styles.version}>v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={20} color={CARDINAL} />
      </View>

      <Text style={styles.quickActionLabel}>{label}</Text>

      <Ionicons name="chevron-forward" size={15} color="#A5A5A5" />
    </Pressable>
  );
}

function SecurityMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.securityMetric}>
      <Text style={styles.securityMetricValue}>{value}</Text>
      <Text style={styles.securityMetricLabel}>{label}</Text>
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

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 1.5,
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
    lineHeight: 19,
    color: MUTED,
  },

  adminBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E2CFA4",
    alignItems: "center",
    justifyContent: "center",
  },

  statusBanner: {
    minHeight: 72,
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DDE9DF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 23,
  },

  statusIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#EAF5EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF5EC",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },

  liveText: {
    fontSize: 8,
    fontWeight: "800",
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 23,
  },

  statCard: {
    width: "48.7%",
    minHeight: 145,
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
  },

  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },

  statValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
  },

  statDetail: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "600",
    color: GREEN,
  },

  quickActions: {
    gap: 8,
    marginBottom: 23,
  },

  quickAction: {
    minHeight: 57,
    backgroundColor: WHITE,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  quickActionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  quickActionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },

  pressed: {
    opacity: 0.7,
  },

  healthSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN,
  },

  healthSummaryText: {
    fontSize: 10,
    fontWeight: "700",
    color: GREEN,
  },

  healthCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 23,
  },

  healthRow: {
    minHeight: 71,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F1",
  },

  healthIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  healthInfo: {
    flex: 1,
  },

  healthName: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  healthDetail: {
    marginTop: 3,
    fontSize: 9,
    color: MUTED,
  },

  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  healthStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },

  healthStatusText: {
    fontSize: 8,
    fontWeight: "800",
    color: GREEN,
  },

  activityCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 23,
  },

  activityRow: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F1",
  },

  activityIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  activityInfo: {
    flex: 1,
    paddingRight: 7,
  },

  activityTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
  },

  activityDetail: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    color: MUTED,
  },

  activityTime: {
    fontSize: 8,
    color: "#999999",
    fontWeight: "600",
  },

  viewAll: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  storeCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 23,
  },

  storeRow: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F1",
  },

  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  storeInfo: {
    flex: 1,
  },

  storeName: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  storeCategory: {
    marginTop: 3,
    fontSize: 9,
    color: MUTED,
  },

  storeSales: {
    alignItems: "flex-end",
  },

  storeSalesValue: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
  },

  storeSalesLabel: {
    marginTop: 2,
    fontSize: 8,
    color: MUTED,
  },

  securityCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 23,
  },

  securityMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F8E9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  securityInfo: {
    flex: 1,
    paddingRight: 7,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  securityDescription: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    color: MUTED,
  },

  securePill: {
    backgroundColor: "#EAF5EC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  securePillText: {
    fontSize: 8,
    fontWeight: "800",
    color: GREEN,
  },

  securityStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F1",
    marginTop: 14,
    paddingTop: 14,
  },

  securityMetric: {
    flex: 1,
    alignItems: "center",
  },

  securityMetricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: CARDINAL_DARK,
  },

  securityMetricLabel: {
    marginTop: 4,
    fontSize: 8,
    textAlign: "center",
    color: MUTED,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 3,
  },

  footerLogo: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  footerLogoText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  footerInfo: {
    flex: 1,
  },

  footerTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: TEXT,
  },

  footerText: {
    marginTop: 2,
    fontSize: 8,
    color: MUTED,
  },

  version: {
    fontSize: 9,
    fontWeight: "700",
    color: "#A0A0A0",
  },

  lastRow: {
    borderBottomWidth: 0,
  },
});

