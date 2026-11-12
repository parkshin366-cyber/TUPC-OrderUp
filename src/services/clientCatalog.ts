import { Ionicons } from "@expo/vector-icons";

import {
  getPublicStores,
  getStoreProducts,
  Product,
} from "./api";

export type ClientStoreType = "canteen" | "organization" | "others";

export type ClientStore = {
  id: string;
  name: string;
  type: ClientStoreType;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  categories: string[];
  rating: number;
  deliveryTime: string;
  status: "Open" | "Closed";
  featured?: boolean;
  profileImage?: string;
  bannerImage?: string;
};

export type CatalogFood = {
  id: string;
  name: string;
  store: string;
  storeId: string;
  price: string;
  image?: string;
  category: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export type ClientCatalog = {
  stores: ClientStore[];
  foods: CatalogFood[];
};

const FOOD_CATEGORIES = new Set([
  "Meals",
  "Snacks",
  "Drinks",
  "Desserts",
]);

function isProductInStock(product: Product): boolean {
  // Food uses the seller's Available / Sold Out toggle, not stock quantity.
  return FOOD_CATEGORIES.has(product.category) || product.stock > 0;
}

function storeIcon(categories: string[]): keyof typeof Ionicons.glyphMap {
  if (categories.includes("Drinks")) return "cafe";
  if (categories.includes("School Supplies")) return "school";
  if (categories.includes("Clothing") || categories.includes("Accessories")) return "bag-handle";
  return "restaurant";
}

function mapImage(product: Product): string | undefined {
  return product.imageUrl || product.photoUrl || product.image || undefined;
}

/** Fetches the exact stores/products currently available to clients. */
export async function loadClientCatalog(): Promise<ClientCatalog> {
  const apiStores = await getPublicStores();
  const productResults = await Promise.all(
    apiStores.map(async (store) => {
      try {
        return { store, products: await getStoreProducts(store._id) };
      } catch (error) {
        // One seller's failed product request should not hide every other store.
        console.error(`LOAD PRODUCTS ERROR FOR STORE ${store._id}:`, error);
        return { store, products: [] as Product[] };
      }
    }),
  );

  const stores: ClientStore[] = productResults.map(({ store, products }) => {
    const categories = Array.from(new Set(products.map((product) => product.category)));
    return {
      id: store._id,
      name: store.name,
      type: "canteen",
      description: store.description || "Campus seller",
      icon: storeIcon(categories),
      categories,
      rating: 0,
      deliveryTime: store.pickupEnabled ? "Pickup available" : "Pickup unavailable",
      status: store.isOpen ? "Open" : "Closed",
      featured: store.isOpen,
      profileImage: store.profileImage,
      bannerImage: store.bannerImage,
    };
  });

  const foods: CatalogFood[] = productResults.flatMap(({ store, products }) =>
    products.filter((product) => product.available && isProductInStock(product) && store.isOpen).map((product) => ({
      id: product._id,
      name: product.name,
      store: store.name,
      storeId: store._id,
      price: `₱${product.price.toLocaleString("en-PH")}`,
      image: mapImage(product),
      category: product.category,
      icon: product.category === "Drinks" ? "cafe" : "restaurant",
    })),
  );

  return { stores, foods };
}
