import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useCart } from "../../context/CartContext";

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function CheckoutScreen() {
  const {
    items,
    itemCount,
    subtotal,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "gcash"
  >("cash");

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      Alert.alert(
        "Cart is Empty",
        "There are no items to checkout."
      );
      router.replace("/(client)");
      return;
    }

    Alert.alert(
      "Confirm Order",
      `Place your order for ₱${total.toFixed(2)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Place Order",
          onPress: () => {
            clearCart();

            router.replace("/(client)/order-success");
          },
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
            <Ionicons
              name="chevron-back"
              size={25}
              color={TEXT}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Checkout
          </Text>

          <View style={styles.headerButton}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={CARDINAL}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* CHECKOUT STEPS */}
          <View style={styles.stepCard}>
            <View style={styles.stepItem}>
              <View style={styles.stepCircleActive}>
                <Ionicons
                  name="checkmark"
                  size={15}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.stepActiveText}>
                Cart
              </Text>
            </View>

            <View style={styles.stepLineActive} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircleCurrent}>
                <Text style={styles.stepNumber}>
                  2
                </Text>
              </View>

              <Text style={styles.stepCurrentText}>
                Checkout
              </Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumberInactive}>
                  3
                </Text>
              </View>

              <Text style={styles.stepText}>
                Done
              </Text>
            </View>
          </View>

          {/* PICKUP */}
          <Text style={styles.sectionTitle}>
            Pickup Details
          </Text>

          <View style={styles.pickupCard}>
            <View style={styles.pickupIcon}>
              <Ionicons
                name="location-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View style={styles.pickupContent}>
              <Text style={styles.cardLabel}>
                PICKUP LOCATION
              </Text>

              <Text style={styles.pickupTitle}>
                TUPC Main Canteen
              </Text>

              <Text style={styles.pickupText}>
                Main Campus • Food Area
              </Text>

              <View style={styles.openRow}>
                <View style={styles.greenDot} />

                <Text style={styles.openText}>
                  Open for pickup
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={MUTED}
            />
          </View>

          {/* PAYMENT */}
          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <Pressable
            style={[
              styles.paymentCard,
              paymentMethod === "cash" &&
                styles.paymentCardSelected,
            ]}
            onPress={() => setPaymentMethod("cash")}
          >
            <View style={styles.paymentIcon}>
              <Ionicons
                name="cash-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                Cash on Pickup
              </Text>

              <Text style={styles.paymentText}>
                Pay directly when you collect your order.
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === "cash" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod === "cash" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.paymentCard,
              paymentMethod === "gcash" &&
                styles.paymentCardSelected,
            ]}
            onPress={() => setPaymentMethod("gcash")}
          >
            <View style={styles.paymentIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                GCash
              </Text>

              <Text style={styles.paymentText}>
                Pay securely using your GCash account.
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === "gcash" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod === "gcash" && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>

          {/* ORDER ITEMS */}
          <Text style={styles.sectionTitle}>
            Order Items
          </Text>

          <View style={styles.itemsCard}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.orderItem,
                  index < items.length - 1 &&
                    styles.orderItemBorder,
                ]}
              >
                <View style={styles.itemQuantity}>
                  <Text style={styles.itemQuantityText}>
                    {item.quantity}×
                  </Text>
                </View>

                <View style={styles.itemInfo}>
                  <Text
                    style={styles.itemName}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.itemStore}>
                    {item.store}
                  </Text>
                </View>

                <Text style={styles.itemPrice}>
                  ₱{(
                    item.price * item.quantity
                  ).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* SUMMARY */}
          <Text style={styles.sectionTitle}>
            Order Summary
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Items ({itemCount})
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

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>
                Total Amount
              </Text>

              <Text style={styles.totalValue}>
                ₱{total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* SECURITY NOTICE */}
          <View style={styles.securityCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={CARDINAL}
            />

            <View style={styles.securityTextArea}>
              <Text style={styles.securityTitle}>
                Secure Checkout
              </Text>

              <Text style={styles.securityText}>
                Your order information is protected and will
                only be shared with the selected campus store.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* PLACE ORDER */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomTotal}>
            <Text style={styles.bottomLabel}>
              Total
            </Text>

            <Text style={styles.bottomPrice}>
              ₱{total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.placeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePlaceOrder}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.placeButtonText}>
              Place Order
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
    height: 64,
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
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },

  stepCard: {
    height: 76,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  stepItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleActive: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleCurrent: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#EEEEEF",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  stepNumberInactive: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  stepActiveText: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "800",
    color: CARDINAL,
  },

  stepCurrentText: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL,
  },

  stepText: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "700",
    color: MUTED,
  },

  stepLineActive: {
    width: 45,
    height: 2,
    backgroundColor: CARDINAL,
    marginHorizontal: 7,
    marginBottom: 18,
  },

  stepLine: {
    width: 45,
    height: 2,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 7,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 11,
  },

  pickupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  pickupIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  pickupContent: {
    flex: 1,
    marginLeft: 12,
  },

  cardLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: MUTED,
  },

  pickupTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  pickupText: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  openRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#238636",
    marginRight: 5,
  },

  openText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#238636",
  },

  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  paymentCardSelected: {
    borderColor: CARDINAL,
    borderWidth: 1.5,
  },

  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  paymentText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D2D2D3",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: CARDINAL,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: CARDINAL,
  },

  itemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  orderItem: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
  },

  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  itemQuantity: {
    width: 35,
    height: 27,
    borderRadius: 8,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  itemQuantityText: {
    fontSize: 11,
    fontWeight: "900",
    color: CARDINAL,
  },

  itemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },

  itemName: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  itemStore: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    color: "#238636",
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 2,
    marginBottom: 15,
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

  securityCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF8E8",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  securityTextArea: {
    flex: 1,
    marginLeft: 9,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  securityText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: MUTED,
  },

  bottomSpace: {
    height: 20,
  },

  bottomBar: {
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

  bottomTotal: {
    flex: 1,
  },

  bottomLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  bottomPrice: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  placeButton: {
    minWidth: 160,
    height: 50,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
  },

  placeButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  buttonPressed: {
    opacity: 0.82,
  },
});