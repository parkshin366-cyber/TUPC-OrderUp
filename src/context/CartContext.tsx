import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_STORAGE_KEY = "@tupc_orderup_cart";
export type AddToCartResult = "added" | "different-store";

export type CartItem = {
  id: string; // Product ID
  name: string;
  price: number;
  quantity: number;

  // Store information
  storeId: string; // Actual Store _id
  store: string; // Store name for display

  image: string;
  maxQuantity?: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;

  addToCart: (
    item: Omit<CartItem, "quantity">,
    quantity?: number
  ) => AddToCartResult;

  replaceCart: (
    item: Omit<CartItem, "quantity">,
    quantity?: number
  ) => void;

  updateQuantity: (
    id: string,
    quantity: number
  ) => void;

  removeFromCart: (
    id: string
  ) => void;

  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((saved) => {
        if (!mounted || !saved) return;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter((item) => item && typeof item.id === "string" && typeof item.storeId === "string");
          const firstStoreId = validItems[0]?.storeId;
          setItems(
            validItems
              .filter((item) => item.storeId === firstStoreId)
              .map((item) => ({ ...item, store: item.store || "Campus Store" }))
          );
        }
      })
      .catch((error) => console.error("Load cart error:", error))
      .finally(() => { if (mounted) setCartLoaded(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch((error) =>
      console.error("Save cart error:", error)
    );
  }, [cartLoaded, items]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (
    item: Omit<CartItem, "quantity">,
    quantity = 1
  ): AddToCartResult => {
    if (quantity <= 0) {
      return "added";
    }

    if (items.length > 0 && items[0].storeId !== item.storeId) {
      return "different-store";
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) =>
          currentItem.id === item.id
      );

      // Product already exists in cart
      if (existingItem) {
        return currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                quantity: Math.min(
                  currentItem.quantity + quantity,
                  item.maxQuantity ?? currentItem.maxQuantity ?? Number.MAX_SAFE_INTEGER
                ),
              }
            : currentItem
        );
      }

      // New product
      return [
        ...currentItems,
        {
          ...item,
          quantity,
        },
      ];
    });

    return "added";
  };

  const replaceCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (quantity <= 0) return;
    setItems([{ ...item, quantity }]);
  };

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (
    id: string,
    quantity: number
  ) => {
    // If quantity becomes 0 or less,
    // remove the item from cart.
    if (quantity <= 0) {
      setItems((currentItems) =>
        currentItems.filter(
          (item) => item.id !== id
        )
      );

      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(quantity, item.maxQuantity ?? Number.MAX_SAFE_INTEGER),
            }
          : item
      )
    );
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (id: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = () => {
    setItems([]);
  };

  // =====================================================
  // TOTAL ITEM COUNT
  // =====================================================

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [items]
  );

  // =====================================================
  // SUBTOTAL
  // =====================================================

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.price * item.quantity,
        0
      ),
    [items]
  );

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    addToCart,
    replaceCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// =====================================================
// USE CART
// =====================================================

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
