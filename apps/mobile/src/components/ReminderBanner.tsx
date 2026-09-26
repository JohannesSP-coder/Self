import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { Segment } from "../api";
import { pickReminder } from "../reminders";
import { colors, fontFamily, radius, spacing } from "../theme";

const DISMISS_KEY = "meglio_dismissed_reminder";

/** Same picker as the server/web use for push, shown as an in-app banner on Home. */
export function ReminderBanner({ segments }: { segments: Segment[] | null }) {
  const [now, setNow] = useState(() => new Date());
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(DISMISS_KEY).then(setDismissedId).catch(() => undefined);
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!segments) return null;
  const reminder = pickReminder(now, segments);
  if (!reminder || reminder.id === dismissedId) return null;

  return (
    <Pressable style={styles.banner} onPress={() => router.push(`/bereiche/${reminder.segmentId}`)}>
      <View style={styles.icon}>
        <Ionicons name="notifications-outline" size={18} color="#fff" />
      </View>
      <View style={styles.grow}>
        <Text style={styles.title}>{reminder.title}</Text>
        <Text style={styles.body}>{reminder.body}</Text>
      </View>
      <Pressable
        style={styles.close}
        hitSlop={8}
        onPress={() => {
          setDismissedId(reminder.id);
          SecureStore.setItemAsync(DISMISS_KEY, reminder.id).catch(() => undefined);
        }}
      >
        <Ionicons name="close" size={16} color={colors.inkFaint} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#5A1F1C",
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  grow: { flex: 1 },
  title: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 13 },
  body: { color: colors.ink, marginTop: 2, fontSize: 13.5, lineHeight: 18 },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
