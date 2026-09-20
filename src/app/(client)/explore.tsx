import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    type: "Meals • Snacks",
    rating: "4.8",
    time: "10–15 min",
  },
  {
    name: "Cardinal Café",
    type: "Coffee • Drinks",
    rating: "4.9",
    time: "5–10 min",
  },
  {
    name: "Campus Essentials",
    type: "Supplies • Accessories",
    rating: "4.7",
    time: "10–20 min",
  },
];

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.eyebrow}>DISCOVER</Text>

        <Text style={styles.title}>Explore</Text>

        <Text style={styles.subtitle}>
          Find stores and products around campus.
        </Text>

        {/* SEARCH */}
        <View style={styles.search}>
          <Ionicons
            name="search-outline"
            size={20}
            color={MUTED}
          />

          <TextInput
            placeholder="Search stores or products..."
            placeholderTextColor="#999999"
            style={styles.input}
          />

          <Ionicons
            name="options-outline"
            size={19}
            color={CARDINAL}
          />
        </View>

        {/* CATEGORIES */}
        <Text style={styles.sectionTitle}>Browse Categories</Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <Pressable
              key={category.label}
              style={({ pressed }) => [
                styles.category,
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

              <Text style={styles.categoryText}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* STORES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campus Stores</Text>

          <Text style={styles.seeAll}>See all</Text>
        </View>

        {stores.map((store) => (
          <Pressable
            key={store.name}
            style={({ pressed }) => [
              styles.store,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.storeImage}>
              <Ionicons
                name="storefront-outline"
                size={29}
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

              <View style={styles.meta}>
                <Ionicons
                  name="star"
                  size={12}
                  color={GOLD}
                />

                <Text style={styles.metaText}>
                  {store.rating}
                </Text>

                <View style={styles.dot} />

                <Ionicons
                  name="time-outline"
                  size={12}
                  color={MUTED}
                />

                <Text style={styles.metaText}>
                  {store.time}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 100,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: CARDINAL,
  },

  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
  },

  search: {
    height: 54,
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 13,
    color: TEXT,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  category: {
    width: "23%",
    alignItems: "center",
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

  categoryText: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },

  sectionHeader: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  seeAll: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  store: {
    minHeight: 86,
    marginBottom: 10,
    padding: 12,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  storeImage: {
    width: 58,
    height: 58,
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
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
  },

  meta: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 4,
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#BBBBBB",
    marginHorizontal: 8,
  },

  pressed: {
    opacity: 0.7,
  },
});