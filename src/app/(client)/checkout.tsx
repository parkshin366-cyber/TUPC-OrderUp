import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../context/ThemeContext";
import { createThemedStyleSheet } from "../../utils/themeStyles";
import CampusLocationPicker, { type CampusPin } from "../../components/campus-location-picker";

import {
  createOrder,
  createGcashCheckout,
  verifyGcashCheckout,
  getCustomerStoreVouchers,
  getPublicStore,
  type PaymentMethod,
  type Voucher,
  type Store,
} from "../../services/api";

// =====================================================
// COLORS
// =====================================================

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
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
// ERROR HELPER
// =====================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const err = error as any;

    if (typeof err.message === "string") {
      return err.message;
    }

    if (
      typeof err.error === "string"
    ) {
      return err.error;
    }

    if (
      typeof err.detail === "string"
    ) {
      return err.detail;
    }

    if (
      typeof err.data?.message === "string"
    ) {
      return err.data.message;
    }

    if (
      typeof err.data?.error === "string"
    ) {
      return err.data.error;
    }
  }

  return "We couldn't place your order. Please try again.";
}

// =====================================================
// CHECKOUT SCREEN
// =====================================================

export default function CheckoutScreen() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  // ===================================================
  // AUTH
  // ===================================================

  const { token } = useAuth();

  // ===================================================
  // CART
  // ===================================================

  const {
    items,
    itemCount,
    subtotal,
    clearCart,
  } = useCart();

  // ===================================================
  // STATE
  // ===================================================

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const pickupLocation = pickupLocations[0];

  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false);

  const [appliedVoucher, setAppliedVoucher] =
    useState<Voucher | null>(null);

  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [voucherOptions, setVoucherOptions] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [orderConfirmVisible, setOrderConfirmVisible] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [checkoutStore, setCheckoutStore] = useState<Store | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [pinningLocation, setPinningLocation] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [phoneLocation, setPhoneLocation] = useState<CampusPin | null>(null);

  useEffect(() => {
    const storeId = items[0]?.storeId;
    if (!storeId) return;
    void getPublicStore(storeId)
      .then((store) => {
        setCheckoutStore(store);
        setDeliveryEnabled(store.deliveryEnabled === true);
        if (!store.gcashEnabled) setPaymentMethod("cash");
      })
      .catch(() => {
        setCheckoutStore(null);
        setDeliveryEnabled(false);
        setPaymentMethod("cash");
      });
  }, [items]);

  // ===================================================
  // TOTAL
  // ===================================================

  const deliveryFee = 0;

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher || subtotal < appliedVoucher.minimumOrder) {
      return 0;
    }

    const eligibleSubtotal = appliedVoucher.productIds?.length
      ? items
        .filter((item) => appliedVoucher.productIds?.includes(item.id))
        .reduce((amount, item) => amount + item.price * item.quantity, 0)
      : subtotal;

    return Number(
      (eligibleSubtotal * appliedVoucher.discountPercent / 100).toFixed(2)
    );
  }, [appliedVoucher, items, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - voucherDiscount + deliveryFee);
  }, [subtotal, voucherDiscount]);

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (items.length === 0) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          "top",
          "left",
          "right",
          "bottom",
        ]}
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
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.replace("/explore")
            }
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
  // GET STORE ID
  // ===================================================

  const getStoreId = (): string | null => {
    if (!items.length) {
      return null;
    }

    const firstStoreId =
      items[0]?.storeId;

    if (!firstStoreId) {
      return null;
    }

    const allSameStore =
      items.every(
        (item) =>
          item.storeId === firstStoreId
      );

    if (!allSameStore) {
      return null;
    }

    return firstStoreId;
  };

  const handleChooseVoucher = async () => {
    setVoucherModalVisible(true);
    setVoucherError(null);

    if (!token) {
      setVoucherOptions([]);
      setVoucherError("Please log in again to use a voucher.");
      return;
    }

    const storeId = getStoreId();
    if (!storeId) {
      setVoucherOptions([]);
      setVoucherError("Vouchers can only be used for one store per order.");
      return;
    }

    try {
      setLoadingVouchers(true);
      const vouchers = await getCustomerStoreVouchers(
        token,
        storeId,
        items.map((item) => item.id)
      );
      setVoucherOptions(vouchers);
    } catch (error) {
      setVoucherOptions([]);
      setVoucherError(getErrorMessage(error));
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handlePinLocation = async () => {
    setMapVisible(true);
    try {
      setPinningLocation(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location Permission", "Allow location access so the seller can find your delivery pin.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setPhoneLocation({ latitude, longitude });
    } catch (error) {
      Alert.alert("Location Error", error instanceof Error ? error.message : "Unable to get your current location.");
    } finally {
      setPinningLocation(false);
    }
  };

  const handleConfirmCampusPin = async (pin: CampusPin) => {
    setDeliveryLatitude(pin.latitude);
    setDeliveryLongitude(pin.longitude);
    setMapVisible(false);
    try {
      const places = await Location.reverseGeocodeAsync(pin);
      const place = places[0];
      if (place) {
        const readable = [place.name, place.street, place.district, place.city]
          .filter(Boolean)
          .filter((part, index, all) => all.indexOf(part) === index)
          .join(", ");
        if (readable) setDeliveryAddress(readable);
      }
    } catch {
      // The client can still enter a campus landmark manually.
    }
  };

  // ===================================================
  // HANDLE PLACE ORDER
  // ===================================================

  const handlePlaceOrder = () => {
    if (isPlacingOrder) {
      return;
    }

    // -----------------------------------------------
    // CHECK LOGIN FIRST
    // -----------------------------------------------

    if (!token) {
      Alert.alert(
        "Login Required",
        "Your login session is not available. Please log in again before placing an order.",
        [
          {
            text: "Log In",
            onPress: () =>
              router.replace("/"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );

      return;
    }

    // -----------------------------------------------
    // CHECK STORE
    // -----------------------------------------------

    const storeId = getStoreId();

    if (!storeId) {
      Alert.alert(
        "Store Error",
        "Hindi matukoy kung saang store kabilang ang items. Please clear your cart and add the products again."
      );

      return;
    }

    // -----------------------------------------------
    // CHECK PRODUCT IDS
    // -----------------------------------------------

    const invalidItem =
      items.find(
        (item) =>
          !item.id ||
          typeof item.id !== "string"
      );

    if (invalidItem) {
      Alert.alert(
        "Product Error",
        "May product sa cart na walang valid product ID. Please remove it and add the product again."
      );

      return;
    }

    if (
      fulfillmentMethod === "delivery" &&
      (!deliveryAddress.trim() || deliveryLatitude === null || deliveryLongitude === null)
    ) {
      Alert.alert("Pin Delivery Location", "Please pin your current location and add a delivery landmark before placing the order.");
      return;
    }

    setOrderConfirmVisible(true);
  };

  // ===================================================
  // CONFIRM PLACE ORDER
  // ===================================================

  const confirmPlaceOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "         CHECKOUT / PLACE ORDER"
      );
      console.log(
        "========================================"
      );

      // -----------------------------------------------
      // 1. CHECK TOKEN
      // -----------------------------------------------

      if (!token) {
        console.error(
          "NO AUTH TOKEN"
        );

        Alert.alert(
          "Login Required",
          "Your login session is no longer available. Please log in again.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace("/"),
            },
          ]
        );

        return;
      }

      console.log(
        "AUTH TOKEN EXISTS"
      );
      console.log(
        "TOKEN LENGTH:",
        token.length
      );

      // -----------------------------------------------
      // 2. GET STORE ID
      // -----------------------------------------------

      const storeId = getStoreId();

      if (!storeId) {
        throw new Error(
          "Unable to determine the store for this order."
        );
      }

      console.log(
        "STORE ID:",
        storeId
      );

      // -----------------------------------------------
      // 3. CHECK ITEMS
      // -----------------------------------------------

      if (!items.length) {
        throw new Error(
          "Your cart is empty."
        );
      }

      // -----------------------------------------------
      // 4. PREPARE ITEMS
      // -----------------------------------------------

      const orderItems = items.map(
        (item) => ({
          productId: item.id,
          quantity: item.quantity,
        })
      );

      console.log(
        "ORDER ITEMS:"
      );

      console.log(
        JSON.stringify(
          orderItems,
          null,
          2
        )
      );

      // -----------------------------------------------
      // 5. VALIDATE PRODUCT IDs
      // -----------------------------------------------

      for (
        const item of orderItems
      ) {
        if (
          !item.productId ||
          typeof item.productId !==
            "string"
        ) {
          throw new Error(
            "Invalid product ID found in cart."
          );
        }

        if (
          !item.quantity ||
          item.quantity <= 0
        ) {
          throw new Error(
            "Invalid product quantity found in cart."
          );
        }
      }

      // -----------------------------------------------
      // 6. PREPARE PAYLOAD
      // -----------------------------------------------

      const payload = {
        storeId,
        items: orderItems,
        pickupLocation: fulfillmentMethod === "delivery" ? deliveryAddress.trim() : pickupLocation.name,
        fulfillmentMethod,
        deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress.trim() : undefined,
        deliveryLatitude: fulfillmentMethod === "delivery" ? deliveryLatitude ?? undefined : undefined,
        deliveryLongitude: fulfillmentMethod === "delivery" ? deliveryLongitude ?? undefined : undefined,
        paymentMethod,
        voucherCode: appliedVoucher?.code,
      };

      console.log(
        "========================================"
      );
      console.log(
        "           ORDER PAYLOAD"
      );
      console.log(
        "========================================"
      );

      console.log(
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      // -----------------------------------------------
      // 7. CREATE ORDER
      // -----------------------------------------------

      console.log(
        "CALLING createOrder()..."
      );

      const result =
        await createOrder(
          token,
          payload
        );

      if (paymentMethod === "gcash") {
        const checkoutUrl = await createGcashCheckout(token, result._id);
        const paymentResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, "tupcorderup://payment-result");
        if (paymentResult.type !== "success") throw new Error("GCash checkout was not completed.");
        let paymentVerified = false;
        let verificationError: unknown;
        for (let attempt = 0; attempt < 5 && !paymentVerified; attempt += 1) {
          try {
            await verifyGcashCheckout(token, result._id);
            paymentVerified = true;
          } catch (error) {
            verificationError = error;
            if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
        if (!paymentVerified) throw verificationError instanceof Error ? verificationError : new Error("GCash payment could not be verified.");
      }

      // -----------------------------------------------
      // 8. SUCCESS
      // -----------------------------------------------

      console.log(
        "========================================"
      );
      console.log(
        "ORDER CREATED SUCCESSFULLY"
      );
      console.log(
        "========================================"
      );

      console.log(
        JSON.stringify(
          result,
          null,
          2
        )
      );

      // -----------------------------------------------
      // 9. CLEAR CART ONLY AFTER SUCCESS
      // -----------------------------------------------

      const completedOrderId = result._id;
      const completedStoreName = items[0]?.store ?? "Campus Store";
      const completedItemCount = itemCount;
      const completedTotal = result.total;
      clearCart();
      setAppliedVoucher(null);

      // -----------------------------------------------
      // 10. SUCCESS SCREEN
      // -----------------------------------------------

      router.replace({
        pathname: "/(client)/order-success",
        params: {
          orderId: completedOrderId,
          storeName: completedStoreName,
          itemCount: String(completedItemCount),
          total: String(completedTotal),
        },
      });
    } catch (error: any) {
      // -----------------------------------------------
      // DETAILED ERROR
      // -----------------------------------------------

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "PLACE ORDER FAILED"
      );
      console.log(
        "========================================"
      );

      console.log(
        "ERROR OBJECT:"
      );

      try {
        console.log(
          JSON.stringify(
            error,
            null,
            2
          )
        );
      } catch {
        console.log(
          error
        );
      }

      console.log(
        "ERROR MESSAGE:",
        error?.message
      );

      console.log(
        "ERROR STATUS:",
        error?.status
      );

      console.log(
        "ERROR RESPONSE:",
        error?.response
      );

      console.log(
        "ERROR DATA:",
        error?.data
      );

      console.log(
        "========================================"
      );

      // -----------------------------------------------
      // USER MESSAGE
      // -----------------------------------------------

      let message =
        getErrorMessage(error);

      // Make common backend errors clearer
      if (
        message
          .toLowerCase()
          .includes("unauthorized") ||
        message
          .toLowerCase()
          .includes("invalid token") ||
        message
          .toLowerCase()
          .includes("token expired") ||
        message
          .toLowerCase()
          .includes("login required")
      ) {
        message =
          "Your login session is no longer valid. Please log in again.";
      }

      Alert.alert(
        "Order Failed",
        message
      );
    } finally {
      setIsPlacingOrder(false);

      console.log(
        "========================================"
      );
      console.log(
        "         PLACE ORDER FINISHED"
      );
      console.log(
        "========================================"
      );
    }
  };

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
        "bottom",
      ]}
    >
      <View style={styles.screen}>

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed &&
                styles.headerButtonPressed,
            ]}
            onPress={() =>
              router.back()
            }
            disabled={isPlacingOrder}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={TEXT}
            />
          </Pressable>

          <View
            style={styles.headerCenter}
          >
            <Text
              style={styles.headerTitle}
            >
              Checkout
            </Text>

            <View
              style={styles.secureHeader}
            >
              <Ionicons
                name="lock-closed"
                size={10}
                color={SUCCESS}
              />

              <Text
                style={
                  styles.secureHeaderText
                }
              >
                Secure
              </Text>
            </View>
          </View>

          <View
            style={styles.headerButton}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* CONTENT */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* PROGRESS */}

          <View
            style={styles.progressCard}
          >
            <View
              style={styles.progressStep}
            >
              <View
                style={
                  styles.progressCircleDone
                }
              >
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={WHITE}
                />
              </View>

              <Text
                style={
                  styles.progressTextDone
                }
              >
                Cart
              </Text>
            </View>

            <View
              style={
                styles.progressLineActive
              }
            />

            <View
              style={styles.progressStep}
            >
              <View
                style={
                  styles.progressCircleCurrent
                }
              >
                <Text
                  style={
                    styles.progressNumber
                  }
                >
                  2
                </Text>
              </View>

              <Text
                style={
                  styles.progressTextCurrent
                }
              >
                Checkout
              </Text>
            </View>

            <View
              style={styles.progressLine}
            />

            <View
              style={styles.progressStep}
            >
              <View
                style={
                  styles.progressCircleInactive
                }
              >
                <Text
                  style={
                    styles.progressNumberInactive
                  }
                >
                  3
                </Text>
              </View>

              <Text
                style={
                  styles.progressTextInactive
                }
              >
                Done
              </Text>
            </View>
          </View>

          {/* PAGE INTRO */}

          <View
            style={styles.pageIntro}
          >
            <View>
              <Text
                style={styles.pageTitle}
              >
                Complete Your Order
              </Text>

              <Text
                style={styles.pageSubtitle}
              >
                Review your details before placing
                your order.
              </Text>
            </View>

            <View
              style={
                styles.itemCountBadge
              }
            >
              <Ionicons
                name="bag-outline"
                size={14}
                color={CARDINAL}
              />

              <Text
                style={
                  styles.itemCountText
                }
              >
                {itemCount}
              </Text>
            </View>
          </View>

          {/* PICKUP LOCATION */}

          <View
            style={styles.sectionHeader}
          >
            <View
              style={styles.sectionNumber}
            >
              <Text
                style={
                  styles.sectionNumberText
                }
              >
                1
              </Text>
            </View>

            <View>
              <Text
                style={styles.sectionTitle}
              >
                Receive Your Order
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Choose pickup or direct delivery.
              </Text>
            </View>
          </View>

          <View style={styles.fulfillmentOptions}>
            <Pressable
              style={[styles.fulfillmentOption, fulfillmentMethod === "pickup" && styles.fulfillmentOptionActive]}
              onPress={() => setFulfillmentMethod("pickup")}
            >
              <Ionicons name="bag-handle-outline" size={21} color={fulfillmentMethod === "pickup" ? CARDINAL : MUTED} />
              <Text style={[styles.fulfillmentTitle, fulfillmentMethod === "pickup" && styles.fulfillmentTitleActive]}>Pickup</Text>
              <Text style={styles.fulfillmentDescription}>Collect at the campus store</Text>
            </Pressable>
            <Pressable
              disabled={!deliveryEnabled}
              style={[
                styles.fulfillmentOption,
                fulfillmentMethod === "delivery" && styles.fulfillmentOptionActive,
                !deliveryEnabled && styles.fulfillmentOptionDisabled,
              ]}
              onPress={() => setFulfillmentMethod("delivery")}
            >
              <Ionicons name="bicycle-outline" size={21} color={fulfillmentMethod === "delivery" ? CARDINAL : MUTED} />
              <Text style={[styles.fulfillmentTitle, fulfillmentMethod === "delivery" && styles.fulfillmentTitleActive]}>Delivery</Text>
              <Text style={styles.fulfillmentDescription}>{deliveryEnabled ? "Deliver to your pinned location" : "Seller has disabled delivery"}</Text>
            </Pressable>
          </View>

          {fulfillmentMethod === "pickup" ? <View style={styles.pickupCard}>
            <View
              style={styles.pickupIcon}
            >
              <Ionicons
                name="location"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View
              style={styles.pickupContent}
            >
              <View
                style={
                  styles.pickupTitleRow
                }
              >
                <Text
                  style={
                    styles.pickupTitle
                  }
                >
                  {pickupLocation.name}
                </Text>

                <View
                  style={
                    styles.selectedBadge
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={SUCCESS}
                  />

                  <Text
                    style={
                      styles.selectedBadgeText
                    }
                  >
                    Selected
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.pickupDescription
                }
              >
                {
                  pickupLocation.description
                }
              </Text>

              <View
                style={styles.openRow}
              >
                <View
                  style={styles.openDot}
                />

                <Text
                  style={styles.openText}
                >
                  Available for pickup
                </Text>
              </View>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={21}
              color={SUCCESS}
            />
          </View> : (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.pickupIcon}>
                  <Ionicons name="location" size={23} color={CARDINAL} />
                </View>
                <View style={styles.deliveryHeaderCopy}>
                  <Text style={styles.pickupTitle}>Delivery Pin</Text>
                  <Text style={styles.pickupDescription}>Pin your exact position, then add a landmark.</Text>
                </View>
              </View>

              <Pressable
                style={[styles.pinButton, pinningLocation && styles.placeButtonDisabled]}
                disabled={pinningLocation}
                onPress={() => void handlePinLocation()}
              >
                {pinningLocation ? <ActivityIndicator size="small" color={WHITE} /> : <Ionicons name="locate" size={18} color={WHITE} />}
                <Text style={styles.pinButtonText}>{pinningLocation ? "Getting phone location..." : deliveryLatitude !== null ? "Update Campus Pin" : "Open Campus Map"}</Text>
              </Pressable>

              {deliveryLatitude !== null && deliveryLongitude !== null ? (
                <View style={styles.coordinatesBadge}>
                  <Ionicons name="checkmark-circle" size={17} color={SUCCESS} />
                  <Text style={styles.coordinatesText}>Pinned at {deliveryLatitude.toFixed(5)}, {deliveryLongitude.toFixed(5)}</Text>
                </View>
              ) : null}

              <Text style={styles.addressLabel}>Building, room, or landmark</Text>
              <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Example: CLA Building, Room 203"
                placeholderTextColor="#9A9A9E"
                multiline
                maxLength={300}
                style={styles.addressInput}
              />
              <Text style={styles.deliveryPrivacy}>Your pin is saved only with this order for delivery.</Text>
            </View>
          )}

          {/* PAYMENT */}

          <View
            style={
              styles.sectionHeaderPayment
            }
          >
            <View
              style={styles.sectionNumber}
            >
              <Text
                style={
                  styles.sectionNumberText
                }
              >
                2
              </Text>
            </View>

            <View>
              <Text
                style={styles.sectionTitle}
              >
                Payment Method
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Choose how you want to pay.
              </Text>
            </View>
          </View>

          {/* CASH */}

          <Pressable
            style={({ pressed }) => [
              styles.paymentCard,
              paymentMethod ===
                "cash" &&
                styles.paymentCardSelected,
              pressed &&
                styles.cardPressed,
            ]}
            onPress={() =>
              setPaymentMethod("cash")
            }
            disabled={isPlacingOrder}
          >
            <View
              style={styles.paymentIcon}
            >
              <Ionicons
                name="cash-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View
              style={styles.paymentContent}
            >
              <View
                style={
                  styles.paymentTitleRow
                }
              >
                <Text
                  style={
                    styles.paymentTitle
                  }
                >
                  {fulfillmentMethod === "delivery" ? "Cash on Delivery" : "Cash on Pickup"}
                </Text>

                {paymentMethod ===
                  "cash" && (
                  <View
                    style={
                      styles.recommendedBadge
                    }
                  >
                    <Text
                      style={
                        styles.recommendedText
                      }
                    >
                      Recommended
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={
                  styles.paymentDescription
                }
              >
                {fulfillmentMethod === "delivery" ? "Pay when your order is delivered." : "Pay directly when you collect your order."}
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  "cash" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                "cash" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>

          {/* GCASH */}

          <Pressable
            style={({ pressed }) => [
              styles.paymentCard,
              paymentMethod ===
                "gcash" &&
                styles.paymentCardSelected,
              pressed &&
                styles.cardPressed,
            ]}
            onPress={() => setPaymentMethod("gcash")}
            disabled={isPlacingOrder || !checkoutStore?.gcashEnabled}
            accessibilityState={{ disabled: isPlacingOrder || !checkoutStore?.gcashEnabled }}
          >
            <View
              style={styles.paymentIcon}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={23}
                color={CARDINAL}
              />
            </View>

            <View
              style={styles.paymentContent}
            >
              <Text
                style={
                  styles.paymentTitle
                }
              >
                GCash
              </Text>

              <Text
                style={
                  styles.paymentDescription
                }
              >
                {checkoutStore?.gcashEnabled ? "Pay securely through the official PayMongo GCash checkout." : "This seller has not enabled GCash."}
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  "gcash" &&
                  styles.radioSelected,
              ]}
            >
              {paymentMethod ===
                "gcash" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>

          {paymentMethod === "gcash" && checkoutStore?.gcashEnabled && (
            <View style={styles.gcashPaymentBox}>
              <View style={styles.gcashMerchantRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.gcashMerchantLabel}>SECURE PAYMENT</Text>
                  <Text style={styles.gcashMerchantName}>PayMongo Checkout</Text>
                  <Text style={styles.gcashMerchantNumber}>You will be redirected to GCash after placing the order.</Text>
                </View>
              </View>
              <Text style={styles.gcashHelp}>The app confirms payment directly with PayMongo. No manual reference number is needed.</Text>
            </View>
          )}

          {/* ORDER ITEMS */}

          <View
            style={
              styles.sectionHeaderItems
            }
          >
            <View
              style={styles.sectionNumber}
            >
              <Text
                style={
                  styles.sectionNumberText
                }
              >
                3
              </Text>
            </View>

            <View>
              <Text
                style={styles.sectionTitle}
              >
                Order Items
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Items included in this order.
              </Text>
            </View>
          </View>

          <View
            style={styles.itemsCard}
          >
            {items.map(
              (item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[
                    styles.orderItem,
                    index !==
                      items.length - 1 &&
                      styles.orderItemBorder,
                  ]}
                >
                  <View
                    style={
                      styles.quantityBadge
                    }
                  >
                    <Text
                      style={
                        styles.quantityText
                      }
                    >
                      {item.quantity}×
                    </Text>
                  </View>

                  <View
                    style={styles.itemInfo}
                  >
                    <Text
                      style={
                        styles.itemName
                      }
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.itemStore
                      }
                      numberOfLines={1}
                    >
                      {item.store}
                    </Text>

                    <Text
                      style={
                        styles.itemUnitPrice
                      }
                    >
                      ₱
                      {Number(
                        item.price
                      ).toFixed(2)}{" "}
                      each
                    </Text>
                  </View>

                  <Text
                    style={styles.itemPrice}
                  >
                    ₱
                    {(
                      Number(item.price) *
                      item.quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* SUMMARY */}

          <View
            style={
              styles.sectionHeaderSummary
            }
          >
            <View
              style={styles.sectionNumber}
            >
              <Text
                style={
                  styles.sectionNumberText
                }
              >
                4
              </Text>
            </View>

            <View>
              <Text
                style={styles.sectionTitle}
              >
                Order Summary
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Final amount for this order.
              </Text>
            </View>
          </View>

          <View
            style={styles.summaryCard}
          >
            <View
              style={styles.summaryRow}
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Items ({itemCount})
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                ₱{subtotal.toFixed(2)}
              </Text>
            </View>

            <View
              style={styles.summaryRow}
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Pickup Fee
              </Text>

              <View
                style={styles.freeBadge}
              >
                <Text
                  style={styles.freeText}
                >
                  FREE
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.voucherRow,
                appliedVoucher && styles.voucherRowApplied,
              ]}
              onPress={() => void handleChooseVoucher()}
            >
              <View style={styles.voucherCopy}>
                <Ionicons name="ticket-outline" size={18} color={CARDINAL} />
                <View>
                  <Text style={styles.summaryLabel}>Seller Voucher</Text>
                  <Text style={styles.voucherHint}>
                    {appliedVoucher
                      ? `${appliedVoucher.code} · ${appliedVoucher.discountPercent}% off`
                      : "View vouchers enabled by this seller"}
                  </Text>
                </View>
              </View>
              <Text style={styles.voucherValue}>
                {voucherDiscount ? `-₱${voucherDiscount.toFixed(2)}` : "Choose"}
              </Text>
            </Pressable>

            <View
              style={styles.summaryDivider}
            />

            <View
              style={styles.totalRow}
            >
              <View>
                <Text
                  style={styles.totalLabel}
                >
                  Total Amount
                </Text>

                <Text
                  style={
                    styles.totalSubtext
                  }
                >
                  {paymentMethod ===
                  "cash"
                    ? "Cash on pickup"
                    : "GCash payment"}
                </Text>
              </View>

              <Text
                style={styles.totalValue}
              >
                ₱{total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* SECURITY */}

          <View
            style={styles.securityCard}
          >
            <View
              style={styles.securityIcon}
            >
              <Ionicons
                name="shield-checkmark"
                size={19}
                color={SUCCESS}
              />
            </View>

            <View
              style={styles.securityContent}
            >
              <Text
                style={styles.securityTitle}
              >
                Secure Checkout
              </Text>

              <Text
                style={styles.securityText}
              >
                Your order details are protected and will only
                be shared with the campus store handling your
                order.
              </Text>
            </View>
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>

        {/* BOTTOM BAR */}

        <View
          style={styles.bottomBar}
        >
          <View
            style={styles.bottomTotal}
          >
            <Text
              style={styles.bottomLabel}
            >
              Total Amount
            </Text>

            <Text
              style={styles.bottomPrice}
            >
              ₱{total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.placeButton,
              pressed &&
                !isPlacingOrder &&
                styles.buttonPressed,
              isPlacingOrder &&
                styles.placeButtonDisabled,
            ]}
            onPress={
              handlePlaceOrder
            }
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={WHITE}
                />

                <Text
                  style={
                    styles.placeButtonText
                  }
                >
                  Placing...
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.placeButtonText
                  }
                >
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

        <CampusLocationPicker
          visible={mapVisible}
          initialPin={deliveryLatitude !== null && deliveryLongitude !== null ? { latitude: deliveryLatitude, longitude: deliveryLongitude } : null}
          phoneLocation={phoneLocation}
          onClose={() => setMapVisible(false)}
          onConfirm={(pin) => void handleConfirmCampusPin(pin)}
        />

        <Modal
          visible={voucherModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setVoucherModalVisible(false)}
        >
          <View style={styles.sheetOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setVoucherModalVisible(false)}
            />
            <View style={styles.voucherSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleCopy}>
                  <Text style={styles.sheetTitle}>Choose a voucher</Text>
                  <Text style={styles.sheetSubtitle}>
                    Vouchers available for this store and order.
                  </Text>
                </View>
                <Pressable
                  style={styles.sheetCloseButton}
                  onPress={() => setVoucherModalVisible(false)}
                >
                  <Ionicons name="close" size={21} color={TEXT} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.voucherList}
                contentContainerStyle={styles.voucherListContent}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  style={[
                    styles.voucherOption,
                    !appliedVoucher && styles.voucherOptionSelected,
                  ]}
                  onPress={() => {
                    setAppliedVoucher(null);
                    setVoucherModalVisible(false);
                  }}
                >
                  <View style={styles.noVoucherIcon}>
                    <Ionicons name="close-circle-outline" size={22} color={MUTED} />
                  </View>
                  <View style={styles.voucherOptionCopy}>
                    <Text style={styles.voucherOptionTitle}>No voucher</Text>
                    <Text style={styles.voucherOptionDescription}>
                      Continue without applying a discount.
                    </Text>
                  </View>
                  <Ionicons
                    name={!appliedVoucher ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={!appliedVoucher ? CARDINAL : "#B7B7BA"}
                  />
                </Pressable>

                {loadingVouchers ? (
                  <View style={styles.voucherStatus}>
                    <ActivityIndicator color={CARDINAL} />
                    <Text style={styles.voucherStatusText}>Loading vouchers...</Text>
                  </View>
                ) : voucherError ? (
                  <View style={styles.voucherStatus}>
                    <Ionicons name="alert-circle-outline" size={28} color={CARDINAL} />
                    <Text style={styles.voucherStatusTitle}>Unable to load vouchers</Text>
                    <Text style={styles.voucherStatusText}>{voucherError}</Text>
                  </View>
                ) : voucherOptions.length === 0 ? (
                  <View style={styles.voucherStatus}>
                    <Ionicons name="ticket-outline" size={30} color={MUTED} />
                    <Text style={styles.voucherStatusTitle}>No vouchers available</Text>
                    <Text style={styles.voucherStatusText}>
                      This seller has no enabled voucher for your cart yet.
                    </Text>
                  </View>
                ) : (
                  voucherOptions.map((voucher) => {
                    const eligible = subtotal >= voucher.minimumOrder;
                    const selected = appliedVoucher?._id === voucher._id;
                    const eligibleSubtotal = voucher.productIds?.length
                      ? items
                        .filter((item) => voucher.productIds?.includes(item.id))
                        .reduce((amount, item) => amount + item.price * item.quantity, 0)
                      : subtotal;
                    const savings = eligible
                      ? eligibleSubtotal * voucher.discountPercent / 100
                      : 0;

                    return (
                      <Pressable
                        key={voucher._id}
                        disabled={!eligible}
                        style={[
                          styles.voucherOption,
                          selected && styles.voucherOptionSelected,
                          !eligible && styles.voucherOptionDisabled,
                        ]}
                        onPress={() => {
                          setAppliedVoucher(voucher);
                          setVoucherModalVisible(false);
                        }}
                      >
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeValue}>{voucher.discountPercent}%</Text>
                          <Text style={styles.discountBadgeLabel}>OFF</Text>
                        </View>
                        <View style={styles.voucherOptionCopy}>
                          <View style={styles.voucherCodeRow}>
                            <Text style={styles.voucherCode}>{voucher.code}</Text>
                            {eligible && savings > 0 ? (
                              <Text style={styles.savingsText}>Save ₱{savings.toFixed(2)}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.voucherOptionTitle}>{voucher.title}</Text>
                          <Text style={styles.voucherOptionDescription}>
                            {eligible
                              ? `Minimum spend ₱${voucher.minimumOrder.toFixed(2)}`
                              : `Add ₱${Math.max(0, voucher.minimumOrder - subtotal).toFixed(2)} more to use`}
                          </Text>
                        </View>
                        <Ionicons
                          name={eligible ? (selected ? "radio-button-on" : "radio-button-off") : "lock-closed"}
                          size={22}
                          color={selected ? CARDINAL : "#B7B7BA"}
                        />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.voucherNotice}>
                <Ionicons name="information-circle-outline" size={17} color={CARDINAL} />
                <Text style={styles.voucherNoticeText}>
                  A used voucher is consumed after checkout, even if the order is cancelled.
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={orderConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setOrderConfirmVisible(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmIcon}>
                <Ionicons name="receipt-outline" size={27} color={CARDINAL} />
              </View>
              <Text style={styles.confirmTitle}>Place your order?</Text>
              <Text style={styles.confirmSubtitle}>
                Check these details before sending your order to the seller.
              </Text>
              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{fulfillmentMethod === "delivery" ? "Deliver to" : "Pickup"}</Text>
                  <Text style={styles.confirmValue}>{fulfillmentMethod === "delivery" ? deliveryAddress : pickupLocation.name}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Payment</Text>
                  <Text style={styles.confirmValue}>
                    {paymentMethod === "cash" ? "Cash on Pickup" : "GCash"}
                  </Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Items</Text>
                  <Text style={styles.confirmValue}>{itemCount}</Text>
                </View>
                <View style={[styles.confirmRow, styles.confirmTotalRow]}>
                  <Text style={styles.confirmTotalLabel}>Total</Text>
                  <Text style={styles.confirmTotalValue}>₱{total.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.confirmActions}>
                <Pressable
                  style={styles.reviewButton}
                  onPress={() => setOrderConfirmVisible(false)}
                >
                  <Text style={styles.reviewButtonText}>Review Again</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmPlaceButton}
                  onPress={() => {
                    setOrderConfirmVisible(false);
                    void confirmPlaceOrder();
                  }}
                >
                  <Text style={styles.confirmPlaceButtonText}>Place Order</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
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

  gcashPaymentBox: { marginTop: 2, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  gcashMerchantRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  gcashMerchantLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1, color: "#2563EB" },
  gcashMerchantName: { marginTop: 2, fontSize: 13, fontWeight: "900", color: TEXT },
  gcashMerchantNumber: { marginTop: 1, fontSize: 12, fontWeight: "700", color: MUTED },
  gcashReferenceInput: { height: 47, marginTop: 13, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: "#93C5FD", backgroundColor: WHITE, color: TEXT, fontSize: 13, fontWeight: "700" },
  gcashHelp: { marginTop: 8, fontSize: 9.5, lineHeight: 14, color: MUTED },

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

  voucherRow: {
    minHeight: 47,
    marginTop: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FBECEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fulfillmentOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 11,
  },

  fulfillmentOption: {
    flex: 1,
    minHeight: 104,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },

  fulfillmentOptionActive: {
    borderColor: CARDINAL,
    backgroundColor: "#FFF7F8",
  },

  fulfillmentOptionDisabled: {
    opacity: 0.5,
    backgroundColor: "#F1F1F2",
  },

  fulfillmentTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "900",
    color: TEXT,
  },

  fulfillmentTitleActive: {
    color: CARDINAL,
  },

  fulfillmentDescription: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    color: MUTED,
  },

  deliveryCard: {
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },

  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  deliveryHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  pinButton: {
    height: 45,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  pinButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  coordinatesBadge: {
    marginTop: 10,
    padding: 10,
    borderRadius: 11,
    backgroundColor: SOFT_GREEN,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  coordinatesText: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: "700",
    color: SUCCESS,
  },

  addressLabel: {
    marginTop: 14,
    marginBottom: 7,
    fontSize: 10.5,
    fontWeight: "800",
    color: TEXT,
  },

  addressInput: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#FAFAFB",
    color: TEXT,
    fontSize: 11,
    textAlignVertical: "top",
  },

  deliveryPrivacy: {
    marginTop: 7,
    fontSize: 9,
    lineHeight: 13,
    color: MUTED,
  },

  voucherRowApplied: {
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#EDC4CB",
  },

  voucherCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  voucherHint: {
    marginTop: 2,
    fontSize: 9.5,
    color: MUTED,
  },

  voucherValue: {
    marginLeft: 8,
    color: CARDINAL,
    fontSize: 11,
    fontWeight: "900",
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

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16, 16, 18, 0.48)",
  },

  voucherSheet: {
    maxHeight: "82%",
    paddingTop: 9,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: WHITE,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4D4D6",
    alignSelf: "center",
    marginBottom: 15,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  sheetTitleCopy: {
    flex: 1,
    paddingRight: 12,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  sheetSubtitle: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: MUTED,
  },

  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3F3F4",
    alignItems: "center",
    justifyContent: "center",
  },

  voucherList: {
    flexGrow: 0,
  },

  voucherListContent: {
    gap: 10,
    paddingBottom: 4,
  },

  voucherOption: {
    minHeight: 82,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
  },

  voucherOptionSelected: {
    borderColor: CARDINAL,
    backgroundColor: "#FFF8F9",
  },

  voucherOptionDisabled: {
    opacity: 0.55,
    backgroundColor: "#F7F7F8",
  },

  noVoucherIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F1F2",
    alignItems: "center",
    justifyContent: "center",
  },

  discountBadge: {
    width: 58,
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: SOFT_RED,
    borderWidth: 1,
    borderColor: "#F1CBD2",
    alignItems: "center",
    justifyContent: "center",
  },

  discountBadgeValue: {
    fontSize: 16,
    fontWeight: "900",
    color: CARDINAL,
  },

  discountBadgeLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: CARDINAL,
  },

  voucherOptionCopy: {
    flex: 1,
    marginHorizontal: 11,
  },

  voucherCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 3,
  },

  voucherCode: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: CARDINAL,
  },

  savingsText: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: SOFT_GREEN,
    fontSize: 8.5,
    fontWeight: "900",
    color: SUCCESS,
  },

  voucherOptionTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: TEXT,
  },

  voucherOptionDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: MUTED,
  },

  voucherStatus: {
    minHeight: 142,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  voucherStatusTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  voucherStatusText: {
    marginTop: 7,
    fontSize: 10.5,
    lineHeight: 16,
    color: MUTED,
    textAlign: "center",
  },

  voucherNotice: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#FFF5F6",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  voucherNoticeText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: CARDINAL_DARK,
  },

  confirmOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "rgba(16, 16, 18, 0.52)",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmCard: {
    width: "100%",
    maxWidth: 410,
    padding: 20,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: "center",
  },

  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: SOFT_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
  },

  confirmSubtitle: {
    marginTop: 5,
    paddingHorizontal: 8,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
    textAlign: "center",
  },

  confirmDetails: {
    width: "100%",
    marginTop: 17,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#F7F7F8",
  },

  confirmRow: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  confirmLabel: {
    fontSize: 10.5,
    color: MUTED,
  },

  confirmValue: {
    flexShrink: 1,
    fontSize: 10.5,
    fontWeight: "800",
    color: TEXT,
    textAlign: "right",
  },

  confirmTotalRow: {
    marginTop: 8,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  confirmTotalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  confirmTotalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: CARDINAL,
  },

  confirmActions: {
    width: "100%",
    marginTop: 17,
    flexDirection: "row",
    gap: 10,
  },

  reviewButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: TEXT,
  },

  confirmPlaceButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmPlaceButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: WHITE,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

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

let styles = createStyles(LIGHT_COLORS);
