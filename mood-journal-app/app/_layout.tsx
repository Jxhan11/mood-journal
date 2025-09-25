import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import * as SplashScreen from "expo-splash-screen";
import { View, Text, ActivityIndicator } from "react-native";
import { COLORS } from "../theme/theme";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, token } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Add any initialization logic here
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName={!isAuthenticated ? "screens/welcome" : "(tabs)"}
    >
      {/* Always available auth screens */}
      <Stack.Screen name="screens/welcome" />
      <Stack.Screen name="screens/login" />
      <Stack.Screen name="screens/signup" />

      {isAuthenticated && (
        // Main App Stack - only when authenticated
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="entry/create"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="entry/detail" />
          <Stack.Screen name="settings/profile" />
        </>
      )}
    </Stack>
  );
}
