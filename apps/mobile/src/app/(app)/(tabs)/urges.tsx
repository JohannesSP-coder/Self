import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, errorMessage, type Tracker } from "../../../api";
import { confirm } from "../../../confirm";
import { colors, fontFamily, radius, spacing } from "../../../theme";
import { blockerSummary, formatShortDate } from "../../../util";

type Feedback = { kind: "good" | "reset"; text: string };

export default function UrgesScreen() {
  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.urges();
      setTrackers(res.trackers);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function resist(id: string) {
    setBusy(id);
    try {
      await api.resist(id);
      setFeedback((f) => ({ ...f, [id]: { kind: "good", text: "Stark! Notiert – weiter so." } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function relapse(id: string) {
    if (!(await confirm("Streak auf 0 setzen? Das ist okay – ehrlich sein zählt.", "Ja, Rückfall"))) return;
    setBusy(id);
    try {
      await api.relapse(id);
      setFeedback((f) => ({ ...f, [id]: { kind: "reset", text: "Rückfall notiert – morgen ist ein neuer Tag." } }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function addTracker() {
    if (!newName.trim()) return;
    try {
      await api.createTracker(newName.trim());
      setNewName("");
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const activeBlockers = trackers?.filter((t) => blockerSummary(t.blocker) !== null).length ?? 0;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sucht-Tracker</Text>
      <Text style={styles.subtitle}>Jeder Tag zählt.</Text>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {trackers && trackers.length > 0 && (
        <View style={[styles.blockerSummary, activeBlockers > 0 && styles.blockerSummaryActive]}>
          <View style={[styles.iconBadge, activeBlockers > 0 && styles.iconBadgeSolid]}>
            <Ionicons name="lock-closed-outline" size={19} color={activeBlockers > 0 ? "#fff" : colors.ink} />
          </View>
          <View style={styles.grow}>
            <View style={styles.rowGap}>
              <Text style={styles.blockerTitle}>App-Blocker</Text>
              {activeBlockers > 0 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>AKTIV</Text>
                </View>
              )}
            </View>
            <Text style={styles.blockerSub}>
              {activeBlockers > 0 ? `Aktiv für ${activeBlockers} von ${trackers.length} Trackern` : "Sperr Apps & Seiten, die dich triggern – pro Tracker einstellbar"}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.stack}>
        {trackers === null && !error && <Text style={styles.muted}>Lädt…</Text>}
        {trackers?.length === 0 && !adding && (
          <Text style={styles.muted}>Noch kein Tracker. Leg einen an für ein Verhalten, das du in den Griff bekommen willst – z.B. Pornos, Social Media oder Rauchen.</Text>
        )}

        {trackers?.map((t) => {
          const summary = blockerSummary(t.blocker);
          const fb = feedback[t.id];
          return (
            <View key={t.id} style={styles.trackerCard}>
              <View style={styles.trackerHead}>
                <View>
                  <Text style={styles.trackerName}>{t.name}</Text>
                  <Text style={styles.trackerSince}>sauber seit {formatShortDate(t.streakStartAt)}</Text>
                </View>
                <View style={styles.iconBadge}>
                  <Ionicons name="shield-outline" size={19} color={colors.ink} />
                </View>
              </View>

              <View style={styles.trackerStreak}>
                <Text style={styles.streakNumber}>{t.streakDays}</Text>
                <Text style={styles.streakUnit}>{t.streakDays === 1 ? "Tag" : "Tage"}</Text>
              </View>

              <Pressable style={styles.blockerRow} onPress={() => router.push(`/urges/${t.id}/blocker`)}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.ink} />
                <Text style={[styles.blockerRowText, styles.grow]}>{summary ? `Gesperrt: ${summary}` : "Kein Blocker – jetzt einrichten"}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.inkFaint} />
              </Pressable>

              {fb && (
                <View style={[styles.feedback, fb.kind === "good" ? styles.feedbackGood : styles.feedbackReset]}>
                  <Text style={styles.feedbackText}>{fb.text}</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.grow]} disabled={busy === t.id} onPress={() => resist(t.id)}>
                  <Text style={styles.buttonLabel}>Drang widerstanden</Text>
                </Pressable>
                <Pressable style={[styles.outlineButton, styles.grow]} onPress={() => relapse(t.id)}>
                  <Text style={styles.outlineButtonLabel}>Rückfall</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {adding ? (
          <View style={styles.card}>
            <Text style={styles.label}>Was willst du in den Griff bekommen?</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Social Media (abends)"
              placeholderTextColor={colors.inkFaint}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.outlineButton, styles.grow]} onPress={() => setAdding(false)}>
                <Text style={styles.outlineButtonLabel}>Abbrechen</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.grow]} onPress={addTracker}>
                <Text style={styles.buttonLabel}>Tracker anlegen</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          trackers && (
            <Pressable style={styles.dashedButton} onPress={() => setAdding(true)}>
              <Text style={styles.dashedButtonLabel}>+ Neuen Tracker hinzufügen</Text>
            </Pressable>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 24 },
  subtitle: { color: colors.inkSoft, fontSize: 13, marginTop: -spacing.sm },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  blockerSummary: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  blockerSummaryActive: { borderColor: colors.accent },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  iconBadgeSolid: { backgroundColor: colors.accent },
  grow: { flex: 1 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  blockerTitle: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  blockerSub: { color: colors.inkFaint, fontSize: 12.5, marginTop: 2 },
  pill: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { color: "#fff", fontSize: 10, fontFamily: fontFamily.bodyBold },
  stack: { gap: spacing.md },
  muted: { color: colors.inkFaint, fontSize: 13.5, lineHeight: 20 },
  trackerCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  trackerHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  trackerName: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 16 },
  trackerSince: { color: colors.inkFaint, fontSize: 12, marginTop: 2 },
  trackerStreak: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
  streakNumber: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 34 },
  streakUnit: { color: colors.inkFaint, fontSize: 14 },
  blockerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.sm },
  blockerRowText: { color: colors.ink, fontSize: 13 },
  feedback: { borderRadius: radius.md, padding: spacing.sm },
  feedbackGood: { backgroundColor: "#173622" },
  feedbackReset: { backgroundColor: colors.accentSoft },
  feedbackText: { color: colors.ink, fontSize: 13 },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 13.5 },
  outlineButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  outlineButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 13.5 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  label: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.ink, fontFamily: fontFamily.body },
  dashedButton: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, borderRadius: radius.lg, paddingVertical: 14, alignItems: "center" },
  dashedButtonLabel: { color: colors.inkSoft, fontFamily: fontFamily.bodyMedium, fontSize: 14 },
});
