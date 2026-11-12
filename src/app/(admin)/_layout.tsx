export const unstable_settings = { initialRouteName: "dashboard" };
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";

export default function AdminLayout() {
  const { colors, themeMode } = useAppTheme();

  return (
    <Tabs
      key={themeMode}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cardinal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 82 : 70,
          paddingTop: 7,
          paddingBottom: Platform.OS === "ios" ? 10 : 7,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Overview", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={focused ? colors.cardinal : colors.muted} /> }} />
      <Tabs.Screen name="users" options={{ title: "Users", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={22} color={focused ? colors.cardinal : colors.muted} /> }} />
      <Tabs.Screen name="finance" options={{ title: "Finance", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={focused ? colors.cardinal : colors.muted} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={22} color={focused ? colors.cardinal : colors.muted} /> }} />
      <Tabs.Screen name="vouchers" options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
      <Tabs.Screen name="settings" options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
      <Tabs.Screen name="security" options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
      <Tabs.Screen name="database" options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
    </Tabs>
  );
}
