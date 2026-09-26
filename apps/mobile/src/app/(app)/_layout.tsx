import { Stack } from "expo-router";
import { colors } from "../../theme";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bereiche/[id]" />
      <Stack.Screen name="urges/[id]/blocker" />
      <Stack.Screen name="profil" />
    </Stack>
  );
}
