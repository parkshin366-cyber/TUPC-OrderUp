import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  STORES,
  type Store,
  type StoreType,
} from "../../data/stores";

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

type FilterType = "all" | StoreType;

// =====================================================
// STORE FILTERS
// =====================================================

const STORE_FILTERS: {
  id: FilterType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "all",
    label: "All",
    icon: "apps-outline",
  },
  {
    id: "canteen",
    label: "Canteen",
    icon: "restaurant-outline",
  },
  {
    id: "organization",
    label: "Organizations",
    icon: "people-outline",
  },
  {
    id: "others",
    label: "Others",
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
): keyof typeof Ionicons.glyphMap => {
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
      return "All Stores";
  }
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function StoreScreen() {
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("all");

  const [refreshing, setRefreshing] = useState(false);

  const [openingStoreId, setOpeningStoreId] =
    useState<string | null>(null);

  // ===================================================
  // FILTER STORES
  // ===================================================

  const filteredStores = useMemo(() => {
    return STORES.filter((store) => {
      if (selectedFilter === "all") {
        return true;
      }

      return store.type === selectedFilter;
    });
  }, [selectedFilter]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      // Temporary refresh.
      // Replace this later with your real API request.
      await new Promise((resolve) => {
        setTimeout(resolve, 700);
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ===================================================
  // OPEN STORE
  // ===================================================

  const openStore = (store: Store) => {
    if (openingStoreId !== null) {
      return;
    }

    setOpeningStoreId(store.id);

    setTimeout(() => {
      setOpeningStoreId(null);

      router.push({
        pathname: "/(client)/(client-details)/store/[id]",
        params: {
          id: store.id,
        },
      });
    }, 120);
  };

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  const clearFilters = () => {
    setSelectedFilter("all");
  };

  // ===================================================
  // STORE CARD
  // ===================================================

  const renderStore = ({
    item,
  }: {
    item: Store;
  }) => {
    const isOpen = item.status === "Open";
    const isOpening = openingStoreId === item.id;

    return (
      <Pressable
        onPress={() => openStore(item)}
        disabled={openingStoreId !== null}
        style={({ pressed }) => [
          styles.storeCard,
          pressed && styles.storeCardPressed,
          isOpening && styles.storeCardOpening,
        ]}
      >
        {/* ===========================================
            STORE ICON
        =========================================== */}

        <View style={styles.storeIconWrapper}>
          <View style={styles.storeIconCircle}>
            <Ionicons
              name={item.icon}
              size={29}
              color={CARDINAL}
            />
          </View>

          {item.featured && (
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

        {/* ===========================================
            STORE CONTENT
        =========================================== */}

        <View style={styles.storeContent}>
          {/* TITLE + STATUS */}

          <View style={styles.storeTitleRow}>
            <Text
              style={styles.storeName}
              numberOfLines={1}
            >
              {item.name}
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
                {item.status}
              </Text>
            </View>
          </View>

          {/* STORE TYPE */}

          <View style={styles.typeRow}>
            <Ionicons
              name={getStoreTypeIcon(item.type)}
              size={13}
              color={CARDINAL}
            />

            <Text style={styles.storeType}>
              {getStoreTypeLabel(item.type)}
            </Text>
          </View>

          {/* DESCRIPTION */}

          <Text
            style={styles.storeDescription}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          {/* CATEGORIES */}

          <View style={styles.categoryRow}>
            {item.categories
              .slice(0, 3)
              .map((category) => (
                <View
                  key={category}
                  style={styles.categoryChip}
                >
                  <Text
                    style={styles.categoryChipText}
                  >
                    {category}
                  </Text>
                </View>
              ))}
          </View>

          {/* META */}

          <View style={styles.metaRow}>
            {/* RATING */}

            <View style={styles.metaItem}>
              <Ionicons
                name="star"
                size={13}
                color={GOLD}
              />

              <Text style={styles.metaText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.metaDivider} />

            {/* DELIVERY TIME */}

            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={MUTED}
              />

              <Text style={styles.metaText}>
                {item.deliveryTime}
              </Text>
            </View>

            {/* ARROW */}

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
  // EMPTY STATE
  // ===================================================

  const renderEmpty = () => {
    const hasFilter = selectedFilter !== "all";

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
          No stores found
        </Text>

        <Text style={styles.emptyText}>
          There are no stores available in this
          category yet.
        </Text>

        {hasFilter && (
          <Pressable
            onPress={clearFilters}
            style={({ pressed }) => [
              styles.resetButton,
              pressed &&
                styles.resetButtonPressed,
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={15}
              color={WHITE}
            />

            <Text style={styles.resetButtonText}>
              Clear Filters
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  // ===================================================
  // HEADER
  // ===================================================

  const ListHeader = () => {
    return (
      <View>
        {/* ===========================================
            PAGE HEADER
        =========================================== */}

        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              Stores
            </Text>

            <Text style={styles.subtitle}>
              Find canteens, organizations, and other
              sellers around campus.
            </Text>
          </View>
        </View>

        {/* ===========================================
            FILTERS
        =========================================== */}

        <FlatList
          data={STORE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            styles.filterContent
          }
          renderItem={({ item }) => {
            const active =
              selectedFilter === item.id;

            return (
              <Pressable
                onPress={() =>
                  setSelectedFilter(item.id)
                }
                style={({ pressed }) => [
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                  pressed &&
                    styles.filterButtonPressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={
                    active ? WHITE : MUTED
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* ===========================================
            RESULT HEADER
        =========================================== */}

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>
              {getFilterTitle(selectedFilter)}
            </Text>

            <Text style={styles.resultCount}>
              {filteredStores.length}{" "}
              {filteredStores.length === 1
                ? "store"
                : "stores"}{" "}
              available
            </Text>
          </View>

          {refreshing && (
            <ActivityIndicator
              size="small"
              color={CARDINAL}
            />
          )}
        </View>
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BACKGROUND}
      />

      <FlatList
        data={filteredStores}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredStores.length === 0 &&
            styles.listContentEmpty,
        ]}
        ItemSeparatorComponent={() => (
          <View style={styles.cardSeparator} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={CARDINAL}
            colors={[CARDINAL]}
          />
        }
      />
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // SCREEN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    marginBottom: 18,
  },

  headerTextContainer: {
    width: "100%",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: CARDINAL_DARK,
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
  },

  // ===================================================
  // FILTER
  // ===================================================

  filterContent: {
    paddingRight: 10,
    gap: 8,
    paddingBottom: 22,
  },

  filterButton: {
    height: 39,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",    alignItems: "center",
    gap: 6,
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
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  filterTextActive: {
    color: WHITE,
  },

  // ===================================================
  // RESULT HEADER
  // ===================================================

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  resultCount: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
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

  cardSeparator: {
    height: 10,
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
  // STORE TYPE
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
  // PRODUCT CATEGORIES
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
  // EMPTY STATE
  // ===================================================

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 55,
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
});