import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const CARDINAL = "#A6192E";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: CARDINAL,
        tabBarInactiveTintColor: MUTED,

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
          HOME / DASHBOARD
      ===================================================== */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          EXPLORE
      ===================================================== */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={23}
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

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          PROFILE
      ===================================================== */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* =====================================================
          HIDDEN ROUTES
          These routes work normally but NEVER appear
          as bottom navigation tabs.
      ===================================================== */}

      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="order-success"
        options={{
          href: null,
        }}
      />

      {/* =====================================================
          CLIENT DETAILS GROUP
          Store/Product are inside a nested route group,
          so they don't appear in the bottom navigation.
      ===================================================== */}

      <Tabs.Screen
        name="(client-details)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
