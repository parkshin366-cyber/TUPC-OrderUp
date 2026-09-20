import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const CARDINAL = "#A6192E";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function SellerLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          CARDINAL,

        tabBarInactiveTintColor:
          MUTED,

        tabBarStyle: {
          height: 72,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: BORDER,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "grid"
                  : "grid-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          ORDERS
      ===================================================== */}

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "receipt"
                  : "receipt-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "fast-food"
                  : "fast-food-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          SALES
      ===================================================== */}

      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "bar-chart"
                  : "bar-chart-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "settings"
                  : "settings-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          HIDDEN ROUTES
      ===================================================== */}

      <Tabs.Screen
        name="inventory"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="store"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}