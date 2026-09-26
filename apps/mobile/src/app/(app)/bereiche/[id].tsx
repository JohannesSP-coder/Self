import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, api, errorMessage, type Habit, type Proof, type Segment } from "../../../api";
import { confirm } from "../../../confirm";
import { ProofStrip, ProofViewer } from "../../../components/ProofStrip";
import { SegmentIcon } from "../../../components/SegmentIcon";
import { pickProofPhoto, takeProofPhoto } from "../../../images";
import { forgetProof } from "../../../proofImages";
import { colors, fontFamily, radius, spacing } from "../../../theme";
import { isFocusSegment, proofHint } from "../../../util";

function lastSevenDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""));
  }
  return labels;
}

const TARGETS = [1, 2, 3, 4, 5, 6, 7];

export default function SegmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(5);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ habitTitle: string; proof: Proof } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.segments();
      const found = res.segments.find((s) => s.id === id) ?? null;
      setSegment(found);
      setNotFound(found === null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(habitId: string) {
    setPending(habitId);
    try {
      await api.toggleHabit(habitId);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function addHabit() {
    if (!segment || !title.trim()) return;
    try {
      await api.createHabit(segment.id, title.trim(), target);
      setTitle("");
      setTarget(5);
      setAdding(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function addProof(habit: Habit) {
    Alert.alert("Beweisfoto", undefined, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Kamera", onPress: () => runProofPick(habit.id, takeProofPhoto) },
      { text: "Galerie", onPress: () => runProofPick(habit.id, pickProofPhoto) },
    ]);
  }

  async function runProofPick(habitId: string, pick: () => Promise<string | null>) {
    setUploading(habitId);
    setError(null);
    try {
      const image = await pick();
      if (!image) return;
      await api.addProof(habitId, image);
      await load();
    } catch (err) {
      setError(err instanceof Error && !(err instanceof ApiError) ? err.message : errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  async function removeProof(proofId: string) {
    setDeleting(true);
    try {
      await api.deleteProof(proofId);
      forgetProof(proofId);
      setViewing(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function removeHabit(habit: Habit) {
    if (!(await confirm(`„${habit.title}“ löschen? Der Verlauf geht dabei verloren.`))) return;
    setDeleting(true);
    try {
      await api.deleteHabit(habit.id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function removeSegment() {
    if (!segment) return;
    if (!(await confirm(`Bereich „${segment.name}“ mit allen Habits löschen?`, "Bereich löschen"))) return;
    setDeleting(true);
    try {
      await api.deleteSegment(segment.id);
      router.replace("/");
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.muted}>Diesen Bereich gibt es nicht (mehr).</Text>
        <Pressable style={styles.outlineButton} onPress={() => router.replace("/")}>
          <Text style={styles.outlineButtonLabel}>Zurück zu Home</Text>
        </Pressable>
      </View>
    );
  }

  const labels = lastSevenDayLabels();
  const habits = segment?.habits ?? [];
  const focus = segment ? isFocusSegment(segment) : false;
  const hint = segment ? proofHint(segment) : "";

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Zurück zu Home">
          <Ionicons name="arrow-back" size={17} color={colors.ink} />
        </Pressable>
        <View style={styles.grow}>
          <Text style={styles.overline}>Bereich</Text>
          <Text style={styles.title}>{segment?.name ?? "…"}</Text>
        </View>
        {segment && (
          <View style={[styles.iconBadge, focus && styles.iconBadgeSolid]}>
            <SegmentIcon icon={segment.icon} size={19} color={focus ? "#fff" : colors.ink} />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.weekStrip}>
          {labels.map((label, i) => {
            const done = habits.filter((h) => h.last7[i]).length;
            const state = habits.length > 0 && done === habits.length ? colors.accent : done > 0 ? colors.accentSoft : "transparent";
            const isToday = i === 6;
            return (
              <View key={i} style={styles.day}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
                <View style={[styles.dayDot, { backgroundColor: state, borderColor: isToday ? colors.accent : colors.border }]} />
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Deine Habits</Text>
        <View style={styles.stack}>
          {segment && habits.length === 0 && <Text style={styles.muted}>Noch keine Habits in diesem Bereich. Leg unten dein erstes an.</Text>}
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitRow}>
                <Pressable
                  style={[styles.check, habit.doneToday && styles.checkDone]}
                  disabled={pending === habit.id}
                  onPress={() => toggle(habit.id)}
                  accessibilityLabel={`${habit.title} heute erledigt`}
                >
                  {habit.doneToday && <Ionicons name="checkmark" size={14} color="#fff" />}
                </Pressable>
                <View style={styles.grow}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitSub}>Ziel: {habit.targetPerWeek}x / Woche</Text>
                </View>
                <View style={styles.streakRow}>
                  <Ionicons name="flame" size={14} color={habit.streak > 0 ? colors.accentText : colors.inkFaint} />
                  <Text style={[styles.streakText, habit.streak === 0 && styles.streakTextMuted]}>{habit.streak}</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => removeHabit(habit)} accessibilityLabel={`${habit.title} löschen`}>
                  <Ionicons name="trash-outline" size={16} color={colors.inkFaint} />
                </Pressable>
              </View>
              <ProofStrip
                habit={habit}
                hint={hint}
                uploading={uploading === habit.id}
                onPick={() => addProof(habit)}
                onOpen={(proof) => setViewing({ habitTitle: habit.title, proof })}
              />
            </View>
          ))}

          {adding ? (
            <View style={styles.card}>
              <Text style={styles.label}>Neues Habit</Text>
              <TextInput
                style={styles.input}
                placeholder="z.B. 20 Min. Laufen"
                placeholderTextColor={colors.inkFaint}
                value={title}
                onChangeText={setTitle}
              />
              <Text style={styles.label}>Ziel pro Woche</Text>
              <View style={styles.targetRow}>
                {TARGETS.map((n) => (
                  <Pressable key={n} style={[styles.targetChoice, target === n && styles.targetChoiceSelected]} onPress={() => setTarget(n)}>
                    <Text style={[styles.targetChoiceLabel, target === n && styles.targetChoiceLabelSelected]}>{n === 7 ? "Jeden Tag" : `${n}x`}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.buttonRow}>
                <Pressable style={[styles.outlineButton, styles.grow]} onPress={() => setAdding(false)}>
                  <Text style={styles.outlineButtonLabel}>Abbrechen</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.grow]} onPress={addHabit}>
                  <Text style={styles.buttonLabel}>Hinzufügen</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            segment && (
              <Pressable style={styles.dashedButton} onPress={() => setAdding(true)}>
                <Text style={styles.dashedButtonLabel}>+ Neues Habit hinzufügen</Text>
              </Pressable>
            )
          )}
        </View>

        {segment && (
          <Pressable style={styles.dangerLink} onPress={removeSegment} disabled={deleting}>
            {deleting ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.dangerLinkLabel}>Bereich löschen</Text>}
          </Pressable>
        )}
      </ScrollView>

      {viewing && (
        <ProofViewer
          habitTitle={viewing.habitTitle}
          proof={viewing.proof}
          deleting={deleting}
          onDelete={() => removeProof(viewing.proof.id)}
          onClose={() => setViewing(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, paddingTop: spacing.xxl },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  overline: { color: colors.inkFaint, fontSize: 12, fontFamily: fontFamily.bodyMedium },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 21 },
  iconBadge: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  iconBadgeSolid: { backgroundColor: colors.accent },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  weekStrip: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: spacing.xs },
  dayLabel: { color: colors.inkFaint, fontSize: 11 },
  dayLabelToday: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold },
  dayDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5 },
  sectionTitle: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 18, marginTop: spacing.sm },
  stack: { gap: spacing.sm },
  muted: { color: colors.inkFaint, fontSize: 13.5 },
  habitCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  habitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  habitTitle: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  habitSub: { color: colors.inkFaint, fontSize: 12, marginTop: 1 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 13 },
  streakTextMuted: { color: colors.inkFaint },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  label: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.ink, fontFamily: fontFamily.body },
  targetRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  targetChoice: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  targetChoiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  targetChoiceLabel: { color: colors.ink, fontSize: 12.5 },
  targetChoiceLabelSelected: { color: "#fff", fontFamily: fontFamily.bodySemiBold },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  outlineButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  outlineButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  dashedButton: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, borderRadius: radius.lg, paddingVertical: 14, alignItems: "center" },
  dashedButtonLabel: { color: colors.inkSoft, fontFamily: fontFamily.bodyMedium, fontSize: 14 },
  dangerLink: { alignItems: "center", paddingVertical: spacing.md },
  dangerLinkLabel: { color: colors.inkFaint, fontSize: 13, textDecorationLine: "underline" },
});
