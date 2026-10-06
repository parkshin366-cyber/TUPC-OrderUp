import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useCart } from "../../../../context/CartContext";

import {
  getPublicProduct,
  type Product,
  type Store,
} from "../../../../services/api";

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
// FAVORITE PRODUCT TYPE
// ============================================================

type FavoriteProduct = {
  id: string;
  name: string;
  store: string;
  price: string;
  image?: string;
  category?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

// ============================================================
// PRODUCT ICON
// ============================================================

const getProductIcon = (
  category: string
): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case "Meals":
      return "restaurant-outline";

    case "Snacks":
      return "fast-food-outline";

    case "Drinks":
      return "cafe-outline";

    case "Desserts":
      return "ice-cream-outline";

    default:
      return "bag-outline";
  }
};

// ============================================================
// SCREEN
// ============================================================

export default function ProductDetails() {
  const { addToCart, replaceCart } = useCart();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const productId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  // ==========================================================
  // PRODUCT / STORE STATE
  // ==========================================================

  const [product, setProduct] =
    useState<Product | null>(null);

  const [store, setStore] =
    useState<Store | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const [quantity, setQuantity] =
    useState(1);

  // ==========================================================
  // FAVORITE
  // ==========================================================

  const [favorite, setFavorite] =
    useState(false);

  const [favoriteLoading, setFavoriteLoading] =
    useState(true);

  // ==========================================================
  // LOAD PRODUCT
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      if (!productId) {
        if (mounted) {
          setProduct(null);
          setStore(null);
          setLoadError("Product ID is missing.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        const result = await getPublicProduct(
          String(productId)
        );

        if (!mounted) {
          return;
        }

        setProduct(result.product);
        setStore(result.store);

        if (result.product.stock > 0) {
          setQuantity((current) =>
            Math.min(
              Math.max(current, 1),
              result.product.stock,
              20
            )
          );
        } else {
          setQuantity(1);
        }
      } catch (error) {
        console.error(
          "LOAD PRODUCT DETAILS ERROR:",
          error
        );

        if (!mounted) {
          return;
        }

        setProduct(null);
        setStore(null);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  // ==========================================================
  // CHECK FAVORITE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadFavoriteStatus = async () => {
      if (!product) {
        if (mounted) {
          setFavorite(false);
          setFavoriteLoading(false);
        }

        return;
      }

      try {
        const saved =
          await AsyncStorage.getItem(
            FAVORITES_STORAGE_KEY
          );

        if (!saved) {
          if (mounted) {
            setFavorite(false);
          }

          return;
        }

        const parsed: unknown =
          JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          if (mounted) {
            setFavorite(false);
          }

          return;
        }

        const exists = parsed.some(
          (item: unknown) => {
            if (typeof item === "string") {
              return item === product._id;
            }

            if (
              item &&
              typeof item === "object"
            ) {
              const raw =
                item as Record<
                  string,
                  unknown
                >;

              return raw.id === product._id;
            }

            return false;
          }
        );

        if (mounted) {
          setFavorite(exists);
        }
      } catch (error) {
        console.error(
          "LOAD FAVORITE ERROR:",
          error
        );

        if (mounted) {
          setFavorite(false);
        }
      } finally {
        if (mounted) {
          setFavoriteLoading(false);
        }
      }
    };

    setFavoriteLoading(true);

    loadFavoriteStatus();

    return () => {
      mounted = false;
    };
  }, [product]);

  // ==========================================================
  // TOGGLE FAVORITE
  // ==========================================================

  const toggleFavorite = async () => {
    if (
      favoriteLoading ||
      !product ||
      !store
    ) {
      return;
    }

    try {
      const saved =
        await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY
        );

      let favorites: FavoriteProduct[] = [];

      if (saved) {
        try {
          const parsed: unknown =
            JSON.parse(saved);

          if (Array.isArray(parsed)) {
            favorites = parsed
              .filter(
                (
                  item: unknown
                ): item is FavoriteProduct =>
                  !!item &&
                  typeof item ===
                    "object" &&
                  typeof (
                    item as Record<
                      string,
                      unknown
                    >
                  ).id === "string"
              )
              .map(
                (item: FavoriteProduct) => ({
                  id: String(item.id),

                  name:
                    typeof item.name ===
                    "string"
                      ? item.name
                      : "Product",

                  store:
                    typeof item.store ===
                    "string"
                      ? item.store
                      : store.name,

                  price:
                    typeof item.price ===
                    "string"
                      ? item.price
                      : "",

                  image:
                    typeof item.image ===
                    "string"
                      ? item.image
                      : undefined,

                  category:
                    typeof item.category ===
                    "string"
                      ? item.category
                      : undefined,

                  icon:
                    typeof item.icon ===
                    "string"
                      ? (item.icon as keyof typeof Ionicons.glyphMap)
                      : undefined,
                })
              );
          }
        } catch {
          favorites = [];
        }
      }

      const alreadyFavorite =
        favorites.some(
          (item) =>
            item.id === product._id
        );

      if (alreadyFavorite) {
        const updatedFavorites =
          favorites.filter(
            (item) =>
              item.id !== product._id
          );

        setFavorite(false);

        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(
            updatedFavorites
          )
        );
      } else {
        const favoriteProduct: FavoriteProduct =
          {
            id: product._id,
            name: product.name,
            store: store.name,
            price: `₱${product.price.toFixed(
              2
            )}`,
            category: product.category,
            icon: getProductIcon(
              product.category
            ),
          };

        const updatedFavorites = [
          ...favorites,
          favoriteProduct,
        ];

        setFavorite(true);

        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(
            updatedFavorites
          )
        );
      }
    } catch (error) {
      console.error(
        "TOGGLE FAVORITE ERROR:",
        error
      );

      Alert.alert(
        "Favorite Error",
        "Hindi ma-save ang favorite mo. Please try again."
      );
    }
  };

  // ==========================================================
  // QUANTITY LIMIT
  // ==========================================================

  const maxQuantity = useMemo(() => {
    if (!product) {
      return 1;
    }

    return Math.min(
      product.stock,
      20
    );
  }, [product]);

  // ==========================================================
  // INCREASE
  // ==========================================================

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    setQuantity((current) =>
      Math.min(
        current + 1,
        maxQuantity
      )
    );
  };

  // ==========================================================
  // DECREASE
  // ==========================================================

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(
        current - 1,
        1
      )
    );
  };

  // ==========================================================
  // TOTAL
  // ==========================================================

  const total =
    product
      ? product.price * quantity
      : 0;

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  const outOfStock =
    !product ||
    product.stock <= 0;

  const productUnavailable =
    !product ||
    !product.available;

  const storeClosed =
    !store ||
    !store.isOpen;

  const canAddToCart =
    !!product &&
    !!store &&
    product.available &&
    product.stock > 0 &&
    store.isOpen &&
    quantity > 0 &&
    quantity <= product.stock;

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = () => {
    if (!product || !store) {
      return;
    }

    if (!product.available) {
      Alert.alert(
        "Product Unavailable",
        "This product is currently unavailable."
      );

      return;
    }

    if (product.stock <= 0) {
      Alert.alert(
        "Out of Stock",
        "This product is currently out of stock."
      );

      return;
    }

    if (!store.isOpen) {
      Alert.alert(
        "Store Closed",
        `${store.name} is currently closed.`
      );

      return;
    }

    if (quantity > product.stock) {
      Alert.alert(
        "Not Enough Stock",
        `Only ${product.stock} item${
          product.stock === 1
            ? ""
            : "s"
        } available.`
      );

      setQuantity(
        Math.max(
          1,
          product.stock
        )
      );

      return;
    }

    // ======================================================
    // IMPORTANT:
    // Store _id is now saved in the CartItem.
    // This will be used by checkout when creating
    // the actual MongoDB Order.
    // ======================================================

    const cartProduct = {
        id: product._id,
        name: product.name,
        price: product.price,

        // ACTUAL MONGODB STORE ID
        storeId: store._id,

        // STORE NAME FOR DISPLAY
        store: store.name,

        image: "",
        maxQuantity: product.stock,
      };

    const result = addToCart(cartProduct, quantity);

    if (result === "different-store") {
      Alert.alert(
        "Start a new cart?",
        `Your cart contains items from another store. Food orders can contain items from only one store at a time.`,
        [
          { text: "Keep current cart", style: "cancel" },
          {
            text: "Start new cart",
            style: "destructive",
            onPress: () => {
              replaceCart(cartProduct, quantity);
              Alert.alert("Added to Cart", `${quantity} × ${product.name} added to your new cart.`);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Added to Cart",
      `${quantity} × ${product.name} added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () =>
            router.push(
              "/(client)/cart"
            ),
        },
      ]
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingScreen
          }
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <Ionicons
              name="cube-outline"
              size={34}
              color={CARDINAL}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={CARDINAL}
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            Loading product...
          </Text>

          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Getting the latest product
            information.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // ERROR / NOT FOUND
  // ==========================================================

  if (!product || !store) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.invalidProduct
          }
        >
          <View
            style={
              styles.invalidIcon
            }
          >
            <Ionicons
              name="cube-outline"
              size={35}
              color={CARDINAL}
            />
          </View>

          <Text
            style={
              styles.invalidTitle
            }
          >
            Product not found
          </Text>

          <Text
            style={
              styles.invalidSubtitle
            }
          >
            {loadError ||
              "This product may have been removed or is no longer available."}
          </Text>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={({
              pressed,
            }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <View
          style={styles.header}
        >
          <Pressable
            style={({
              pressed,
            }) => [
              styles.headerButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="chevron-back"
              size={25}
              color={TEXT}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Product Details
          </Text>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.headerButton,
              favorite &&
                styles.favoriteHeaderButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={
              toggleFavorite
            }
            disabled={
              favoriteLoading
            }
          >
            <Ionicons
              name={
                favorite
                  ? "heart"
                  : "heart-outline"
              }
              size={24}
              color={
                favorite
                  ? CARDINAL
                  : TEXT
              }
            />
          </Pressable>
        </View>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* PRODUCT IMAGE / PLACEHOLDER */}

          <View
            style={
              styles.imageContainer
            }
          >
            <View
              style={
                styles.productImagePlaceholder
              }
            >
              <Ionicons
                name={getProductIcon(
                  product.category
                )}
                size={78}
                color={CARDINAL}
              />
            </View>

            {/* CATEGORY */}

            <View
              style={
                styles.categoryBadge
              }
            >
              <Text
                style={
                  styles.categoryBadgeText
                }
              >
                {product.category}
              </Text>
            </View>

            {/* FAVORITE */}

            <Pressable
              style={({
                pressed,
              }) => [
                styles.imageFavoriteButton,
                favorite &&
                  styles.imageFavoriteButtonActive,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={
                toggleFavorite
              }
              disabled={
                favoriteLoading
              }
            >
              <Ionicons
                name={
                  favorite
                    ? "heart"
                    : "heart-outline"
                }
                size={24}
                color={
                  favorite
                    ? CARDINAL
                    : TEXT
                }
              />
            </Pressable>
          </View>

          {/* PRODUCT INFO */}

          <View
            style={styles.content}
          >
            <View
              style={styles.titleRow}
            >
              <View
                style={styles.titleArea}
              >
                <Text
                  style={
                    styles.productName
                  }
                >
                  {product.name}
                </Text>

                <Pressable
                  onPress={() =>
                    router.back()
                  }
                >
                  <Text
                    style={
                      styles.storeName
                    }
                  >
                    {store.name}
                  </Text>
                </Pressable>
              </View>

              <Text
                style={styles.price}
              >
                ₱
                {product.price.toFixed(
                  2
                )}
              </Text>
            </View>

            {/* AVAILABILITY */}

            <View
              style={
                styles.availabilityRow
              }
            >
              <View
                style={[
                  styles.availabilityBox,
                  product.available &&
                  product.stock > 0
                    ? styles.availableBox
                    : styles.unavailableBox,
                ]}
              >
                <Ionicons
                  name={
                    product.available &&
                    product.stock > 0
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={15}
                  color={
                    product.available &&
                    product.stock > 0
                      ? SUCCESS
                      : MUTED
                  }
                />

                <Text
                  style={[
                    styles.availabilityText,
                    product.available &&
                    product.stock > 0
                      ? styles.availableText
                      : styles.unavailableText,
                  ]}
                >
                  {product.stock <=
                  0
                    ? "Out of stock"
                    : !product.available
                      ? "Unavailable"
                      : store.isOpen
                        ? "Available"
                        : "Store closed"}
                </Text>
              </View>

              <View
                style={styles.dot}
              />

              <Text
                style={
                  styles.stockText
                }
              >
                {product.stock}{" "}
                in stock
              </Text>
            </View>

            <View
              style={styles.divider}
            />

            {/* DESCRIPTION */}

            <Text
              style={styles.sectionTitle}
            >
              Description
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Product information is
              currently managed by{" "}
              {store.name}.
            </Text>

            {/* STORE INFO */}

            <View
              style={styles.infoCard}
            >
              <View
                style={styles.infoIcon}
              >
                <Ionicons
                  name="storefront-outline"
                  size={21}
                  color={CARDINAL}
                />
              </View>

              <View
                style={
                  styles.infoTextArea
                }
              >
                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  {store.name}
                </Text>

                <Text
                  style={styles.infoText}
                >
                  {store.location ||
                    "Campus store"}{" "}
                  •{" "}
                  {store.isOpen
                    ? "Open"
                    : "Closed"}
                </Text>

                <Text
                  style={styles.infoText}
                >
                  Pickup:{" "}
                  {store.pickupEnabled
                    ? "Available"
                    : "Unavailable"}
                </Text>
              </View>
            </View>

            {/* QUANTITY */}

            <View
              style={
                styles.quantitySection
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Quantity
                </Text>

                <Text
                  style={
                    styles.quantityHint
                  }
                >
                  Maximum{" "}
                  {Math.min(
                    product.stock,
                    20
                  )}{" "}
                  item
                  {Math.min(
                    product.stock,
                    20
                  ) === 1
                    ? ""
                    : "s"}
                </Text>
              </View>

              <View
                style={
                  styles.quantityControl
                }
              >
                <Pressable
                  style={[
                    styles.quantityButton,
                    quantity <= 1 &&
                      styles.quantityButtonDisabled,
                  ]}
                  onPress={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1
                  }
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={
                      quantity <= 1
                        ? "#AAAAAA"
                        : TEXT
                    }
                  />
                </Pressable>

                <Text
                  style={
                    styles.quantityText
                  }
                >
                  {quantity}
                </Text>

                <Pressable
                  style={[
                    styles.quantityButton,
                    quantity >=
                      maxQuantity &&
                      styles.quantityButtonDisabled,
                  ]}
                  onPress={
                    increaseQuantity
                  }
                  disabled={
                    quantity >=
                    maxQuantity
                  }
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={
                      quantity >=
                      maxQuantity
                        ? "#AAAAAA"
                        : TEXT
                    }
                  />
                </Pressable>
              </View>
            </View>

            <View
              style={styles.bottomSpace}
            />
          </View>
        </ScrollView>

        {/* ==================================================
            BOTTOM ACTION
        ================================================== */}

        <View
          style={
            styles.bottomAction
          }
        >
          <View
            style={styles.totalArea}
          >
            <Text
              style={
                styles.totalLabel
              }
            >
              Total
            </Text>

            <Text
              style={
                styles.totalPrice
              }
            >
              ₱{total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.addButton,
              !canAddToCart &&
                styles.addButtonDisabled,
              pressed &&
                canAddToCart &&
                styles.buttonPressed,
            ]}
            onPress={
              handleAddToCart
            }
            disabled={
              !canAddToCart
            }
          >
            <Ionicons
              name={
                outOfStock ||
                productUnavailable
                  ? "close-circle-outline"
                  : storeClosed
                    ? "lock-closed-outline"
                    : "bag-add-outline"
              }
              size={21}
              color={WHITE}
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              {outOfStock
                ? "Out of Stock"
                : productUnavailable
                  ? "Unavailable"
                  : storeClosed
                    ? "Store Closed"
                    : "Add to Cart"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
    textAlign: "center",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F6",
  },

  favoriteHeaderButton: {
    backgroundColor: "#FCECEF",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scrollContent: {
    paddingBottom: 20,
  },

  // ==========================================================
  // IMAGE
  // ==========================================================

  imageContainer: {
    height: 290,
    backgroundColor: "#FCECEF",
    position: "relative",
    overflow: "hidden",
  },

  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCECEF",
  },

  categoryBadge: {
    position: "absolute",
    left: 18,
    bottom: 18,
    backgroundColor: CARDINAL,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },

  categoryBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },

  imageFavoriteButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  imageFavoriteButtonActive: {
    backgroundColor: "#FCECEF",
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  titleArea: {
    flex: 1,
  },

  productName: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    color: TEXT,
  },

  storeName: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "700",
    color: CARDINAL,
  },

  price: {
    fontSize: 23,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  availabilityBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },

  availableBox: {
    backgroundColor: SUCCESS_BG,
  },

  unavailableBox: {
    backgroundColor: "#F4F4F4",
  },

  availabilityText: {
    fontSize: 12,
    fontWeight: "800",
  },

  availableText: {
    color: SUCCESS,
  },

  unavailableText: {
    color: MUTED,
  },

  stockText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MUTED,
    marginHorizontal: 9,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 22,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  description: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 22,
    color: MUTED,
  },

  // ==========================================================
  // INFO CARD
  // ==========================================================

  infoCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECEF",
  },

  infoTextArea: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  infoText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
  },

  // ==========================================================
  // QUANTITY
  // ==========================================================

  quantitySection: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  quantityHint: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
  },

  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },

  quantityButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonDisabled: {
    opacity: 0.5,
  },

  quantityText: {
    minWidth: 35,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  bottomSpace: {
    height: 30,
  },

  // ==========================================================
  // BOTTOM ACTION
  // ==========================================================

  bottomAction: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  totalArea: {
    flex: 1,
  },

  totalLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },

  totalPrice: {
    marginTop: 2,
    fontSize: 21,
    color: TEXT,
    fontWeight: "900",
  },

  addButton: {
    minWidth: 155,
    height: 50,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },

  addButtonDisabled: {
    backgroundColor: "#AAAAAA",
  },

  addButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "900",
  },

  // ==========================================================
  // INVALID
  // ==========================================================

  invalidProduct: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  invalidIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  invalidTitle: {
    marginTop: 17,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  invalidSubtitle: {
    marginTop: 6,
    maxWidth: 300,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: MUTED,
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: CARDINAL,
  },

  backButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  // ==========================================================
  // GENERAL
  // ==========================================================

  buttonPressed: {
    opacity: 0.82,
  },
});
