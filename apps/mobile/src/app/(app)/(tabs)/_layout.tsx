import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: "Journal", tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="urges"
        options={{ title: "Urges", tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: "Coach", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
