import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
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

type Category = "Meals" | "Snacks" | "Drinks" | "Desserts";

type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  available: boolean;
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Chicken Rice Meal",
    category: "Meals",
    price: 89,
    stock: 24,
    available: true,
  },
  {
    id: "2",
    name: "Beef Tapa Meal",
    category: "Meals",
    price: 99,
    stock: 18,
    available: true,
  },
  {
    id: "3",
    name: "Iced Coffee",
    category: "Drinks",
    price: 55,
    stock: 32,
    available: true,
  },
  {
    id: "4",
    name: "French Fries",
    category: "Snacks",
    price: 45,
    stock: 7,
    available: true,
  },
  {
    id: "5",
    name: "Chocolate Cake",
    category: "Desserts",
    price: 65,
    stock: 0,
    available: false,
  },
];

const CATEGORIES: Array<"All" | Category> = [
  "All",
  "Meals",
  "Snacks",
  "Drinks",
  "Desserts",
];

export default function SellerProducts() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<"All" | Category>("All");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("Meals");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalProducts = products.length;

  const availableProducts = products.filter(
    (product) => product.available
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setSelectedCategory("Meals");
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setSelectedCategory(product.category);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
  };

  const saveProduct = () => {
    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!trimmedName) {
      Alert.alert(
        "Product Name Required",
        "Please enter a product name."
      );
      return;
    }

    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert(
        "Invalid Price",
        "Please enter a valid product price."
      );
      return;
    }

    if (
      stock === "" ||
      Number.isNaN(numericStock) ||
      numericStock < 0
    ) {
      Alert.alert(
        "Invalid Stock",
        "Please enter a valid stock quantity."
      );
      return;
    }

    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                name: trimmedName,
                price: numericPrice,
                stock: numericStock,
                category: selectedCategory,
                available: numericStock > 0,
              }
            : product
        )
      );

      closeModal();

      Alert.alert(
        "Product Updated",
        `${trimmedName} has been updated successfully.`
      );

      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: trimmedName,
      category: selectedCategory,
      price: numericPrice,
      stock: numericStock,
      available: numericStock > 0,
    };

    setProducts((current) => [newProduct, ...current]);

    closeModal();

    Alert.alert(
      "Product Added",
      `${trimmedName} has been added successfully.`
    );
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setProducts((current) =>
              current.filter(
                (item) => item.id !== product.id
              )
            );
          },
        },
      ]
    );
  };

  const toggleAvailability = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert(
        "Out of Stock",
        "Add stock before making this product available."
      );
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              available: !item.available,
            }
          : item
      )
    );
  };

  const getStockText = (stock: number) => {
    if (stock === 0) return "Out of stock";
    if (stock <= 10) return `Low stock • ${stock} left`;
    return `${stock} in stock`;
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return RED;
    if (stock <= 10) return "#B45309";
    return GREEN;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PRODUCT MANAGEMENT</Text>
            <Text style={styles.title}>My Products</Text>
            <Text style={styles.subtitle}>
              Manage your menu and inventory
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={22} color={WHITE} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="fast-food-outline"
                size={19}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {totalProducts}
            </Text>

            <Text style={styles.summaryLabel}>
              Products
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={GREEN}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {availableProducts}
            </Text>

            <Text style={styles.summaryLabel}>
              Available
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="warning-outline"
                size={19}
                color="#B45309"
              />
            </View>

            <Text style={styles.summaryNumber}>
              {lowStockProducts}
            </Text>

            <Text style={styles.summaryLabel}>
              Low Stock
            </Text>
          </View>
        </View>

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
            placeholder="Search products..."
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

        {/* CATEGORY FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((item) => {
            const active = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryButton,
                  active && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* PRODUCT LIST HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Your Products
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* PRODUCT CARDS */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="search-outline"
                size={28}
                color={CARDINAL}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Products Found
            </Text>

            <Text style={styles.emptyText}>
              Try another search or category.
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <View
                key={product.id}
                style={styles.productCard}
              >
                <View style={styles.productIcon}>
                  <Ionicons
                    name="fast-food-outline"
                    size={28}
                    color={CARDINAL}
                  />
                </View>

                <View style={styles.productMain}>
                  <View style={styles.productTop}>
                    <View style={styles.productNameArea}>
                      <Text
                        style={styles.productName}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>

                      <Text style={styles.productCategory}>
                        {product.category}
                      </Text>
                    </View>

                    <Text style={styles.productPrice}>
                      ₱{product.price.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.productInfoRow}>
                    <View style={styles.stockInfo}>
                      <Ionicons
                        name={
                          product.stock === 0
                            ? "close-circle-outline"
                            : product.stock <= 10
                            ? "warning-outline"
                            : "cube-outline"
                        }
                        size={17}
                        color={getStockColor(product.stock)}
                      />

                      <Text
                        style={[
                          styles.stockText,
                          {
                            color: getStockColor(
                              product.stock
                            ),
                          },
                        ]}
                      >
                        {getStockText(product.stock)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        product.available
                          ? styles.statusAvailable
                          : styles.statusUnavailable,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: product.available
                              ? GREEN
                              : RED,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: product.available
                              ? GREEN
                              : RED,
                          },
                        ]}
                      >
                        {product.available
                          ? "Available"
                          : "Unavailable"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[
                        styles.availabilityButton,
                        product.available &&
                          styles.availabilityButtonActive,
                      ]}
                      onPress={() =>
                        toggleAvailability(product)
                      }
                    >
                      <Ionicons
                        name={
                          product.available
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={17}
                        color={
                          product.available
                            ? MUTED
                            : CARDINAL
                        }
                      />

                      <Text
                        style={[
                          styles.availabilityText,
                          product.available &&
                            styles.availabilityTextActive,
                        ]}
                      >
                        {product.available
                          ? "Hide"
                          : "Show"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        openEditModal(product)
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={CARDINAL}
                      />

                      <Text style={styles.editText}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() =>
                        deleteProduct(product)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={RED}
                      />

                      <Text style={styles.deleteText}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ADD / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editingProduct
                    ? "Update your product details"
                    : "Create a new menu item"}
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={TEXT}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* NAME */}
              <Text style={styles.inputLabel}>
                Product Name
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="fast-food-outline"
                  size={19}
                  color={MUTED}
                />

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Chicken Rice Meal"
                  placeholderTextColor="#A1A1AA"
                  style={styles.input}
                />
              </View>

              {/* PRICE + STOCK */}
              <View style={styles.twoColumn}>
                <View style={styles.column}>
                  <Text style={styles.inputLabel}>
                    Price
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.currency}>
                      ₱
                    </Text>

                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0.00"
                      placeholderTextColor="#A1A1AA"
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.column}>
                  <Text style={styles.inputLabel}>
                    Stock
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="cube-outline"
                      size={19}
                      color={MUTED}
                    />

                    <TextInput
                      value={stock}
                      onChangeText={setStock}
                      placeholder="0"
                      placeholderTextColor="#A1A1AA"
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* CATEGORY */}
              <Text style={styles.inputLabel}>
                Category
              </Text>

              <View style={styles.modalCategoryRow}>
                {(
                  [
                    "Meals",
                    "Snacks",
                    "Drinks",
                    "Desserts",
                  ] as Category[]
                ).map((item) => {
                  const active =
                    selectedCategory === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() =>
                        setSelectedCategory(item)
                      }
                      style={[
                        styles.modalCategoryButton,
                        active &&
                          styles.modalCategoryButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalCategoryText,
                          active &&
                            styles.modalCategoryTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={styles.saveButton}
                onPress={saveProduct}
              >
                <Ionicons
                  name={
                    editingProduct
                      ? "checkmark-circle-outline"
                      : "add-circle-outline"
                  }
                  size={21}
                  color={WHITE}
                />

                <Text style={styles.saveButtonText}>
                  {editingProduct
                    ? "Save Changes"
                    : "Add Product"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: CARDINAL,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 44,
  },

  addButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "800",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: BORDER,
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT,
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
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

  categoryRow: {
    gap: 8,
    paddingBottom: 20,
  },

  categoryButton: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },

  categoryButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },

  categoryTextActive: {
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

  productList: {
    gap: 12,
  },

  productCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },

  productIcon: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  productMain: {
    flex: 1,
    minWidth: 0,
  },

  productTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  productNameArea: {
    flex: 1,
  },

  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
  },

  productCategory: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: CARDINAL,
  },

  productInfoRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },

  stockText: {
    fontSize: 11,
    fontWeight: "700",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusAvailable: {
    backgroundColor: "#ECFDF3",
  },

  statusUnavailable: {
    backgroundColor: "#FEF2F2",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 12,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  availabilityButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  availabilityButtonActive: {
    backgroundColor: "#FAECEF",
  },

  availabilityText: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  availabilityTextActive: {
    color: CARDINAL,
  },

  editButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FAECEF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  editText: {
    fontSize: 11,
    fontWeight: "800",
    color: CARDINAL,
  },

  deleteButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  deleteText: {
    fontSize: 11,
    fontWeight: "800",
    color: RED,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: BG,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 7,
    marginTop: 4,
  },

  inputWrapper: {
    minHeight: 48,
    backgroundColor: WHITE,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 8,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    paddingVertical: 11,
  },

  currency: {
    fontSize: 17,
    fontWeight: "800",
    color: CARDINAL,
  },

  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },

  column: {
    flex: 1,
  },

  modalCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  modalCategoryButton: {
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },

  modalCategoryButtonActive: {
    backgroundColor: CARDINAL,
    borderColor: CARDINAL,
  },

  modalCategoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  modalCategoryTextActive: {
    color: WHITE,
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

  saveButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
  },
});

