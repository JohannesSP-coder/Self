import { Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold, WorkSans_700Bold } from "@expo-google-fonts/work-sans";
import { useFonts } from "expo-font";
import { Stack, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../auth";
import { colors } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hide();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
