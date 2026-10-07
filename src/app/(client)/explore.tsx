import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../context/ThemeContext";
import { createThemedStyleSheet } from "../../utils/themeStyles";

import {
  ClientStore as Store,
  ClientStoreType as StoreType,
  CatalogFood,
  loadClientCatalog,
} from "../../services/clientCatalog";

// =====================================================
// TUP CARDINAL THEME
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const CARDINAL_DEEP = "#570B17";
const GOLD = "#D8B56A";

const BACKGROUND = "#F7F7F8";
const WHITE = "#FFFFFF";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E5E5E5";

const SUCCESS = "#18864B";
const SUCCESS_BG = "#EAF7EF";

// =====================================================
// TYPES
// =====================================================

type IconName = keyof typeof Ionicons.glyphMap;

type Category = {
  icon: IconName;
  label: string;
  description: string;
};

type FilterType = "all" | StoreType;

// =====================================================
// CATEGORIES
// =====================================================

const categories: Category[] = [
  {
    icon: "restaurant-outline",
    label: "Food",
    description: "Meals and dishes",
  },
  {
    icon: "cafe-outline",
    label: "Drinks",
    description: "Coffee and beverages",
  },
  {
    icon: "fast-food-outline",
    label: "Snacks",
    description: "Quick bites",
  },
  {
    icon: "school-outline",
    label: "School",
    description: "School needs",
  },
  {
    icon: "bag-handle-outline",
    label: "Essentials",
    description: "Daily essentials",
  },
];

// =====================================================
// STORE FILTERS
// =====================================================

const STORE_FILTERS: {
  id: FilterType;
  label: string;
  icon: IconName;
}[] = [
  {
    id: "all",
    label: "All",
    icon: "apps-outline",
  },
  {
    id: "canteen",
    label: "Canteens",
    icon: "restaurant-outline",
  },
  {
    id: "organization",
    label: "Organizations",
    icon: "people-outline",
  },
  {
    id: "others",
    label: "Other Sellers",
    icon: "ellipsis-horizontal-circle-outline",
  },
];

// =====================================================
// STORE TYPE LABEL
// =====================================================

const getStoreTypeLabel = (type: StoreType) => {
  switch (type) {
    case "canteen":
      return "Canteen";

    case "organization":
      return "Organization";

    case "others":
      return "Other Seller";

    default:
      return "Store";
  }
};

// =====================================================
// STORE TYPE ICON
// =====================================================

const getStoreTypeIcon = (
  type: StoreType
): IconName => {
  switch (type) {
    case "canteen":
      return "restaurant-outline";

    case "organization":
      return "people-outline";

    case "others":
      return "person-outline";

    default:
      return "storefront-outline";
  }
};

// =====================================================
// FILTER TITLE
// =====================================================

const getFilterTitle = (filter: FilterType) => {
  switch (filter) {
    case "canteen":
      return "Canteens";

    case "organization":
      return "Organizations";

    case "others":
      return "Other Sellers";

    default:
      return "All Results";
  }
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const [stores, setStores] = useState<Store[]>([]);
  const [foods, setFoods] = useState<CatalogFood[]>([]);
  const params = useLocalSearchParams<{
    category?: string;
  }>();

  const initialCategory =
    typeof params.category === "string"
      ? params.category
      : "";

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("all");

  const [openingStoreId, setOpeningStoreId] =
    useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedFilter("all");
  }, [initialCategory]);

  // ===================================================
  // CATEGORY FILTER
  // ===================================================

  const categoryFilteredStores = useMemo(() => {
    if (!selectedCategory) {
      return stores;
    }

    return stores.filter((store) =>
      store.categories.some(
        (category) =>
          category.toLowerCase() ===
          selectedCategory.toLowerCase()
      )
    );
  }, [selectedCategory, stores]);

  const filteredFoods = useMemo(() => {
    if (!selectedCategory) return foods;
    const categoryMap: Record<string, string[]> = {
      Food: ["Meals", "Desserts"],
      Drinks: ["Drinks"],
      Snacks: ["Snacks"],
      School: ["School Supplies"],
      Essentials: ["Clothing", "Accessories", "Gadgets and Electronics", "Gifts and Souvenirs", "Others"],
    };
    const accepted = categoryMap[selectedCategory] ?? [selectedCategory];
    return foods.filter((food) => accepted.includes(food.category));
  }, [foods, selectedCategory]);

  useEffect(() => {
    let active = true;
    loadClientCatalog()
      .then((catalog) => {
        if (active) {
          setStores(catalog.stores);
          setFoods(catalog.foods);
        }
      })
      .catch((error) => console.error("LOAD EXPLORE STORES ERROR:", error))
    return () => { active = false; };
  }, []);

  // ===================================================
  // STORE TYPE FILTER
  // ===================================================

  const filteredStores = useMemo(() => {
    if (selectedFilter === "all") {
      return categoryFilteredStores;
    }

    return categoryFilteredStores.filter(
      (store) => store.type === selectedFilter
    );
  }, [
    categoryFilteredStores,
    selectedFilter,
  ]);

  // ===================================================
  // ALL RESULTS
  // ===================================================

  const showingAllResults =
    !selectedCategory &&
    selectedFilter === "all";

  // ===================================================
  // SELECT CATEGORY
  // ===================================================

  const handleCategoryPress = (
    category: string
  ) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      setSelectedFilter("all");
      return;
    }

    setSelectedCategory(category);
    setSelectedFilter("all");
  };

  // ===================================================
  // VIEW ALL RESULTS
  // ===================================================

  const handleViewAllResults = () => {
    setSelectedCategory("");
    setSelectedFilter("all");
  };

  // ===================================================
  // STORE DETAIL
  // ===================================================

  const openStore = (store: Store) => {
    if (openingStoreId !== null) {
      return;
    }

    setOpeningStoreId(store.id);

    setTimeout(() => {
      setOpeningStoreId(null);

      router.push({
        pathname:
          "/(client)/(client-details)/store/[id]",
        params: {
          id: store.id,
        },
      });
    }, 120);
  };

  const openProduct = (food: CatalogFood) => {
    router.push({ pathname: "/(client)/(client-details)/product/[id]", params: { id: food.id } });
  };

  // ===================================================
  // STORE CARD
  // ===================================================

  const renderStore = (store: Store) => {
    const isOpen = store.status === "Open";
    const isOpening =
      openingStoreId === store.id;

    return (
      <Pressable
        key={store.id}
        onPress={() => openStore(store)}
        disabled={openingStoreId !== null}
        style={({ pressed }) => [
          styles.storeCard,
          pressed && styles.storeCardPressed,
          isOpening && styles.storeCardOpening,
        ]}
      >
        {/* STORE ICON */}

        <View style={styles.storeIconWrapper}>
          <View style={styles.storeIconCircle}>
            <Ionicons
              name={store.icon}
              size={29}
              color={CARDINAL}
            />
          </View>

          {store.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons
                name="star"
                size={9}
                color={WHITE}
              />

              <Text style={styles.featuredText}>
                Featured
              </Text>
            </View>
          )}
        </View>

        {/* STORE CONTENT */}

        <View style={styles.storeContent}>
          {/* TITLE + STATUS */}

          <View style={styles.storeTitleRow}>
            <Text
              style={styles.storeName}
              numberOfLines={1}
            >
              {store.name}
            </Text>

            <View
              style={[
                styles.statusBadge,
                isOpen
                  ? styles.statusOpen
                  : styles.statusClosed,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isOpen
                    ? styles.statusDotOpen
                    : styles.statusDotClosed,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  isOpen
                    ? styles.statusTextOpen
                    : styles.statusTextClosed,
                ]}
              >
                {store.status}
              </Text>
            </View>
          </View>

          {/* TYPE */}

          <View style={styles.typeRow}>
            <Ionicons
              name={getStoreTypeIcon(
                store.type
              )}
              size={13}
              color={CARDINAL}
            />

            <Text style={styles.storeType}>
              {getStoreTypeLabel(store.type)}
            </Text>
          </View>

          {/* DESCRIPTION */}

          <Text
            style={styles.storeDescription}
            numberOfLines={2}
          >
            {store.description}
          </Text>

          {/* CATEGORIES */}

          <View style={styles.categoryRow}>
            {store.categories
              .slice(0, 3)
              .map((category) => (
                <View
                  key={category}
                  style={styles.categoryChip}
                >
                  <Text
                    style={
                      styles.categoryChipText
                    }
                  >
                    {category}
                  </Text>
                </View>
              ))}
          </View>

          {/* META */}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="star"
                size={13}
                color={GOLD}
              />

              <Text style={styles.metaText}>
                {store.rating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={MUTED}
              />

              <Text style={styles.metaText}>
                {store.deliveryTime}
              </Text>
            </View>

            <View style={styles.storeArrow}>
              {isOpening ? (
                <ActivityIndicator
                  size="small"
                  color={CARDINAL}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={CARDINAL}
                />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // ===================================================
  // EMPTY
  // ===================================================

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="storefront-outline"
            size={38}
            color={CARDINAL}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No results found
        </Text>

        <Text style={styles.emptyText}>
          There are no available products or stores for this selection yet.
        </Text>

        <Pressable
          onPress={handleViewAllResults}
          style={({ pressed }) => [
            styles.resetButton,
            pressed &&
              styles.resetButtonPressed,
          ]}
        >
          <Ionicons
            name="apps-outline"
            size={15}
            color={WHITE}
          />

          <Text style={styles.resetButtonText}>
            View All Results
          </Text>
        </Pressable>
      </View>
    );
  };

  // ===================================================
  // SCREEN
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* =================================================
            TOP SPACING
            NO LOGO / NO STORES TITLE
        ================================================= */}

        <View style={styles.topSpacing} />

        {/* =================================================
            CATEGORY BOXES
            THESE ARE KEPT
        ================================================= */}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactCategories}>
          {[{ icon: "apps-outline" as IconName, label: "All", description: "" }, ...categories].map((category) => {
            const active =
              category.label === "All" ? !selectedCategory : selectedCategory === category.label;

            return (
              <Pressable
                key={category.label}
                onPress={() =>
                  category.label === "All" ? handleViewAllResults() : handleCategoryPress(category.label)
                }
                style={({ pressed }) => [
                  styles.compactCategory,
                  active && styles.compactCategoryActive,
                  pressed && styles.categoryBoxPressed,
                ]}
              >
                <View
                  style={[
                    styles.compactCategoryIcon,
                    active && styles.compactCategoryIconActive,
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={
                      active
                        ? WHITE
                        : CARDINAL
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.compactCategoryLabel,
                    active && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>

              </Pressable>
            );
          })}
        </ScrollView>

        {/* =================================================
            RESULTS SECTION
        ================================================= */}

        <View style={styles.resultsTopRow}>
          <View>
            <Text style={styles.resultsEyebrow}>
              {selectedCategory ? "AVAILABLE PRODUCTS" : "CAMPUS STORES"}
            </Text>

            <Text style={styles.resultsTitle}>
              All Results
            </Text>

            <Text style={styles.resultsCount}>
              {selectedCategory ? filteredFoods.length : filteredStores.length}{" "}
              {selectedCategory ? (filteredFoods.length === 1 ? "product" : "products") : (filteredStores.length === 1 ? "store" : "stores")}{" "}
              available
            </Text>
          </View>

          {!showingAllResults && (
            <Pressable
              onPress={handleViewAllResults}
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed &&
                  styles.viewAllButtonPressed,
              ]}
            >
              <Text style={styles.viewAllText}>
                View All
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color={CARDINAL}
              />
            </Pressable>
          )}
        </View>

        {/* =================================================
            STORE TYPE FILTERS
        ================================================= */}

        {!selectedCategory && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filterContent
          }
        >
          {STORE_FILTERS.map((filter) => {
            const active =
              selectedFilter === filter.id;

            return (
              <Pressable
                key={filter.id}
                onPress={() => {
                  setSelectedFilter(
                    filter.id
                  );
                }}
                style={({ pressed }) => [
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                  pressed &&
                    styles.filterButtonPressed,
                ]}
              >
                <Ionicons
                  name={filter.icon}
                  size={15}
                  color={
                    active
                      ? WHITE
                      : MUTED
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>}

        {/* =================================================
            ALL RESULTS / STORE LIST
        ================================================= */}

        <View style={selectedCategory ? styles.productGrid : styles.storeList}>
          {(selectedCategory ? filteredFoods.length : filteredStores.length) > 0 ? (
            selectedCategory ? filteredFoods.map((food) => (
              <Pressable key={food.id} onPress={() => openProduct(food)} style={({ pressed }) => [styles.productCard, pressed && styles.storeCardPressed]}>
                <View style={styles.productImageWrap}>
                  {food.image ? <Image source={{ uri: food.image }} style={styles.productImage} contentFit="cover" /> : <Ionicons name={food.icon ?? "restaurant-outline"} size={30} color={CARDINAL} />}
                  <View style={styles.availableBadge}><Text style={styles.availableBadgeText}>Available</Text></View>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{food.name}</Text>
                <Text style={styles.productStore} numberOfLines={1}>{food.store}</Text>
                <View style={styles.productBottom}><Text style={styles.productPrice}>{food.price}</Text><View style={styles.productArrow}><Ionicons name="add" size={17} color={WHITE} /></View></View>
              </Pressable>
            )) : filteredStores.map(renderStore)
          ) : (
            renderEmpty()
          )}
        </View>

        {/* =================================================
            VIEW ALL RESULTS
        ================================================= */}

        {!showingAllResults &&
          (selectedCategory ? filteredFoods.length : filteredStores.length) > 0 && (
            <Pressable
              onPress={
                handleViewAllResults
              }
              style={({ pressed }) => [
                styles.fullViewAllButton,
                pressed &&
                  styles.fullViewAllPressed,
              ]}
            >
              <View
                style={styles.fullViewAllIcon}
              >
                <Ionicons
                  name="apps-outline"
                  size={18}
                  color={CARDINAL}
                />
              </View>

              <View
                style={styles.fullViewAllContent}
              >
                <Text
                  style={
                    styles.fullViewAllTitle
                  }
                >
                  View All Results
                </Text>

                <Text
                  style={
                    styles.fullViewAllSubtitle
                  }
                >
                  Browse all {stores.length}{" "}
                  campus stores
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={CARDINAL}
              />
            </Pressable>
          )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={MUTED}
          />

          <Text style={styles.footerText}>
            TUPC campus marketplace
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
  // ===================================================
  // SCREEN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  topSpacing: {
    height: 8,
  },

  compactCategories: {
    gap: 9,
    paddingTop: 5,
    paddingBottom: 18,
    paddingRight: 12,
  },

  compactCategory: {
    minWidth: 64,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  compactCategoryActive: {
    opacity: 1,
  },

  compactCategoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  compactCategoryIconActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  compactCategoryLabel: {
    marginTop: 6,
    fontSize: 9.5,
    fontWeight: "800",
    color: MUTED,
  },

  // ===================================================
  // CATEGORY HEADER
  // ===================================================

  categoryHeaderRow: {
    marginBottom: 13,
  },

  categoryEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: CARDINAL,
    marginBottom: 4,
  },

  categoryTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.4,
  },

  // ===================================================
  // CATEGORY GRID
  // ===================================================

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 25,
  },

  categoryBox: {
    width: "31.8%",
    minHeight: 112,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 11,
    alignItems: "flex-start",
    justifyContent: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },

  categoryBoxActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  categoryBoxPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  categoryIconActive: {
    backgroundColor: CARDINAL_DARK,
  },

  categoryLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: TEXT,
  },

  categoryLabelActive: {
    color: WHITE,
  },

  categoryDescription: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "600",
    color: MUTED,
  },

  categoryDescriptionActive: {
    color: "#F6DDE1",
  },

  // ===================================================
  // RESULTS HEADER
  // ===================================================

  resultsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  resultsEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: MUTED,
    marginBottom: 2,
  },

  resultsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.4,
  },

  resultsCount: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },

  viewAllButton: {
    height: 35,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#F0D9DD",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  viewAllButtonPressed: {
    opacity: 0.7,
  },

  viewAllText: {
    fontSize: 10,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ===================================================
  // FILTER
  // ===================================================

  filterContent: {
    gap: 7,
    paddingBottom: 15,
    paddingRight: 10,
  },

  filterButton: {
    height: 37,
    paddingHorizontal: 13,
    borderRadius: 19,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  filterButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  filterButtonPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  filterText: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },

  filterTextActive: {
    color: WHITE,
  },

  // ===================================================
  // STORE LIST
  // ===================================================

  storeList: {
    gap: 10,
  },

  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  productCard: {
    width: "48.5%",
    padding: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },

  productImageWrap: {
    height: 112,
    borderRadius: 13,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  availableBadge: {
    position: "absolute",
    left: 7,
    top: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  availableBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: SUCCESS,
  },

  productName: {
    minHeight: 34,
    marginTop: 9,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    color: TEXT,
  },

  productStore: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
  },

  productBottom: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: CARDINAL,
  },

  productArrow: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // STORE CARD
  // ===================================================

  storeCard: {
    width: "100%",
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  storeCardPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  storeCardOpening: {
    opacity: 0.7,
  },

  // ===================================================
  // STORE ICON
  // ===================================================

  storeIconWrapper: {
    width: 82,
    minHeight: 125,
    alignItems: "center",
    justifyContent: "flex-start",
    marginRight: 12,
  },

  storeIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FBECEF",
    borderWidth: 1,
    borderColor: "#F2D5DA",
    alignItems: "center",
    justifyContent: "center",
  },

  featuredBadge: {
    position: "absolute",
    top: 56,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 2,
    borderColor: WHITE,
  },

  featuredText: {
    fontSize: 8,
    fontWeight: "900",
    color: WHITE,
  },

  // ===================================================
  // STORE CONTENT
  // ===================================================

  storeContent: {
    flex: 1,
    minWidth: 0,
  },

  storeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
  },

  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.2,
  },

  // ===================================================
  // TYPE
  // ===================================================

  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },

  storeType: {
    fontSize: 10,
    fontWeight: "800",
    color: CARDINAL,
  },

  // ===================================================
  // DESCRIPTION
  // ===================================================

  storeDescription: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "500",
    color: MUTED,
    marginBottom: 8,
  },

  // ===================================================
  // CATEGORIES
  // ===================================================

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 9,
  },

  categoryChip: {
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 7,
    backgroundColor: "#F6F6F7",
    borderWidth: 1,
    borderColor: "#ECECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipText: {
    fontSize: 8,
    fontWeight: "800",
    color: MUTED,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusBadge: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusOpen: {
    backgroundColor: SUCCESS_BG,
  },

  statusClosed: {
    backgroundColor: "#F4F4F4",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusDotOpen: {
    backgroundColor: SUCCESS,
  },

  statusDotClosed: {
    backgroundColor: "#999999",
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },

  statusTextOpen: {
    color: SUCCESS,
  },

  statusTextClosed: {
    color: "#777777",
  },

  // ===================================================
  // META
  // ===================================================

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },

  metaDivider: {
    width: 1,
    height: 13,
    backgroundColor: BORDER,
    marginHorizontal: 9,
  },

  storeArrow: {
    marginLeft: "auto",
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // VIEW ALL RESULTS
  // ===================================================

  fullViewAllButton: {
    marginTop: 16,
    minHeight: 68,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#F0D9DD",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  fullViewAllPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  fullViewAllIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  fullViewAllContent: {
    flex: 1,
  },

  fullViewAllTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  fullViewAllSubtitle: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "600",
    color: MUTED,
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 55,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "500",
    color: MUTED,
    textAlign: "center",
    maxWidth: 290,
  },

  resetButton: {
    marginTop: 18,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resetButtonPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  resetButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "900",
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  footerText: {
    fontSize: 9,
    fontWeight: "600",
    color: MUTED,
  },
});

let styles = createStyles(LIGHT_COLORS);
