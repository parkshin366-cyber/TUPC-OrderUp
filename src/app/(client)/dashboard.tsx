import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

import {
  STORES
} from "../../data/stores";

// ============================================================
// COLORS
// ============================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const WHITE = "#FFFFFF";

const SUCCESS = "#18864B";
const SUCCESS_BG = "#EAF7EF";

// ============================================================
// FAVORITES STORAGE
// ============================================================

export const FAVORITES_STORAGE_KEY =
  "@tuporderup_favorite_foods";

// ============================================================
// SCREEN
// ============================================================

const { width: SCREEN_WIDTH } =
  Dimensions.get("window");

const SLIDE_WIDTH =
  SCREEN_WIDTH - 40;

// ============================================================
// TYPES
// ============================================================

type IconName =
  React.ComponentProps<
    typeof Ionicons
  >["name"];

type CarouselItem = {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
};

type Category = {
  icon: IconName;
  label: string;
};

type FavoriteFood = {
  id: string;
  name: string;
  store: string;
  price?: string;
  image?: string;
  icon?: IconName;
  category?: string;
};

// ============================================================
// WELCOME CAROUSEL
// ============================================================

const carouselItems: CarouselItem[] = [
  {
    id: "campus-food",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
    eyebrow: "WELCOME TO CAMPUS",
    title: "Order smarter.\nStudy better.",
    description:
      "Discover food, drinks, and essentials from campus sellers.",
  },

  {
    id: "coffee",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
    eyebrow: "YOUR CAMPUS,\nYOUR CHOICE",
    title: "Coffee first.\nClasses next.",
    description:
      "Grab your favorite drinks before heading to your next class.",
  },

  {
    id: "food",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85",
    eyebrow: "GOOD FOOD,\nGOOD DAY",
    title: "Cravings\ncovered.",
    description:
      "Find delicious meals without leaving your campus.",
  },

  {
    id: "study",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85",
    eyebrow: "CAMPUS LIFE",
    title: "More time\nfor what matters.",
    description:
      "Order ahead and spend less time waiting between classes.",
  },
];

// ============================================================
// CATEGORIES
// ============================================================

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

// ============================================================
// FALLBACK FOOD CATALOG
// ============================================================

const fallbackFoods: FavoriteFood[] = [
  {
    id: "chicken-rice-meal",
    name: "Chicken Rice Meal",
    store: "TUPC Main Canteen",
    price: "₱89",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    icon: "restaurant",
    category: "Meals",
  },
];

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function ClientDashboard() {
  const { user } = useAuth();

  // ==========================================================
  // STATES
  // ==========================================================

  const [activeSlide, setActiveSlide] =
    useState(0);

  const [favoriteFoods, setFavoriteFoods] =
    useState<FavoriteFood[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [searchFocused, setSearchFocused] =
    useState(false);

  const carouselRef =
    useRef<ScrollView>(null);

  // ==========================================================
  // POPULAR STORES
  // ==========================================================

  /**
   * IMPORTANT:
   *
   * Dashboard now uses the SAME STORES data
   * used by store.tsx.
   *
   * Highest rated stores appear first.
   *
   * Only top 3 are displayed under
   * "Popular Stores".
   */
  const popularStores = useMemo(() => {
    return [...STORES]
      .sort((a, b) => {
        return b.rating - a.rating;
      })
      .slice(0, 3);
  }, []);

  // ==========================================================
  // SEARCH RESULTS
  // ==========================================================

  // ==========================================================
  // SEARCH RESULTS
  // ==========================================================

  type SearchFood = FavoriteFood & {
    kind: "food";
  };

  const searchData = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return {
        foods: [] as SearchFood[],
        stores: [] as typeof STORES,
        categories: [] as Category[],
      };
    }

    // ----------------------------------------------------------
    // FOODS
    // Uses saved/favorite foods plus products exposed by stores
    // when the store data contains a products/items array.
    // ----------------------------------------------------------
    const foodMap = new Map<string, SearchFood>();

    [...fallbackFoods, ...favoriteFoods].forEach((food) => {
      foodMap.set(food.id, {
        ...food,
        kind: "food",
      });
    });

    STORES.forEach((store) => {
      const rawStore = store as typeof store & {
        products?: unknown[];
        items?: unknown[];
        foods?: unknown[];
      };

      const products = [
        ...(Array.isArray(rawStore.products)
          ? rawStore.products
          : []),
        ...(Array.isArray(rawStore.items)
          ? rawStore.items
          : []),
        ...(Array.isArray(rawStore.foods)
          ? rawStore.foods
          : []),
      ];

      products.forEach((product, index) => {
        if (!product || typeof product !== "object") {
          return;
        }

        const raw = product as Record<string, unknown>;

        const id =
          typeof raw.id === "string"
            ? raw.id
            : `${store.id}-food-${index}`;

        const name =
          typeof raw.name === "string"
            ? raw.name
            : typeof raw.title === "string"
              ? raw.title
              : "";

        if (!name) {
          return;
        }

        const price =
          typeof raw.price === "string"
            ? raw.price
            : typeof raw.price === "number"
              ? `₱${raw.price}`
              : undefined;

        const image =
          typeof raw.image === "string"
            ? raw.image
            : typeof raw.imageUrl === "string"
              ? raw.imageUrl
              : typeof raw.photo === "string"
                ? raw.photo
                : undefined;

        const category =
          typeof raw.category === "string"
            ? raw.category
            : typeof raw.type === "string"
              ? raw.type
              : "Food";

        foodMap.set(id, {
          id,
          name,
          store: store.name,
          price,
          image,
          category,
          icon: "restaurant",
          kind: "food",
        });
      });
    });

    const foods = Array.from(foodMap.values())
      .filter((food) => {
        const searchable = [
          food.name,
          food.store,
          food.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 5);

    // ----------------------------------------------------------
    // STORES
    // ----------------------------------------------------------
    const stores = STORES.filter((store) => {
      const name =
        store.name?.toLowerCase() ?? "";

      const description =
        store.description?.toLowerCase() ?? "";

      const type =
        store.type?.toLowerCase() ?? "";

      const categories =
        store.categories
          ?.join(" ")
          .toLowerCase() ?? "";

      return (
        name.includes(query) ||
        description.includes(query) ||
        type.includes(query) ||
        categories.includes(query)
      );
    }).slice(0, 5);

    // ----------------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------------
    const matchedCategories = categories.filter(
      (category) =>
        category.label
          .toLowerCase()
          .includes(query)
    );

    return {
      foods,
      stores,
      categories: matchedCategories,
    };
  }, [searchText, favoriteFoods]);

  const hasSearchResults =
    searchData.foods.length > 0 ||
    searchData.stores.length > 0 ||
    searchData.categories.length > 0;

  // ==========================================================
  // LOAD FAVORITES
  // ==========================================================

  const loadFavorites =
    useCallback(async () => {
      try {
        const saved =
          await AsyncStorage.getItem(
            FAVORITES_STORAGE_KEY
          );

        if (!saved) {
          setFavoriteFoods([]);
          return;
        }

        const parsed: unknown =
          JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          setFavoriteFoods([]);
          return;
        }

        const cleaned: FavoriteFood[] =
          parsed
            .map(
              (
                item
              ): FavoriteFood | null => {
                // ----------------------------------------------
                // OLD FORMAT
                // ["product-id"]
                // ----------------------------------------------

                if (
                  typeof item ===
                  "string"
                ) {
                  const fallback =
                    fallbackFoods.find(
                      (food) =>
                        food.id === item
                    );

                  return fallback
                    ? { ...fallback }
                    : null;
                }

                // ----------------------------------------------
                // NEW FORMAT
                // [{ id, name, store, ... }]
                // ----------------------------------------------

                if (
                  !item ||
                  typeof item !==
                    "object"
                ) {
                  return null;
                }

                const raw =
                  item as Record<
                    string,
                    unknown
                  >;

                if (
                  typeof raw.id !==
                  "string"
                ) {
                  return null;
                }

                const fallback =
                  fallbackFoods.find(
                    (food) =>
                      food.id === raw.id
                  );

                return {
                  id: raw.id,

                  name:
                    typeof raw.name ===
                    "string"
                      ? raw.name
                      : fallback?.name ??
                        "Favorite Product",

                  store:
                    typeof raw.store ===
                    "string"
                      ? raw.store
                      : fallback?.store ??
                        "TUPC Store",

                  price:
                    typeof raw.price ===
                    "string"
                      ? raw.price
                      : typeof raw.price ===
                          "number"
                        ? `₱${raw.price}`
                        : fallback?.price,

                  image:
                    typeof raw.image ===
                    "string"
                      ? raw.image
                      : fallback?.image,

                  icon:
                    typeof raw.icon ===
                    "string"
                      ? (raw.icon as IconName)
                      : fallback?.icon,

                  category:
                    typeof raw.category ===
                    "string"
                      ? raw.category
                      : fallback?.category,
                };
              }
            )
            .filter(
              (
                item
              ): item is FavoriteFood =>
                item !== null
            );

        // ----------------------------------------------
        // REMOVE DUPLICATES
        // ----------------------------------------------

        const unique =
          cleaned.filter(
            (
              food,
              index,
              array
            ) =>
              array.findIndex(
                (item) =>
                  item.id === food.id
              ) === index
          );

        setFavoriteFoods(unique);
      } catch (error) {
        console.error(
          "LOAD DASHBOARD FAVORITES ERROR:",
          error
        );

        setFavoriteFoods([]);
      }
    }, []);

  // ==========================================================
  // REFRESH FAVORITES WHEN DASHBOARD OPENS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // ==========================================================
  // AUTO CAROUSEL
  // ==========================================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        setActiveSlide(
          (current) => {
            const next =
              current + 1 >=
              carouselItems.length
                ? 0
                : current + 1;

            carouselRef.current?.scrollTo({
              x:
                next *
                SLIDE_WIDTH,
              animated: true,
            });

            return next;
          }
        );
      }, 4500);

    return () =>
      clearInterval(timer);
  }, []);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goToExplore = () => {
    setSearchFocused(false);

    router.push("/explore");
  };

  // ==========================================================
  // GO TO STORES TAB
  //
  // The "See all" button under Popular Stores must open
  // the dedicated store.tsx tab, not the Explore screen.
  // ==========================================================

  const goToStoresTab = () => {
    setSearchFocused(false);
    setSearchText("");

    router.push("/store");
  };

  const goToStore = (
    storeId: string
  ) => {
    setSearchFocused(false);
    setSearchText("");

    router.push({
      pathname:
        "/(client)/(client-details)/store/[id]",
      params: {
        id: storeId,
      },
    });
  };

  const goToCategory = (
    category: string
  ) => {
    router.push({
      pathname: "/explore",
      params: {
        category,
      },
    });
  };

  const goToFavoriteFood = (
    foodId: string
  ) => {
    router.push({
      pathname:
        "/(client)/(client-details)/product/[id]",
      params: {
        id: foodId,
      },
    });
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchChange = (
    text: string
  ) => {
    setSearchText(text);
    setSearchFocused(true);
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchFocused(false);
  };

  // ==========================================================
  // CAROUSEL SCROLL
  // ==========================================================

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX =
      event.nativeEvent
        .contentOffset.x;

    const index =
      Math.round(
        offsetX / SLIDE_WIDTH
      );

    if (
      index >= 0 &&
      index <
        carouselItems.length &&
      index !== activeSlide
    ) {
      setActiveSlide(index);
    }
  };

  // ==========================================================
  // GO TO SLIDE
  // ==========================================================

  const goToSlide = (
    index: number
  ) => {
    setActiveSlide(index);

    carouselRef.current?.scrollTo({
      x:
        index *
        SLIDE_WIDTH,
      animated: true,
    });
  };

  // ==========================================================
  // FIRST NAME
  // ==========================================================

  // Converts names like:
  // "joshua" -> "Joshua"
  // "JOSHUA" -> "Joshua"
  // "jOsHuA" -> "Joshua"
  // "joshua canda rally" -> "Joshua Canda Rally"
  const capitalizeName = (value?: string | null) => {
    const name = value?.trim();

    if (!name) {
      return "User";
    }

    return name
      .toLowerCase()
      .split(/\s+/)
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : ""
      )
      .join(" ");
  };

  const firstName = capitalizeName(user?.firstName);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      <View
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <View
            style={styles.header}
          >
            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={styles.eyebrow}
              >
                TUPC-ORDERUP
              </Text>

              <Text
                style={styles.greeting}
              >
                Welcome, {firstName} 👋
              </Text>

              <Text
                style={styles.subtitle}
              >
                What are you craving today?
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  "/cart"
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Open cart"
            >
              <Ionicons
                name="cart-outline"
                size={21}
                color={TEXT}
              />
            </Pressable>
          </View>

          {/* ================================================= */}
          {/* SEARCH */}
          {/* ================================================= */}

          <View
            style={styles.searchWrapper}
          >
            <View
              style={[
                styles.searchBox,
                searchFocused &&
                  styles.searchBoxFocused,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={21}
                color={
                  searchFocused
                    ? CARDINAL
                    : MUTED
                }
              />

              <TextInput
                value={searchText}
                onChangeText={
                  handleSearchChange
                }
                onFocus={
                  handleSearchFocus
                }
                placeholder="Search food, drinks, stores..."
                placeholderTextColor="#999999"
                style={
                  styles.searchInput
                }
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {searchText.length >
              0 ? (
                <Pressable
                  onPress={
                    clearSearch
                  }
                  style={
                    styles.searchClear
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={MUTED}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={
                    goToExplore
                  }
                  style={
                    styles.filterButton
                  }
                  hitSlop={5}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={
                      CARDINAL
                    }
                  />
                </Pressable>
              )}
            </View>

            {/* ================================================= */}
            {/* SEARCH RESULTS */}
            {/* ================================================= */}

            {searchFocused &&
              searchText.trim().length > 0 && (
                <View style={styles.searchResults}>
                  {hasSearchResults ? (
                    <>
                      {/* ============================
                          FOODS
                      ============================ */}
                      {searchData.foods.length > 0 && (
                        <View style={styles.searchSection}>
                          <View style={styles.searchSectionHeader}>
                            <Text style={styles.searchSectionTitle}>
                              FOODS
                            </Text>
                            <Text style={styles.searchSectionCount}>
                              {searchData.foods.length}
                            </Text>
                          </View>

                          {searchData.foods.map((food) => (
                            <Pressable
                              key={`food-${food.id}`}
                              onPress={() =>
                                goToFavoriteFood(food.id)
                              }
                              style={({ pressed }) => [
                                styles.searchResultItem,
                                pressed &&
                                  styles.searchResultPressed,
                              ]}
                            >
                              <View style={styles.searchFoodImage}>
                                {food.image ? (
                                  <Image
                                    source={{ uri: food.image }}
                                    style={styles.searchFoodImageActual}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <Ionicons
                                    name={
                                      food.icon ??
                                      "restaurant-outline"
                                    }
                                    size={20}
                                    color={CARDINAL}
                                  />
                                )}
                              </View>

                              <View style={styles.searchResultContent}>
                                <Text
                                  style={styles.searchResultName}
                                  numberOfLines={1}
                                >
                                  {food.name}
                                </Text>

                                <Text
                                  style={styles.searchResultDescription}
                                  numberOfLines={1}
                                >
                                  {food.store}
                                </Text>

                                <View style={styles.searchResultMeta}>
                                  <Text
                                    style={styles.searchFoodCategory}
                                  >
                                    {food.category ?? "Food"}
                                  </Text>

                                  {food.price ? (
                                    <>
                                      <View
                                        style={styles.searchResultDot}
                                      />
                                      <Text
                                        style={styles.searchFoodPrice}
                                      >
                                        {food.price}
                                      </Text>
                                    </>
                                  ) : null}
                                </View>
                              </View>

                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#AAAAAA"
                              />
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* ============================
                          STORES
                      ============================ */}
                      {searchData.stores.length > 0 && (
                        <View style={styles.searchSection}>
                          <View style={styles.searchSectionHeader}>
                            <Text style={styles.searchSectionTitle}>
                              STORES
                            </Text>
                            <Text style={styles.searchSectionCount}>
                              {searchData.stores.length}
                            </Text>
                          </View>

                          {searchData.stores.map((store) => (
                            <Pressable
                              key={`store-${store.id}`}
                              onPress={() =>
                                goToStore(store.id)
                              }
                              style={({ pressed }) => [
                                styles.searchResultItem,
                                pressed &&
                                  styles.searchResultPressed,
                              ]}
                            >
                              <View style={styles.searchResultIcon}>
                                <Ionicons
                                  name={store.icon}
                                  size={20}
                                  color={CARDINAL}
                                />
                              </View>

                              <View style={styles.searchResultContent}>
                                <Text
                                  style={styles.searchResultName}
                                  numberOfLines={1}
                                >
                                  {store.name}
                                </Text>

                                <Text
                                  style={styles.searchResultDescription}
                                  numberOfLines={1}
                                >
                                  {store.description}
                                </Text>

                                <View style={styles.searchResultMeta}>
                                  <Ionicons
                                    name="star"
                                    size={11}
                                    color={GOLD}
                                  />

                                  <Text
                                    style={styles.searchResultRating}
                                  >
                                    {store.rating.toFixed(1)}
                                  </Text>

                                  <View
                                    style={styles.searchResultDot}
                                  />

                                  <Text
                                    style={styles.searchResultType}
                                  >
                                    {store.type}
                                  </Text>
                                </View>
                              </View>

                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#AAAAAA"
                              />
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* ============================
                          CATEGORIES
                      ============================ */}
                      {searchData.categories.length > 0 && (
                        <View style={styles.searchSection}>
                          <View style={styles.searchSectionHeader}>
                            <Text style={styles.searchSectionTitle}>
                              CATEGORIES
                            </Text>
                            <Text style={styles.searchSectionCount}>
                              {searchData.categories.length}
                            </Text>
                          </View>

                          {searchData.categories.map((category) => (
                            <Pressable
                              key={`category-${category.label}`}
                              onPress={() => {
                                setSearchFocused(false);
                                goToCategory(category.label);
                              }}
                              style={({ pressed }) => [
                                styles.searchCategoryItem,
                                pressed &&
                                  styles.searchResultPressed,
                              ]}
                            >
                              <View
                                style={styles.searchCategoryIcon}
                              >
                                <Ionicons
                                  name={category.icon}
                                  size={19}
                                  color={CARDINAL}
                                />
                              </View>

                              <View
                                style={styles.searchResultContent}
                              >
                                <Text
                                  style={styles.searchResultName}
                                >
                                  {category.label}
                                </Text>

                                <Text
                                  style={styles.searchResultDescription}
                                >
                                  Browse {category.label.toLowerCase()}
                                </Text>
                              </View>

                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#AAAAAA"
                              />
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* ============================
                          VIEW ALL
                      ============================ */}
                      <Pressable
                        onPress={goToExplore}
                        style={styles.viewAllSearch}
                      >
                        <Text style={styles.viewAllSearchText}>
                          View all results
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color={CARDINAL}
                        />
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.noSearchResults}>
                      <View style={styles.noSearchIcon}>
                        <Ionicons
                          name="search-outline"
                          size={21}
                          color={MUTED}
                        />
                      </View>

                      <View style={styles.noSearchTextContainer}>
                        <Text style={styles.noSearchTitle}>
                          No results found
                        </Text>

                        <Text style={styles.noSearchDescription}>
                          Try a food, drink, store, or category.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

          </View>

          {/* ================================================= */}
          {/* CAROUSEL */}
          {/* ================================================= */}

          <View
            style={
              styles.carouselWrapper
            }
          >
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={
                false
              }
              decelerationRate="fast"
              snapToInterval={
                SLIDE_WIDTH
              }
              snapToAlignment="start"
              onScroll={
                handleCarouselScroll
              }
              scrollEventThrottle={16}
              contentContainerStyle={
                styles.carouselContent
              }
            >
              {carouselItems.map(
                (item) => (
                  <View
                    key={item.id}
                    style={
                      styles.carouselSlide
                    }
                  >
                    <Image
                      source={{
                        uri: item.image,
                      }}
                      style={
                        styles.carouselImage
                      }
                      resizeMode="cover"
                    />

                    <View
                      style={
                        styles.imageOverlay
                      }
                    />

                    <View
                      style={
                        styles.carouselTextContent
                      }
                    >
                      <Text
                        style={
                          styles.carouselEyebrow
                        }
                      >
                        {item.eyebrow}
                      </Text>

                      <Text
                        style={
                          styles.carouselTitle
                        }
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={
                          styles.carouselDescription
                        }
                      >
                        {
                          item.description
                        }
                      </Text>

                      <Pressable
                        style={({ pressed }) => [
                          styles.carouselButton,
                          pressed &&
                            styles.pressed,
                        ]}
                        onPress={
                          goToExplore
                        }
                      >
                        <Text
                          style={
                            styles.carouselButtonText
                          }
                        >
                          Explore Stores
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color={
                            CARDINAL_DARK
                          }
                        />
                      </Pressable>
                    </View>
                  </View>
                )
              )}
            </ScrollView>

            <View
              style={
                styles.pagination
              }
            >
              {carouselItems.map(
                (
                  item,
                  index
                ) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      goToSlide(
                        index
                      )
                    }
                    hitSlop={8}
                  >
                    <View
                      style={[
                        styles.paginationDot,
                        index ===
                          activeSlide &&
                          styles.paginationDotActive,
                      ]}
                    />
                  </Pressable>
                )
              )}
            </View>
          </View>

          {/* ================================================= */}
          {/* CATEGORIES */}
          {/* ================================================= */}

          <SectionHeader
            title="Categories"
          />

          <View
            style={
              styles.categoryRow
            }
          >
            {categories.map(
              (category) => (
                <Pressable
                  key={
                    category.label
                  }
                  style={({ pressed }) => [
                    styles.categoryItem,
                    pressed &&
                      styles.pressed,
                  ]}
                  onPress={() =>
                    goToCategory(
                      category.label
                    )
                  }
                >
                  <View
                    style={
                      styles.categoryIcon
                    }
                  >
                    <Ionicons
                      name={
                        category.icon
                      }
                      size={24}
                      color={
                        CARDINAL
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.categoryLabel
                    }
                  >
                    {
                      category.label
                    }
                  </Text>
                </Pressable>
              )
            )}
          </View>

          {/* ================================================= */}
          {/* MY FAVORITES */}
          {/* ================================================= */}

          <SectionHeader
            title="My Favorites"
          />

          {favoriteFoods.length >
          0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.favoriteList
              }
            >
              {favoriteFoods.map(
                (food) => (
                  <Pressable
                    key={food.id}
                    style={({ pressed }) => [
                      styles.favoriteCard,
                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      goToFavoriteFood(
                        food.id
                      )
                    }
                  >
                    <View
                      style={
                        styles.favoriteImageContainer
                      }
                    >
                      {food.image ? (
                        <Image
                          source={{
                            uri: food.image,
                          }}
                          style={
                            styles.favoriteImage
                          }
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={
                            styles.favoriteImageFallback
                          }
                        >
                          <Ionicons
                            name={
                              food.icon ??
                              "restaurant"
                            }
                            size={30}
                            color={
                              CARDINAL
                            }
                          />
                        </View>
                      )}

                      <View
                        style={
                          styles.favoriteHeart
                        }
                      >
                        <Ionicons
                          name="heart"
                          size={15}
                          color={
                            CARDINAL
                          }
                        />
                      </View>
                    </View>

                    <View
                      style={
                        styles.favoriteInfo
                      }
                    >
                      <Text
                        style={
                          styles.favoriteName
                        }
                        numberOfLines={1}
                      >
                        {food.name}
                      </Text>

                      <Text
                        style={
                          styles.favoriteStore
                        }
                        numberOfLines={1}
                      >
                        {food.store}
                      </Text>

                      <View
                        style={
                          styles.favoriteBottomRow
                        }
                      >
                        <Text
                          style={
                            styles.favoritePrice
                          }
                        >
                          {food.price ?? ""}
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={
                            MUTED
                          }
                        />
                      </View>
                    </View>
                  </Pressable>
                )
              )}
            </ScrollView>
          ) : (
            <View
              style={
                styles.emptyFavoriteCard
              }
            >
              <View
                style={
                  styles.emptyFavoriteIcon
                }
              >
                <Ionicons
                  name="heart-outline"
                  size={25}
                  color={
                    CARDINAL
                  }
                />
              </View>

              <View
                style={
                  styles.emptyFavoriteText
                }
              >
                <Text
                  style={
                    styles.emptyFavoriteTitle
                  }
                >
                  No favorites yet
                </Text>

                <Text
                  style={
                    styles.emptyFavoriteDescription
                  }
                >
                  Tap the heart on a product
                  to save it here.
                </Text>
              </View>

              <Pressable
                onPress={
                  goToExplore
                }
                style={({ pressed }) => [
                  styles.emptyFavoriteButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.emptyFavoriteButtonText
                  }
                >
                  Explore
                </Text>
              </Pressable>
            </View>
          )}

          {/* ================================================= */}
          {/* POPULAR STORES */}
          {/* ================================================= */}

          <SectionHeader
            title="Popular Stores"
            action="See all"
            onAction={
              goToStoresTab
            }
          />

          <Text
            style={
              styles.popularSubtitle
            }
          >
            Top-rated stores on campus
          </Text>

          {popularStores.map(
            (store) => (
              <Pressable
                key={store.id}
                style={({ pressed }) => [
                  styles.storeCard,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  goToStore(
                    store.id
                  )
                }
              >
                {/* STORE ICON */}

                <View
                  style={
                    styles.storeIcon
                  }
                >
                  <Ionicons
                    name={
                      store.icon
                    }
                    size={26}
                    color={
                      CARDINAL
                    }
                  />
                </View>

                {/* STORE CONTENT */}

                <View
                  style={
                    styles.storeInfo
                  }
                >
                  <View
                    style={
                      styles.storeNameRow
                    }
                  >
                    <Text
                      style={
                        styles.storeName
                      }
                      numberOfLines={1}
                    >
                      {
                        store.name
                      }
                    </Text>

                    {store.status ===
                      "Open" && (
                      <View
                        style={
                          styles.openBadge
                        }
                      >
                        <View
                          style={
                            styles.openDot
                          }
                        />

                        <Text
                          style={
                            styles.openText
                          }
                        >
                          Open
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={
                      styles.storeType
                    }
                    numberOfLines={1}
                  >
                    {
                      store.description
                    }
                  </Text>

                  <View
                    style={
                      styles.storeMeta
                    }
                  >
                    <Ionicons
                      name="star"
                      size={12}
                      color={
                        GOLD
                      }
                    />

                    <Text
                      style={
                        styles.storeMetaText
                      }
                    >
                      {store.rating.toFixed(
                        1
                      )}
                    </Text>

                    <View
                      style={
                        styles.metaDot
                      }
                    />

                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={
                        MUTED
                      }
                    />

                    <Text
                      style={
                        styles.storeMetaText
                      }
                    >
                      {
                        store.deliveryTime
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.storeArrow
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={
                      CARDINAL
                    }
                  />
                </View>
              </Pressable>
            )
          )}

          {/* ================================================= */}
          {/* BOTTOM SPACE */}
          {/* ================================================= */}

          <View
            style={
              styles.bottomSpace
            }
          />
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
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {action &&
        onAction && (
          <Pressable
            onPress={
              onAction
            }
            hitSlop={10}
          >
            <Text
              style={
                styles.sectionAction
              }
            >
              {action}
            </Text>
          </Pressable>
        )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // SCREEN
  // ==========================================================

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

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
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
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent:
      "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  // ==========================================================
  // SEARCH
  // ==========================================================

  searchWrapper: {
    position: "relative",
    zIndex: 100,
  },

  searchBox: {
    height: 54,
    marginTop: 20,
    paddingLeft: 16,
    paddingRight: 7,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  searchBoxFocused: {
    borderColor: CARDINAL,
    shadowColor: CARDINAL,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    paddingVertical: 0,
    fontSize: 13,
    color: TEXT,
  },

  searchClear: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent:
      "center",
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      "#FCECEF",
    alignItems: "center",
    justifyContent:
      "center",
  },

  // ==========================================================
  // SEARCH RESULTS
  // ==========================================================

  searchResults: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  searchResultHeader: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  searchSection: {
    paddingTop: 2,
  },

  searchSectionHeader: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F2",
  },

  searchSectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: CARDINAL,
  },

  searchSectionCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#FCECEF",
    color: CARDINAL,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 9,
    fontWeight: "900",
  },

  searchFoodImage: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  searchFoodImageActual: {
    width: "100%",
    height: "100%",
  },

  searchFoodCategory: {
    fontSize: 9,
    fontWeight: "700",
    color: MUTED,
  },

  searchFoodPrice: {
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL,
  },

  searchCategoryItem: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F2",
  },

  searchCategoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  searchResultTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  searchResultCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor:
      "#FCECEF",
    color: CARDINAL,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 10,
    fontWeight: "900",
  },

  searchResultItem: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F2",
  },

  searchResultPressed: {
    backgroundColor: "#FAFAFA",
  },

  searchResultIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor:
      "#FCECEF",
    alignItems: "center",
    justifyContent:
      "center",
  },

  searchResultContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  searchResultName: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  searchResultDescription: {
    marginTop: 2,
    fontSize: 9.5,
    color: MUTED,
  },

  searchResultMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  searchResultRating: {
    marginLeft: 3,
    fontSize: 9,
    fontWeight: "800",
    color: MUTED,
  },

  searchResultDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      "#BBBBBB",
    marginHorizontal: 6,
  },

  searchResultType: {
    fontSize: 9,
    fontWeight: "700",
    color: MUTED,
  },

  viewAllSearch: {
    height: 43,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 6,
  },

  viewAllSearchText: {
    fontSize: 11,
    fontWeight: "900",
    color: CARDINAL,
  },

  noSearchResults: {
    minHeight: 85,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  noSearchIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      "#F4F4F5",
    alignItems: "center",
    justifyContent:
      "center",
  },

  noSearchTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  noSearchTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  noSearchDescription: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  // ==========================================================
  // CAROUSEL
  // ==========================================================

  carouselWrapper: {
    marginTop: 18,
  },

  carouselContent: {
    padding: 0,
  },

  carouselSlide: {
    width: SLIDE_WIDTH,
    height: 205,
    borderRadius: 23,
    overflow: "hidden",
    position: "relative",
    backgroundColor:
      "#555555",
  },

  carouselImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(45,45,45,0.48)",
  },

  carouselTextContent: {
    position: "absolute",
    left: 20,
    top: 19,
    width: "67%",
    zIndex: 5,
  },

  carouselEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.15,
    lineHeight: 13,
    color: "#F0F0F0",
  },

  carouselTitle: {
    marginTop: 6,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "900",
    color: WHITE,
  },

  carouselDescription: {
    marginTop: 7,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#EEEEEE",
    maxWidth: 220,
  },

  carouselButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 13,
    height: 33,
    borderRadius: 10,
    backgroundColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  carouselButtonText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  // ==========================================================
  // PAGINATION
  // ==========================================================

  pagination: {
    position: "absolute",
    right: 20,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    zIndex: 20,
  },

  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      "rgba(255,255,255,0.65)",
  },

  paginationDotActive: {
    width: 19,
    backgroundColor: WHITE,
  },

  // ==========================================================
  // SECTIONS
  // ==========================================================

  sectionHeader: {
    marginTop: 25,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
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

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  categoryRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
  },

  categoryItem: {
    alignItems: "center",
    width: "23%",
  },

  categoryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent:
      "center",
  },

  categoryLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
  },

  // ==========================================================
  // MY FAVORITES
  // ==========================================================

  favoriteList: {
    paddingRight: 4,
    gap: 12,
  },

  favoriteCard: {
    width: 190,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  favoriteImageContainer: {
    width: "100%",
    height: 125,
    backgroundColor:
      "#F3F3F4",
    position: "relative",
  },

  favoriteImage: {
    width: "100%",
    height: "100%",
  },

  favoriteImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
    backgroundColor:
      "#FCECEF",
  },

  favoriteHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent:
      "center",
  },

  favoriteInfo: {
    padding: 12,
  },

  favoriteName: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  favoriteStore: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
  },

  favoriteBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  favoritePrice: {
    fontSize: 14,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ==========================================================
  // EMPTY FAVORITES
  // ==========================================================

  emptyFavoriteCard: {
    minHeight: 92,
    padding: 13,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  emptyFavoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor:
      "#FCECEF",
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyFavoriteText: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  emptyFavoriteTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  emptyFavoriteDescription: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
  },

  emptyFavoriteButton: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyFavoriteButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  // ==========================================================
  // POPULAR STORES
  // ==========================================================

  popularSubtitle: {
    marginTop: -2,
    marginBottom: 11,
    fontSize: 10.5,
    fontWeight: "600",
    color: MUTED,
  },

  storeCard: {
    minHeight: 84,
    marginBottom: 10,
    padding: 12,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor:
      "#FCECEF",
    alignItems: "center",
    justifyContent:
      "center",
  },

  storeInfo: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },

  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  storeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  storeType: {
    marginTop: 4,
    fontSize: 10.5,
    color: MUTED,
  },

  openBadge: {
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor:
      SUCCESS_BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      SUCCESS,
  },

  openText: {
    fontSize: 8,
    fontWeight: "900",
    color: SUCCESS,
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
    fontWeight: "700",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      "#BBBBBB",
    marginHorizontal: 7,
  },

  storeArrow: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor:
      "#FCECEF",
    alignItems: "center",
    justifyContent:
      "center",
    marginLeft: 7,
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomSpace: {
    height: 100,
  },

  // ==========================================================
  // PRESS
  // ==========================================================

  pressed: {
    opacity: 0.7,
  },
});