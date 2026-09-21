import { Stack } from "expo-router";

const BG = "#F7F7F8";

export default function ClientDetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: BG,
        },
        gestureEnabled: true,
      }}
    />
  );
}

