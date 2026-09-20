import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { useCart } from "../../context/CartContext";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

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

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      "Remove Item",
      `Remove ${name} from your cart?`,
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

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert(
        "Cart is Empty",
        "Add products to your cart before checking out."
      );
      return;
    }

    router.push("/(client)/checkout");
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
            <Ionicons
              name="chevron-back"
              size={25}
              color={TEXT}
            />
          </Pressable>

          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>My Cart</Text>

            {itemCount > 0 && (
              <Text style={styles.headerCount}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            )}
          </View>

          <View style={styles.headerButton}>
            <Ionicons
              name="bag-handle-outline"
              size={23}
              color={CARDINAL}
            />
          </View>
        </View>

        {items.length === 0 ? (
          /* EMPTY CART */
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
              Looks like you haven't added anything to your
              cart yet.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.shopButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/(client)/explore")}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.shopButtonText}>
                Browse Products
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* STORE INFO */}
              <View style={styles.storeCard}>
                <View style={styles.storeIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={21}
                    color={CARDINAL}
                  />
                </View>

                <View style={styles.storeInfo}>
                  <Text style={styles.storeLabel}>
                    STORE
                  </Text>

                  <Text style={styles.storeName}>
                    {items[0].store}
                  </Text>
                </View>

                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={CARDINAL}
                  />

                  <Text style={styles.verifiedText}>
                    Verified
                  </Text>
                </View>
              </View>

              {/* CART ITEMS */}
              <Text style={styles.sectionTitle}>
                Your Items
              </Text>

              {items.map((item) => (
                <View
                  key={item.id}
                  style={styles.itemCard}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />

                  <View style={styles.itemContent}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemNameArea}>
                        <Text
                          style={styles.itemName}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>

                        <Text style={styles.itemStore}>
                          {item.store}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() =>
                          handleRemove(
                            item.id,
                            item.name
                          )
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color={CARDINAL}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.itemBottomRow}>
                      <Text style={styles.itemPrice}>
                        ₱{item.price}
                      </Text>

                      <View style={styles.quantityControl}>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                        >
                          <Ionicons
                            name="remove"
                            size={17}
                            color={TEXT}
                          />
                        </Pressable>

                        <Text style={styles.quantityText}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          style={styles.quantityButton}
                          onPress={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                        >
                          <Ionicons
                            name="add"
                            size={17}
                            color={TEXT}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {/* ORDER TYPE */}
              <Text style={styles.sectionTitle}>
                Order Type
              </Text>

              <View style={styles.orderTypeCard}>
                <View style={styles.orderTypeIcon}>
                  <Ionicons
                    name="walk-outline"
                    size={23}
                    color={CARDINAL}
                  />
                </View>

                <View style={styles.orderTypeText}>
                  <Text style={styles.orderTypeTitle}>
                    Campus Pickup
                  </Text>

                  <Text style={styles.orderTypeDescription}>
                    Pick up your order at the selected campus
                    store.
                  </Text>
                </View>

                <View style={styles.selectedCircle}>
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              {/* SUMMARY */}
              <Text style={styles.sectionTitle}>
                Order Summary
              </Text>

              <View style={styles.summaryCard}>
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

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    ₱{total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* NOTE */}
              <View style={styles.noteCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={CARDINAL}
                />

                <Text style={styles.noteText}>
                  You can review your order details and payment
                  method before placing the order.
                </Text>
              </View>

              <View style={styles.bottomSpace} />
            </ScrollView>

            {/* CHECKOUT BAR */}
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
              >
                <Text style={styles.checkoutButtonText}>
                  Proceed to Checkout
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
    fontWeight: "600",
    color: MUTED,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },

  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
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
    fontWeight: "800",
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
    fontWeight: "800",
    color: CARDINAL,
  },

  sectionTitle: {
    marginBottom: 11,
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
  },

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
    paddingRight: 8,
  },

  itemName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: TEXT,
  },

  itemStore: {
    marginTop: 4,
    fontSize: 11,
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
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: CARDINAL,
  },

  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
  },

  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },

  quantityText: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  orderTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: CARDINAL,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
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
    marginRight: 10,
  },

  orderTypeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  orderTypeDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
  },

  selectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

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
    marginBottom: 11,
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
    color: "#238636",
    fontWeight: "900",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 5,
    marginBottom: 15,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: CARDINAL,
  },

  noteCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#FFF8E8",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#6D5A2B",
    fontWeight: "600",
  },

  bottomSpace: {
    height: 20,
  },

  checkoutBar: {
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

  checkoutTotal: {
    flex: 1,
  },

  checkoutLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  checkoutPrice: {
    marginTop: 2,
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
  },

  checkoutButton: {
    minWidth: 190,
    height: 50,
    paddingHorizontal: 16,
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

  buttonPressed: {
    opacity: 0.82,
  },
});