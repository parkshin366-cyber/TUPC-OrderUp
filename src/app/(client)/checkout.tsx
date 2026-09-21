import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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
import { useCart } from "../../context/CartContext";

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
const SUCCESS = "#238636";
const SOFT_RED = "#FCECEF";
const SOFT_GREEN = "#EAF7EE";
const SOFT_GOLD = "#FFF8E7";

// =====================================================
// TYPES
// =====================================================

type PaymentMethod = "cash" | "gcash";

type PickupLocation = {
  id: string;
  name: string;
  description: string;
};

// =====================================================
// PICKUP LOCATIONS
// =====================================================

const pickupLocations: PickupLocation[] = [
  {
    id: "canteen",
    name: "TUPC Main Canteen",
    description: "Main Campus • Food Area",
  },
];

// =====================================================
// CHECKOUT SCREEN
// =====================================================

export default function CheckoutScreen() {
  const {
    items,
    itemCount,
    subtotal,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [pickupLocation, setPickupLocation] =
    useState<PickupLocation>(pickupLocations[0]);

  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false);

  const deliveryFee = 0;

  const total = useMemo(() => {
    return subtotal + deliveryFee;
  }, [subtotal]);

  // ===================================================
  // EMPTY CART CHECK
  // ===================================================

  if (items.length === 0) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="cart-outline"
              size={48}
              color={CARDINAL}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Your Cart is Empty
          </Text>

          <Text style={styles.emptyText}>
            Add some items from a campus store before
            proceeding to checkout.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.replace("/explore")}
          >
            <Ionicons
              name="bag-handle-outline"
              size={19}
              color={WHITE}
            />

            <Text style={styles.emptyButtonText}>
              Browse Campus Stores
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // PLACE ORDER
  // ===================================================

  const handlePlaceOrder = () => {
    const paymentLabel =
      paymentMethod === "cash"
        ? "Cash on Pickup"
        : "GCash";

    Alert.alert(
      "Confirm Your Order",
      [
        `Pickup: ${pickupLocation.name}`,
        `Payment: ${paymentLabel}`,
        `Total: ₱${total.toFixed(2)}`,
        "",
        "Do you want to place this order?",
      ].join("\n"),
      [
        {
          text: "Review Again",
          style: "cancel",
        },
        {
          text: "Place Order",
          onPress: confirmPlaceOrder,
        },
      ]
    );
  };

  // ===================================================
  // CONFIRM ORDER
  // ===================================================

  const confirmPlaceOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      /*
       * TEMPORARY ORDER CREATION
       *
       * Later, this section will call the backend:
       *
       * POST /api/orders
       *
       * and save:
       * - user
       * - items
       * - store
       * - quantity
       * - subtotal
       * - total
       * - pickup location
       * - payment method
       * - order status
       *
       * For now we clear the local cart and continue
       * to the order-success screen.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );

      clearCart();

      router.replace("/order-success");
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      Alert.alert(
        "Order Failed",
        "We couldn't place your order. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.screen}>
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() => router.back()}
            disabled={isPlacingOrder}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={TEXT}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Checkout
            </Text>

            <View style={styles.secureHeader}>
              <Ionicons
                name="lock-closed"
                size={10}
                color={SUCCESS}
              />

              <Text style={styles.secureHeaderText}>
                Secure
              </Text>
            </View>
          </View>

          <View style={styles.headerButton}>
            <Ionicons
              name="receipt-outline"
              size={20}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* =================================================
              PROGRESS
          ================================================= */}

          <View style={styles.progressCard}>
            <View style={styles.progressStep}>
              <View style={styles.progressCircleDone}>
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={WHITE}
                />
              </View>

              <Text style={styles.progressTextDone}>
                Cart
              </Text>
            </View>

            <View style={styles.progressLineActive} />

            <View style={styles.progressStep}>
              <View style={styles.progressCircleCurrent}>
                <Text style={styles.progressNumber}>
                  2
                </Text>
              </View>

              <Text style={styles.progressTextCurrent}>
                Checkout
              </Text>
            </View>

            <View style={styles.progressLine} />

            <View style={styles.progressStep}>
              <View style={styles.progressCircleInactive}>
                <Text style={styles.progressNumberInactive}>
                  3
                </Text>
              </View>

              <Text style={styles.progressTextInactive}>
                Done
              </Text>
            </View>
          </View>

          {/* =================================================
              ORDER HEADER
          ================================================= */}

          <View style={styles.pageIntro}>
            <View>
              <Text style={styles.pageTitle}>
                Complete Your Order
              </Text>

              <Text style={styles.pageSubtitle}>
                Review your details before placing your order.
              </Text>
            </View>

            <View style={styles.itemCountBadge}>
              <Ionicons
                name="bag-outline"
                size={14}
                color={CARDINAL}
              />

              <Text style={styles.itemCountText}>
                {itemCount}
              </Text>
            </View>
          </View>

          {/* =================================================
              PICKUP LOCATION
          ================================================= */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                1
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Pickup Location
              </Text>

              <Text style={styles.sectionSubtitle}>
                Where will you collect your order?
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.pickupCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() => {
              Alert.alert(
                "Pickup Location",
                "TUPC Main Canteen is currently the available pickup location.",
                [
                  {
                    text: "OK",
                  },
                ]
              );
            }}
          >
            <View style={styles.pickupIcon}>
              <Ionicons
                name="location"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View style={styles.pickupContent}>
              <View style={styles.pickupTitleRow}>
                <Text style={styles.pickupTitle}>
                  {pickupLocation.name}
                </Text>

                <View style={styles.selectedBadge}>
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={SUCCESS}
                  />

                  <Text style={styles.selectedBadgeText}>
                    Selected
                  </Text>
                </View>
              </View>

              <Text style={styles.pickupDescription}>
                {pickupLocation.description}
              </Text>

              <View style={styles.openRow}>
                <View style={styles.openDot} />

                <Text style={styles.openText}>
                  Available for pickup
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={MUTED}
            />
          </Pressable>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <View style={styles.sectionHeaderPayment}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                2
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Payment Method
              </Text>

              <Text style={styles.sectionSubtitle}>
                Choose how you want to pay.
              </Text>
            </View>
          </View>

          {/* CASH */}
          <Pressable
            style={({ pressed }) => [
              styles.paymentCard,
              paymentMethod === "cash" &&
                styles.paymentCardSelected,
              pressed && styles.cardPressed,
            ]}
            onPress={() => setPaymentMethod("cash")}
            disabled={isPlacingOrder}
          >
            <View style={styles.paymentIcon}>
              <Ionicons
                name="cash-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View style={styles.paymentContent}>
              <View style={styles.paymentTitleRow}>
                <Text style={styles.paymentTitle}>
                  Cash on Pickup
                </Text>

                {paymentMethod === "cash" && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>
                      Recommended
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.paymentDescription}>
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

          {/* GCASH */}
          <Pressable
            style={({ pressed }) => [
              styles.paymentCard,
              paymentMethod === "gcash" &&
                styles.paymentCardSelected,
              pressed && styles.cardPressed,
            ]}
            onPress={() => setPaymentMethod("gcash")}
            disabled={isPlacingOrder}
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

              <Text style={styles.paymentDescription}>
                Pay using your GCash account.
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

          {/* =================================================
              ORDER ITEMS
          ================================================= */}

          <View style={styles.sectionHeaderItems}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                3
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Order Items
              </Text>

              <Text style={styles.sectionSubtitle}>
                Items included in this order.
              </Text>
            </View>
          </View>

          <View style={styles.itemsCard}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.orderItem,
                  index !== items.length - 1 &&
                    styles.orderItemBorder,
                ]}
              >
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>
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

                <Text style={styles.itemPrice}>
                  ₱{(
                    item.price * item.quantity
                  ).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <View style={styles.sectionHeaderSummary}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                4
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Order Summary
              </Text>

              <Text style={styles.sectionSubtitle}>
                Final amount for this order.
              </Text>
            </View>
          </View>

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

              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>
                  FREE
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>
                  Total Amount
                </Text>

                <Text style={styles.totalSubtext}>
                  {paymentMethod === "cash"
                    ? "Cash on pickup"
                    : "GCash payment"}
                </Text>
              </View>

              <Text style={styles.totalValue}>
                ₱{total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* =================================================
              SECURITY
          ================================================= */}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark"
                size={19}
                color={SUCCESS}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Secure Checkout
              </Text>

              <Text style={styles.securityText}>
                Your order details are protected and will only
                be shared with the campus store handling your
                order.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* =================================================
            BOTTOM CHECKOUT BAR
        ================================================= */}

        <View style={styles.bottomBar}>
          <View style={styles.bottomTotal}>
            <Text style={styles.bottomLabel}>
              Total Amount
            </Text>

            <Text style={styles.bottomPrice}>
              ₱{total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.placeButton,
              pressed && !isPlacingOrder
                ? styles.buttonPressed
                : null,
              isPlacingOrder &&
                styles.placeButtonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={WHITE}
                />

                <Text style={styles.placeButtonText}>
                  Placing...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.placeButtonText}>
                  Place Order
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={WHITE}
                />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // SCREEN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 35,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    minHeight: 64,
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
    borderRadius: 13,
    backgroundColor: "#F5F5F6",
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonPressed: {
    opacity: 0.7,
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  secureHeader: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  secureHeaderText: {
    fontSize: 9,
    fontWeight: "800",
    color: SUCCESS,
  },

  // ===================================================
  // PROGRESS
  // ===================================================

  progressCard: {
    height: 78,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  progressStep: {
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircleDone: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircleCurrent: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F4CDD4",
  },

  progressCircleInactive: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#F0F0F1",
    alignItems: "center",
    justifyContent: "center",
  },

  progressNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  progressNumberInactive: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  progressTextDone: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL,
  },

  progressTextCurrent: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  progressTextInactive: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "700",
    color: MUTED,
  },

  progressLineActive: {
    width: 45,
    height: 2,
    marginHorizontal: 7,
    marginBottom: 18,
    backgroundColor: CARDINAL,
  },

  progressLine: {
    width: 45,
    height: 2,
    marginHorizontal: 7,
    marginBottom: 18,
    backgroundColor: "#E5E5E5",
  },

  // ===================================================
  // PAGE INTRO
  // ===================================================

  pageIntro: {
    marginTop: 22,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  pageSubtitle: {
    marginTop: 4,
    maxWidth: 290,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
  },

  itemCountBadge: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: SOFT_RED,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  itemCountText: {
    fontSize: 12,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ===================================================
  // SECTION HEADER
  // ===================================================

  sectionHeader: {
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionHeaderPayment: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionHeaderItems: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionHeaderSummary: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionNumberText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  // ===================================================
  // PICKUP
  // ===================================================

  pickupCard: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  cardPressed: {
    opacity: 0.84,
  },

  pickupIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  pickupContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  pickupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  pickupTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  selectedBadge: {
    paddingHorizontal: 6,
    minHeight: 19,
    borderRadius: 6,
    backgroundColor: SOFT_GREEN,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  selectedBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: SUCCESS,
  },

  pickupDescription: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  openRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SUCCESS,
    marginRight: 5,
  },

  openText: {
    fontSize: 9,
    fontWeight: "800",
    color: SUCCESS,
  },

  // ===================================================
  // PAYMENT
  // ===================================================

  paymentCard: {
    minHeight: 78,
    padding: 13,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  paymentCardSelected: {
    borderWidth: 1.5,
    borderColor: CARDINAL,
    backgroundColor: "#FFFAFB",
  },

  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 9,
  },

  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  paymentTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  paymentDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  recommendedBadge: {
    paddingHorizontal: 6,
    minHeight: 18,
    borderRadius: 5,
    backgroundColor: SOFT_GOLD,
    justifyContent: "center",
  },

  recommendedText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#9A6A13",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D3D3D4",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: CARDINAL,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CARDINAL,
  },

  // ===================================================
  // ORDER ITEMS
  // ===================================================

  itemsCard: {
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
  },

  orderItem: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
  },

  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  quantityBadge: {
    width: 37,
    height: 29,
    borderRadius: 9,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    fontSize: 10,
    fontWeight: "900",
    color: CARDINAL,
  },

  itemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },

  itemName: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  itemStore: {
    marginTop: 3,
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  itemUnitPrice: {
    marginTop: 3,
    fontSize: 9,
    color: "#969696",
    fontWeight: "600",
  },

  itemPrice: {
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    padding: 16,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryRow: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  freeBadge: {
    paddingHorizontal: 7,
    minHeight: 21,
    borderRadius: 7,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  freeText: {
    fontSize: 9,
    fontWeight: "900",
    color: SUCCESS,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 13,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  totalSubtext: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
  },

  totalValue: {
    fontSize: 21,
    fontWeight: "900",
    color: CARDINAL,
  },

  // ===================================================
  // SECURITY
  // ===================================================

  securityCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#F0F8F2",
    borderWidth: 1,
    borderColor: "#D8EBDD",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  securityIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  securityContent: {
    flex: 1,
    marginLeft: 9,
  },

  securityTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: TEXT,
  },

  securityText: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 15,
    color: MUTED,
  },

  bottomSpace: {
    height: 20,
  },

  // ===================================================
  // BOTTOM BAR
  // ===================================================

  bottomBar: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  bottomTotal: {
    flex: 1,
  },

  bottomLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
  },

  bottomPrice: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: CARDINAL_DARK,
  },

  placeButton: {
    minWidth: 157,
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  placeButtonDisabled: {
    opacity: 0.65,
  },

  placeButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: WHITE,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // ===================================================
  // EMPTY CART
  // ===================================================

  emptyContainer: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F2D3D9",
  },

  emptyTitle: {
    marginTop: 22,
    fontSize: 23,
    fontWeight: "900",
    color: CARDINAL_DARK,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 9,
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 25,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: WHITE,
  },
});
