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
    apiStores.map(async (store) => ({
      store,
      products: await getStoreProducts(store._id),
    })),
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
    products.filter((product) => product.available && product.stock > 0 && store.isOpen).map((product) => ({
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
