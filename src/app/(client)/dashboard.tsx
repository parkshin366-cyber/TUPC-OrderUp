import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const categories: {
  icon: IconName;
  label: string;
}[] = [
  {
    icon: "restaurant-outline",
    label: "Food",
  },
  {
    icon: "cafe-outline",
    label: "Drinks",
  },
  {
    icon: "bag-handle-outline",
    label: "Essentials",
  },
  {
    icon: "school-outline",
    label: "School",
  },
];

const stores: {
  id: string;
  name: string;
  type: string;
  time: string;
  rating: string;
  icon: IconName;
}[] = [
  {
    id: "tupc-food-hub",
    name: "TUPC Food Hub",
    type: "Food & Meals",
    time: "10–15 min",
    rating: "4.8",
    icon: "restaurant",
  },
  {
    id: "cardinal-cafe",
    name: "Cardinal Café",
    type: "Coffee & Drinks",
    time: "5–10 min",
    rating: "4.8",
    icon: "cafe",
  },
  {
    id: "campus-essentials",
    name: "Campus Essentials",
    type: "School Supplies",
    time: "10–20 min",
    rating: "4.8",
    icon: "bag-handle",
  },
];

export default function ClientDashboard() {
  // ============================================================
  // NAVIGATION
  // ============================================================

  const goToExplore = () => {
    router.push("/explore");
  };

  const goToOrders = () => {
    router.push("/orders");
  };

  const goToCart = () => {
    router.push("/cart");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  const goToStore = (storeId: string) => {
    router.push({
      pathname: "/store/[id]",
      params: {
        id: storeId,
      },
    });
  };

  const goToCategory = (category: string) => {
    router.push({
      pathname: "/explore",
      params: {
        category,
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.eyebrow}>
                TUPC-ORDERUP
              </Text>

              <Text style={styles.greeting}>
                Good morning 👋
              </Text>

              <Text style={styles.subtitle}>
                What are you craving today?
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.pressed,
              ]}
              onPress={goToProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Ionicons
                name="person-outline"
                size={21}
                color={TEXT}
              />
            </Pressable>
          </View>

          {/* ================================================== */}
          {/* SEARCH */}
          {/* ================================================== */}

          <Pressable
            style={({ pressed }) => [
              styles.searchBox,
              pressed && styles.pressed,
            ]}
            onPress={goToExplore}
            accessibilityRole="button"
            accessibilityLabel="Search food, drinks, and stores"
          >
            <Ionicons
              name="search-outline"
              size={21}
              color={MUTED}
            />

            <Text style={styles.searchPlaceholder}>
              Search food, drinks, stores...
            </Text>

            <View style={styles.filterButton}>
              <Ionicons
                name="options-outline"
                size={18}
                color={CARDINAL}
              />
            </View>
          </Pressable>

          {/* ================================================== */}
          {/* PROMO */}
          {/* ================================================== */}

          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Text style={styles.promoSmall}>
                WELCOME TO CAMPUS
              </Text>

              <Text style={styles.promoTitle}>
                Order smarter.
                {"\n"}
                Study better.
              </Text>

              <Text style={styles.promoDescription}>
                Discover food and essentials from campus sellers.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.promoButton,
                  pressed && styles.pressed,
                ]}
                onPress={goToExplore}
                accessibilityRole="button"
                accessibilityLabel="Explore stores"
              >
                <Text style={styles.promoButtonText}>
                  Explore Stores
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={CARDINAL_DARK}
                />
              </Pressable>
            </View>

            <View style={styles.promoIcon}>
              <Ionicons
                name="bag-handle"
                size={52}
                color={GOLD}
              />
            </View>
          </View>

          {/* ================================================== */}
          {/* CATEGORIES */}
          {/* ================================================== */}

          <SectionHeader title="Categories" />

          <View style={styles.categoryRow}>
            {categories.map((category) => (
              <Pressable
                key={category.label}
                style={({ pressed }) => [
                  styles.categoryItem,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  goToCategory(category.label)
                }
                accessibilityRole="button"
                accessibilityLabel={`Open ${category.label}`}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon}
                    size={24}
                    color={CARDINAL}
                  />
                </View>

                <Text style={styles.categoryLabel}>
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ================================================== */}
          {/* POPULAR STORES */}
          {/* ================================================== */}

          <SectionHeader
            title="Popular Stores"
            action="See all"
            onAction={goToExplore}
          />

          {stores.map((store) => (
            <Pressable
              key={store.id}
              style={({ pressed }) => [
                styles.storeCard,
                pressed && styles.pressed,
              ]}
              onPress={() => goToStore(store.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${store.name}`}
            >
              <View style={styles.storeIcon}>
                <Ionicons
                  name={store.icon}
                  size={26}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>
                  {store.name}
                </Text>

                <Text style={styles.storeType}>
                  {store.type}
                </Text>

                <View style={styles.storeMeta}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={MUTED}
                  />

                  <Text style={styles.storeMetaText}>
                    {store.time}
                  </Text>

                  <View style={styles.metaDot} />

                  <Ionicons
                    name="star"
                    size={12}
                    color={GOLD}
                  />

                  <Text style={styles.storeMetaText}>
                    {store.rating}
                  </Text>
                </View>
              </View>

              <View style={styles.storeArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#AAAAAA"
                />
              </View>
            </Pressable>
          ))}

          {/* ================================================== */}
          {/* QUICK ACTIONS */}
          {/* ================================================== */}

          <SectionHeader title="Quick Actions" />

          <View style={styles.quickRow}>
            <QuickAction
              icon="receipt-outline"
              label="My Orders"
              onPress={goToOrders}
            />

            <QuickAction
              icon="compass-outline"
              label="Explore"
              onPress={goToExplore}
            />

            <QuickAction
              icon="cart-outline"
              label="My Cart"
              onPress={goToCart}
            />
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {action && onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={styles.sectionAction}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.quickIconContainer}>
        <Ionicons
          name={icon}
          size={23}
          color={CARDINAL}
        />
      </View>

      <Text style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: CARDINAL,
  },

  greeting: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
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
  },

  // SEARCH

  searchBox: {
    height: 54,
    marginTop: 20,
    paddingLeft: 16,
    paddingRight: 7,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#999999",
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  // PROMO

  promoCard: {
    minHeight: 190,
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: CARDINAL_DARK,
    padding: 21,
    overflow: "hidden",
    flexDirection: "row",
  },

  promoContent: {
    flex: 1,
    zIndex: 2,
  },

  promoSmall: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: GOLD,
  },

  promoTitle: {
    marginTop: 8,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  promoDescription: {
    marginTop: 8,
    maxWidth: 245,
    fontSize: 11,
    lineHeight: 16,
    color: "#E8DDE0",
  },

  promoButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    backgroundColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  promoButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  promoIcon: {
    position: "absolute",
    right: -14,
    bottom: -12,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#8F1029",
    alignItems: "center",
    justifyContent: "center",
  },

  // SECTIONS

  sectionHeader: {
    marginTop: 25,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  sectionAction: {
    fontSize: 12,
    fontWeight: "800",
    color: CARDINAL,
  },

  // CATEGORIES

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  categoryItem: {
    alignItems: "center",
    width: "23%",
  },

  categoryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
  },

  // STORES

  storeCard: {
    minHeight: 84,
    marginBottom: 10,
    padding: 12,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  storeInfo: {
    flex: 1,
    marginLeft: 13,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  storeType: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
  },

  storeMeta: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  storeMetaText: {
    marginLeft: 4,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#BBBBBB",
    marginHorizontal: 7,
  },

  storeArrow: {
    width: 25,
    alignItems: "flex-end",
  },

  // QUICK ACTIONS

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },

  quickAction: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  quickIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  quickLabel: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "800",
    color: TEXT,
  },

  bottomSpace: {
    height: 100,
  },

  pressed: {
    opacity: 0.7,
  },
});

