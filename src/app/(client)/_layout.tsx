import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

// =====================================================
// TUP CARDINAL THEME
// =====================================================

const CARDINAL = "#A6192E";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const WHITE = "#FFFFFF";
const ACTIVE_BACKGROUND = "#FBECEF";

// =====================================================
// CLIENT LAYOUT
// =====================================================

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // =================================================
        // TAB COLORS
        // =================================================

        tabBarActiveTintColor: CARDINAL,
        tabBarInactiveTintColor: MUTED,

        // =================================================
        // BOTTOM NAVIGATION
        // =================================================

        tabBarStyle: {
          height: Platform.OS === "ios" ? 82 : 70,
          paddingTop: 7,
          paddingBottom: Platform.OS === "ios" ? 10 : 7,

          backgroundColor: WHITE,

          borderTopWidth: 1,
          borderTopColor: BORDER,

          // Android shadow
          elevation: 10,

          // iOS shadow
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 1,
        },

        tabBarIconStyle: {
          marginTop: 1,
        },

        // Hide keyboard automatically when keyboard opens
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* =================================================
          HOME
      ================================================= */}

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",

          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={21}
                  color={color}
                />
              </View>
            );
          },
        }}
      />

      {/* =================================================
          STORE
          
          NEW BOTTOM TAB
          
          This replaces Explore in the bottom navigation.
      ================================================= */}

      <Tabs.Screen
        name="store"
        options={{
          title: "Store",

          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "storefront" : "storefront-outline"}
                  size={22}
                  color={color}
                />
              </View>
            );
          },
        }}
      />

      {/* =================================================
          EXPLORE
          
          HIDDEN FROM BOTTOM NAVIGATION ONLY.
          
          IMPORTANT:
          explore.tsx IS NOT DELETED.
          
          You can still navigate to:
          
          router.push("/explore")
          
          from dashboard, search, categories, etc.
      ================================================= */}

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      {/* =================================================
          ORDERS
      ================================================= */}

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",

          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "receipt" : "receipt-outline"}
                  size={21}
                  color={color}
                />
              </View>
            );
          },
        }}
      />

      {/* =================================================
          PROFILE
      ================================================= */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={21}
                  color={color}
                />
              </View>
            );
          },
        }}
      />

      {/* =================================================
          HIDDEN CART
      ================================================= */}

      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />

      {/* =================================================
          HIDDEN CHECKOUT
      ================================================= */}

      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />

      {/* =================================================
          HIDDEN ORDER SUCCESS
      ================================================= */}

      <Tabs.Screen
        name="order-success"
        options={{
          href: null,
        }}
      />

      {/* =================================================
          HIDDEN CLIENT DETAILS GROUP
      ================================================= */}

      <Tabs.Screen
        name="(client-details)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 30,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",
  },

  activeIconContainer: {
    backgroundColor: ACTIVE_BACKGROUND,
  },
});

