import { Ionicons } from "@expo/vector-icons";

// =========================================================
// STORE TYPES
// =========================================================

export type StoreType =
  | "canteen"
  | "organization"
  | "others";

export type StoreStatus =
  | "Open"
  | "Closed";

export type Store = {
  id: string;
  name: string;
  type: StoreType;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  categories: string[];
  rating: number;
  deliveryTime: string;
  status: StoreStatus;
  featured?: boolean;
};

// =========================================================
// SHARED STORE DATA
// =========================================================

export const STORES: Store[] = [
  {
    id: "tupc-main-canteen",
    name: "TUPC Main Canteen",
    type: "canteen",
    description:
      "Affordable meals, snacks, and drinks for TUPC students.",
    icon: "restaurant",
    categories: [
      "Food",
      "Meals",
      "Drinks",
    ],
    rating: 4.8,
    deliveryTime: "10–20 min",
    status: "Open",
    featured: true,
  },

  {
    id: "cardinal-cafe",
    name: "Cardinal Café",
    type: "canteen",
    description:
      "Coffee, refreshing drinks, and quick snacks.",
    icon: "cafe",
    categories: [
      "Drinks",
      "Coffee",
      "Snacks",
    ],
    rating: 4.7,
    deliveryTime: "5–15 min",
    status: "Open",
    featured: true,
  },

  {
    id: "campus-food-corner",
    name: "Campus Food Corner",
    type: "canteen",
    description:
      "Quick and tasty campus meals for busy students.",
    icon: "fast-food",
    categories: [
      "Food",
      "Meals",
      "Snacks",
    ],
    rating: 4.6,
    deliveryTime: "10–20 min",
    status: "Open",
  },

  {
    id: "tupc-computer-society",
    name: "TUPC Computer Society",
    type: "organization",
    description:
      "Student-made products, snacks, and organization items.",
    icon: "laptop",
    categories: [
      "Snacks",
      "Merch",
      "School",
    ],
    rating: 4.7,
    deliveryTime: "15–25 min",
    status: "Open",
    featured: true,
  },

  {
    id: "tupc-engineering-organization",
    name: "TUPC Engineering Organization",
    type: "organization",
    description:
      "Organization products and student essentials.",
    icon: "construct",
    categories: [
      "School",
      "Merch",
      "Snacks",
    ],
    rating: 4.5,
    deliveryTime: "15–25 min",
    status: "Open",
  },

  {
    id: "student-market",
    name: "Student Market",
    type: "others",
    description:
      "Useful campus essentials and student-made products.",
    icon: "storefront",
    categories: [
      "School",
      "Essentials",
      "Snacks",
    ],
    rating: 4.5,
    deliveryTime: "10–25 min",
    status: "Open",
  },

  {
    id: "campus-essentials",
    name: "Campus Essentials",
    type: "others",
    description:
      "School supplies and everyday campus necessities.",
    icon: "bag-handle",
    categories: [
      "School",
      "Supplies",
      "Essentials",
    ],
    rating: 4.4,
    deliveryTime: "10–25 min",
    status: "Closed",
  },
];