import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// =====================================================
// COLORS
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

// =====================================================
// TYPES
// =====================================================

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Category = {
  icon: IconName;
  label: string;
};

type Store = {
  id: string;
  name: string;
  type: string;
  rating: string;
  time: string;
  categories: string[];
};

// =====================================================
// CATEGORIES
// =====================================================

const categories: Category[] = [
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

// =====================================================
// TEMPORARY STORE DATA
// =====================================================
// Later, papalitan natin ito ng MongoDB API data.
// For now, functional na ang search/filter/navigation.
// =====================================================

const stores: Store[] = [
  {
    id: "tupc-food-hub",
    name: "TUPC Food Hub",
    type: "Meals • Snacks",
    rating: "4.8",
    time: "10–15 min",
    categories: ["Food"],
  },
  {
    id: "cardinal-cafe",
    name: "Cardinal Café",
    type: "Coffee • Drinks",
    rating: "4.9",
    time: "5–10 min",
    categories: ["Drinks"],
  },
  {
    id: "campus-essentials",
    name: "Campus Essentials",
    type: "Supplies • Accessories",
    rating: "4.7",
    time: "10–20 min",
    categories: ["Essentials", "School"],
  },
];

// =====================================================
// SCREEN
// =====================================================

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    category?: string;
  }>();

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === "string" ? params.category : ""
  );

  // ===================================================
  // FILTER STORES
  // ===================================================

  const filteredStores = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return stores.filter((store) => {
      const matchesSearch =
        search.length === 0 ||
        store.name.toLowerCase().includes(search) ||
        store.type.toLowerCase().includes(search) ||
        store.categories.some((category) =>
          category.toLowerCase().includes(search)
        );

      const matchesCategory =
        selectedCategory.length === 0 ||
        store.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchText, selectedCategory]);

  // ===================================================
  // CATEGORY
  // ===================================================

  const handleCategoryPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      return;
    }

    setSelectedCategory(category);
  };

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("");
  };

  // ===================================================
  // STORE NAVIGATION
  // ===================================================

  const openStore = (storeId: string) => {
    router.push({
      pathname: "/store/[id]",
      params: {
        id: storeId,
      },
    });
  };

  // ===================================================
  // SEARCH CLEAR
  // ===================================================

  const clearSearch = () => {
    setSearchText("");
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Text style={styles.eyebrow}>DISCOVER</Text>

        <Text style={styles.title}>Explore</Text>

        <Text style={styles.subtitle}>
          Find stores and products around campus.
        </Text>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View style={styles.search}>
          <Ionicons
            name="search-outline"
            size={20}
            color={MUTED}
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search stores or products..."
            placeholderTextColor="#999999"
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {searchText.length > 0 ? (
            <Pressable
              onPress={clearSearch}
              hitSlop={10}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#AAAAAA"
              />
            </Pressable>
          ) : (
            <Ionicons
              name="options-outline"
              size={19}
              color={CARDINAL}
            />
          )}
        </View>

        {/* =================================================
            ACTIVE FILTER
        ================================================= */}

        {selectedCategory.length > 0 && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilter}>
              <Ionicons
                name="funnel-outline"
                size={13}
                color={CARDINAL}
              />

              <Text style={styles.activeFilterText}>
                {selectedCategory}
              </Text>

              <Pressable
                onPress={() => setSelectedCategory("")}
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={14}
                  color={CARDINAL}
                />
              </Pressable>
            </View>

            <Pressable onPress={clearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Browse Categories
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const isSelected =
              selectedCategory === category.label;

            return (
              <Pressable
                key={category.label}
                onPress={() =>
                  handleCategoryPress(category.label)
                }
                style={({ pressed }) => [
                  styles.category,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    isSelected && styles.categoryIconSelected,
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={24}
                    color={
                      isSelected ? "#FFFFFF" : CARDINAL
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.categoryText,
                    isSelected &&
                      styles.categoryTextSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =================================================
            STORES HEADER
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Campus Stores
            </Text>

            <Text style={styles.resultText}>
              {filteredStores.length}{" "}
              {filteredStores.length === 1
                ? "store"
                : "stores"}{" "}
              found
            </Text>
          </View>

          {(searchText.length > 0 ||
            selectedCategory.length > 0) && (
            <Pressable onPress={clearFilters}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          )}
        </View>

        {/* =================================================
            STORE LIST
        ================================================= */}

        {filteredStores.length > 0 ? (
          filteredStores.map((store) => (
            <Pressable
              key={store.id}
              onPress={() => openStore(store.id)}
              style={({ pressed }) => [
                styles.store,
                pressed && styles.pressed,
              ]}
            >
              {/* STORE ICON */}

              <View style={styles.storeImage}>
                <Ionicons
                  name="storefront-outline"
                  size={29}
                  color={CARDINAL}
                />
              </View>

              {/* STORE INFO */}

              <View style={styles.storeInfo}>
                <Text
                  style={styles.storeName}
                  numberOfLines={1}
                >
                  {store.name}
                </Text>

                <Text
                  style={styles.storeType}
                  numberOfLines={1}
                >
                  {store.type}
                </Text>

                {/* META */}

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

              {/* ARROW */}

              <View style={styles.arrow}>
                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#AAAAAA"
                />
              </View>
            </Pressable>
          ))
        ) : (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="search-outline"
                size={30}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No stores found
            </Text>

            <Text style={styles.emptySubtitle}>
              Try a different search or category.
            </Text>

            <Pressable
              onPress={clearFilters}
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.resetButtonText}>
                Clear Filters
              </Text>
            </Pressable>
          </View>
        )}

        {/* =================================================
            BOTTOM SPACE
        ================================================= */}

        <View style={styles.bottomSpace} />
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

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 100,
  },

  // ===================================================
  // HEADER
  // ===================================================

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

  // ===================================================
  // SEARCH
  // ===================================================

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

  // ===================================================
  // ACTIVE FILTER
  // ===================================================

  activeFilterRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activeFilter: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FCECEF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  activeFilterText: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  clearText: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  // ===================================================
  // SECTIONS
  // ===================================================

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  sectionHeader: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  seeAll: {
    marginBottom: 13,
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  resultText: {
    marginTop: -7,
    marginBottom: 12,
    fontSize: 10,
    color: MUTED,
  },

  // ===================================================
  // CATEGORIES
  // ===================================================

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

  categoryIconSelected: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  categoryText: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },

  categoryTextSelected: {
    color: CARDINAL,
    fontWeight: "900",
  },

  // ===================================================
  // STORE
  // ===================================================

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

  arrow: {
    marginLeft: 8,
  },

  // ===================================================
  // EMPTY STATE
  // ===================================================

  emptyState: {
    marginTop: 15,
    paddingVertical: 35,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  emptySubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },

  resetButton: {
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  resetButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  // ===================================================
  // PRESS
  // ===================================================

  pressed: {
    opacity: 0.7,
  },

  bottomSpace: {
    height: 20,
  },
});

