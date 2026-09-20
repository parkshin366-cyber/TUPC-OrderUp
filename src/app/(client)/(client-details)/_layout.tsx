import { Stack } from "expo-router";

export default function ClientDetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#F7F7F8",
        },
      }}
    />
  );
}