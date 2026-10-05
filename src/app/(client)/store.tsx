import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  getPublicStores,
  type Store,
} from "../../services/api";

// =====================================================
// TUP CARDINAL THEME
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";

const BACKGROUND = "#F7F7F8";
const WHITE = "#FFFFFF";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E5E5E5";

const SUCCESS = "#18864B";
const SUCCESS_BG = "#EAF7EF";
const CLOSED = "#777777";
const CLOSED_BG = "#F4F4F4";

// =====================================================
// MAIN SCREEN
// =====================================================

export default function StoreScreen() {
  // ===================================================
  // STATE
  // ===================================================

  const [stores, setStores] = useState<Store[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [openingStoreId, setOpeningStoreId] =
    useState<string | null>(null);

  // ===================================================
  // LOAD STORES FROM BACKEND
  // ===================================================

  const loadStores = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const result = await getPublicStores();

        setStores(result);
      } catch (error) {
        console.error(
          "LOAD PUBLIC STORES ERROR:",
          error
        );

        setStores([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadStores(true);
  }, [loadStores]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await loadStores(false);
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

    setOpeningStoreId(store._id);

    setTimeout(() => {
      setOpeningStoreId(null);

      router.push({
        pathname:
          "/(client)/(client-details)/store/[id]",
        params: {
          id: store._id,
        },
      });
    }, 120);
  };

  // ===================================================
  // STORE COUNT
  // ===================================================

  const storeCountText = useMemo(() => {
    return `${stores.length} ${
      stores.length === 1
        ? "store"
        : "stores"
    } available`;
  }, [stores.length]);

  // ===================================================
  // STORE CARD
  // ===================================================

  const renderStore = ({
    item,
  }: {
    item: Store;
  }) => {
    const isOpen = item.isOpen === true;

    const isOpening =
      openingStoreId === item._id;

    return (
      <Pressable
        onPress={() => openStore(item)}
        disabled={
          openingStoreId !== null
        }
        style={({ pressed }) => [
          styles.storeCard,

          pressed &&
            styles.storeCardPressed,

          isOpening &&
            styles.storeCardOpening,
        ]}
      >
        {/* ===========================================
            STORE ICON
        =========================================== */}

        <View style={styles.storeIconWrapper}>
          <View style={styles.storeIconCircle}>
            <Ionicons
              name="storefront-outline"
              size={29}
              color={CARDINAL}
            />
          </View>

          <View
            style={[
              styles.statusMiniBadge,
              isOpen
                ? styles.statusMiniOpen
                : styles.statusMiniClosed,
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
                styles.statusMiniText,
                isOpen
                  ? styles.statusTextOpen
                  : styles.statusTextClosed,
              ]}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>

        {/* ===========================================
            STORE CONTENT
        =========================================== */}

        <View style={styles.storeContent}>
          {/* TITLE + STATUS */}

          <View style={styles.storeTitleRow}>
            <Text
              style={styles.storeName}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>

          {/* SELLER LABEL */}

          <View style={styles.typeRow}>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={CARDINAL}
            />

            <Text style={styles.storeType}>
              TUPC Seller
            </Text>
          </View>

          {/* DESCRIPTION */}

          <Text
            style={styles.storeDescription}
            numberOfLines={2}
          >
            {item.description ||
              "No store description available."}
          </Text>

          {/* LOCATION */}

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={MUTED}
            />

            <Text
              style={styles.infoText}
              numberOfLines={1}
            >
              {item.location ||
                "Pickup location not specified"}
            </Text>
          </View>

          {/* HOURS */}

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={MUTED}
            />

            <Text
              style={styles.infoText}
              numberOfLines={1}
            >
              {item.openTime} - {item.closeTime}
            </Text>
          </View>

          {/* PICKUP */}

          <View style={styles.bottomRow}>
            {item.pickupEnabled ? (
              <View style={styles.pickupBadge}>
                <Ionicons
                  name="bag-handle-outline"
                  size={12}
                  color={SUCCESS}
                />

                <Text
                  style={styles.pickupText}
                >
                  Campus Pickup
                </Text>
              </View>
            ) : (
              <View
                style={styles.noPickupBadge}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={12}
                  color={MUTED}
                />

                <Text
                  style={
                    styles.noPickupText
                  }
                >
                  Pickup Unavailable
                </Text>
              </View>
            )}

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
          There are no approved seller stores
          available right now.
        </Text>

        <Pressable
          onPress={() => loadStores(true)}
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

          <Text
            style={styles.resetButtonText}
          >
            Refresh Stores
          </Text>
        </Pressable>
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
          <View
            style={styles.headerTextContainer}
          >
            <Text style={styles.eyebrow}>
              TUPC-ORDERUP
            </Text>

            <Text style={styles.title}>
              Stores
            </Text>

            <Text style={styles.subtitle}>
              Find stores, canteens, and sellers
              around campus.
            </Text>
          </View>
        </View>

        {/* ===========================================
            RESULT HEADER
        =========================================== */}

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>
              Available Stores
            </Text>

            <Text style={styles.resultCount}>
              {storeCountText}
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
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={BACKGROUND}
        />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="storefront-outline"
              size={34}
              color={CARDINAL}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={CARDINAL}
          />

          <Text
            style={styles.loadingTitle}
          >
            Loading stores...
          </Text>

          <Text
            style={styles.loadingText}
          >
            Getting available stores from
            TUPC-OrderUp.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        data={stores}
        keyExtractor={(item) =>
          item._id
        }
        renderItem={renderStore}
        ListHeaderComponent={
          ListHeader
        }
        ListEmptyComponent={
          renderEmpty
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          stores.length === 0 &&
            styles.listContentEmpty,
        ]}
        ItemSeparatorComponent={() => (
          <View
            style={styles.cardSeparator}
          />
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
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  loadingText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
    textAlign: "center",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    marginBottom: 22,
  },

  headerTextContainer: {
    width: "100%",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: CARDINAL,
    marginBottom: 4,
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
    minHeight: 150,
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

  statusMiniBadge: {
    position: "absolute",
    top: 56,
    minWidth: 62,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: WHITE,
  },

  statusMiniOpen: {
    backgroundColor: SUCCESS_BG,
  },

  statusMiniClosed: {
    backgroundColor: CLOSED_BG,
  },

  statusMiniText: {
    fontSize: 8,
    fontWeight: "900",
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
    backgroundColor: CLOSED,
  },

  statusTextOpen: {
    color: SUCCESS,
  },

  statusTextClosed: {
    color: CLOSED,
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
  // SELLER TYPE
  // ===================================================

  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
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
    marginBottom: 9,
  },

  // ===================================================
  // INFO
  // ===================================================

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },

  infoText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
  },

  // ===================================================
  // BOTTOM
  // ===================================================

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    minHeight: 29,
  },

  pickupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: SUCCESS_BG,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  pickupText: {
    fontSize: 8,
    fontWeight: "900",
    color: SUCCESS,
  },

  noPickupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  noPickupText: {
    fontSize: 8,
    fontWeight: "900",
    color: MUTED,
  },

  // ===================================================
  // ARROW
  // ===================================================

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
  // EMPTY
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