import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCart } from "../../../../context/CartContext";

// =====================================================
// TUP CARDINAL THEME
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const SUCCESS = "#238636";
const WHITE = "#FFFFFF";

// =====================================================
// TYPES
// =====================================================

type Product = {
  id: string;
  name: string;
  price: number;
  storeId: string;
  store: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  available: boolean;
};

// =====================================================
// PRODUCT DATA
// =====================================================

const PRODUCTS: Product[] = [
  // ===================================================
  // TUPC FOOD HUB
  // ===================================================

  {
    id: "food-1",
    name: "Chicken Rice Meal",
    price: 89,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Meals",
    rating: 4.8,
    reviews: 124,
    description:
      "A delicious and filling chicken rice meal prepared fresh for TUPC students and staff. Perfect for a quick and satisfying campus lunch.",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "food-2",
    name: "Beef Tapa Meal",
    price: 99,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Meals",
    rating: 4.7,
    reviews: 98,
    description:
      "Tender and flavorful beef tapa served with steamed rice. A hearty campus favorite prepared fresh for every order.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "food-3",
    name: "Iced Coffee",
    price: 65,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Drinks",
    rating: 4.9,
    reviews: 156,
    description:
      "Refreshing iced coffee with a smooth coffee flavor. A perfect pick-me-up for long classes and study sessions.",
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "food-4",
    name: "Cheese Burger",
    price: 85,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Burgers",
    rating: 4.8,
    reviews: 87,
    description:
      "Juicy burger patty with melted cheese and fresh toppings served in a soft toasted bun.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "food-5",
    name: "French Fries",
    price: 55,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Snacks",
    rating: 4.6,
    reviews: 73,
    description:
      "Crispy golden french fries that make the perfect snack or side for your campus meal.",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "food-6",
    name: "Bottled Water",
    price: 25,
    storeId: "tupc-food-hub",
    store: "TUPC Food Hub",
    category: "Drinks",
    rating: 4.8,
    reviews: 64,
    description:
      "Chilled bottled drinking water, convenient for classes, activities, and everyday campus use.",
    image:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  // ===================================================
  // CARDINAL CAFÉ
  // ===================================================

  {
    id: "cafe-1",
    name: "Iced Latte",
    price: 75,
    storeId: "cardinal-cafe",
    store: "Cardinal Café",
    category: "Coffee",
    rating: 4.9,
    reviews: 142,
    description:
      "Smooth espresso blended with chilled milk and served over ice. A classic coffee choice for students and staff.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "cafe-2",
    name: "Caramel Macchiato",
    price: 95,
    storeId: "cardinal-cafe",
    store: "Cardinal Café",
    category: "Coffee",
    rating: 4.9,
    reviews: 118,
    description:
      "Rich espresso, creamy milk, and sweet caramel flavors combined into a smooth and refreshing coffee drink.",
    image:
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "cafe-3",
    name: "Chocolate Frappe",
    price: 89,
    storeId: "cardinal-cafe",
    store: "Cardinal Café",
    category: "Frappe",
    rating: 4.8,
    reviews: 103,
    description:
      "Creamy blended chocolate frappe topped with a rich chocolate flavor. Great for a refreshing study break.",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "cafe-4",
    name: "Blueberry Muffin",
    price: 55,
    storeId: "cardinal-cafe",
    store: "Cardinal Café",
    category: "Pastries",
    rating: 4.7,
    reviews: 76,
    description:
      "Soft and freshly baked muffin filled with sweet blueberries. A convenient snack for your next class.",
    image:
      "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  // ===================================================
  // CAMPUS ESSENTIALS
  // ===================================================

  {
    id: "ess-1",
    name: "Ballpen Set",
    price: 45,
    storeId: "campus-essentials",
    store: "Campus Essentials",
    category: "School",
    rating: 4.7,
    reviews: 54,
    description:
      "A practical set of smooth-writing ballpens for note-taking, assignments, examinations, and everyday school work.",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "ess-2",
    name: "Notebook",
    price: 65,
    storeId: "campus-essentials",
    store: "Campus Essentials",
    category: "School",
    rating: 4.8,
    reviews: 61,
    description:
      "Clean and durable notebook designed for lectures, notes, projects, and everyday academic use.",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "ess-3",
    name: "USB Flash Drive",
    price: 299,
    storeId: "campus-essentials",
    store: "Campus Essentials",
    category: "Accessories",
    rating: 4.7,
    reviews: 43,
    description:
      "Portable USB flash drive for storing school documents, presentations, projects, and other important files.",
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },

  {
    id: "ess-4",
    name: "Phone Charging Cable",
    price: 149,
    storeId: "campus-essentials",
    store: "Campus Essentials",
    category: "Accessories",
    rating: 4.6,
    reviews: 39,
    description:
      "Convenient charging cable designed for everyday use. A useful campus essential when your device needs power.",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85",
    available: true,
  },
];

// =====================================================
// COMPONENT
// =====================================================

export default function ProductDetails() {
  const { addToCart } = useCart();

  const { id } = useLocalSearchParams<{
    id?: string;
  }>();

  const insets = useSafeAreaInsets();

  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);

  // ===================================================
  // FIND PRODUCT
  // ===================================================

  const product = useMemo(() => {
    const productId = Array.isArray(id) ? id[0] : id;

    return (
      PRODUCTS.find((item) => item.id === productId) ??
      PRODUCTS[0]
    );
  }, [id]);

  // ===================================================
  // TOTAL
  // ===================================================

  const total = product.price * quantity;

  // ===================================================
  // QUANTITY
  // ===================================================

  const increaseQuantity = () => {
    if (quantity < 20) {
      setQuantity((current) => current + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((current) => current - 1);
    }
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const handleAddToCart = () => {
    if (!product.available) {
      Alert.alert(
        "Product Unavailable",
        "This product is currently unavailable."
      );
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        store: product.store,
        image: product.image,
      },
      quantity
    );

    Alert.alert(
      "Added to Cart",
      `${quantity} × ${product.name} has been added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () => router.push("/cart"),
        },
      ]
    );
  };

  // ===================================================
  // VIEW STORE
  // ===================================================

  const handleViewStore = () => {
    router.push(`/store/${product.storeId}`);
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={WHITE}
        translucent={false}
      />

      {/* =================================================
          ROOT SAFE AREA
      ================================================= */}

      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.container}>
          {/* =================================================
              FIXED HEADER
          ================================================= */}

          <View
            style={[
              styles.header,
              {
                height: 62,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={25}
                color={TEXT}
              />
            </Pressable>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              Product Details
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                setFavorite((current) => !current)
              }
              hitSlop={8}
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

          {/* =================================================
              SCROLLABLE CONTENT
              IMPORTANT:
              HEADER IS OUTSIDE THIS SCROLLVIEW
          ================================================= */}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  30 + insets.bottom,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* =================================================
                PRODUCT IMAGE
            ================================================= */}

            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: product.image,
                }}
                style={styles.productImage}
                resizeMode="cover"
              />

              <View
                style={styles.imageOverlay}
              />

              <View
                style={styles.categoryBadge}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={13}
                  color={WHITE}
                />

                <Text
                  style={
                    styles.categoryBadgeText
                  }
                >
                  {product.category}
                </Text>
              </View>

              {product.available && (
                <View
                  style={styles.availableBadge}
                >
                  <View
                    style={styles.availableDot}
                  />

                  <Text
                    style={
                      styles.availableBadgeText
                    }
                  >
                    Available
                  </Text>
                </View>
              )}
            </View>

            {/* =================================================
                CONTENT
            ================================================= */}

            <View style={styles.content}>
              {/* =================================================
                  TITLE
              ================================================= */}

              <View style={styles.titleRow}>
                <View style={styles.titleArea}>
                  <Text
                    style={styles.productName}
                  >
                    {product.name}
                  </Text>

                  <Pressable
                    onPress={handleViewStore}
                    style={styles.storeButton}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={15}
                      color={CARDINAL}
                    />

                    <Text
                      style={styles.storeName}
                    >
                      {product.store}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={CARDINAL}
                    />
                  </Pressable>
                </View>

                <View
                  style={styles.priceContainer}
                >
                  <Text
                    style={styles.priceLabel}
                  >
                    Price
                  </Text>

                  <Text
                    style={styles.price}
                  >
                    ₱{product.price}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  RATING
              ================================================= */}

              <View style={styles.ratingRow}>
                <View style={styles.ratingBox}>
                  <Ionicons
                    name="star"
                    size={15}
                    color={GOLD}
                  />

                  <Text
                    style={styles.ratingText}
                  >
                    {product.rating.toFixed(1)}
                  </Text>
                </View>

                <Text
                  style={styles.reviewText}
                >
                  {product.reviews} reviews
                </Text>

                <View style={styles.dot} />

                <View
                  style={
                    styles.availableStatus
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={SUCCESS}
                  />

                  <Text
                    style={
                      styles.availableText
                    }
                  >
                    Available
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <Text
                style={styles.sectionTitle}
              >
                Description
              </Text>

              <Text
                style={styles.description}
              >
                {product.description}
              </Text>

              {/* =================================================
                  STORE INFORMATION
              ================================================= */}

              <Pressable
                style={({ pressed }) => [
                  styles.storeCard,
                  pressed &&
                    styles.cardPressed,
                ]}
                onPress={handleViewStore}
              >
                <View style={styles.storeIcon}>
                  <Ionicons
                    name="storefront"
                    size={21}
                    color={CARDINAL}
                  />
                </View>

                <View
                  style={styles.storeInfo}
                >
                  <Text
                    style={
                      styles.storeCardLabel
                    }
                  >
                    Sold by
                  </Text>

                  <Text
                    style={
                      styles.storeCardName
                    }
                  >
                    {product.store}
                  </Text>

                  <Text
                    style={
                      styles.storeCardHint
                    }
                  >
                    View store and other
                    products
                  </Text>
                </View>

                <View
                  style={styles.storeArrow}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={MUTED}
                  />
                </View>
              </Pressable>

              {/* =================================================
                  PREPARATION INFO
              ================================================= */}

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="restaurant-outline"
                    size={21}
                    color={CARDINAL}
                  />
                </View>

                <View
                  style={styles.infoTextArea}
                >
                  <Text
                    style={styles.infoTitle}
                  >
                    Freshly prepared
                  </Text>

                  <Text
                    style={styles.infoText}
                  >
                    Your order will be prepared
                    by the selected campus
                    store.
                  </Text>
                </View>
              </View>

              {/* =================================================
                  PICKUP INFO
              ================================================= */}

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="location-outline"
                    size={21}
                    color={CARDINAL}
                  />
                </View>

                <View
                  style={styles.infoTextArea}
                >
                  <Text
                    style={styles.infoTitle}
                  >
                    Campus pickup
                  </Text>

                  <Text
                    style={styles.infoText}
                  >
                    Pick up your order at the
                    selected campus pickup
                    location during checkout.
                  </Text>
                </View>
              </View>

              {/* =================================================
                  QUANTITY
              ================================================= */}

              <View
                style={styles.quantitySection}
              >
                <View
                  style={styles.quantityTextArea}
                >
                  <Text
                    style={styles.sectionTitle}
                  >
                    Quantity
                  </Text>

                  <Text
                    style={styles.quantityHint}
                  >
                    Maximum of 20 items
                  </Text>
                </View>

                <View
                  style={styles.quantityControl}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.quantityButton,
                      pressed &&
                        styles.quantityPressed,
                    ]}
                    onPress={
                      decreaseQuantity
                    }
                    disabled={quantity <= 1}
                  >
                    <Ionicons
                      name="remove"
                      size={19}
                      color={
                        quantity <= 1
                          ? "#BDBDBD"
                          : TEXT
                      }
                    />
                  </Pressable>

                  <View
                    style={
                      styles.quantityNumberBox
                    }
                  >
                    <Text
                      style={
                        styles.quantityText
                      }
                    >
                      {quantity}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.quantityButton,
                      pressed &&
                        styles.quantityPressed,
                    ]}
                    onPress={
                      increaseQuantity
                    }
                    disabled={quantity >= 20}
                  >
                    <Ionicons
                      name="add"
                      size={19}
                      color={
                        quantity >= 20
                          ? "#BDBDBD"
                          : TEXT
                      }
                    />
                  </Pressable>
                </View>
              </View>

              {/* =================================================
                  ORDER SUMMARY
              ================================================= */}

              <View
                style={styles.summaryCard}
              >
                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Order total
                  </Text>

                  <Text
                    style={
                      styles.summarySubtext
                    }
                  >
                    {quantity} item
                    {quantity !== 1
                      ? "s"
                      : ""}
                  </Text>
                </View>

                <Text
                  style={styles.summaryTotal}
                >
                  ₱{total}
                </Text>
              </View>

              {/* EXTRA SPACE FOR FIXED BUTTON */}
              <View
                style={{
                  height: 90,
                }}
              />
            </View>
          </ScrollView>

          {/* =================================================
              FIXED BOTTOM ACTION
          ================================================= */}

          <View
            style={[
              styles.bottomAction,
              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    Platform.OS === "ios"
                      ? 12
                      : 10
                  ),
              },
            ]}
          >
            <View style={styles.totalArea}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text
                style={styles.totalPrice}
              >
                ₱{total}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                !product.available &&
                  styles.disabledButton,
                pressed &&
                  product.available &&
                  styles.buttonPressed,
              ]}
              onPress={handleAddToCart}
              disabled={!product.available}
            >
              <Ionicons
                name={
                  product.available
                    ? "bag-add-outline"
                    : "close-circle-outline"
                }
                size={21}
                color={WHITE}
              />

              <Text
                style={styles.addButtonText}
              >
                {product.available
                  ? "Add to Cart"
                  : "Unavailable"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // ROOT
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    width: "100%",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: WHITE,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,

    zIndex: 100,
    elevation: 8,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F5F5F6",
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: 12,

    textAlign: "center",

    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  // ===================================================
  // SCROLL
  // ===================================================

  scrollView: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // ===================================================
  // IMAGE
  // ===================================================

  imageContainer: {
    width: "100%",
    height: 300,

    backgroundColor: "#E8E8E8",

    position: "relative",
    overflow: "hidden",
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

    height: 100,

    backgroundColor:
      "rgba(0,0,0,0.12)",
  },

  categoryBadge: {
    position: "absolute",

    left: 18,
    bottom: 18,

    backgroundColor: CARDINAL,

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 20,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  categoryBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },

  availableBadge: {
    position: "absolute",

    right: 18,
    bottom: 18,

    backgroundColor: WHITE,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 20,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  availableDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: SUCCESS,
  },

  availableBadgeText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    paddingHorizontal: 18,
    paddingTop: 21,
  },

  titleRow: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    gap: 12,
  },

  titleArea: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    fontSize: 25,
    lineHeight: 31,

    fontWeight: "900",

    color: TEXT,
  },

  storeButton: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "center",

    alignSelf: "flex-start",

    gap: 5,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "800",
    color: CARDINAL,
  },

  priceContainer: {
    alignItems: "flex-end",
    paddingTop: 2,
  },

  priceLabel: {
    fontSize: 10,

    color: MUTED,
    fontWeight: "700",

    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  price: {
    marginTop: 2,

    fontSize: 23,

    fontWeight: "900",

    color: CARDINAL,
  },

  // ===================================================
  // RATING
  // ===================================================

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 15,
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: "#FFF8E8",

    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 8,
  },

  ratingText: {
    fontSize: 13,

    fontWeight: "800",

    color: TEXT,
  },

  reviewText: {
    marginLeft: 9,

    fontSize: 13,

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

  availableStatus: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  availableText: {
    fontSize: 13,

    color: SUCCESS,
    fontWeight: "700",
  },

  divider: {
    height: 1,

    backgroundColor: BORDER,

    marginVertical: 22,
  },

  // ===================================================
  // DESCRIPTION
  // ===================================================

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

  // ===================================================
  // STORE CARD
  // ===================================================

  storeCard: {
    marginTop: 20,

    padding: 14,

    borderRadius: 15,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: "row",
    alignItems: "center",
  },

  storeIcon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FBECEF",
  },

  storeInfo: {
    flex: 1,

    marginLeft: 12,
  },

  storeCardLabel: {
    fontSize: 11,

    color: MUTED,

    fontWeight: "700",
  },

  storeCardName: {
    marginTop: 2,

    fontSize: 14,

    color: TEXT,

    fontWeight: "900",
  },

  storeCardHint: {
    marginTop: 2,

    fontSize: 11,

    color: MUTED,
  },

  storeArrow: {
    marginLeft: 8,
  },

  // ===================================================
  // INFO CARDS
  // ===================================================

  infoCard: {
    marginTop: 12,

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

  // ===================================================
  // QUANTITY
  // ===================================================

  quantitySection: {
    marginTop: 24,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  quantityTextArea: {
    flex: 1,
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

  quantityNumberBox: {
    minWidth: 38,

    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    fontSize: 16,

    fontWeight: "900",

    color: TEXT,
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    marginTop: 24,

    padding: 16,

    borderRadius: 15,

    backgroundColor: "#FFF7F8",

    borderWidth: 1,
    borderColor: "#F0D9DE",

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  summaryLabel: {
    fontSize: 14,

    fontWeight: "900",

    color: TEXT,
  },

  summarySubtext: {
    marginTop: 3,

    fontSize: 12,

    color: MUTED,
  },

  summaryTotal: {
    fontSize: 20,

    fontWeight: "900",

    color: CARDINAL,
  },

  // ===================================================
  // BOTTOM ACTION
  // ===================================================

  bottomAction: {
    width: "100%",

    paddingHorizontal: 18,
    paddingTop: 12,

    backgroundColor: WHITE,

    borderTopWidth: 1,
    borderTopColor: BORDER,

    flexDirection: "row",

    alignItems: "center",

    gap: 14,

    zIndex: 200,
    elevation: 12,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: -2,
    },

    shadowOpacity: 0.08,
    shadowRadius: 6,
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

  disabledButton: {
    backgroundColor: "#A9A9A9",
  },

  addButtonText: {
    color: WHITE,

    fontSize: 14,

    fontWeight: "900",
  },

  // ===================================================
  // PRESS STATES
  // ===================================================

  pressed: {
    opacity: 0.75,
  },

  buttonPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  cardPressed: {
    opacity: 0.75,
  },

  quantityPressed: {
    backgroundColor: "#F5F5F6",
  },
});

