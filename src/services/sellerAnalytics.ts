import type { Order, Product } from "./api";

// =====================================================
// SELLER ANALYTICS
// Pure helpers that turn the seller's orders and products
// into the numbers shown on the Sales and Dashboard screens.
//
// Rules:
// - Only "Completed" orders count as sales.
// - Cancelled orders are ignored everywhere.
// - Orders are placed in a period using their createdAt date.
// =====================================================

export type Period = "Today" | "7 Days" | "30 Days" | "All Time";

export const FOOD_CATEGORIES = ["Meals", "Snacks", "Drinks", "Desserts"];

// Same threshold used by the Products screen.
export const LOW_STOCK_LIMIT = 10;

export const isFoodCategory = (category: string): boolean =>
  FOOD_CATEGORIES.includes(category);

const DAY_MS = 86_400_000;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TODAY_LABELS = [
  "6AM",
  "8AM",
  "10AM",
  "12PM",
  "2PM",
  "4PM",
  "6PM",
  "8PM",
];

// =====================================================
// DATE HELPERS
// =====================================================

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getOrderDate(order: Order): Date | null {
  if (!order.createdAt) {
    return null;
  }

  const date = new Date(order.createdAt);

  return Number.isNaN(date.getTime()) ? null : date;
}

const orderTotal = (order: Order): number => {
  const total = Number(order.total);

  return Number.isFinite(total) ? total : 0;
};

function isInRange(order: Order, start: Date, end: Date): boolean {
  const date = getOrderDate(order);

  return !!date && date >= start && date < end;
}

function completedIn(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter(
    (order) =>
      order.status === "Completed" && isInRange(order, start, end)
  );
}

const sumOrders = (orders: Order[]) =>
  orders.reduce((sum, order) => sum + orderTotal(order), 0);

// =====================================================
// ORDER DISPLAY HELPERS
// =====================================================

export function getCustomerName(order: Order): string {
  if (typeof order.customer === "object" && order.customer !== null) {
    const firstName = order.customer.firstName ?? "";
    const lastName = order.customer.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    return (
      order.customer.username || order.customer.email || "Customer"
    );
  }

  return order.customer || "Customer";
}

export function describeItems(order: Order): string {
  const items = order.items ?? [];

  if (items.length === 0) {
    return "No items";
  }

  if (items.length === 1) {
    return `${items[0].name} × ${items[0].quantity}`;
  }

  return `${items[0].name} + ${items.length - 1} more`;
}

export function formatOrderCode(order: Order): string {
  return `#${order._id.slice(-6).toUpperCase()}`;
}

export function formatTimeAgo(createdAt: string): string {
  const date = new Date(createdAt);

  if (!createdAt || Number.isNaN(date.getTime())) {
    return "";
  }

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString();
}

export function getRecentOrders(orders: Order[], limit: number): Order[] {
  return orders
    .filter((order) => order.status !== "Cancelled")
    .sort((a, b) => {
      const first = getOrderDate(a)?.getTime() ?? 0;
      const second = getOrderDate(b)?.getTime() ?? 0;

      return second - first;
    })
    .slice(0, limit);
}

// =====================================================
// CHANGE TEXT
// =====================================================

// Percent change vs. the previous period.
// null means there was nothing to compare against.
export function formatChange(percent: number | null, total: number): string {
  if (percent === null) {
    return total > 0 ? "New" : "—";
  }

  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function describeChange(
  percent: number | null,
  total: number,
  comparedTo: string
): string {
  if (percent === null) {
    return total > 0 ? "No sales to compare yet" : "No sales yet";
  }

  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% from ${comparedTo}`;
}

// =====================================================
// PERIODS AND CHART BUCKETS
// =====================================================

function getPeriodRange(period: Period, now: Date, orders: Order[]) {
  const today = startOfDay(now);

  if (period === "All Time") {
    // From the oldest order up to today. No previous period to compare.
    let earliest = today;

    orders.forEach((order) => {
      const date = getOrderDate(order);

      if (date && date < earliest) {
        earliest = startOfDay(date);
      }
    });

    return {
      start: earliest,
      end: addDays(today, 1),
      prevStart: earliest,
      prevEnd: earliest,
    };
  }

  const length = period === "Today" ? 1 : period === "7 Days" ? 7 : 30;
  const start = addDays(today, -(length - 1));

  return {
    start,
    end: addDays(start, length),
    prevStart: addDays(start, -length),
    prevEnd: start,
  };
}

// All Time: six equal slices between the oldest order and today.
function getAllTimeBucketSize(start: Date, end: Date): number {
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);

  return Math.max(1, Math.ceil(days / 6));
}

function getBucketLabels(period: Period, start: Date, end: Date): string[] {
  if (period === "Today") {
    return TODAY_LABELS;
  }

  if (period === "All Time") {
    const size = getAllTimeBucketSize(start, end);

    return Array.from({ length: 6 }, (_, index) => {
      const date = addDays(start, index * size);

      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
  }

  if (period === "7 Days") {
    return Array.from(
      { length: 7 },
      (_, index) => WEEKDAYS[addDays(start, index).getDay()]
    );
  }

  // 30 days: six buckets of five days each.
  return Array.from({ length: 6 }, (_, index) => {
    const date = addDays(start, index * 5);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
}

function getBucketIndex(
  period: Period,
  date: Date,
  start: Date,
  end: Date
): number {
  if (period === "All Time") {
    const dayIndex = Math.round(
      (startOfDay(date).getTime() - start.getTime()) / DAY_MS
    );

    return clamp(Math.floor(dayIndex / getAllTimeBucketSize(start, end)), 0, 5);
  }

  if (period === "Today") {
    // 2-hour blocks from 6AM. Earlier/later orders go in the first/last block.
    return clamp(Math.floor((date.getHours() - 6) / 2), 0, 7);
  }

  const dayIndex = Math.round(
    (startOfDay(date).getTime() - start.getTime()) / DAY_MS
  );

  if (period === "7 Days") {
    return clamp(dayIndex, 0, 6);
  }

  return clamp(Math.floor(dayIndex / 5), 0, 5);
}

// =====================================================
// SALES SUMMARY
// =====================================================

export type TopProduct = {
  name: string;
  category: string;
  sold: number;
  revenue: number;
};

export type SalesSummary = {
  total: number;
  orderCount: number;
  average: number;
  changePercent: number | null;
  chart: number[];
  labels: string[];
  payment: {
    cash: number;
    gcash: number;
    total: number;
    cashPercent: number;
    gcashPercent: number;
  };
  topProducts: TopProduct[];
};

function getItemUnitPrice(
  item: NonNullable<Order["items"]>[number],
  fallbackPrice: number | undefined
): number {
  const raw = (item as unknown as { price?: number | string | null }).price;

  if (raw !== undefined && raw !== null) {
    const price = Number(raw);

    if (Number.isFinite(price)) {
      return price;
    }
  }

  return fallbackPrice ?? 0;
}

export function computeSales(
  orders: Order[],
  products: Product[],
  period: Period,
  now: Date = new Date()
): SalesSummary {
  const { start, end, prevStart, prevEnd } = getPeriodRange(
    period,
    now,
    orders
  );

  // All Time also counts old orders that have no valid date.
  const completed =
    period === "All Time"
      ? orders.filter((order) => order.status === "Completed")
      : completedIn(orders, start, end);
  const previous = completedIn(orders, prevStart, prevEnd);

  const total = sumOrders(completed);
  const previousTotal = sumOrders(previous);

  // ---- chart ----

  const labels = getBucketLabels(period, start, end);
  const chart = labels.map(() => 0);

  completed.forEach((order) => {
    const date = getOrderDate(order);

    const index = date ? getBucketIndex(period, date, start, end) : 0;

    chart[index] += orderTotal(order);
  });

  // ---- payment methods ----

  let cash = 0;
  let gcash = 0;

  completed.forEach((order) => {
    if (order.paymentMethod === "cash") {
      cash += orderTotal(order);
    } else if (order.paymentMethod === "gcash") {
      gcash += orderTotal(order);
    }
  });

  const paymentTotal = cash + gcash;

  // ---- top products ----

  const productByName = new Map<string, Product>();

  products.forEach((product) => {
    productByName.set(product.name.trim().toLowerCase(), product);
  });

  const sold = new Map<string, TopProduct>();

  completed.forEach((order) => {
    (order.items ?? []).forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const product = productByName.get(key);
      const quantity = Number(item.quantity) || 0;
      const unitPrice = getItemUnitPrice(item, product?.price);

      const existing = sold.get(key);

      if (existing) {
        existing.sold += quantity;
        existing.revenue += unitPrice * quantity;
      } else {
        sold.set(key, {
          name: item.name,
          category: product?.category ? String(product.category) : "Other",
          sold: quantity,
          revenue: unitPrice * quantity,
        });
      }
    });
  });

  const topProducts = Array.from(sold.values())
    .sort((a, b) => b.revenue - a.revenue || b.sold - a.sold)
    .slice(0, 5);

  return {
    total,
    orderCount: completed.length,
    average: completed.length ? total / completed.length : 0,
    changePercent:
      previousTotal > 0
        ? ((total - previousTotal) / previousTotal) * 100
        : null,
    chart,
    labels,
    payment: {
      cash,
      gcash,
      total: paymentTotal,
      cashPercent: paymentTotal ? Math.round((cash / paymentTotal) * 100) : 0,
      gcashPercent: paymentTotal
        ? Math.round((gcash / paymentTotal) * 100)
        : 0,
    },
    topProducts,
  };
}

// =====================================================
// DASHBOARD SUMMARY
// =====================================================

export type DashboardSummary = {
  today: SalesSummary;
  week: SalesSummary;
  ordersToday: number;
  inProgress: number;
  productCount: number;
  attentionCount: number;
  lowStockCount: number;
  recent: Order[];
};

export function computeDashboard(
  orders: Order[],
  products: Product[],
  now: Date = new Date()
): DashboardSummary {
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  const ordersToday = orders.filter(
    (order) =>
      order.status !== "Cancelled" && isInRange(order, todayStart, todayEnd)
  ).length;

  const inProgress = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Preparing" ||
      order.status === "Ready"
  ).length;

  // Food products don't track stock, so they never count as low stock.
  const isTrackedLow = (product: Product) =>
    !isFoodCategory(String(product.category ?? "").trim()) &&
    product.stock <= LOW_STOCK_LIMIT;

  const lowStockCount = products.filter(
    (product) => isTrackedLow(product) && product.stock > 0
  ).length;

  const attentionCount = products.filter(
    (product) => !product.available || isTrackedLow(product)
  ).length;

  return {
    today: computeSales(orders, products, "Today", now),
    week: computeSales(orders, products, "7 Days", now),
    ordersToday,
    inProgress,
    productCount: products.length,
    attentionCount,
    lowStockCount,
    recent: getRecentOrders(orders, 4),
  };
}