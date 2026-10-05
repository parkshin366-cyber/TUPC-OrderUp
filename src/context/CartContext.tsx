import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string; // Product ID
  name: string;
  price: number;
  quantity: number;

  // Store information
  storeId: string; // Actual Store _id
  store: string; // Store name for display

  image: string;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;

  addToCart: (
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

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (
    item: Omit<CartItem, "quantity">,
    quantity = 1
  ) => {
    if (quantity <= 0) {
      return;
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
                quantity:
                  currentItem.quantity + quantity,
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
              quantity,
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