import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

const PRODUCTS = [
  {
    id: "1",
    name: "Chicken Rice Meal",
    category: "Meals",
    price: 89,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "2",
    name: "Beef Tapa Meal",
    category: "Meals",
    price: 99,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "3",
    name: "Iced Coffee",
    category: "Drinks",
    price: 65,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "4",
    name: "Cheese Burger",
    category: "Snacks",
    price: 85,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "5",
    name: "French Fries",
    category: "Snacks",
    price: 55,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "6",
    name: "Bottled Water",
    category: "Drinks",
    price: 25,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=700&q=80",
  },
];

const CATEGORIES = ["All", "Meals", "Snacks", "Drinks"];

export default function StoreDetails() {
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [favorite, setFavorite] = useState(false);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return PRODUCTS;
    }

    return PRODUCTS.filter(
      (product) => product.category === selectedCategory
    );
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={25}
              color={TEXT}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Store
          </Text>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.push("/(client)/cart")}
          >
            <Ionicons
              name="bag-outline"
              size={23}
              color={TEXT}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* COVER */}
          <View style={styles.coverContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
              }}
              style={styles.coverImage}
            />

            <View style={styles.coverOverlay} />

            <View style={styles.storeLogo}>
              <Ionicons
                name="storefront"
                size={30}
                color={CARDINAL}
              />
            </View>
          </View>

          {/* STORE INFORMATION */}
          <View style={styles.storeInfo}>
            <View style={styles.storeTitleRow}>
              <View style={styles.storeTitleArea}>
                <Text style={styles.storeName}>
                  TUPC Main Canteen
                </Text>

                <View style={styles.verifiedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={CARDINAL}
                  />

                  <Text style={styles.verifiedText}>
                    Verified Campus Store
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.favoriteButton}
                onPress={() =>
                  setFavorite((current) => !current)
                }
              >
                <Ionicons
                  name={
                    favorite
                      ? "heart"
                      : "heart-outline"
                  }
                  size={23}
                  color={
                    favorite ? CARDINAL : TEXT
                  }
                />
              </Pressable>
            </View>

            <Text style={styles.storeDescription}>
              Your campus go-to for affordable meals,
              snacks, and drinks.
            </Text>

            {/* META */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="star"
                  size={16}
                  color={GOLD}
                />

                <Text style={styles.metaText}>
                  4.8
                </Text>

                <Text style={styles.metaMuted}>
                  (328)
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={MUTED}
                />

                <Text style={styles.metaText}>
                  Open
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color={MUTED}
                />

                <Text style={styles.metaText}>
                  Main Campus
                </Text>
              </View>
            </View>
          </View>

          {/* CATEGORIES */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>
              Menu
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.categoryList
              }
            >
              {CATEGORIES.map((category) => {
                const active =
                  selectedCategory === category;

                return (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryButton,
                      active &&
                        styles.categoryButtonActive,
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

          {/* PRODUCTS */}
          <View style={styles.productsSection}>
            <View style={styles.productsHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === "All"
                  ? "Popular Items"
                  : selectedCategory}
              </Text>

              <Text style={styles.itemCount}>
                {filteredProducts.length} items
              </Text>
            </View>

            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productCard,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname:
                        "/(client)/(client-details)/product/[id]",
                      params: {
                        id: product.id,
                      },
                    })
                  }
                >
                  <View
                    style={
                      styles.productImageContainer
                    }
                  >
                    <Image
                      source={{
                        uri: product.image,
                      }}
                      style={styles.productImage}
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
                  </View>

                  <View style={styles.productInfo}>
                    <Text
                      style={styles.productName}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>

                    <Text
                      style={styles.productCategory}
                    >
                      {product.category}
                    </Text>

                    <View
                      style={styles.productBottom}
                    >
                      <Text
                        style={styles.productPrice}
                      >
                        ₱{product.price}
                      </Text>

                      <View style={styles.addIcon}>
                        <Ionicons
                          name="add"
                          size={19}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
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
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  coverContainer: {
    height: 185,
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
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  storeLogo: {
    position: "absolute",
    left: 20,
    bottom: -30,
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  storeInfo: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },

  storeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  storeTitleArea: {
    flex: 1,
  },

  storeName: {
    fontSize: 23,
    fontWeight: "900",
    color: TEXT,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 12,
    color: CARDINAL,
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

  storeDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
  },

  metaRow: {
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  metaMuted: {
    marginLeft: 3,
    fontSize: 12,
    color: MUTED,
  },

  metaDivider: {
    width: 1,
    height: 17,
    backgroundColor: BORDER,
    marginHorizontal: 11,
  },

  categorySection: {
    paddingTop: 20,
    paddingBottom: 5,
  },

  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  productsSection: {
    marginTop: 20,
  },

  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },

  itemCount: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  cardPressed: {
    opacity: 0.82,
  },

  productImageContainer: {
    height: 135,
    backgroundColor: "#EEEEEE",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  ratingBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
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
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  productCategory: {
    marginTop: 4,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  productBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: CARDINAL,
  },

  addIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSpace: {
    height: 35,
  },
});