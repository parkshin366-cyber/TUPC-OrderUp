import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARDINAL = "#A6192E";
const GOLD = "#D8B56A";
const TEXT = "#171717";
const MUTED = "#737373";
const BG = "#F7F7F8";
const WHITE = "#FFFFFF";
const BORDER = "#E7E7E8";
const GREEN = "#15803D";
const RED = "#B91C1C";
const ORANGE = "#B45309";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minimumStock: number;
  unit: string;
  price: number;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    name: "Chicken Rice Meal",
    category: "Meals",
    stock: 24,
    minimumStock: 10,
    unit: "servings",
    price: 89,
  },
  {
    id: "2",
    name: "Beef Tapa Meal",
    category: "Meals",
    stock: 18,
    minimumStock: 8,
    unit: "servings",
    price: 99,
  },
  {
    id: "3",
    name: "Iced Coffee",
    category: "Drinks",
    stock: 32,
    minimumStock: 10,
    unit: "cups",
    price: 55,
  },
  {
    id: "4",
    name: "French Fries",
    category: "Snacks",
    stock: 7,
    minimumStock: 10,
    unit: "orders",
    price: 45,
  },
  {
    id: "5",
    name: "Chocolate Cake",
    category: "Desserts",
    stock: 0,
    minimumStock: 5,
    unit: "slices",
    price: 65,
  },
];

const FILTERS = [
  "All",
  "In Stock",
  "Low Stock",
  "Out of Stock",
] as const;

type Filter = (typeof FILTERS)[number];

export default function SellerInventory() {
  const [inventory, setInventory] =
    useState<InventoryItem[]>(INITIAL_INVENTORY);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const getStatus = (item: InventoryItem): StockStatus => {
    if (item.stock <= 0) return "Out of Stock";
    if (item.stock <= item.minimumStock) return "Low Stock";
    return "In Stock";
  };

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const status = getStatus(item);

      const matchesFilter =
        filter === "All" || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [inventory, search, filter]);

  const totalItems = inventory.length;

  const inStock = inventory.filter(
    (item) => getStatus(item) === "In Stock"
  ).length;

  const lowStock = inventory.filter(
    (item) => getStatus(item) === "Low Stock"
  ).length;

  const outOfStock = inventory.filter(
    (item) => getStatus(item) === "Out of Stock"
  ).length;

  const adjustStock = (
    item: InventoryItem,
    amount: number
  ) => {
    setInventory((current) =>
      current.map((inventoryItem) => {
        if (inventoryItem.id !== item.id) {
          return inventoryItem;
        }

        return {
          ...inventoryItem,
          stock: Math.max(
            0,
            inventoryItem.stock + amount
          ),
        };
      })
    );
  };

  const addStock = (item: InventoryItem) => {
    Alert.prompt(
      "Add Stock",
      `How many ${item.unit} would you like to add?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add",
          onPress: (value?: string) => {
            const quantity = Number(value);

            if (
              !value ||
              Number.isNaN(quantity) ||
              quantity <= 0
            ) {
              Alert.alert(
                "Invalid Quantity",
                "Please enter a valid quantity."
              );
              return;
            }

            adjustStock(item, quantity);
          },
        },
      ],
      "plain-text"
    );
  };

  const removeStock = (item: InventoryItem) => {
    Alert.prompt(
      "Remove Stock",
      `How many ${item.unit} would you like to remove?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: (value?: string) => {
            const quantity = Number(value);

            if (
              !value ||
              Number.isNaN(quantity) ||
              quantity <= 0
            ) {
              Alert.alert(
                "Invalid Quantity",
                "Please enter a valid quantity."
              );
              return;
            }

            if (quantity > item.stock) {
              Alert.alert(
                "Insufficient Stock",
                `Only ${item.stock} ${item.unit} available.`
              );
              return;
            }

            adjustStock(item, -quantity);
          },
        },
      ],
      "plain-text"
    );
  };

  const restockItem = (item: InventoryItem) => {
    const recommended =
      Math.max(
        item.minimumStock * 2 - item.stock,
        1
      );

    adjustStock(item, recommended);

    Alert.alert(
      "Inventory Updated",
      `${recommended} ${item.unit} added to ${item.name}.`
    );
  };

  const getStatusColor = (status: StockStatus) => {
    if (status === "In Stock") return GREEN;
    if (status === "Low Stock") return ORANGE;
    return RED;
  };

  const getStatusBackground = (
    status: StockStatus
  ) => {
    if (status === "In Stock") return "#ECFDF3";
    if (status === "Low Stock") return "#FFF7ED";
    return "#FEF2F2";
  };

  const getStatusIcon = (status: StockStatus) => {
    if (status === "In Stock") {
      return "checkmark-circle-outline";
    }

    if (status === "Low Stock") {
      return "warning-outline";
    }

    return "close-circle-outline";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              INVENTORY MANAGEMENT
            </Text>

            <Text style={styles.title}>
              Inventory
            </Text>

            <Text style={styles.subtitle}>
              Monitor and manage your stock
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="cube-outline"
              size={25}
              color={CARDINAL}
            />
          </View>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="layers-outline"
                  size={18}
                  color={CARDINAL}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {totalItems}
              </Text>
            </View>

            <Text style={styles.summaryLabel}>
              Total Items
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.greenIcon,
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={GREEN}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {inStock}
              </Text>
            </View>

            <Text style={styles.summaryLabel}>
              In Stock
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.orangeIcon,
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={ORANGE}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {lowStock}
              </Text>
            </View>

            <Text style={styles.summaryLabel}>
              Low Stock
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.redIcon,
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={RED}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {outOfStock}
              </Text>
            </View>

            <Text style={styles.summaryLabel}>
              Out of Stock
            </Text>
          </View>
        </View>

        {/* ALERT */}
        {lowStock + outOfStock > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={ORANGE}
              />
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                Inventory Attention Needed
              </Text>

              <Text style={styles.alertText}>
                {lowStock + outOfStock} item
                {lowStock + outOfStock !== 1
                  ? "s"
                  : ""}{" "}
                need{lowStock + outOfStock === 1 ? "s" : ""}{" "}
                your attention.
              </Text>
            </View>
          </View>
        )}

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={MUTED}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search inventory..."
            placeholderTextColor="#A1A1AA"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color="#A1A1AA"
              />
            </Pressable>
          )}
        </View>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const active = filter === item;

            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Stock Overview
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredInventory.length} item
              {filteredInventory.length !== 1
                ? "s"
                : ""}{" "}
              displayed
            </Text>
          </View>
        </View>

        {/* INVENTORY LIST */}
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cube-outline"
                size={28}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Inventory Found
            </Text>

            <Text style={styles.emptyText}>
              Try changing your search or filter.
            </Text>
          </View>
        ) : (
          <View style={styles.inventoryList}>
            {filteredInventory.map((item) => {
              const status = getStatus(item);
              const statusColor =
                getStatusColor(status);

              return (
                <View
                  key={item.id}
                  style={styles.inventoryCard}
                >
                  {/* TOP */}
                  <View style={styles.itemTop}>
                    <View style={styles.itemIcon}>
                      <Ionicons
                        name="cube-outline"
                        size={25}
                        color={CARDINAL}
                      />
                    </View>

                    <View style={styles.itemInfo}>
                      <Text
                        style={styles.itemName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      <Text style={styles.itemCategory}>
                        {item.category} • ₱
                        {item.price.toFixed(2)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusBackground(
                              status
                            ),
                        },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(status)}
                        size={13}
                        color={statusColor}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: statusColor,
                          },
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  {/* STOCK DISPLAY */}
                  <View style={styles.stockSection}>
                    <View style={styles.stockHeader}>
                      <Text style={styles.stockLabel}>
                        Current Stock
                      </Text>

                      <Text
                        style={[
                          styles.stockNumber,
                          {
                            color: statusColor,
                          },
                        ]}
                      >
                        {item.stock}{" "}
                        <Text style={styles.stockUnit}>
                          {item.unit}
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width:
                              item.stock === 0
                                ? "0%"
                                : `${Math.min(
                                    (item.stock /
                                      Math.max(
                                        item.minimumStock *
                                          2,
                                        1
                                      )) *
                                      100,
                                    100
                                  )}%`,
                            backgroundColor:
                              statusColor,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.stockFooter}>
                      <Text style={styles.minimumText}>
                        Minimum: {item.minimumStock}{" "}
                        {item.unit}
                      </Text>

                      {status !== "In Stock" && (
                        <Text
                          style={[
                            styles.restockText,
                            {
                              color: statusColor,
                            },
                          ]}
                        >
                          Restock recommended
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* ACTIONS */}
                  <View style={styles.actionDivider} />

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.adjustButton}
                      onPress={() =>
                        removeStock(item)
                      }
                    >
                      <Ionicons
                        name="remove"
                        size={17}
                        color={MUTED}
                      />

                      <Text style={styles.adjustText}>
                        Remove
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.adjustButton}
                      onPress={() => addStock(item)}
                    >
                      <Ionicons
                        name="add"
                        size={17}
                        color={CARDINAL}
                      />

                      <Text
                        style={[
                          styles.adjustText,
                          {
                            color: CARDINAL,
                          },
                        ]}
                      >
                        Add Stock
                      </Text>
                    </Pressable>

                    {status !== "In Stock" && (
                      <Pressable
                        style={styles.restockButton}
                        onPress={() =>
                          restockItem(item)
                        }
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={17}
                          color={WHITE}
                        />

                        <Text
                          style={
                            styles.restockButtonText
                          }
                        >
                          Restock
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
    fontSize: 13,
    color: MUTED,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  summaryCard: {
    width: "48%",
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  greenIcon: {
    backgroundColor: "#ECFDF3",
  },

  orangeIcon: {
    backgroundColor: "#FFF7ED",
  },

  redIcon: {
    backgroundColor: "#FEF2F2",
  },

  summaryNumber: {
    fontSize: 21,
    fontWeight: "800",
    color: TEXT,
  },

  summaryLabel: {
    marginTop: 9,
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    gap: 10,
  },

  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9A3412",
  },

  alertText: {
    marginTop: 2,
    fontSize: 11,
    color: "#C2410C",
  },

  searchBox: {
    height: 48,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 9,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    paddingVertical: 0,
  },

  filterRow: {
    gap: 8,
    paddingBottom: 20,
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  filterTextActive: {
    color: WHITE,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
  },

  inventoryList: {
    gap: 12,
  },

  inventoryCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },

  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  itemIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  itemCategory: {
    marginTop: 4,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  stockSection: {
    marginTop: 18,
  },

  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stockLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  stockNumber: {
    fontSize: 17,
    fontWeight: "800",
  },

  stockUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: MUTED,
  },

  progressTrack: {
    height: 7,
    backgroundColor: "#EEEEF0",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
  },

  progressBar: {
    height: "100%",
    borderRadius: 10,
  },

  stockFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
  },

  minimumText: {
    fontSize: 9,
    color: MUTED,
  },

  restockText: {
    fontSize: 9,
    fontWeight: "700",
  },

  actionDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 13,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  adjustButton: {
    flex: 1,
    height: 37,
    borderRadius: 10,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  adjustText: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },

  restockButton: {
    flex: 1,
    height: 37,
    borderRadius: 10,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  restockButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: WHITE,
  },

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
});

