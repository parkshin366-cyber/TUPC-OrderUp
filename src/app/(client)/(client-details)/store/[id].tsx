import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../../../context/CartContext";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../../../context/ThemeContext";
import { createThemedStyleSheet } from "../../../../utils/themeStyles";

import {
  getPublicStore,
  getPublicSellerReviews,
  getStoreProducts,
  type Product,
  type SellerReview,
  type Store,
} from "../../../../services/api";

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
const WHITE = "#FFFFFF";

const SUCCESS = "#18864B";
const SUCCESS_BG = "#EAF7EF";

// =====================================================
// HELPERS
// =====================================================

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

// =====================================================
// SCREEN
// =====================================================

export default function StoreDetails() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const { items: cartItems, addToCart: addCartItem, replaceCart } = useCart();
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const storeId = Array.isArray(params.id)
    ? params.id[0] ?? ""
    : params.id ?? "";

  // ===================================================
  // STATE
  // ===================================================

  const [store, setStore] =
    useState<Store | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [favorite, setFavorite] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadingCart = false;

  const [addingProductId, setAddingProductId] =
    useState<string | null>(null);

  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // ===================================================
  // LOAD STORE + PRODUCTS
  // ===================================================

  const loadStore = useCallback(
    async (showLoading = true) => {
      if (!storeId) {
        setStore(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        const [storeResult, productsResult] =
          await Promise.all([
            getPublicStore(storeId),
            getStoreProducts(storeId),
          ]);

        setStore(storeResult);
        setProducts(productsResult);

        try {
          const sellerId = String(
            typeof storeResult.seller === "object"
              ? (storeResult.seller as any)?._id ?? (storeResult.seller as any)?.id ?? ""
              : storeResult.seller ?? ""
          );
          const reviewResult = await getPublicSellerReviews(sellerId);
          setReviews(reviewResult.reviews);
          setAverageRating(reviewResult.averageRating);
          setReviewCount(reviewResult.reviewCount);
        } catch (reviewError) {
          console.error("LOAD STORE REVIEWS ERROR:", reviewError);
          setReviews([]);
          setAverageRating(0);
          setReviewCount(0);
        }

        // If selected category no longer exists,
        // return to All.
        if (
          selectedCategory !== "All" &&
          !productsResult.some(
            (product) =>
              product.category ===
              selectedCategory
          )
        ) {
          setSelectedCategory("All");
        }
      } catch (error) {
        console.error(
          "LOAD STORE DETAILS ERROR:",
          error
        );

        setStore(null);
        setProducts([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [storeId, selectedCategory]
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadStore(true);
  }, [loadStore]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await loadStore(false);
    } finally {
      setRefreshing(false);
    }
  };

  // ===================================================
  // PRODUCT CATEGORIES
  // ===================================================

  const categories = useMemo(() => {
    const uniqueCategories =
      Array.from(
        new Set(
          products.map(
            (product) =>
              product.category
          )
        )
      );

    return [
      "All",
      ...uniqueCategories,
    ];
  }, [products]);

  // ===================================================
  // FILTERED PRODUCTS
  // ===================================================

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return products;
    }

    return products.filter(
      (product) =>
        product.category ===
        selectedCategory
    );
  }, [
    products,
    selectedCategory,
  ]);

  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cartItems]);

  // ===================================================
  // CART TOTAL
  // ===================================================

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );
  }, [cartItems]);

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart = async (
    product: Product
  ) => {
    if (!store) {
      return;
    }

    // Store is closed.
    if (!store.isOpen) {
      return;
    }

    // Product is unavailable.
    if (!product.available) {
      return;
    }

    // No stock.
    if (product.stock <= 0) {
      return;
    }

    try {
      setAddingProductId(
        product._id
      );

      const existingItem =
        cartItems.find(
          (item) =>
            item.id ===
            product._id
        );

      // =============================================
      // STOCK LIMIT
      // =============================================

      if (
        existingItem &&
        existingItem.quantity >=
          product.stock
      ) {
        return;
      }

      const cartProduct = {
        id: product._id,
        storeId: store._id,
        store: store.name,
        name: product.name,
        price: product.price,
        image: "",
        maxQuantity: product.stock,
      };

      const result = addCartItem(cartProduct, 1);
      if (result === "different-store") {
        Alert.alert(
          "Start a new cart?",
          "Your cart contains food from another store. One order can contain items from only one store.",
          [
            { text: "Keep current cart", style: "cancel" },
            { text: "Start new cart", style: "destructive", onPress: () => replaceCart(cartProduct, 1) },
          ]
        );
      }
    } catch (error) {
      console.log(
        "Failed to add to cart:",
        error
      );
    } finally {
      setTimeout(() => {
        setAddingProductId(null);
      }, 250);
    }
  };

  // ===================================================
  // OPEN PRODUCT
  // ===================================================

  const openProduct = (
    productId: string
  ) => {
    if (!productId) {
      return;
    }

    router.push({
      pathname:
        "/(client)/(client-details)/product/[id]",
      params: {
        id: productId,
      },
    });
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
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
          style={styles.loadingScreen}
        >
          <View
            style={styles.loadingIcon}
          >
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
            style={
              styles.loadingTitle
            }
          >
            Loading store...
          </Text>

          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Getting the latest store
            information and products.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // INVALID STORE
  // ===================================================

  if (!store) {
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
          style={styles.invalidStore}
        >
          <View
            style={styles.invalidIcon}
          >
            <Ionicons
              name="storefront-outline"
              size={34}
              color={CARDINAL}
            />
          </View>

          <Text
            style={
              styles.invalidTitle
            }
          >
            Store not found
          </Text>

          <Text
            style={
              styles.invalidSubtitle
            }
          >
            This campus store may no
            longer be available.
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
                styles.pressed,
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

  // ===================================================
  // SCREEN
  // ===================================================

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
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Pressable
            style={({
              pressed,
            }) => [
              styles.headerButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={TEXT}
            />
          </Pressable>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.headerTitle
              }
              numberOfLines={1}
            >
              {store.name}
            </Text>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.headerButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/cart"
              )
            }
          >
            <Ionicons
              name="bag-outline"
              size={22}
              color={TEXT}
            />

            {cartCount > 0 && (
              <View
                style={
                  styles.cartBadge
                }
              >
                <Text
                  style={
                    styles.cartBadgeText
                  }
                >
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              tintColor={
                CARDINAL
              }
              colors={[
                CARDINAL,
              ]}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            cartCount > 0 &&
              styles.scrollContentWithCart,
          ]}
        >
          {/* =================================================
              STORE HERO
          ================================================= */}

          <View
            style={
              styles.coverContainer
            }
          >
            <View style={styles.coverBackground}>
              {store.bannerImage ? (
                <Image source={{ uri: store.bannerImage }} style={styles.coverImage} />
              ) : (
                <Ionicons name="storefront" size={64} color={CARDINAL} />
              )}
            </View>

            <View
              style={
                styles.coverOverlay
              }
            />

            <View
              style={
                styles.coverTopLabel
              }
            >
              <Ionicons
                name="location-outline"
                size={13}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.coverTopLabelText
                }
                numberOfLines={1}
              >
                {store.location ||
                  "Campus"}
              </Text>
            </View>

            <View
              style={styles.storeLogo}
            >
              {store.profileImage ? (
                <Image source={{ uri: store.profileImage }} style={styles.storeLogoImage} resizeMode="contain" />
              ) : (
                <Ionicons name="storefront" size={31} color={CARDINAL} />
              )}
            </View>
          </View>

          {/* =================================================
              STORE INFO
          ================================================= */}

          <View
            style={styles.storeInfo}
          >
            <View
              style={
                styles.storeTitleRow
              }
            >
              <View
                style={
                  styles.storeTitleArea
                }
              >
                <Text
                  style={
                    styles.storeName
                  }
                  numberOfLines={2}
                >
                  {store.name}
                </Text>

                <View
                  style={
                    styles.verifiedRow
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={CARDINAL}
                  />

                  <Text
                    style={
                      styles.verifiedText
                    }
                  >
                    Approved Campus
                    Seller
                  </Text>
                </View>
              </View>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.favoriteButton,
                  favorite &&
                    styles.favoriteButtonActive,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  setFavorite(
                    (current) =>
                      !current
                  )
                }
              >
                <Ionicons
                  name={
                    favorite
                      ? "heart"
                      : "heart-outline"
                  }
                  size={22}
                  color={
                    favorite
                      ? WHITE
                      : CARDINAL
                  }
                />
              </Pressable>
            </View>

            {/* OPEN / CLOSED */}

            <View
              style={
                styles.openStatusRow
              }
            >
              <View
                style={[
                  styles.openStatusBadge,
                  store.isOpen
                    ? styles.openStatusBadgeOpen
                    : styles.openStatusBadgeClosed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    store.isOpen
                      ? styles.statusDotOpen
                      : styles.statusDotClosed,
                  ]}
                />

                <Text
                  style={[
                    styles.openStatusText,
                    store.isOpen
                      ? styles.openStatusTextOpen
                      : styles.openStatusTextClosed,
                  ]}
                >
                  {store.isOpen
                    ? "Open"
                    : "Closed"}
                </Text>
              </View>

              <Text
                style={
                  styles.storeHours
                }
              >
                {store.openTime} -{" "}
                {store.closeTime}
              </Text>
            </View>

            {/* DESCRIPTION */}

            <Text
              style={
                styles.storeDescription
              }
            >
              {store.description ||
                "No store description available."}
            </Text>

            {/* META */}

            <View
              style={styles.metaRow}
            >
              <View
                style={styles.metaItem}
              >
                <View
                  style={
                    styles.metaIcon
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={CARDINAL}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.metaSubtext
                    }
                    numberOfLines={1}
                  >
                    {store.location ||
                      "Not specified"}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.metaDivider
                }
              />

              <View
                style={
                  styles.metaItem
                }
              >
                <View
                  style={
                    styles.metaIcon
                  }
                >
                  <Ionicons
                    name="bag-handle-outline"
                    size={16}
                    color={CARDINAL}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    Pickup
                  </Text>

                  <Text
                    style={
                      styles.metaSubtext
                    }
                  >
                    {store.pickupEnabled
                      ? "Available"
                      : "Unavailable"}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.metaDivider
                }
              />

              <View
                style={
                  styles.metaItem
                }
              >
                <View
                  style={
                    styles.metaIcon
                  }
                >
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={CARDINAL}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    Products
                  </Text>

                  <Text
                    style={
                      styles.metaSubtext
                    }
                  >
                    {products.length}{" "}
                    available
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.sectionTitle}>Customer Reviews</Text>
                <Text style={styles.sectionSubtitle}>Ratings from completed orders</Text>
              </View>
              <View style={styles.ratingSummary}>
                <Ionicons name="star" size={17} color="#D59B00" />
                <Text style={styles.ratingValue}>{reviewCount ? averageRating.toFixed(1) : "—"}</Text>
                <Text style={styles.ratingCount}>({reviewCount})</Text>
              </View>
            </View>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewerName}>
                      {`${review.client?.firstName ?? "Customer"} ${review.client?.lastName ?? ""}`.trim()}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={13}
                          color="#D59B00"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noReviews}>
                <Ionicons name="star-outline" size={24} color={CARDINAL} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noReviewsTitle}>No reviews yet</Text>
                  <Text style={styles.noReviewsText}>Be the first to review this seller after a completed order.</Text>
                </View>
              </View>
            )}
          </View>

          {/* =================================================
              MENU
          ================================================= */}

          <View
            style={
              styles.categorySection
            }
          >
            <View
              style={
                styles.menuHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Menu
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Choose something you
                  like
                </Text>
              </View>

              <View
                style={
                  styles.menuCount
                }
              >
                <Text
                  style={
                    styles.menuCountText
                  }
                >
                  {products.length}{" "}
                  items
                </Text>
              </View>
            </View>

            {/* CATEGORIES */}

            {categories.length >
              1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.categoryList
                }
              >
                {categories.map(
                  (category) => {
                    const active =
                      selectedCategory ===
                      category;

                    return (
                      <Pressable
                        key={
                          category
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.categoryButton,
                          active &&
                            styles.categoryButtonActive,
                          pressed &&
                            styles.pressed,
                        ]}
                        onPress={() =>
                          setSelectedCategory(
                            category
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            active &&
                              styles.categoryTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            )}
          </View>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <View
            style={
              styles.productsSection
            }
          >
            <View
              style={
                styles.productsHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {selectedCategory ===
                  "All"
                    ? "Products"
                    : selectedCategory}
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {
                    filteredProducts.length
                  }{" "}
                  {filteredProducts.length ===
                  1
                    ? "item"
                    : "items"}{" "}
                  available
                </Text>
              </View>
            </View>

            {loadingCart ? (
              <View
                style={
                  styles.loadingBox
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    CARDINAL
                  }
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading cart...
                </Text>
              </View>
            ) : filteredProducts.length >
              0 ? (
              <View
                style={
                  styles.productGrid
                }
              >
                {filteredProducts.map(
                  (product) => {
                    const cartItem =
                      cartItems.find(
                        (item) =>
                          item.id ===
                          product._id
                      );

                    const quantity =
                      cartItem?.quantity ??
                      0;

                    const isAdding =
                      addingProductId ===
                      product._id;

                    const outOfStock =
                      product.stock <=
                      0;

                    const unavailable =
                      !product.available;

                    const cannotAdd =
                      !store.isOpen ||
                      outOfStock ||
                      unavailable ||
                      isAdding;

                    return (
                      <View
                        key={
                          product._id
                        }
                        style={[
                          styles.productCard,
                          unavailable &&
                            styles.productCardUnavailable,
                        ]}
                      >
                        {/* PRODUCT ICON */}

                        <Pressable
                          onPress={() =>
                            openProduct(
                              product._id
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.productImageContainer,
                            pressed &&
                              styles.imagePressed,
                          ]}
                        >
                          <View
                            style={
                              styles.productPlaceholder
                            }
                          >
                            <Ionicons
                              name={getProductIcon(
                                product.category
                              )}
                              size={43}
                              color={
                                CARDINAL
                              }
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
                              {
                                product.category
                              }
                            </Text>
                          </View>

                          {/* STOCK */}

                          {outOfStock ? (
                            <View
                              style={
                                styles.stockBadgeOut
                              }
                            >
                              <Text
                                style={
                                  styles.stockBadgeTextOut
                                }
                              >
                                OUT OF STOCK
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={
                                styles.stockBadge
                              }
                            >
                              <Text
                                style={
                                  styles.stockBadgeText
                                }
                              >
                                {product.stock}{" "}
                                left
                              </Text>
                            </View>
                          )}

                          {!product.available && (
                            <View
                              style={
                                styles.unavailableOverlay
                              }
                            >
                              <Text
                                style={
                                  styles.unavailableText
                                }
                              >
                                UNAVAILABLE
                              </Text>
                            </View>
                          )}
                        </Pressable>

                        {/* PRODUCT INFO */}

                        <View
                          style={
                            styles.productInfo
                          }
                        >
                          <Pressable
                            onPress={() =>
                              openProduct(
                                product._id
                              )
                            }
                          >
                            <Text
                              style={
                                styles.productName
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {
                                product.name
                              }
                            </Text>

                            <Text
                              style={
                                styles.productCategory
                              }
                            >
                              {
                                product.category
                              }
                            </Text>
                          </Pressable>

                          <View
                            style={
                              styles.productBottom
                            }
                          >
                            <View>
                              <Text
                                style={
                                  styles.productPrice
                                }
                              >
                                ₱
                                {product.price.toFixed(
                                  2
                                )}
                              </Text>

                              {quantity >
                                0 && (
                                <Text
                                  style={
                                    styles.inCartText
                                  }
                                >
                                  {quantity}{" "}
                                  in cart
                                </Text>
                              )}
                            </View>

                            <Pressable
                              disabled={
                                cannotAdd
                              }
                              onPress={() =>
                                addToCart(
                                  product
                                )
                              }
                              style={({
                                pressed,
                              }) => [
                                styles.addButton,
                                cannotAdd &&
                                  styles.addButtonDisabled,
                                pressed &&
                                  !cannotAdd &&
                                  styles.addButtonPressed,
                              ]}
                            >
                              {isAdding ? (
                                <ActivityIndicator
                                  size="small"
                                  color={
                                    WHITE
                                  }
                                />
                              ) : outOfStock ? (
                                <Ionicons
                                  name="close"
                                  size={19}
                                  color={
                                    WHITE
                                  }
                                />
                              ) : (
                                <Ionicons
                                  name="add"
                                  size={19}
                                  color={
                                    WHITE
                                  }
                                />
                              )}
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  }
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyMenu
                }
              >
                <View
                  style={
                    styles.emptyMenuIcon
                  }
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={30}
                    color={
                      CARDINAL
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyMenuTitle
                  }
                >
                  No items available
                </Text>

                <Text
                  style={
                    styles.emptyMenuText
                  }
                >
                  There are no products
                  available in this
                  category right now.
                </Text>

                {selectedCategory !==
                  "All" && (
                  <Pressable
                    onPress={() =>
                      setSelectedCategory(
                        "All"
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.showAllButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.showAllButtonText
                      }
                    >
                      Show All Items
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>

        {/* =================================================
            CART BAR
        ================================================= */}

        {cartCount > 0 && (
          <View
            style={
              styles.cartBarContainer
            }
          >
            <Pressable
              onPress={() =>
                router.push(
                  "/cart"
                )
              }
              style={({
                pressed,
              }) => [
                styles.cartBar,
                pressed &&
                  styles.cartBarPressed,
              ]}
            >
              <View
                style={
                  styles.cartBarLeft
                }
              >
                <View
                  style={
                    styles.cartBarIcon
                  }
                >
                  <Ionicons
                    name="bag-handle"
                    size={20}
                    color={
                      WHITE
                    }
                  />

                  <View
                    style={
                      styles.cartBarBadge
                    }
                  >
                    <Text
                      style={
                        styles.cartBarBadgeText
                      }
                    >
                      {cartCount >
                      99
                        ? "99+"
                        : cartCount}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={
                      styles.cartBarTitle
                    }
                  >
                    View Cart
                  </Text>

                  <Text
                    style={
                      styles.cartBarSubtitle
                    }
                  >
                    {cartCount}{" "}
                    {cartCount ===
                    1
                      ? "item"
                      : "items"}{" "}
                    from{" "}
                    {store.name}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.cartBarRight
                }
              >
                <Text
                  style={
                    styles.cartBarTotal
                  }
                >
                  ₱
                  {cartTotal.toFixed(
                    2
                  )}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={
                    WHITE
                  }
                />
              </View>
            </Pressable>
          </View>
        )}
      </View>
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
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ===================================================
  // LOADING
  // ===================================================

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

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F5F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerCenter: {
    flex: 1,
    paddingHorizontal: 15,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: WHITE,
  },

  cartBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: WHITE,
  },

  // ===================================================
  // SCROLL
  // ===================================================

  scrollContent: {
    paddingBottom: 20,
  },

  scrollContentWithCart: {
    paddingBottom: 115,
  },

  // ===================================================
  // COVER
  // ===================================================

  coverContainer: {
    height: 195,
    position: "relative",
    backgroundColor: "#FCECEF",
    overflow: "visible",
    zIndex: 2,
  },

  coverBackground: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCECEF",
    overflow: "hidden",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(166,25,46,0.07)",
  },

  coverTopLabel: {
    position: "absolute",
    top: 15,
    right: 16,
    maxWidth: "65%",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.48)",
    flexDirection: "row",
    alignItems: "center",
  },

  coverTopLabelText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "800",
    color: WHITE,
  },

  storeLogo: {
    position: "absolute",
    left: 20,
    bottom: -30,
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  storeLogoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // ===================================================
  // STORE INFO
  // ===================================================

  storeInfo: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 21,
    backgroundColor: WHITE,
    zIndex: 1,
  },

  storeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  storeTitleArea: {
    flex: 1,
    paddingRight: 10,
  },

  storeName: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    color: TEXT,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    minHeight: 17,
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 11,
    color: CARDINAL,
    fontWeight: "800",
  },

  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteButtonActive: {
    backgroundColor: CARDINAL,
  },

  openStatusRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  openStatusBadge: {
    height: 25,
    paddingHorizontal: 9,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  openStatusBadgeOpen: {
    backgroundColor: SUCCESS_BG,
  },

  openStatusBadgeClosed: {
    backgroundColor: "#F4F4F4",
  },

  openStatusText: {
    fontSize: 9,
    fontWeight: "900",
  },

  openStatusTextOpen: {
    color: SUCCESS,
  },

  openStatusTextClosed: {
    color: MUTED,
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

  storeHours: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
  },

  storeDescription: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
  },

  // ===================================================
  // META
  // ===================================================

  metaRow: {
    marginTop: 19,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  metaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  metaIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  metaText: {
    fontSize: 10,
    fontWeight: "900",
    color: TEXT,
  },

  metaSubtext: {
    marginTop: 2,
    fontSize: 8,
    color: MUTED,
    fontWeight: "600",
  },

  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
    marginHorizontal: 6,
  },

  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 21,
  },

  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FFF8E7",
  },

  ratingValue: { marginLeft: 5, color: TEXT, fontSize: 13, fontWeight: "900" },
  ratingCount: { marginLeft: 3, color: MUTED, fontSize: 10, fontWeight: "700" },
  reviewCard: { marginBottom: 9, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewerName: { flex: 1, color: TEXT, fontSize: 12, fontWeight: "900", marginRight: 8 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { marginTop: 8, color: TEXT, fontSize: 12, lineHeight: 18 },
  reviewDate: { marginTop: 9, color: MUTED, fontSize: 9, fontWeight: "700" },
  noReviews: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, flexDirection: "row", alignItems: "center", gap: 11 },
  noReviewsTitle: { color: TEXT, fontSize: 12, fontWeight: "900" },
  noReviewsText: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 2 },

  // ===================================================
  // MENU
  // ===================================================

  categorySection: {
    paddingTop: 21,
    paddingBottom: 4,
  },

  menuHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  menuCount: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#FCECEF",
  },

  menuCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL,
  },

  categoryList: {
    paddingHorizontal: 20,
    paddingTop: 13,
  },

  categoryButton: {
    marginRight: 9,
    paddingHorizontal: 17,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  categoryTextActive: {
    color: WHITE,
  },

  // ===================================================
  // PRODUCTS
  // ===================================================

  productsSection: {
    marginTop: 20,
  },

  productsHeader: {
    paddingHorizontal: 20,
  },

  productGrid: {
    paddingHorizontal: 20,
    paddingTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  productCard: {
    width: "48%",
    marginBottom: 14,
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  productCardUnavailable: {
    opacity: 0.72,
  },

  productImageContainer: {
    height: 140,
    backgroundColor: "#FCECEF",
    position: "relative",
  },

  productPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCECEF",
  },

  imagePressed: {
    opacity: 0.82,
  },

  categoryBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: WHITE,
  },

  categoryBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: CARDINAL,
  },

  stockBadge: {
    position: "absolute",
    right: 9,
    bottom: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: SUCCESS_BG,
  },

  stockBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: SUCCESS,
  },

  stockBadgeOut: {
    position: "absolute",
    right: 9,
    bottom: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "#F4F4F4",
  },

  stockBadgeTextOut: {
    fontSize: 7,
    fontWeight: "900",
    color: MUTED,
  },

  unavailableOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.62)",
  },

  unavailableText: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#444444",
    color: WHITE,
    fontSize: 8,
    fontWeight: "900",
  },

  productInfo: {
    padding: 12,
  },

  productName: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: TEXT,
  },

  productCategory: {
    marginTop: 4,
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  productBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  productPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: CARDINAL,
  },

  inCartText: {
    marginTop: 2,
    fontSize: 8,
    color: CARDINAL,
    fontWeight: "800",
  },

  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonActive: {
    backgroundColor: CARDINAL_DARK,
  },

  addButtonDisabled: {
    backgroundColor: "#AAAAAA",
  },

  addButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingBox: {
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 35,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 9,
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  // ===================================================
  // EMPTY MENU
  // ===================================================

  emptyMenu: {
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },

  emptyMenuIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FCECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMenuTitle: {
    marginTop: 13,
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  emptyMenuText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: MUTED,
  },

  showAllButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: CARDINAL,
  },

  showAllButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: WHITE,
  },

  // ===================================================
  // CART BAR
  // ===================================================

  cartBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  cartBar: {
    minHeight: 64,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 17,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 7,
  },

  cartBarPressed: {
    opacity: 0.9,
  },

  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  cartBarIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cartBarBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: GOLD,
    borderWidth: 1,
    borderColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  cartBarBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  cartBarTitle: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "900",
    color: WHITE,
  },

  cartBarSubtitle: {
    marginLeft: 10,
    marginTop: 2,
    fontSize: 9,
    color:
      "rgba(255,255,255,0.75)",
  },

  cartBarRight: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  cartBarTotal: {
    marginRight: 4,
    fontSize: 14,
    fontWeight: "900",
    color: WHITE,
  },

  // ===================================================
  // INVALID STORE
  // ===================================================

  invalidStore: {
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
    maxWidth: 280,
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

  // ===================================================
  // GENERAL
  // ===================================================

  pressed: {
    opacity: 0.7,
  },

  bottomSpace: {
    height: 25,
  },
});

let styles = createStyles(LIGHT_COLORS);
