import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

  import {
  createProduct,
  deleteProduct as deleteProductApi,
  getMyProducts,
  Product,
  ProductCategory,
  RegisterImage,
  updateProduct as updateProductApi,
  updateProductAvailability,
} from "../../services/api";


  import { useAuth } from "../../context/AuthContext";

  const CARDINAL = "#A6192E";
  const TEXT = "#171717";
  const MUTED = "#737373";
  const BG = "#F7F7F8";
  const WHITE = "#FFFFFF";
  const BORDER = "#E7E7E8";
  const GREEN = "#15803D";
  const RED = "#B91C1C";

  type Category = string;

  type CategoryOption = {
    value: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  };

  const CATEGORY_OPTIONS: CategoryOption[] = [
    {
      value: "Meals",
      label: "Meals",
      icon: "restaurant-outline",
    },
    {
      value: "Snacks",
      label: "Snacks",
      icon: "fast-food-outline",
    },
    {
      value: "Drinks",
      label: "Drinks",
      icon: "cafe-outline",
    },
    {
      value: "Desserts",
      label: "Desserts",
      icon: "ice-cream-outline",
    },
    {
      value: "Clothing",
      label: "Clothing",
      icon: "shirt-outline",
    },
    {
      value: "Accessories",
      label: "Accessories",
      icon: "bag-handle-outline",
    },
    {
      value: "School Supplies",
      label: "School Supplies",
      icon: "pencil-outline",
    },
    {
      value: "Gadgets and Electronics",
      label: "Gadgets and Electronics",
      icon: "phone-portrait-outline",
    },
    {
      value: "Gifts and Souvenirs",
      label: "Gifts and Souvenirs",
      icon: "gift-outline",
    },
    {
      value: "Others",
      label: "Others",
      icon: "cube-outline",
    },
  ];

  const DEFAULT_CATEGORIES: Category[] = CATEGORY_OPTIONS.map(
    (item) => item.value
  );

  // =====================================================
  // FOOD CATEGORIES
  // These categories do NOT use stock quantity.
  // They use Available / Sold Out instead.
  // =====================================================

  const FOOD_CATEGORIES = [
    "Meals",
    "Snacks",
    "Drinks",
    "Desserts",
  ];

  const isFoodCategory = (category: string): boolean => {
    return FOOD_CATEGORIES.includes(category);
  };

  export default function SellerProducts() {
    const { token } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("All");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [availabilityId, setAvailabilityId] = useState<string | null>(null);

    const [modalVisible, setModalVisible] = useState(false);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

    // =====================================================
    // FOOD AVAILABILITY STATE
    // =====================================================

    const [formAvailable, setFormAvailable] = useState(true);

    // =====================================================
    // IMAGE STATE
    // =====================================================

    const [imageUri, setImageUri] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] =
      useState<RegisterImage | undefined>(undefined);

    const [removeImage, setRemoveImage] = useState(false);

    // =====================================================
    // CATEGORY STATE
    // =====================================================

    const [selectedCategory, setSelectedCategory] =
      useState<Category>("Meals");

    const [categoryDropdownOpen, setCategoryDropdownOpen] =
      useState(false);

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = useCallback(
      async (showLoading = true) => {
        if (!token) {
          setProducts([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          if (showLoading) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          console.log("LOADING SELLER PRODUCTS...");

          const result = await getMyProducts(token);

          console.log(
            "SELLER PRODUCTS LOADED:",
            result.length
          );

          setProducts(result);
        } catch (error) {
          console.error(
            "LOAD SELLER PRODUCTS ERROR:",
            error
          );

          Alert.alert(
            "Unable to Load Products",
            error instanceof Error
              ? error.message
              : "Something went wrong while loading your products."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [token]
    );

    // =====================================================
    // RELOAD WHEN SCREEN IS FOCUSED
    // =====================================================

    useFocusEffect(
      useCallback(() => {
        loadProducts(true);
      }, [loadProducts])
    );

    // =====================================================
    // AVAILABLE CATEGORIES
    // =====================================================

    const categories = useMemo<Category[]>(() => {
      return DEFAULT_CATEGORIES;
    }, []);

    // =====================================================
    // FILTER PRODUCTS
    // =====================================================

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

    // =====================================================
    // SUMMARY
    // =====================================================

    const totalProducts = products.length;

    const availableProducts = products.filter(
      (product) => product.available
    ).length;

    // Food products are not included in low-stock calculation
    // because they do not use stock quantity.

    const lowStockProducts = products.filter((product) => {
      const productCategory = String(
        product.category ?? ""
      ).trim();

      if (isFoodCategory(productCategory)) {
        return false;
      }

      return (
        product.stock > 0 &&
        product.stock <= 10
      );
    }).length;

    // =====================================================
    // GET PRODUCT IMAGE
    // =====================================================

    const getProductImage = (
      product: Product
    ): string | null => {
      return (
        product.imageUrl ||
        product.image ||
        product.photoUrl ||
        null
      );
    };

    // =====================================================
    // GET CATEGORY OPTION
    // =====================================================

    const getCategoryOption = (
      categoryValue: string
    ): CategoryOption | undefined => {
      return CATEGORY_OPTIONS.find(
        (item) => item.value === categoryValue
      );
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {
      setName("");
      setPrice("");
      setStock("");

      setFormAvailable(true);

      setImageUri(null);
      setSelectedImage(undefined);
      setRemoveImage(false);

      setSelectedCategory("Meals");
      setCategoryDropdownOpen(false);

      setEditingProduct(null);
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
      resetForm();
      setModalVisible(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (product: Product) => {
      setEditingProduct(product);

      setName(product.name);
      setPrice(String(product.price));

      const productCategory = String(
        product.category ?? ""
      ).trim();

      // Food products do not use stock.
      if (isFoodCategory(productCategory)) {
        setStock("");
      } else {
        setStock(String(product.stock));
      }

      setFormAvailable(Boolean(product.available));

      setImageUri(getProductImage(product));

      setSelectedImage(undefined);
      setRemoveImage(false);

      setCategoryDropdownOpen(false);

      if (
        DEFAULT_CATEGORIES.includes(
          productCategory
        )
      ) {
        setSelectedCategory(productCategory);
      } else {
        // Old/custom category
        setSelectedCategory("Others");
      }

      setModalVisible(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
      if (saving) {
        return;
      }

      setModalVisible(false);
      resetForm();
    };

    // =====================================================
    // CHANGE CATEGORY
    // =====================================================

    const handleCategoryChange = (
      newCategory: string
    ) => {
      setSelectedCategory(newCategory);
      setCategoryDropdownOpen(false);

      // Food does not need stock.
      if (isFoodCategory(newCategory)) {
        setStock("");

        return;
      }

      // For non-food products, make sure the stock
      // field has a usable default.
      if (stock === "") {
        setStock("0");
      }
    };

    // =====================================================
    // PRODUCT IMAGE PICKER
    // =====================================================

    const pickProductImage = async () => {
      if (saving) {
        return;
      }

      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Photo Permission Required",
            "Please allow photo library access so you can choose a product image."
          );
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: false,
          });

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const asset = result.assets[0];

        if (!asset.uri) {
          Alert.alert(
            "Unable to Select Image",
            "The selected image does not have a valid file URI."
          );
          return;
        }

        const imageType =
          asset.mimeType ||
          getMimeTypeFromUri(asset.uri);

        const imageName =
          asset.fileName ||
          getFileNameFromUri(asset.uri) ||
          `product-${Date.now()}.jpg`;

        const selected: RegisterImage = {
          uri: asset.uri,
          name: imageName,
          type: imageType,
        };

        setSelectedImage(selected);
        setImageUri(asset.uri);
        setRemoveImage(false);

        console.log(
          "PRODUCT IMAGE SELECTED:",
          {
            uri: selected.uri,
            name: selected.name,
            type: selected.type,
          }
        );
      } catch (error) {
        console.error(
          "PICK PRODUCT IMAGE ERROR:",
          error
        );

        Alert.alert(
          "Unable to Select Image",
          "Something went wrong while selecting the product image."
        );
      }
    };

    // =====================================================
    // IMAGE HELPERS
    // =====================================================

    const getFileNameFromUri = (
      uri: string
    ): string => {
      try {
        const cleanUri = uri.split("?")[0];
        const parts = cleanUri.split("/");
        const fileName =
          parts[parts.length - 1];

        if (
          fileName &&
          fileName.includes(".")
        ) {
          return fileName;
        }

        return "";
      } catch {
        return "";
      }
    };

    const getMimeTypeFromUri = (
      uri: string
    ): string => {
      const extension = uri
        .split("?")[0]
        .split(".")
        .pop()
        ?.toLowerCase();

      switch (extension) {
        case "png":
          return "image/png";

        case "webp":
          return "image/webp";

        case "heic":
          return "image/heic";

        case "heif":
          return "image/heif";

        case "jpg":
        case "jpeg":
        default:
          return "image/jpeg";
      }
    };

    // =====================================================
    // REMOVE PRODUCT IMAGE
    // =====================================================

    const removeProductImage = () => {
      if (saving) {
        return;
      }

      setImageUri(null);
      setSelectedImage(undefined);

      if (editingProduct) {
        setRemoveImage(true);
      } else {
        setRemoveImage(false);
      }
    };

    // =====================================================
    // SAVE PRODUCT
    // =====================================================

    const saveProduct = async () => {
      if (!token) {
        Alert.alert(
          "Session Required",
          "Please log in again."
        );
        return;
      }

      const trimmedName = name.trim();

      const numericPrice = Number(price);

      const foodProduct =
        isFoodCategory(selectedCategory);

      // For food, stock is not used.
      // We send 0 to the API because the product
      // availability is controlled by formAvailable.
      const numericStock = foodProduct
        ? 0
        : Number(stock);

      const finalCategory =
        selectedCategory.trim();

      // ===================================================
      // VALIDATION
      // ===================================================

      if (!trimmedName) {
        Alert.alert(
          "Product Name Required",
          "Please enter a product name."
        );
        return;
      }

      if (!finalCategory) {
        Alert.alert(
          "Category Required",
          "Please select a category."
        );
        return;
      }

      if (
        !price ||
        Number.isNaN(numericPrice) ||
        numericPrice <= 0
      ) {
        Alert.alert(
          "Invalid Price",
          "Please enter a valid product price."
        );
        return;
      }

      // ===================================================
      // NON-FOOD STOCK VALIDATION
      // ===================================================

      if (!foodProduct) {
        if (
          stock === "" ||
          Number.isNaN(numericStock) ||
          numericStock < 0 ||
          !Number.isInteger(numericStock)
        ) {
          Alert.alert(
            "Invalid Stock",
            "Please enter a valid whole-number stock quantity."
          );
          return;
        }
      }

      try {
        setSaving(true);

        // =================================================
        // EDIT EXISTING PRODUCT
        // =================================================

        if (editingProduct) {
          const updated =
            await updateProductApi(
              token,
              editingProduct._id,
              {
                name: trimmedName,

                category:
                  finalCategory as ProductCategory,

                price: numericPrice,

                stock: numericStock,

                // FOOD:
                // use Available/Sold Out toggle.
                //
                // NON-FOOD:
                // availability depends on stock.
                available: foodProduct
                  ? formAvailable
                  : numericStock > 0
                  ? editingProduct.available
                  : false,

                image: selectedImage,

                removeImage: removeImage,
              }
            );

          setProducts((current) =>
            current.map((product) =>
              product._id === updated._id
                ? updated
                : product
            )
          );

          setModalVisible(false);
          resetForm();

          Alert.alert(
            "Product Updated",
            `${trimmedName} has been updated successfully.`
          );
        }

        // =================================================
        // CREATE NEW PRODUCT
        // =================================================

        else {
          const created =
            await createProduct(token, {
              name: trimmedName,

              category:
                finalCategory as ProductCategory,

              price: numericPrice,

              stock: numericStock,

              // FOOD:
              // use the toggle.
              //
              // NON-FOOD:
              // available when stock > 0.
              available: foodProduct
                ? formAvailable
                : numericStock > 0,

              image: selectedImage,
            });

          setProducts((current) => [
            created,
            ...current,
          ]);

          setModalVisible(false);
          resetForm();

          Alert.alert(
            "Product Added",
            `${trimmedName} has been added successfully.`
          );
        }
      } catch (error) {
        console.error(
          "SAVE PRODUCT ERROR:",
          error
        );

        Alert.alert(
          editingProduct
            ? "Unable to Update Product"
            : "Unable to Add Product",
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setSaving(false);
      }
    };

    // =====================================================
    // DELETE PRODUCT
    // =====================================================

    const deleteProduct = (
      product: Product
    ) => {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",

            onPress: async () => {
              if (!token) {
                Alert.alert(
                  "Session Required",
                  "Please log in again."
                );
                return;
              }

              try {
                setDeletingId(product._id);

                await deleteProductApi(
                  token,
                  product._id
                );

                setProducts((current) =>
                  current.filter(
                    (item) =>
                      item._id !== product._id
                  )
                );

                Alert.alert(
                  "Product Deleted",
                  `${product.name} has been deleted.`
                );
              } catch (error) {
                console.error(
                  "DELETE PRODUCT ERROR:",
                  error
                );

                Alert.alert(
                  "Unable to Delete Product",
                  error instanceof Error
                    ? error.message
                    : "Something went wrong."
                );
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    };

    // =====================================================
    // TOGGLE AVAILABILITY
    // =====================================================

    const toggleAvailability = async (
      product: Product
    ) => {
      if (!token) {
        Alert.alert(
          "Session Required",
          "Please log in again."
        );
        return;
      }

      const productCategory = String(
        product.category ?? ""
      ).trim();

      const foodProduct =
        isFoodCategory(productCategory);

      // ===================================================
      // IMPORTANT:
      // Food products do NOT need stock.
      // Therefore, do NOT block availability changes
      // when stock === 0 for food.
      // ===================================================

      if (
        !foodProduct &&
        product.stock <= 0 &&
        !product.available
      ) {
        Alert.alert(
          "Out of Stock",
          "Add stock before making this product available."
        );
        return;
      }

      const newAvailability =
        !product.available;

      try {
        setAvailabilityId(product._id);

        const updated =
          await updateProductAvailability(
            token,
            product._id,
            newAvailability
          );

        setProducts((current) =>
          current.map((item) =>
            item._id === updated._id
              ? updated
              : item
          )
        );
      } catch (error) {
        console.error(
          "TOGGLE AVAILABILITY ERROR:",
          error
        );

        Alert.alert(
          "Unable to Update Availability",
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setAvailabilityId(null);
      }
    };

    // =====================================================
    // STOCK HELPERS
    // =====================================================

    const getStockText = (
      stock: number
    ) => {
      if (stock === 0) {
        return "Out of stock";
      }

      if (stock <= 10) {
        return `Low stock • ${stock} left`;
      }

      return `${stock} in stock`;
    };

    const getStockColor = (
      stock: number
    ) => {
      if (stock === 0) {
        return RED;
      }

      if (stock <= 10) {
        return "#B45309";
      }

      return GREEN;
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                PRODUCT MANAGEMENT
              </Text>

              <Text style={styles.title}>
                My Products
              </Text>

              <Text style={styles.subtitle}>
                Manage your menu and inventory
              </Text>
            </View>

            <View style={styles.headerButtons}>
              <Pressable
                style={styles.refreshButton}
                onPress={() =>
                  loadProducts(false)
                }
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator
                    size="small"
                    color={CARDINAL}
                  />
                ) : (
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={CARDINAL}
                  />
                )}
              </Pressable>

              <Pressable
                style={styles.addButton}
                onPress={openAddModal}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={WHITE}
                />

                <Text style={styles.addButtonText}>
                  Add
                </Text>
              </Pressable>
            </View>
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
              <Pressable
                onPress={() => setSearch("")}
              >
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
            contentContainerStyle={
              styles.categoryRow
            }
          >
            {["All", ...categories].map(
              (item) => {
                const active =
                  category === item;

                const categoryOption =
                  getCategoryOption(item);

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setCategory(item)
                    }
                    style={[
                      styles.categoryButton,
                      active &&
                        styles.categoryButtonActive,
                    ]}
                  >
                    {categoryOption && (
                      <Ionicons name={categoryOption.icon} size={15} color={active ? WHITE : MUTED} />
                    )}

                    <Text
                      style={[
                        styles.categoryText,
                        active &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          {/* PRODUCT LIST HEADER */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Your Products
              </Text>

              <Text style={styles.sectionSubtitle}>
                {filteredProducts.length}{" "}
                product
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}
              </Text>
            </View>
          </View>

          {/* LOADING */}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="large"
                color={CARDINAL}
              />

              <Text style={styles.loadingTitle}>
                Loading products...
              </Text>

              <Text style={styles.loadingText}>
                Getting your products from the server.
              </Text>
            </View>
          ) : filteredProducts.length ===
            0 ? (
            /* EMPTY */

            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    products.length === 0
                      ? "fast-food-outline"
                      : "search-outline"
                  }
                  size={28}
                  color={CARDINAL}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {products.length === 0
                  ? "No Products Yet"
                  : "No Products Found"}
              </Text>

              <Text style={styles.emptyText}>
                {products.length === 0
                  ? "Add your first product to start managing your menu."
                  : "Try another search or category."}
              </Text>

              {products.length === 0 && (
                <Pressable
                  style={
                    styles.emptyAddButton
                  }
                  onPress={openAddModal}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={WHITE}
                  />

                  <Text
                    style={
                      styles.emptyAddButtonText
                    }
                  >
                    Add Product
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            /* PRODUCT CARDS */

            <View style={styles.productList}>
              {filteredProducts.map(
                (product) => {
                  const isDeleting =
                    deletingId ===
                    product._id;

                  const isChangingAvailability =
                    availabilityId ===
                    product._id;

                  const productImage =
                    getProductImage(product);

                  const productCategory =
                    String(
                      product.category ?? ""
                    ).trim();

                  const foodProduct =
                    isFoodCategory(
                      productCategory
                    );

                  const categoryOption =
                    getCategoryOption(
                      productCategory
                    );

                  return (
                    <View
                      key={product._id}
                      style={
                        styles.productCard
                      }
                    >
                      {/* PRODUCT IMAGE */}

                      <View
                        style={
                          styles.productImageWrapper
                        }
                      >
                        {productImage ? (
                          <Image
                            source={{
                              uri: productImage,
                            }}
                            style={
                              styles.productImage
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.productIcon
                            }
                          >
                            <Ionicons
                              name="fast-food-outline"
                              size={28}
                              color={CARDINAL}
                            />
                          </View>
                        )}
                      </View>

                      <View
                        style={
                          styles.productMain
                        }
                      >
                        <View
                          style={
                            styles.productTop
                          }
                        >
                          <View
                            style={
                              styles.productNameArea
                            }
                          >
                            <Text
                              style={
                                styles.productName
                              }
                              numberOfLines={1}
                            >
                              {product.name}
                            </Text>

                            <View
                              style={
                                styles.productCategoryRow
                              }
                            >
                              {categoryOption && (
                                <Ionicons name={categoryOption.icon} size={13} color={MUTED} />
                              )}

                              <Text
                                style={
                                  styles.productCategory
                                }
                              >
                                {
                                  product.category
                                }
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={
                              styles.productPrice
                            }
                          >
                            ₱
                            {product.price.toFixed(
                              2
                            )}
                          </Text>
                        </View>

                        {/* =================================================
                            FOOD PRODUCT INFO
                            ================================================= */}

                        {foodProduct ? (
                          <View
                            style={
                              styles.foodStatusRow
                            }
                          >
                            <View
                              style={[
                                styles.foodAvailabilityBadge,
                                product.available
                                  ? styles.foodAvailableBadge
                                  : styles.foodSoldOutBadge,
                              ]}
                            >
                              <Ionicons
                                name={
                                  product.available
                                    ? "checkmark-circle"
                                    : "close-circle"
                                }
                                size={17}
                                color={
                                  product.available
                                    ? GREEN
                                    : RED
                                }
                              />

                              <Text
                                style={[
                                  styles.foodAvailabilityText,
                                  {
                                    color:
                                      product.available
                                        ? GREEN
                                        : RED,
                                  },
                                ]}
                              >
                                {product.available
                                  ? "Available"
                                  : "Sold Out"}
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.noStockText
                              }
                            >
                              No stock tracking
                            </Text>
                          </View>
                        ) : (
                          /* =================================================
                            NON-FOOD PRODUCT INFO
                            ================================================= */

                          <View
                            style={
                              styles.productInfoRow
                            }
                          >
                            <View
                              style={
                                styles.stockInfo
                              }
                            >
                              <Ionicons
                                name={
                                  product.stock ===
                                  0
                                    ? "close-circle-outline"
                                    : product.stock <=
                                      10
                                    ? "warning-outline"
                                    : "cube-outline"
                                }
                                size={17}
                                color={getStockColor(
                                  product.stock
                                )}
                              />

                              <Text
                                style={[
                                  styles.stockText,
                                  {
                                    color:
                                      getStockColor(
                                        product.stock
                                      ),
                                  },
                                ]}
                              >
                                {getStockText(
                                  product.stock
                                )}
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
                                    backgroundColor:
                                      product.available
                                        ? GREEN
                                        : RED,
                                  },
                                ]}
                              />

                              <Text
                                style={[
                                  styles.statusText,
                                  {
                                    color:
                                      product.available
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
                        )}

                        <View
                          style={styles.divider}
                        />

                        <View
                          style={styles.actionsRow}
                        >
                          <Pressable
                            style={[
                              styles.availabilityButton,
                              product.available &&
                                styles.availabilityButtonActive,
                            ]}
                            onPress={() =>
                              toggleAvailability(
                                product
                              )
                            }
                            disabled={
                              isChangingAvailability ||
                              isDeleting
                            }
                          >
                            {isChangingAvailability ? (
                              <ActivityIndicator
                                size="small"
                                color={
                                  product.available
                                    ? MUTED
                                    : CARDINAL
                                }
                              />
                            ) : (
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
                            )}

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
                            style={
                              styles.editButton
                            }
                            onPress={() =>
                              openEditModal(
                                product
                              )
                            }
                            disabled={
                              isDeleting ||
                              isChangingAvailability
                            }
                          >
                            <Ionicons
                              name="create-outline"
                              size={17}
                              color={CARDINAL}
                            />

                            <Text
                              style={
                                styles.editText
                              }
                            >
                              Edit
                            </Text>
                          </Pressable>

                          <Pressable
                            style={
                              styles.deleteButton
                            }
                            onPress={() =>
                              deleteProduct(
                                product
                              )
                            }
                            disabled={
                              isDeleting ||
                              isChangingAvailability
                            }
                          >
                            {isDeleting ? (
                              <ActivityIndicator
                                size="small"
                                color={RED}
                              />
                            ) : (
                              <Ionicons
                                name="trash-outline"
                                size={17}
                                color={RED}
                              />
                            )}

                            <Text
                              style={
                                styles.deleteText
                              }
                            >
                              {isDeleting
                                ? "Deleting..."
                                : "Delete"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          )}

          <View
            style={{
              height: 20,
            }}
          />
        </ScrollView>

        {/* =====================================================
            ADD / EDIT MODAL
            ===================================================== */}

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

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    {editingProduct
                      ? "Update your product details"
                      : "Create a new menu item"}
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={closeModal}
                  disabled={saving}
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
                {/* PRODUCT IMAGE */}

                <Text style={styles.inputLabel}>
                  Product Image
                </Text>

                <Pressable
                  style={
                    styles.imagePickerCard
                  }
                  onPress={pickProductImage}
                  disabled={saving}
                >
                  {imageUri ? (
                    <Image
                      source={{
                        uri: imageUri,
                      }}
                      style={
                        styles.imagePreview
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.imagePlaceholder
                      }
                    >
                      <Ionicons
                        name="camera-outline"
                        size={30}
                        color={CARDINAL}
                      />

                      <Text
                        style={
                          styles.imagePlaceholderTitle
                        }
                      >
                        Add Product Photo
                      </Text>

                      <Text
                        style={
                          styles.imagePlaceholderText
                        }
                      >
                        Choose a clear photo from your gallery
                      </Text>
                    </View>
                  )}

                  <View
                    style={
                      styles.imagePickerOverlay
                    }
                  >
                    <Ionicons
                      name="camera"
                      size={16}
                      color={WHITE}
                    />

                    <Text
                      style={
                        styles.imagePickerOverlayText
                      }
                    >
                      {imageUri
                        ? "Change Photo"
                        : "Choose Photo"}
                    </Text>
                  </View>
                </Pressable>

                {imageUri && (
                  <Pressable
                    style={
                      styles.removeImageButton
                    }
                    onPress={
                      removeProductImage
                    }
                    disabled={saving}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={RED}
                    />

                    <Text
                      style={
                        styles.removeImageText
                      }
                    >
                      Remove photo
                    </Text>
                  </Pressable>
                )}

                {/* NAME */}

                <Text style={styles.inputLabel}>
                  Product Name
                </Text>

                <View
                  style={styles.inputWrapper}
                >
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
                    editable={!saving}
                  />
                </View>

                {/* PRICE */}

                <View style={styles.twoColumn}>
                  <View style={styles.column}>
                    <Text
                      style={styles.inputLabel}
                    >
                      Price
                    </Text>

                    <View
                      style={
                        styles.inputWrapper
                      }
                    >
                      <Text
                        style={styles.currency}
                      >
                        ₱
                      </Text>

                      <TextInput
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="decimal-pad"
                        style={styles.input}
                        editable={!saving}
                      />
                    </View>
                  </View>

                  {/* =================================================
                      SECOND FIELD:
                      STOCK QUANTITY FOR NON-FOOD
                      AVAILABILITY FOR FOOD
                      ================================================= */}

                  {isFoodCategory(selectedCategory) ? (
                    <View style={styles.column}>
                      <Text style={styles.inputLabel}>
                        Availability
                      </Text>

                      <View style={styles.compactAvailability}>
                        <Pressable
                          style={[
                            styles.compactAvailabilityOption,
                            formAvailable &&
                              styles.compactAvailabilityOptionActive,
                          ]}
                          onPress={() => setFormAvailable(true)}
                          disabled={saving}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={formAvailable ? GREEN : MUTED}
                          />
                          <Text
                            style={[
                              styles.compactAvailabilityText,
                              formAvailable &&
                                styles.compactAvailabilityTextActive,
                            ]}
                          >
                            Available
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.compactAvailabilityOption,
                            !formAvailable &&
                              styles.compactAvailabilityOptionSoldOut,
                          ]}
                          onPress={() => setFormAvailable(false)}
                          disabled={saving}
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={!formAvailable ? RED : MUTED}
                          />
                          <Text
                            style={[
                              styles.compactAvailabilityText,
                              !formAvailable &&
                                styles.compactAvailabilityTextSoldOut,
                            ]}
                          >
                            Sold Out
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.column}>
                      <Text style={styles.inputLabel}>
                        Stock Quantity
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
                          editable={!saving}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* =================================================
                    CATEGORY
                    ================================================= */}

                <Text style={styles.inputLabel}>
                  Category
                </Text>

                <Pressable
                  style={[
                    styles.dropdownButton,
                    categoryDropdownOpen &&
                      styles.dropdownButtonActive,
                  ]}
                  onPress={() => {
                    if (!saving) {
                      setCategoryDropdownOpen(
                        (current) => !current
                      );
                    }
                  }}
                  disabled={saving}
                >
                  <View
                    style={
                      styles.dropdownSelectedLeft
                    }
                  >
                    <Ionicons name={getCategoryOption(selectedCategory)?.icon ?? "cube-outline"} size={18} color={CARDINAL} />

                    <Text
                      style={
                        styles.dropdownSelectedText
                      }
                    >
                      {selectedCategory}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      categoryDropdownOpen
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color={MUTED}
                  />
                </Pressable>

                {/* DROPDOWN OPTIONS */}

                {categoryDropdownOpen && (
                  <View
                    style={
                      styles.dropdownMenu
                    }
                  >
                    {CATEGORY_OPTIONS.map(
                      (item) => {
                        const active =
                          selectedCategory ===
                          item.value;

                        return (
                          <Pressable
                            key={item.value}
                            style={[
                              styles.dropdownItem,
                              active &&
                                styles.dropdownItemActive,
                            ]}
                            onPress={() =>
                              handleCategoryChange(
                                item.value
                              )
                            }
                            disabled={saving}
                          >
                            <Ionicons name={item.icon} size={17} color={active ? CARDINAL : MUTED} />

                            <Text
                              style={[
                                styles.dropdownItemText,
                                active &&
                                  styles.dropdownItemTextActive,
                              ]}
                            >
                              {item.label}
                            </Text>

                            {active && (
                              <Ionicons
                                name="checkmark"
                                size={19}
                                color={
                                  CARDINAL
                                }
                              />
                            )}
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                )}

                {/* NON-FOOD INFORMATION */}

                {!isFoodCategory(
                  selectedCategory
                ) && (
                  <Text
                    style={
                      styles.stockHint
                    }
                  >
                    Stock quantity is used for this category.
                    The product becomes unavailable when stock
                    reaches 0.
                  </Text>
                )}

                {/* SAVE */}

                <Pressable
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={saveProduct}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      size="small"
                      color={WHITE}
                    />
                  ) : (
                    <Ionicons
                      name={
                        editingProduct
                          ? "checkmark-circle-outline"
                          : "add-circle-outline"
                      }
                      size={21}
                      color={WHITE}
                    />
                  )}

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {saving
                      ? editingProduct
                        ? "Saving..."
                        : "Adding..."
                      : editingProduct
                      ? "Save Changes"
                      : "Add Product"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </Pressable>

                <View
                  style={{
                    height: 10,
                  }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // =====================================================
  // STYLES
  // =====================================================

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F7F7F8",
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

    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      color: "#A6192E",
      marginBottom: 4,
    },

    title: {
      fontSize: 28,
      fontWeight: "800",
      color: "#171717",
      letterSpacing: -0.5,
    },

    subtitle: {
      marginTop: 3,
      fontSize: 13,
      color: "#737373",
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E7E8",
      alignItems: "center",
      justifyContent: "center",
    },

    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#A6192E",
      borderRadius: 13,
      paddingHorizontal: 14,
      height: 44,
    },

    addButtonText: {
      color: "#FFFFFF",
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
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 13,
      borderWidth: 1,
      borderColor: "#E7E7E8",
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
      color: "#171717",
    },

    summaryLabel: {
      marginTop: 2,
      fontSize: 10,
      color: "#737373",
      fontWeight: "600",
    },

    searchBox: {
      height: 48,
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      gap: 9,
      marginBottom: 12,
    },

    searchInput: {
      flex: 1,
      fontSize: 14,
      color: "#171717",
      paddingVertical: 0,
    },

    categoryRow: {
      gap: 8,
      paddingBottom: 20,
    },

    categoryButton: {
      height: 38,
      paddingHorizontal: 13,
      borderRadius: 19,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E7E8",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 5,
    },

    categoryButtonActive: {
      backgroundColor: "#A6192E",
      borderColor: "#A6192E",
    },

    categoryEmoji: {
      fontSize: 14,
    },

    categoryText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#737373",
    },

    categoryTextActive: {
      color: "#FFFFFF",
    },

    sectionHeader: {
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#171717",
    },

    sectionSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: "#737373",
    },

    loadingCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      alignItems: "center",
      paddingVertical: 45,
      paddingHorizontal: 25,
    },

    loadingTitle: {
      marginTop: 14,
      fontSize: 16,
      fontWeight: "800",
      color: "#171717",
    },

    loadingText: {
      marginTop: 5,
      fontSize: 12,
      color: "#737373",
      textAlign: "center",
    },

    productList: {
      gap: 12,
    },

    productCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      padding: 14,
      flexDirection: "row",
      gap: 12,
    },

    productImageWrapper: {
      width: 72,
      height: 72,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#FAECEF",
      flexShrink: 0,
    },

    productImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    productIcon: {
      width: "100%",
      height: "100%",
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
      color: "#171717",
    },

    productCategoryRow: {
      marginTop: 3,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    productCategoryEmoji: {
      fontSize: 11,
    },

    productCategory: {
      fontSize: 11,
      color: "#737373",
      fontWeight: "600",
    },

    productPrice: {
      fontSize: 15,
      fontWeight: "800",
      color: "#A6192E",
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

    foodStatusRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },

    foodAvailabilityBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },

    foodAvailableBadge: {
      backgroundColor: "#ECFDF3",
    },

    foodSoldOutBadge: {
      backgroundColor: "#FEF2F2",
    },

    foodAvailabilityText: {
      fontSize: 11,
      fontWeight: "800",
    },

    noStockText: {
      fontSize: 10,
      color: "#737373",
      fontWeight: "600",
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
      backgroundColor: "#E7E7E8",
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
      color: "#737373",
    },

    availabilityTextActive: {
      color: "#A6192E",
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
      color: "#A6192E",
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
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E7E7E8",
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
      color: "#171717",
    },

    emptyText: {
      marginTop: 5,
      fontSize: 12,
      color: "#737373",
      textAlign: "center",
    },

    emptyAddButton: {
      marginTop: 16,
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: "#A6192E",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    emptyAddButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },

    // =====================================================
    // MODAL
    // =====================================================

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },

    modalCard: {
      backgroundColor: "#F7F7F8",
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      maxHeight: "92%",
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
      color: "#171717",
    },

    modalSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: "#737373",
    },

    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#E7E7E8",
    },

    // =====================================================
    // IMAGE
    // =====================================================

    imagePickerCard: {
      height: 190,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      borderStyle: "dashed",
      overflow: "hidden",
      marginBottom: 8,
      position: "relative",
    },

    imagePreview: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    imagePlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },

    imagePlaceholderTitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: "800",
      color: "#171717",
    },

    imagePlaceholderText: {
      marginTop: 4,
      fontSize: 11,
      color: "#737373",
      textAlign: "center",
    },

    imagePickerOverlay: {
      position: "absolute",
      right: 10,
      bottom: 10,
      height: 34,
      paddingHorizontal: 11,
      borderRadius: 10,
      backgroundColor: "#A6192E",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    imagePickerOverlayText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },

    removeImageButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 10,
      paddingVertical: 4,
    },

    removeImageText: {
      color: RED,
      fontSize: 11,
      fontWeight: "700",
    },

    // =====================================================
    // INPUTS
    // =====================================================

    inputLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: "#171717",
      marginBottom: 7,
      marginTop: 4,
    },

    inputWrapper: {
      minHeight: 48,
      backgroundColor: "#FFFFFF",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      gap: 8,
      marginBottom: 15,
    },

    input: {
      flex: 1,
      color: "#171717",
      fontSize: 14,
      paddingVertical: 11,
    },

    currency: {
      fontSize: 17,
      fontWeight: "800",
      color: "#A6192E",
    },

    twoColumn: {
      flexDirection: "row",
      gap: 10,
    },

    column: {
      flex: 1,
    },

    compactAvailability: {
      minHeight: 48,
      flexDirection: "row",
      backgroundColor: "#FFFFFF",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      overflow: "hidden",
      marginBottom: 15,
    },

    compactAvailabilityOption: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 6,
      backgroundColor: "#FFFFFF",
    },

    compactAvailabilityOptionActive: {
      backgroundColor: "#ECFDF3",
    },

    compactAvailabilityOptionSoldOut: {
      backgroundColor: "#FEF2F2",
    },

    compactAvailabilityText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#737373",
    },

    compactAvailabilityTextActive: {
      color: GREEN,
    },

    compactAvailabilityTextSoldOut: {
      color: RED,
    },

    // =====================================================
    // CATEGORY DROPDOWN
    // =====================================================

    dropdownButton: {
      minHeight: 52,
      backgroundColor: "#FFFFFF",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    dropdownButtonActive: {
      borderColor: "#A6192E",
    },

    dropdownSelectedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },

    dropdownEmoji: {
      fontSize: 22,
    },

    dropdownSelectedText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#171717",
    },

    dropdownMenu: {
      backgroundColor: "#FFFFFF",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E7E7E8",
      overflow: "hidden",
      marginBottom: 12,
    },

    dropdownItem: {
      minHeight: 46,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F1F2",
    },

    dropdownItemActive: {
      backgroundColor: "#FAECEF",
    },

    dropdownItemEmoji: {
      width: 28,
      fontSize: 19,
      textAlign: "center",
    },

    dropdownItemText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: "#171717",
    },

    dropdownItemTextActive: {
      color: "#A6192E",
      fontWeight: "800",
    },

    // =====================================================
    // FOOD AVAILABILITY TOGGLE
    // =====================================================

    availabilityToggle: {
      gap: 9,
      marginBottom: 7,
    },

    availabilityOption: {
      minHeight: 64,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E7E8",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    availabilityOptionActive: {
      borderColor: "#86EFAC",
      backgroundColor: "#F0FDF4",
    },

    availabilityOptionSoldOut: {
      borderColor: "#FCA5A5",
      backgroundColor: "#FEF2F2",
    },

    availabilityOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: "#F4F4F5",
      alignItems: "center",
      justifyContent: "center",
    },

    availabilityOptionIconActive: {
      backgroundColor: "#DCFCE7",
    },

    availabilityOptionIconSoldOut: {
      backgroundColor: "#FEE2E2",
    },

    availabilityOptionTextArea: {
      flex: 1,
    },

    availabilityOptionTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: "#171717",
    },

    availabilityOptionTitleActive: {
      color: GREEN,
    },

    availabilityOptionTitleSoldOut: {
      color: RED,
    },

    availabilityOptionSubtitle: {
      marginTop: 2,
      fontSize: 10,
      color: "#737373",
    },

    foodAvailabilityHint: {
      fontSize: 10,
      lineHeight: 15,
      color: "#737373",
      marginBottom: 18,
      marginTop: 3,
    },

    stockHint: {
      fontSize: 10,
      lineHeight: 15,
      color: "#737373",
      marginBottom: 18,
      marginTop: 0,
    },

    // =====================================================
    // BUTTONS
    // =====================================================

    saveButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: "#A6192E",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },

    saveButtonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },

    cancelButton: {
      height: 46,
      alignItems: "center",
      justifyContent: "center",
    },

    cancelButtonText: {
      color: "#737373",
      fontSize: 13,
      fontWeight: "700",
    },
  });
