import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TruckerDataProvider } from "@/hooks/useTruckerData";
import { POIProvider } from "@/hooks/usePOI";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Zurück" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: "modal",
          title: "Modal"
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TruckerDataProvider>
        <POIProvider>
          <GestureHandlerRootView style={styles.container}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </POIProvider>
      </TruckerDataProvider>
    </QueryClientProvider>
  );
}