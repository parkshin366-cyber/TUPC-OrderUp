import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getMyStore,
  saveMyStore,
  Store,
} from "../../services/api";

import { useAuth } from "../../context/AuthContext";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const WHITE = "#FFFFFF";
const BORDER = "#E7E7E8";
const GREEN = "#15803D";
const RED = "#B91C1C";

export default function SellerStore() {
  const { token } = useAuth();

  // =====================================================
  // STORE STATE
  // =====================================================

  const [store, setStore] = useState<Store | null>(
    null
  );

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [openTime, setOpenTime] = useState("7:00 AM");
  const [closeTime, setCloseTime] = useState("6:00 PM");

  const [storeOpen, setStoreOpen] = useState(true);
  const [pickupEnabled, setPickupEnabled] =
    useState(true);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] =
    useState(false);

  // =====================================================
  // LOAD STORE
  // =====================================================

  const loadStore = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getMyStore(token);

      if (result) {
        setStore(result);

        setStoreName(result.name ?? "");
        setDescription(result.description ?? "");
        setLocation(result.location ?? "");

        setOpenTime(
          result.openTime || "7:00 AM"
        );

        setCloseTime(
          result.closeTime || "6:00 PM"
        );

        setStoreOpen(
          result.isOpen ?? true
        );

        setPickupEnabled(
          result.pickupEnabled ?? true
        );
      } else {
        // No store yet.
        // Start with blank fields.
        setStore(null);

        setStoreName("");
        setDescription("");
        setLocation("");

        setOpenTime("7:00 AM");
        setCloseTime("6:00 PM");

        setStoreOpen(true);
        setPickupEnabled(true);
      }

      setHasChanges(false);
    } catch (error) {
      console.error(
        "LOAD SELLER STORE ERROR:",
        error
      );

      Alert.alert(
        "Unable to Load Store",
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your store."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  // =====================================================
  // CHANGE TRACKING
  // =====================================================

  const markChanged = () => {
    setHasChanges(true);
  };

  // =====================================================
  // SAVE STORE
  // =====================================================

  const saveChanges = async () => {
    if (!token) {
      Alert.alert(
        "Session Required",
        "Please log in again."
      );
      return;
    }

    const trimmedName = storeName.trim();
    const trimmedDescription =
      description.trim();
    const trimmedLocation =
      location.trim();
    const trimmedOpenTime =
      openTime.trim();
    const trimmedCloseTime =
      closeTime.trim();

    if (!trimmedName) {
      Alert.alert(
        "Store Name Required",
        "Please enter your store name."
      );
      return;
    }

    if (!trimmedLocation) {
      Alert.alert(
        "Location Required",
        "Please enter your pickup location."
      );
      return;
    }

    if (!trimmedOpenTime) {
      Alert.alert(
        "Opening Time Required",
        "Please enter your opening time."
      );
      return;
    }

    if (!trimmedCloseTime) {
      Alert.alert(
        "Closing Time Required",
        "Please enter your closing time."
      );
      return;
    }

    try {
      setSaving(true);

      const savedStore = await saveMyStore(
        token,
        {
          name: trimmedName,
          description: trimmedDescription,
          location: trimmedLocation,
          openTime: trimmedOpenTime,
          closeTime: trimmedCloseTime,
          isOpen: storeOpen,
          pickupEnabled,
        }
      );

      setStore(savedStore);

      setStoreName(savedStore.name);
      setDescription(
        savedStore.description ?? ""
      );
      setLocation(
        savedStore.location ?? ""
      );

      setOpenTime(
        savedStore.openTime || "7:00 AM"
      );

      setCloseTime(
        savedStore.closeTime || "6:00 PM"
      );

      setStoreOpen(
        savedStore.isOpen ?? true
      );

      setPickupEnabled(
        savedStore.pickupEnabled ?? true
      );

      setHasChanges(false);

      Alert.alert(
        "Store Updated",
        "Your store information has been saved successfully."
      );
    } catch (error) {
      console.error(
        "SAVE STORE ERROR:",
        error
      );

      Alert.alert(
        "Unable to Save Store",
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your store."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STORE STATUS
  // =====================================================

  const toggleStoreStatus = (
    value: boolean
  ) => {
    setStoreOpen(value);
    markChanged();
  };

  const togglePickup = (
    value: boolean
  ) => {
    setPickupEnabled(value);
    markChanged();
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View style={styles.loadingScreen}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="storefront-outline"
              size={32}
              color={CARDINAL}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={CARDINAL}
          />

          <Text style={styles.loadingTitle}>
            Loading your store...
          </Text>

          <Text style={styles.loadingText}>
            Getting your store information from the server.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              STORE MANAGEMENT
            </Text>

            <Text style={styles.title}>
              My Store
            </Text>

            <Text style={styles.subtitle}>
              Manage your store information and availability
            </Text>
          </View>

          <View
            style={[
              styles.headerStatus,
              storeOpen
                ? styles.headerStatusOpen
                : styles.headerStatusClosed,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: storeOpen
                    ? GREEN
                    : RED,
                },
              ]}
            />

            <Text
              style={[
                styles.headerStatusText,
                {
                  color: storeOpen
                    ? GREEN
                    : RED,
                },
              ]}
            >
              {storeOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        {/* STORE PREVIEW */}

        <View style={styles.previewCard}>
          <View style={styles.previewCover}>
            <View style={styles.coverPatternOne} />
            <View style={styles.coverPatternTwo} />

            <View style={styles.storeLogo}>
              <Ionicons
                name="storefront"
                size={30}
                color={WHITE}
              />
            </View>
          </View>

          <View style={styles.previewBody}>
            <View style={styles.previewTitleRow}>
              <View style={styles.previewNameArea}>
                <Text
                  style={styles.previewName}
                  numberOfLines={1}
                >
                  {storeName || "Your Store"}
                </Text>

                <View style={styles.verifiedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={CARDINAL}
                  />

                  <Text style={styles.verifiedText}>
                    TUPC Seller
                  </Text>
                </View>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons
                  name="star"
                  size={13}
                  color={GOLD}
                />

                <Text style={styles.ratingText}>
                  4.8
                </Text>
              </View>
            </View>

            <Text
              style={styles.previewDescription}
              numberOfLines={2}
            >
              {description ||
                "Store description"}
            </Text>

            <View style={styles.previewInfoRow}>
              <View style={styles.previewInfo}>
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={MUTED}
                />

                <Text
                  style={styles.previewInfoText}
                  numberOfLines={1}
                >
                  {location ||
                    "Pickup location"}
                </Text>
              </View>

              <View style={styles.previewInfo}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={MUTED}
                />

                <Text
                  style={styles.previewInfoText}
                >
                  {openTime} - {closeTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* STORE STATUS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Store Status
          </Text>

          <Text style={styles.sectionSubtitle}>
            Control whether customers can place orders
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={
                storeOpen
                  ? "storefront-outline"
                  : "storefront"
              }
              size={22}
              color={
                storeOpen
                  ? GREEN
                  : RED
              }
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {storeOpen
                ? "Store is Open"
                : "Store is Closed"}
            </Text>

            <Text style={styles.statusDescription}>
              {storeOpen
                ? "Customers can currently place orders."
                : "Customers cannot place new orders."}
            </Text>
          </View>

          <Switch
            value={storeOpen}
            onValueChange={
              toggleStoreStatus
            }
            disabled={saving}
            trackColor={{
              false: "#D4D4D8",
              true: "#DFAAB3",
            }}
            thumbColor={
              storeOpen
                ? CARDINAL
                : "#F4F4F5"
            }
          />
        </View>

        {/* BASIC INFORMATION */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Store Information
          </Text>

          <Text style={styles.sectionSubtitle}>
            Keep your customer-facing details updated
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* STORE NAME */}

          <Text style={styles.inputLabel}>
            Store Name
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="storefront-outline"
              size={19}
              color={MUTED}
            />

            <TextInput
              value={storeName}
              onChangeText={(value) => {
                setStoreName(value);
                markChanged();
              }}
              placeholder="Enter store name"
              placeholderTextColor="#A1A1AA"
              style={styles.input}
              editable={!saving}
            />
          </View>

          {/* DESCRIPTION */}

          <Text style={styles.inputLabel}>
            Store Description
          </Text>

          <View
            style={[
              styles.inputWrapper,
              styles.textAreaWrapper,
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={19}
              color={MUTED}
              style={styles.textAreaIcon}
            />

            <TextInput
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                markChanged();
              }}
              placeholder="Describe your store..."
              placeholderTextColor="#A1A1AA"
              style={[
                styles.input,
                styles.textArea,
              ]}
              multiline
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* LOCATION */}

          <Text style={styles.inputLabel}>
            Pickup Location
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={19}
              color={MUTED}
            />

            <TextInput
              value={location}
              onChangeText={(value) => {
                setLocation(value);
                markChanged();
              }}
              placeholder="Enter pickup location"
              placeholderTextColor="#A1A1AA"
              style={styles.input}
              editable={!saving}
            />
          </View>
        </View>

        {/* BUSINESS HOURS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Business Hours
          </Text>

          <Text style={styles.sectionSubtitle}>
            Let customers know when your store operates
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.hoursRow}>
            <View style={styles.hoursIcon}>
              <Ionicons
                name="sunny-outline"
                size={20}
                color={GOLD}
              />
            </View>

            <View style={styles.hoursContent}>
              <Text style={styles.hoursTitle}>
                Monday - Saturday
              </Text>

              <Text style={styles.hoursSubtitle}>
                Regular operating hours
              </Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>
                Opening
              </Text>

              <View style={styles.timeInput}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={MUTED}
                />

                <TextInput
                  value={openTime}
                  onChangeText={(value) => {
                    setOpenTime(value);
                    markChanged();
                  }}
                  style={styles.timeTextInput}
                  placeholder="7:00 AM"
                  placeholderTextColor="#A1A1AA"
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.timeArrow}>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={MUTED}
              />
            </View>

            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>
                Closing
              </Text>

              <View style={styles.timeInput}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={MUTED}
                />

                <TextInput
                  value={closeTime}
                  onChangeText={(value) => {
                    setCloseTime(value);
                    markChanged();
                  }}
                  style={styles.timeTextInput}
                  placeholder="6:00 PM"
                  placeholderTextColor="#A1A1AA"
                  editable={!saving}
                />
              </View>
            </View>
          </View>

          <View style={styles.closedDay}>
            <View style={styles.closedDayIcon}>
              <Ionicons
                name="moon-outline"
                size={17}
                color={MUTED}
              />
            </View>

            <View style={styles.closedDayText}>
              <Text style={styles.closedDayTitle}>
                Sunday
              </Text>

              <Text
                style={styles.closedDaySubtitle}
              >
                Closed
              </Text>
            </View>

            <View style={styles.closedBadge}>
              <Text
                style={styles.closedBadgeText}
              >
                CLOSED
              </Text>
            </View>
          </View>
        </View>

        {/* ORDER SETTINGS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Order Settings
          </Text>

          <Text style={styles.sectionSubtitle}>
            Configure how customers receive their orders
          </Text>
        </View>

        <View style={styles.settingCard}>
          {/* PICKUP */}

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons
                name="bag-handle-outline"
                size={20}
                color={CARDINAL}
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                Campus Pickup
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Allow customers to pick up orders at your
                store.
              </Text>
            </View>

            <Switch
              value={pickupEnabled}
              onValueChange={
                togglePickup
              }
              disabled={saving}
              trackColor={{
                false: "#D4D4D8",
                true: "#DFAAB3",
              }}
              thumbColor={
                pickupEnabled
                  ? CARDINAL
                  : "#F4F4F5"
              }
            />
          </View>

          <View
            style={styles.settingDivider}
          />

          {/* CASH */}

          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIcon,
                styles.goldSettingIcon,
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={GOLD}
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                Cash Payment
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Customers can pay when they pick up
                their order.
              </Text>
            </View>

            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>
                ENABLED
              </Text>
            </View>
          </View>

          <View
            style={styles.settingDivider}
          />

          {/* GCASH */}

          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIcon,
                styles.gcashIcon,
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color="#2563EB"
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                GCash
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Accept digital payments from customers.
              </Text>
            </View>

            <View
              style={[
                styles.enabledBadge,
                styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.enabledText,
                  styles.pendingText,
                ]}
              >
                SETUP
              </Text>
            </View>
          </View>
        </View>

        {/* STORE VISIBILITY */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={CARDINAL}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Customer Visibility
            </Text>

            <Text style={styles.infoText}>
              Your store information will appear on the
              TUPC-OrderUp client marketplace.
            </Text>
          </View>
        </View>

        {/* SAVE */}

        <Pressable
          style={[
            styles.saveButton,
            (!hasChanges || saving) &&
              styles.saveButtonDisabled,
          ]}
          onPress={saveChanges}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={WHITE}
            />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color={WHITE}
            />
          )}

          <Text style={styles.saveButtonText}>
            {saving
              ? "Saving..."
              : hasChanges
              ? "Save Changes"
              : "All Changes Saved"}
          </Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  loadingText: {
    marginTop: 5,
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: CARDINAL,
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },

  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },

  headerStatusOpen: {
    backgroundColor: "#ECFDF3",
  },

  headerStatusClosed: {
    backgroundColor: "#FEF2F2",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  headerStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  previewCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 22,
  },

  previewCover: {
    height: 105,
    backgroundColor: CARDINAL_DARK,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  coverPatternOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(255,255,255,0.06)",
    right: -55,
    top: -75,
  },

  coverPatternTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor:
      "rgba(216,181,106,0.12)",
    left: -35,
    bottom: -65,
  },

  storeLogo: {
    width: 62,
    height: 62,
    borderRadius: 19,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor:
      "rgba(255,255,255,0.8)",
  },

  previewBody: {
    padding: 15,
  },

  previewTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  previewNameArea: {
    flex: 1,
  },

  previewName: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: CARDINAL,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  ratingText: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
  },

  previewDescription: {
    marginTop: 9,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
  },

  previewInfoRow: {
    marginTop: 12,
    gap: 8,
  },

  previewInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  previewInfoText: {
    flex: 1,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
  },

  statusCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 22,
  },

  statusIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    lineHeight: 15,
  },

  formCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginBottom: 22,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 7,
    marginTop: 2,
  },

  inputWrapper: {
    minHeight: 48,
    backgroundColor: "#FAFAFA",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    paddingVertical: 11,
  },

  textAreaWrapper: {
    alignItems: "flex-start",
    minHeight: 92,
  },

  textAreaIcon: {
    marginTop: 13,
  },

  textArea: {
    minHeight: 70,
    lineHeight: 19,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 17,
  },

  hoursIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },

  hoursContent: {
    flex: 1,
  },

  hoursTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  hoursSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  timeField: {
    flex: 1,
  },

  timeLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
    marginBottom: 6,
  },

  timeInput: {
    height: 45,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
  },

  timeTextInput: {
    flex: 1,
    color: TEXT,
    fontSize: 12,
    paddingVertical: 0,
  },

  timeArrow: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  closedDay: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  closedDayIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },

  closedDayText: {
    flex: 1,
  },

  closedDayTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
  },

  closedDaySubtitle: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
  },

  closedBadge: {
    backgroundColor: "#F4F4F5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  closedBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: MUTED,
  },

  settingCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  goldSettingIcon: {
    backgroundColor: "#FFFBEB",
  },

  gcashIcon: {
    backgroundColor: "#EFF6FF",
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  settingDescription: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
  },

  settingDivider: {
    height: 1,
    backgroundColor: BORDER,
  },

  enabledBadge: {
    backgroundColor: "#ECFDF3",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  enabledText: {
    fontSize: 8,
    fontWeight: "800",
    color: GREEN,
  },

  pendingBadge: {
    backgroundColor: "#EFF6FF",
  },

  pendingText: {
    color: "#2563EB",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAECEF",
    borderWidth: 1,
    borderColor: "#E9BBC3",
    borderRadius: 16,
    padding: 13,
    gap: 10,
    marginBottom: 16,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  infoText: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: "#7D1021",
  },

  saveButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveButtonDisabled: {
    backgroundColor: "#8F1029",
    opacity: 0.72,
  },

  saveButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "800",
  },
});