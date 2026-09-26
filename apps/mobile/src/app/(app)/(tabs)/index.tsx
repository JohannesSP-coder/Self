import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, errorMessage, type Segment, type Tracker } from "../../../api";
import { useAuth } from "../../../auth";
import { Avatar } from "../../../components/Avatar";
import { ReminderBanner } from "../../../components/ReminderBanner";
import { SEGMENT_ICONS, SegmentIcon } from "../../../components/SegmentIcon";
import { colors, fontFamily, radius, spacing } from "../../../theme";
import { isFocusSegment } from "../../../util";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [lastMood, setLastMood] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("star");

  const load = useCallback(async () => {
    try {
      const [s, u, j] = await Promise.all([api.segments(), api.urges(), api.journal()]);
      setSegments(s.segments);
      setTrackers(u.trackers);
      setLastMood(j.entries[0]?.mood ?? null);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addSegment() {
    if (!newName.trim()) return;
    try {
      await api.createSegment(newName.trim(), newIcon);
      setNewName("");
      setNewIcon("star");
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const habits = segments?.flatMap((s) => s.habits) ?? [];
  const doneToday = habits.filter((h) => h.doneToday).length;
  const cleanDays = trackers.length > 0 ? Math.max(...trackers.map((t) => t.streakDays)) : null;
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>{today}</Text>
          <Text style={styles.title}>
            {greeting()}, {user?.name}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/profil")} accessibilityLabel="Profil öffnen">
          <Avatar />
        </Pressable>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{segments ? `${doneToday}/${habits.length}` : "–"}</Text>
          <Text style={styles.statLabel}>Habits heute</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.statValueRow}>
            {cleanDays !== null && <Ionicons name="flame" size={15} color={colors.accentText} />}
            <Text style={styles.statValue}>{cleanDays ?? "–"}</Text>
          </View>
          <Text style={styles.statLabel}>Tage sauber</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{lastMood ? `${lastMood}/5` : "–"}</Text>
          <Text style={styles.statLabel}>Stimmung</Text>
        </View>
      </View>

      <ReminderBanner segments={segments} />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Deine Bereiche</Text>
        <Pressable onPress={() => setAdding(!adding)}>
          <Text style={styles.link}>{adding ? "Abbrechen" : "+ Neu"}</Text>
        </Pressable>
      </View>

      {adding && (
        <View style={styles.card}>
          <Text style={styles.label}>Name des Bereichs</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Ernährung, Karriere, Beziehungen"
            placeholderTextColor={colors.inkFaint}
            value={newName}
            onChangeText={setNewName}
          />
          <Text style={styles.label}>Symbol</Text>
          <View style={styles.iconPicker}>
            {Object.entries(SEGMENT_ICONS).map(([key, { label, ionicon }]) => (
              <Pressable
                key={key}
                style={[styles.iconChoice, newIcon === key && styles.iconChoiceSelected]}
                onPress={() => setNewIcon(key)}
                accessibilityLabel={label}
              >
                <Ionicons name={ionicon} size={20} color={newIcon === key ? "#fff" : colors.ink} />
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.button} onPress={addSegment}>
            <Text style={styles.buttonLabel}>Bereich anlegen</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.stack}>
        {segments === null && !error && <Text style={styles.muted}>Lädt…</Text>}
        {segments?.length === 0 && <Text style={styles.muted}>Noch keine Bereiche. Leg deinen ersten an, z.B. Fitness oder Schlaf.</Text>}
        {segments?.map((segment) => {
          const done = segment.habits.filter((h) => h.doneToday).length;
          const streak = Math.max(0, ...segment.habits.map((h) => h.streak));
          const focus = isFocusSegment(segment);
          return (
            <Pressable
              key={segment.id}
              style={[styles.segmentCard, focus && styles.segmentCardFocus]}
              onPress={() => router.push(`/bereiche/${segment.id}`)}
            >
              <View style={[styles.iconBadge, focus && styles.iconBadgeSolid]}>
                <SegmentIcon icon={segment.icon} size={21} color={focus ? "#fff" : colors.ink} />
              </View>
              <View style={styles.grow}>
                <View style={styles.segmentNameRow}>
                  <Text style={styles.segmentName}>{segment.name}</Text>
                  {focus && (
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>FOKUS</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.segmentSub}>
                  {segment.habits.length} {segment.habits.length === 1 ? "Habit" : "Habits"} · {done} heute erledigt
                </Text>
              </View>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={14} color={streak > 0 ? colors.accentText : colors.inkFaint} />
                <Text style={[styles.streakText, streak === 0 && styles.streakTextMuted]}>{streak}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.coachBanner} onPress={() => router.push("/coach")}>
        <View style={styles.coachBannerIcon}>
          <Ionicons name="chatbubble-outline" size={19} color="#fff" />
        </View>
        <View style={styles.grow}>
          <Text style={styles.coachBannerTitle}>Brauchst du einen Impuls?</Text>
          <Text style={styles.coachBannerSub}>Frag deinen Coach</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  overline: { color: colors.inkFaint, fontSize: 12, fontFamily: fontFamily.bodyMedium },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 24, marginTop: 4 },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  statRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", gap: 4 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 20 },
  statLabel: { color: colors.inkFaint, fontSize: 11.5 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 19 },
  link: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.ink,
    fontFamily: fontFamily.body,
  },
  iconPicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  iconChoice: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  iconChoiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  stack: { gap: spacing.sm },
  muted: { color: colors.inkFaint, fontSize: 13.5 },
  segmentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  segmentCardFocus: { borderColor: colors.accent },
  iconBadge: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  iconBadgeSolid: { backgroundColor: colors.accent },
  grow: { flex: 1 },
  segmentNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  segmentName: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 15.5 },
  pill: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { color: "#fff", fontSize: 10, fontFamily: fontFamily.bodyBold },
  segmentSub: { color: colors.inkFaint, fontSize: 12.5, marginTop: 2 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  streakTextMuted: { color: colors.inkFaint },
  coachBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  coachBannerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  coachBannerTitle: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  coachBannerSub: { color: "#FFE3E0", fontSize: 12, marginTop: 1 },
});
