import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCart } from "../../../../context/CartContext";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function ProductDetails() {
  const { addToCart } = useCart();
  const { id } = useLocalSearchParams();

  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);

  const product = {
    id: String(id ?? "chicken-rice-meal"),
    name: "Chicken Rice Meal",
    price: 89,
    store: "TUPC Main Canteen",
    category: "Meals",
    rating: 4.8,
    reviews: 124,
    description:
      "A delicious and filling chicken rice meal prepared fresh for TUPC students and staff.",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=80",
  };

  const total = product.price * quantity;

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

  const handleAddToCart = () => {
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
      `${quantity} × ${product.name} added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () => router.push("/(client)/cart"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={25} color={TEXT} />
          </Pressable>

          <Text style={styles.headerTitle}>Product Details</Text>

          <Pressable
            style={styles.headerButton}
            onPress={() => setFavorite((current) => !current)}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={24}
              color={favorite ? CARDINAL : TEXT}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PRODUCT IMAGE */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
            />

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {product.category}
              </Text>
            </View>
          </View>

          {/* PRODUCT INFO */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleArea}>
                <Text style={styles.productName}>
                  {product.name}
                </Text>

                <Pressable onPress={() => router.back()}>
                  <Text style={styles.storeName}>
                    {product.store}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.price}>
                ₱{product.price}
              </Text>
            </View>

            {/* RATING */}
            <View style={styles.ratingRow}>
              <View style={styles.ratingBox}>
                <Ionicons
                  name="star"
                  size={15}
                  color={GOLD}
                />

                <Text style={styles.ratingText}>
                  {product.rating}
                </Text>
              </View>

              <Text style={styles.reviewText}>
                {product.reviews} reviews
              </Text>

              <View style={styles.dot} />

              <Text style={styles.availableText}>
                Available
              </Text>
            </View>

            <View style={styles.divider} />

            {/* DESCRIPTION */}
            <Text style={styles.sectionTitle}>
              Description
            </Text>

            <Text style={styles.description}>
              {product.description}
            </Text>

            {/* INFO CARD */}
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={21}
                  color={CARDINAL}
                />
              </View>

              <View style={styles.infoTextArea}>
                <Text style={styles.infoTitle}>
                  Freshly prepared
                </Text>

                <Text style={styles.infoText}>
                  Your order will be prepared by the selected
                  campus store.
                </Text>
              </View>
            </View>

            {/* QUANTITY */}
            <View style={styles.quantitySection}>
              <View>
                <Text style={styles.sectionTitle}>
                  Quantity
                </Text>

                <Text style={styles.quantityHint}>
                  Maximum of 20 items
                </Text>
              </View>

              <View style={styles.quantityControl}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={decreaseQuantity}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={TEXT}
                  />
                </Pressable>

                <Text style={styles.quantityText}>
                  {quantity}
                </Text>

                <Pressable
                  style={styles.quantityButton}
                  onPress={increaseQuantity}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={TEXT}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>

        {/* BOTTOM ACTION */}
        <View style={styles.bottomAction}>
          <View style={styles.totalArea}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalPrice}>
              ₱{total}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleAddToCart}
          >
            <Ionicons
              name="bag-add-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              Add to Cart
            </Text>
          </Pressable>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
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

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  imageContainer: {
    height: 290,
    backgroundColor: "#ECECEC",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
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
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

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

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
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

  availableText: {
    fontSize: 13,
    color: "#238636",
    fontWeight: "700",
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

  infoCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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

  bottomAction: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
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

  buttonPressed: {
    opacity: 0.82,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});