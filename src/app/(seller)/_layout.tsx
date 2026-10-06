import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";

export default function SellerLayout() {
  const { colors, themeMode } = useAppTheme();

  return (
    <Tabs
      key={themeMode}
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          colors.cardinal,

        tabBarInactiveTintColor:
          colors.muted,

        tabBarStyle: {
          height: 72,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
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

      <Tabs.Screen name="vouchers" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />

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
