import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, errorMessage, type JournalEntry } from "../../../api";
import { confirm } from "../../../confirm";
import { colors, fontFamily, radius, spacing } from "../../../theme";
import { formatEntryDate } from "../../../util";

const MOODS = [1, 2, 3, 4, 5];

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState(4);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .journal()
      .then((res) => setEntries(res.entries))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useFocusEffect(load);

  function closeComposer() {
    setComposerOpen(false);
    setDraft("");
    setMood(4);
  }

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await api.createEntry(draft.trim(), mood);
      setEntries((prev) => [res.entry, ...(prev ?? [])]);
      closeComposer();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: JournalEntry) {
    if (!(await confirm("Diesen Eintrag löschen?"))) return;
    try {
      await api.deleteEntry(entry.id);
      setEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Pressable
          style={styles.roundButton}
          onPress={() => (composerOpen ? closeComposer() : setComposerOpen(true))}
          accessibilityLabel={composerOpen ? "Eintrag verwerfen" : "Neuer Eintrag"}
        >
          <Ionicons name={composerOpen ? "close" : "add"} size={18} color="#fff" />
        </Pressable>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {composerOpen && (
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Was beschäftigt dich heute?"
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={5}
            value={draft}
            onChangeText={setDraft}
          />
          <Text style={styles.label}>Stimmung</Text>
          <View style={styles.moodRow}>
            {MOODS.map((v) => (
              <Pressable key={v} style={[styles.mood, mood === v && styles.moodSelected]} onPress={() => setMood(v)}>
                <Text style={[styles.moodLabel, mood === v && styles.moodLabelSelected]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Pressable style={[styles.outlineButton, styles.grow]} onPress={closeComposer}>
              <Text style={styles.outlineButtonLabel}>Verwerfen</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.grow]} onPress={save} disabled={saving}>
              <Text style={styles.buttonLabel}>{saving ? "Speichert…" : "Speichern"}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.stack}>
        {entries === null && !error && <Text style={styles.muted}>Lädt…</Text>}
        {entries?.length === 0 && !composerOpen && (
          <Text style={styles.muted}>
            Noch keine Einträge. Schreib auf, was dich heute beschäftigt – dein Coach liest mit und kann besser auf dich eingehen.
          </Text>
        )}
        {entries?.map((entry) => (
          <View key={entry.id} style={styles.entry}>
            <View style={styles.entryMeta}>
              <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
              <View style={styles.entryMetaRight}>
                {entry.mood !== null && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Stimmung {entry.mood}/5</Text>
                  </View>
                )}
                <Pressable hitSlop={8} onPress={() => remove(entry)} accessibilityLabel="Eintrag löschen">
                  <Ionicons name="trash-outline" size={15} color={colors.inkFaint} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.entryBody}>{entry.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 24 },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.ink, fontFamily: fontFamily.body },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  label: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  moodRow: { flexDirection: "row", gap: spacing.sm },
  mood: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  moodSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  moodLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold },
  moodLabelSelected: { color: "#fff" },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  grow: { flex: 1 },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  outlineButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  outlineButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
  stack: { gap: spacing.sm },
  muted: { color: colors.inkFaint, fontSize: 13.5, lineHeight: 20 },
  entry: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  entryMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryDate: { color: colors.inkFaint, fontSize: 12 },
  entryMetaRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipText: { color: colors.inkSoft, fontSize: 11 },
  entryBody: { color: colors.ink, fontSize: 14, lineHeight: 21 },
});
