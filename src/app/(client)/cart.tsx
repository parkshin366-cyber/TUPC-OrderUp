import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../context/CartContext";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const SUCCESS = "#238636";

export default function CartScreen() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  /*
   * Group cart items by store.
   * This makes the cart ready for future multi-store support.
   */
  const storeNames = useMemo(() => {
    return [...new Set(items.map((item) => item.store))];
  }, [items]);

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      "Remove Item",
      `Remove "${name}" from your cart?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromCart(id),
        },
      ]
    );
  };

  const handleDecrease = (
    id: string,
    quantity: number,
    name: string
  ) => {
    if (quantity <= 1) {
      handleRemove(id, name);
      return;
    }

    updateQuantity(id, quantity - 1);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert(
        "Cart is Empty",
        "Add products to your cart before checking out."
      );
      return;
    }

    router.push("/checkout");
  };

  const handleContinueShopping = () => {
    router.push("/explore");
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.container}>
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={TEXT}
            />
          </Pressable>

          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>My Cart</Text>

            {itemCount > 0 && (
              <Text style={styles.headerCount}>
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </Text>
            )}
          </View>

          <View style={styles.headerButton}>
            <Ionicons
              name="bag-handle-outline"
              size={22}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* ===================================================== */}
        {/* EMPTY CART */}
        {/* ===================================================== */}

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bag-outline"
                size={52}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Your Cart is Empty
            </Text>

            <Text style={styles.emptyText}>
              You haven't added anything yet.
              {"\n"}
              Browse campus stores and find something
              you like.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.shopButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleContinueShopping}
            >
              <Ionicons
                name="search-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.shopButtonText}>
                Browse Products
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ================================================= */}
            {/* CONTENT */}
            {/* ================================================= */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* CART STATUS */}

              <View style={styles.statusCard}>
                <View style={styles.statusIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={23}
                    color={SUCCESS}
                  />
                </View>

                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>
                    Ready for Checkout
                  </Text>

                  <Text style={styles.statusText}>
                    {itemCount}{" "}
                    {itemCount === 1
                      ? "item"
                      : "items"}{" "}
                    in your cart
                  </Text>
                </View>

                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>
                    PICKUP
                  </Text>
                </View>
              </View>

              {/* ================================================= */}
              {/* STORE */}
              {/* ================================================= */}

              <View style={styles.storeCard}>
                <View style={styles.storeIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={22}
                    color={CARDINAL}
                  />
                </View>

                <View style={styles.storeInfo}>
                  <Text style={styles.storeLabel}>
                    STORE
                  </Text>

                  <Text style={styles.storeName}>
                    {storeNames.length === 1
                      ? storeNames[0]
                      : `${storeNames.length} Campus Stores`}
                  </Text>
                </View>

                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={CARDINAL}
                  />

                  <Text style={styles.verifiedText}>
                    Verified
                  </Text>
                </View>
              </View>

              {/* ================================================= */}
              {/* ITEMS */}
              {/* ================================================= */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Your Items
                </Text>

                <Text style={styles.sectionCount}>
                  {itemCount}
                </Text>
              </View>

              {items.map((item) => (
                <View
                  key={item.id}
                  style={styles.itemCard}
                >
                  {/* IMAGE */}

                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />

                  {/* DETAILS */}

                  <View style={styles.itemContent}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemNameArea}>
                        <Text
                          style={styles.itemName}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>

                        <Text
                          style={styles.itemStore}
                          numberOfLines={1}
                        >
                          {item.store}
                        </Text>

                        <Text style={styles.itemUnitPrice}>
                          ₱{item.price.toFixed(2)} each
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          handleRemove(
                            item.id,
                            item.name
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.name}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={CARDINAL}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.itemBottomRow}>
                      <Text style={styles.itemPrice}>
                        ₱
                        {(
                          item.price * item.quantity
                        ).toFixed(2)}
                      </Text>

                      {/* QUANTITY */}

                      <View style={styles.quantityControl}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.quantityButton,
                            pressed &&
                              styles.quantityPressed,
                          ]}
                          onPress={() =>
                            handleDecrease(
                              item.id,
                              item.quantity,
                              item.name
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Decrease ${item.name} quantity`}
                        >
                          <Ionicons
                            name="remove"
                            size={16}
                            color={TEXT}
                          />
                        </Pressable>

                        <View style={styles.quantityValue}>
                          <Text
                            style={styles.quantityText}
                          >
                            {item.quantity}
                          </Text>
                        </View>

                        <Pressable
                          style={({ pressed }) => [
                            styles.quantityButton,
                            pressed &&
                              styles.quantityPressed,
                          ]}
                          onPress={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Increase ${item.name} quantity`}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color={TEXT}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {/* ================================================= */}
              {/* ORDER TYPE */}
              {/* ================================================= */}

              <Text style={styles.sectionTitle}>
                Order Type
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.orderTypeCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.orderTypeIcon}>
                  <Ionicons
                    name="walk-outline"
                    size={23}
                    color={CARDINAL}
                  />
                </View>

                <View style={styles.orderTypeText}>
                  <View style={styles.orderTypeTitleRow}>
                    <Text style={styles.orderTypeTitle}>
                      Campus Pickup
                    </Text>

                    <View style={styles.selectedCircle}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>

                  <Text
                    style={styles.orderTypeDescription}
                  >
                    Pick up your order directly at the
                    selected campus store.
                  </Text>
                </View>
              </Pressable>

              {/* ================================================= */}
              {/* SUMMARY */}
              {/* ================================================= */}

              <Text style={styles.sectionTitle}>
                Order Summary
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Items
                  </Text>

                  <Text style={styles.summaryValue}>
                    {itemCount}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Subtotal
                  </Text>

                  <Text style={styles.summaryValue}>
                    ₱{subtotal.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Pickup Fee
                  </Text>

                  <Text style={styles.freeText}>
                    FREE
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRowTotal}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    ₱{total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* ================================================= */}
              {/* INFORMATION */}
              {/* ================================================= */}

              <View style={styles.noteCard}>
                <View style={styles.noteIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={CARDINAL}
                  />
                </View>

                <Text style={styles.noteText}>
                  Review your items, pickup method, and
                  payment details before placing your
                  order.
                </Text>
              </View>

              {/* CONTINUE SHOPPING */}

              <Pressable
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleContinueShopping}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={19}
                  color={CARDINAL}
                />

                <Text style={styles.continueButtonText}>
                  Continue Shopping
                </Text>
              </Pressable>

              <View style={styles.bottomSpace} />
            </ScrollView>

            {/* ================================================= */}
            {/* CHECKOUT BAR */}
            {/* ================================================= */}

            <View style={styles.checkoutBar}>
              <View style={styles.checkoutTotal}>
                <Text style={styles.checkoutLabel}>
                  Total
                </Text>

                <Text style={styles.checkoutPrice}>
                  ₱{total.toFixed(2)}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCheckout}
                accessibilityRole="button"
                accessibilityLabel="Proceed to checkout"
              >
                <Text style={styles.checkoutButtonText}>
                  Checkout
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </>
        )}
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

  /* ========================================================= */
  /* HEADER */
  /* ========================================================= */

  header: {
    height: 66,
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

  headerTitleArea: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  headerCount: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  /* ========================================================= */
  /* CONTENT */
  /* ========================================================= */

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  /* ========================================================= */
  /* STATUS */
  /* ========================================================= */

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#F2FAF4",
    borderWidth: 1,
    borderColor: "#D8EEDC",
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F4E7",
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  statusText: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  freeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8EEDC",
  },

  freeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: SUCCESS,
    letterSpacing: 0.5,
  },

  /* ========================================================= */
  /* STORE */
  /* ========================================================= */

  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 23,
  },

  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECEF",
  },

  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },

  storeLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: MUTED,
    letterSpacing: 0.8,
  },

  storeName: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: "900",
    color: CARDINAL,
  },

  /* ========================================================= */
  /* SECTION */
  /* ========================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  sectionTitle: {
    marginBottom: 11,
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  sectionCount: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    alignItems: "center",
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#FBECEF",
    color: CARDINAL,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 11,
  },

  /* ========================================================= */
  /* ITEM */
  /* ========================================================= */

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: BORDER,
  },

  itemImage: {
    width: 92,
    height: 92,
    borderRadius: 13,
    backgroundColor: "#ECECEC",
  },

  itemContent: {
    flex: 1,
    marginLeft: 12,
  },

  itemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  itemNameArea: {
    flex: 1,
    paddingRight: 7,
  },

  itemName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: TEXT,
  },

  itemStore: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  itemUnitPrice: {
    marginTop: 5,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECEF",
  },

  itemBottomRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: CARDINAL,
  },

  /* ========================================================= */
  /* QUANTITY */
  /* ========================================================= */

  quantityControl: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },

  quantityValue: {
    minWidth: 31,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
  },

  quantityText: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  quantityPressed: {
    backgroundColor: "#F1F1F1",
  },

  /* ========================================================= */
  /* ORDER TYPE */
  /* ========================================================= */

  orderTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: CARDINAL,
    borderRadius: 16,
    padding: 14,
    marginBottom: 23,
  },

  orderTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECEF",
  },

  orderTypeText: {
    flex: 1,
    marginLeft: 12,
  },

  orderTypeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  orderTypeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  orderTypeDescription: {
    marginTop: 5,
    paddingRight: 15,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
  },

  selectedCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ========================================================= */
  /* SUMMARY */
  /* ========================================================= */

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },

  summaryValue: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "800",
  },

  freeText: {
    fontSize: 12,
    color: SUCCESS,
    fontWeight: "900",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 2,
    marginBottom: 15,
  },

  summaryRowTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  totalValue: {
    fontSize: 21,
    fontWeight: "900",
    color: CARDINAL,
  },

  /* ========================================================= */
  /* NOTE */
  /* ========================================================= */

  noteCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#FFF8E8",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noteIcon: {
    marginRight: 9,
  },

  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#6D5A2B",
    fontWeight: "600",
  },

  /* ========================================================= */
  /* CONTINUE SHOPPING */
  /* ========================================================= */

  continueButton: {
    height: 48,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  continueButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: CARDINAL,
  },

  /* ========================================================= */
  /* CHECKOUT BAR */
  /* ========================================================= */

  checkoutBar: {
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 13,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  checkoutTotal: {
    flex: 1,
  },

  checkoutLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "800",
  },

  checkoutPrice: {
    marginTop: 2,
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
  },

  checkoutButton: {
    minWidth: 145,
    height: 50,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  /* ========================================================= */
  /* EMPTY */
  /* ========================================================= */

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECEF",
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },

  shopButton: {
    marginTop: 25,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  /* ========================================================= */
  /* GENERAL */
  /* ========================================================= */

  bottomSpace: {
    height: 25,
  },

  pressed: {
    opacity: 0.78,
  },

  buttonPressed: {
    opacity: 0.84,
  },

  cardPressed: {
    opacity: 0.86,
  },
});

