import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
const WHITE = "#FFFFFF";

// =====================================================
// STORAGE
// =====================================================

const CART_STORAGE_KEY = "@tupc_orderup_cart";

// =====================================================
// TYPES
// =====================================================

type Product = {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
};

type Store = {
  id: string;
  name: string;
  type: string;
  description: string;
  rating: string;
  reviewCount: string;
  time: string;
  location: string;
  coverImage: string;
  categories: string[];
  verified: boolean;
};

type CartItem = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

// =====================================================
// STORES
// =====================================================

const STORES: Store[] = [
  {
    id: "tupc-food-hub",
    name: "TUPC Food Hub",
    type: "Meals • Snacks",
    description:
      "Your campus go-to for affordable meals, snacks, and drinks.",
    rating: "4.8",
    reviewCount: "328",
    time: "10–15 min",
    location: "Main Campus",
    coverImage:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    categories: ["All", "Meals", "Snacks", "Drinks"],
    verified: true,
  },
  {
    id: "cardinal-cafe",
    name: "Cardinal Café",
    type: "Coffee • Drinks",
    description:
      "Fresh coffee, refreshing drinks, and quick campus favorites.",
    rating: "4.9",
    reviewCount: "214",
    time: "5–10 min",
    location: "Student Center",
    coverImage:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    categories: ["All", "Coffee", "Drinks", "Snacks"],
    verified: true,
  },
  {
    id: "campus-essentials",
    name: "Campus Essentials",
    type: "Supplies • Accessories",
    description:
      "School supplies, accessories, and everyday essentials for students.",
    rating: "4.7",
    reviewCount: "176",
    time: "10–20 min",
    location: "Academic Building",
    coverImage:
      "https://images.unsplash.com/photo-1455885666463-6f7cbd7f0f55?auto=format&fit=crop&w=1200&q=80",
    categories: ["All", "School", "Essentials", "Accessories"],
    verified: true,
  },
];

// =====================================================
// PRODUCTS
// =====================================================

const PRODUCTS: Product[] = [
  {
    id: "food-1",
    storeId: "tupc-food-hub",
    name: "Chicken Rice Meal",
    category: "Meals",
    price: 89,
    rating: 4.8,
    description:
      "Tender chicken served with steamed rice and a simple savory sauce.",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "food-2",
    storeId: "tupc-food-hub",
    name: "Beef Tapa Meal",
    category: "Meals",
    price: 99,
    rating: 4.7,
    description:
      "Classic sweet-savory beef tapa served with rice.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "food-3",
    storeId: "tupc-food-hub",
    name: "Iced Coffee",
    category: "Drinks",
    price: 65,
    rating: 4.9,
    description:
      "Cold and refreshing coffee perfect for a campus break.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "food-4",
    storeId: "tupc-food-hub",
    name: "Cheese Burger",
    category: "Snacks",
    price: 85,
    rating: 4.6,
    description:
      "Juicy burger with melted cheese in a soft bun.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "food-5",
    storeId: "tupc-food-hub",
    name: "French Fries",
    category: "Snacks",
    price: 55,
    rating: 4.7,
    description:
      "Crispy golden fries with a lightly salted finish.",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "food-6",
    storeId: "tupc-food-hub",
    name: "Bottled Water",
    category: "Drinks",
    price: 25,
    rating: 4.5,
    description:
      "Cold bottled drinking water.",
    image:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=700&q=80",
  },

  // ===================================================
  // CARDINAL CAFE
  // ===================================================

  {
    id: "cafe-1",
    storeId: "cardinal-cafe",
    name: "Iced Latte",
    category: "Coffee",
    price: 75,
    rating: 4.9,
    description:
      "Smooth espresso blended with chilled milk.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "cafe-2",
    storeId: "cardinal-cafe",
    name: "Caramel Macchiato",
    category: "Coffee",
    price: 95,
    rating: 4.8,
    description:
      "Creamy coffee with caramel sweetness.",
    image:
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "cafe-3",
    storeId: "cardinal-cafe",
    name: "Chocolate Frappe",
    category: "Drinks",
    price: 89,
    rating: 4.8,
    description:
      "Rich chocolate blended into a cold creamy frappe.",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "cafe-4",
    storeId: "cardinal-cafe",
    name: "Blueberry Muffin",
    category: "Snacks",
    price: 55,
    rating: 4.6,
    description:
      "Soft muffin filled with sweet blueberry flavor.",
    image:
      "https://images.unsplash.com/photo-1558303056-8849c2d8b0d0?auto=format&fit=crop&w=700&q=80",
  },

  // ===================================================
  // CAMPUS ESSENTIALS
  // ===================================================

  {
    id: "ess-1",
    storeId: "campus-essentials",
    name: "Ballpen Set",
    category: "School",
    price: 45,
    rating: 4.8,
    description:
      "Reliable everyday ballpens for classes and note-taking.",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "ess-2",
    storeId: "campus-essentials",
    name: "Notebook",
    category: "School",
    price: 65,
    rating: 4.7,
    description:
      "Durable notebook for lectures, notes, and school work.",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "ess-3",
    storeId: "campus-essentials",
    name: "USB Flash Drive",
    category: "Accessories",
    price: 299,
    rating: 4.6,
    description:
      "Compact storage for school files and projects.",
    image:
      "https://images.unsplash.com/photo-1618410320927-95f3f0c3d7c8?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "ess-4",
    storeId: "campus-essentials",
    name: "Phone Charging Cable",
    category: "Essentials",
    price: 149,
    rating: 4.7,
    description:
      "Convenient charging cable for everyday campus use.",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
  },
];

// =====================================================
// SCREEN
// =====================================================

export default function StoreDetails() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const storeId =
    typeof params.id === "string"
      ? params.id
      : "tupc-food-hub";

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [favorite, setFavorite] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(
    []
  );

  const [addingProductId, setAddingProductId] =
    useState<string | null>(null);

  const [loadingCart, setLoadingCart] = useState(true);

  // ===================================================
  // FIND STORE
  // ===================================================

  const store = useMemo(() => {
    return STORES.find((item) => item.id === storeId);
  }, [storeId]);

  // ===================================================
  // STORE PRODUCTS
  // ===================================================

  const storeProducts = useMemo(() => {
    return PRODUCTS.filter(
      (product) => product.storeId === storeId
    );
  }, [storeId]);

  // ===================================================
  // FILTERED PRODUCTS
  // ===================================================

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return storeProducts;
    }

    return storeProducts.filter(
      (product) =>
        product.category === selectedCategory
    );
  }, [selectedCategory, storeProducts]);

  // ===================================================
  // LOAD CART
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      try {
        const savedCart =
          await AsyncStorage.getItem(
            CART_STORAGE_KEY
          );

        if (!mounted) return;

        if (savedCart) {
          const parsed: CartItem[] =
            JSON.parse(savedCart);

          setCartItems(
            Array.isArray(parsed) ? parsed : []
          );
        }
      } catch (error) {
        console.log("Failed to load cart:", error);
      } finally {
        if (mounted) {
          setLoadingCart(false);
        }
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // SAVE CART
  // ===================================================

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.log("Failed to save cart:", error);
    }
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart = async (product: Product) => {
    if (!store) return;

    try {
      setAddingProductId(product.id);

      const existingItem = cartItems.find(
        (item) => item.id === product.id
      );

      let updatedCart: CartItem[];

      if (existingItem) {
        updatedCart = cartItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          storeId: product.storeId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        };

        updatedCart = [
          ...cartItems,
          newItem,
        ];
      }

      setCartItems(updatedCart);

      await saveCart(updatedCart);
    } catch (error) {
      console.log("Failed to add to cart:", error);
    } finally {
      setTimeout(() => {
        setAddingProductId(null);
      }, 250);
    }
  };

  // ===================================================
  // CART TOTAL
  // ===================================================

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  // ===================================================
  // OPEN PRODUCT
  // ===================================================

  const openProduct = (productId: string) => {
    router.push({
      pathname: "/product/[id]",
      params: {
        id: productId,
      },
    });
  };

  // ===================================================
  // INVALID STORE
  // ===================================================

  if (!store) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right"]}
      >
        <View style={styles.invalidStore}>
          <View style={styles.invalidIcon}>
            <Ionicons
              name="storefront-outline"
              size={34}
              color={CARDINAL}
            />
          </View>

          <Text style={styles.invalidTitle}>
            Store not found
          </Text>

          <Text style={styles.invalidSubtitle}>
            This campus store may no longer be
            available.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={TEXT}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {store.name}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/cart")}
          >
            <Ionicons
              name="bag-outline"
              size={22}
              color={TEXT}
            />

            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            cartCount > 0 &&
              styles.scrollContentWithCart,
          ]}
        >
          {/* =================================================
              COVER
          ================================================= */}

          <View style={styles.coverContainer}>
            <Image
              source={{
                uri: store.coverImage,
              }}
              style={styles.coverImage}
            />

            <View style={styles.coverOverlay} />

            <View style={styles.coverTopLabel}>
              <Ionicons
                name="location-outline"
                size={13}
                color="#FFFFFF"
              />

              <Text style={styles.coverTopLabelText}>
                {store.location}
              </Text>
            </View>

            <View style={styles.storeLogo}>
              <Ionicons
                name="storefront"
                size={31}
                color={CARDINAL}
              />
            </View>
          </View>

          {/* =================================================
              STORE INFO
          ================================================= */}

          <View style={styles.storeInfo}>
            <View style={styles.storeTitleRow}>
              <View style={styles.storeTitleArea}>
                <View style={styles.storeNameRow}>
                  <Text
                    style={styles.storeName}
                    numberOfLines={2}
                  >
                    {store.name}
                  </Text>
                </View>

                <View style={styles.verifiedRow}>
                  {store.verified && (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={CARDINAL}
                      />

                      <Text
                        style={styles.verifiedText}
                      >
                        Verified Campus Store
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.favoriteButton,
                  favorite &&
                    styles.favoriteButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setFavorite(
                    (current) => !current
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
                    favorite ? "#FFFFFF" : CARDINAL
                  }
                />
              </Pressable>
            </View>

            <Text style={styles.storeType}>
              {store.type}
            </Text>

            <Text style={styles.storeDescription}>
              {store.description}
            </Text>

            {/* META */}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <View style={styles.metaIcon}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={GOLD}
                  />
                </View>

                <View>
                  <Text style={styles.metaText}>
                    {store.rating}
                  </Text>

                  <Text style={styles.metaSubtext}>
                    {store.reviewCount} reviews
                  </Text>
                </View>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <View style={styles.metaIcon}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={CARDINAL}
                  />
                </View>

                <View>
                  <Text style={styles.metaText}>
                    Open
                  </Text>

                  <Text style={styles.metaSubtext}>
                    {store.time}
                  </Text>
                </View>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <View style={styles.metaIcon}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={CARDINAL}
                  />
                </View>

                <View>
                  <Text style={styles.metaText}>
                    Campus
                  </Text>

                  <Text style={styles.metaSubtext}>
                    {store.location}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =================================================
              MENU
          ================================================= */}

          <View style={styles.categorySection}>
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Menu
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Choose something you like
                </Text>
              </View>

              <View style={styles.menuCount}>
                <Text style={styles.menuCountText}>
                  {storeProducts.length} items
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.categoryList
              }
            >
              {store.categories.map((category) => {
                const active =
                  selectedCategory === category;

                return (
                  <Pressable
                    key={category}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      active &&
                        styles.categoryButtonActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      setSelectedCategory(category)
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
              })}
            </ScrollView>
          </View>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <View style={styles.productsSection}>
            <View style={styles.productsHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === "All"
                    ? "Popular Items"
                    : selectedCategory}
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "item"
                    : "items"}{" "}
                  available
                </Text>
              </View>
            </View>

            {loadingCart ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator
                  size="small"
                  color={CARDINAL}
                />

                <Text style={styles.loadingText}>
                  Loading cart...
                </Text>
              </View>
            ) : filteredProducts.length > 0 ? (
              <View style={styles.productGrid}>
                {filteredProducts.map((product) => {
                  const cartItem = cartItems.find(
                    (item) =>
                      item.id === product.id
                  );

                  const quantity =
                    cartItem?.quantity ?? 0;

                  const isAdding =
                    addingProductId === product.id;

                  return (
                    <View
                      key={product.id}
                      style={styles.productCard}
                    >
                      {/* IMAGE */}

                      <Pressable
                        onPress={() =>
                          openProduct(product.id)
                        }
                        style={({ pressed }) => [
                          styles.productImageContainer,
                          pressed &&
                            styles.imagePressed,
                        ]}
                      >
                        <Image
                          source={{
                            uri: product.image,
                          }}
                          style={styles.productImage}
                        />

                        <View
                          style={styles.imageOverlay}
                        />

                        <View
                          style={styles.ratingBadge}
                        >
                          <Ionicons
                            name="star"
                            size={11}
                            color={GOLD}
                          />

                          <Text
                            style={
                              styles.ratingBadgeText
                            }
                          >
                            {product.rating}
                          </Text>
                        </View>
                      </Pressable>

                      {/* PRODUCT INFO */}

                      <View style={styles.productInfo}>
                        <Pressable
                          onPress={() =>
                            openProduct(
                              product.id
                            )
                          }
                        >
                          <Text
                            style={styles.productName}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>

                          <Text
                            style={
                              styles.productCategory
                            }
                          >
                            {product.category}
                          </Text>
                        </Pressable>

                        <View
                          style={styles.productBottom}
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

                            {quantity > 0 && (
                              <Text
                                style={
                                  styles.inCartText
                                }
                              >
                                {quantity} in cart
                              </Text>
                            )}
                          </View>

                          <Pressable
                            disabled={isAdding}
                            onPress={() =>
                              addToCart(product)
                            }
                            style={({ pressed }) => [
                              styles.addButton,
                              quantity > 0 &&
                                styles.addButtonActive,
                              pressed &&
                                styles.addButtonPressed,
                            ]}
                          >
                            {isAdding ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Ionicons
                                name={
                                  quantity > 0
                                    ? "checkmark"
                                    : "add"
                                }
                                size={19}
                                color="#FFFFFF"
                              />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyMenu}>
                <View style={styles.emptyMenuIcon}>
                  <Ionicons
                    name="restaurant-outline"
                    size={30}
                    color={CARDINAL}
                  />
                </View>

                <Text style={styles.emptyMenuTitle}>
                  No items available
                </Text>

                <Text style={styles.emptyMenuText}>
                  There are no products in this
                  category right now.
                </Text>

                <Pressable
                  onPress={() =>
                    setSelectedCategory("All")
                  }
                  style={({ pressed }) => [
                    styles.showAllButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={styles.showAllButtonText}
                  >
                    Show All Items
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* =================================================
            CART BAR
        ================================================= */}

        {cartCount > 0 && (
          <View style={styles.cartBarContainer}>
            <Pressable
              onPress={() => router.push("/cart")}
              style={({ pressed }) => [
                styles.cartBar,
                pressed && styles.cartBarPressed,
              ]}
            >
              <View style={styles.cartBarLeft}>
                <View style={styles.cartBarIcon}>
                  <Ionicons
                    name="bag-handle"
                    size={20}
                    color="#FFFFFF"
                  />

                  <View style={styles.cartBarBadge}>
                    <Text
                      style={styles.cartBarBadgeText}
                    >
                      {cartCount > 99
                        ? "99+"
                        : cartCount}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.cartBarTitle}>
                    View Cart
                  </Text>

                  <Text style={styles.cartBarSubtitle}>
                    {cartCount}{" "}
                    {cartCount === 1
                      ? "item"
                      : "items"}{" "}
                    from {store.name}
                  </Text>
                </View>
              </View>

              <View style={styles.cartBarRight}>
                <Text style={styles.cartBarTotal}>
                  ₱{cartTotal.toFixed(2)}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#FFFFFF"
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
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
    backgroundColor: "#DDDDDD",
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
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  coverTopLabel: {
    position: "absolute",
    top: 15,
    right: 16,
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
  },

  // ===================================================
  // STORE INFO
  // ===================================================

  storeInfo: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 21,
    backgroundColor: WHITE,
  },

  storeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  storeTitleArea: {
    flex: 1,
    paddingRight: 10,
  },

  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
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

  storeType: {
    marginTop: 8,
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
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
    fontSize: 11,
    fontWeight: "900",
    color: TEXT,
  },

  metaSubtext: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
    marginHorizontal: 8,
  },

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

  productImageContainer: {
    height: 140,
    backgroundColor: "#EEEEEE",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  imagePressed: {
    opacity: 0.82,
  },

  ratingBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
  },

  ratingBadgeText: {
    marginLeft: 3,
    fontSize: 10,
    fontWeight: "800",
    color: TEXT,
  },

  productInfo: {
    padding: 12,
  },

  productName: {
    fontSize: 13,
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

  addButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
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
    backgroundColor: "rgba(247,247,248,0.96)",
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
    backgroundColor: "rgba(255,255,255,0.16)",
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
    color: "rgba(255,255,255,0.75)",
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

