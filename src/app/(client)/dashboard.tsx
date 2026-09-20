import { Ionicons } from "@expo/vector-icons";
import {
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
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

const categories = [
  { icon: "restaurant-outline", label: "Food" },
  { icon: "cafe-outline", label: "Drinks" },
  { icon: "bag-handle-outline", label: "Essentials" },
  { icon: "school-outline", label: "School" },
];

const stores = [
  {
    name: "TUPC Food Hub",
    type: "Food & Meals",
    time: "10–15 min",
    icon: "restaurant",
  },
  {
    name: "Cardinal Café",
    type: "Coffee & Drinks",
    time: "5–10 min",
    icon: "cafe",
  },
  {
    name: "Campus Essentials",
    type: "School Supplies",
    time: "10–20 min",
    icon: "bag-handle",
  },
];

export default function ClientDashboard() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>TUPC-ORDERUP</Text>

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
              onPress={() => {}}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={TEXT}
              />

              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          {/* SEARCH */}
          <Pressable
            style={({ pressed }) => [
              styles.searchBox,
              pressed && styles.pressed,
            ]}
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

          {/* PROMO */}
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Text style={styles.promoSmall}>
                WELCOME TO CAMPUS
              </Text>

              <Text style={styles.promoTitle}>
                Order smarter.{`\n`}Study better.
              </Text>

              <Text style={styles.promoDescription}>
                Discover food and essentials from campus sellers.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.promoButton,
                  pressed && styles.pressed,
                ]}
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

          {/* CATEGORIES */}
          <SectionHeader title="Categories" />

          <View style={styles.categoryRow}>
            {categories.map((category) => (
              <Pressable
                key={category.label}
                style={({ pressed }) => [
                  styles.categoryItem,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon as any}
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

          {/* STORES */}
          <SectionHeader
            title="Popular Stores"
            action="See all"
            onAction={() => {}}
          />

          {stores.map((store) => (
            <Pressable
              key={store.name}
              style={({ pressed }) => [
                styles.storeCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.storeIcon}>
                <Ionicons
                  name={store.icon as any}
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
                    4.8
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#AAAAAA"
              />
            </Pressable>
          ))}

          {/* QUICK ACTIONS */}
          <SectionHeader title="Quick Actions" />

          <View style={styles.quickRow}>
            <QuickAction
              icon="receipt-outline"
              label="My Orders"
              onPress={() => {}}
            />

            <QuickAction
              icon="heart-outline"
              label="Favorites"
              onPress={() => {}}
            />

            <QuickAction
              icon="cart-outline"
              label="My Cart"
              onPress={() => {}}
            />
          </View>

          {/* SPACE FOR TAB BAR */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
      <Text style={styles.sectionTitle}>{title}</Text>

      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
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
    >
      <Ionicons
        name={icon as any}
        size={23}
        color={CARDINAL}
      />

      <Text style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: CARDINAL,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

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