import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, errorMessage, type BlockRule, type Tracker } from "../../../../api";
import { confirm } from "../../../../confirm";
import { Toggle } from "../../../../components/Toggle";
import { colors, fontFamily, radius, spacing } from "../../../../theme";

const APPS: BlockRule[] = [
  { kind: "app", target: "instagram", label: "Instagram" },
  { kind: "app", target: "tiktok", label: "TikTok" },
  { kind: "app", target: "snapchat", label: "Snapchat" },
  { kind: "app", target: "youtube", label: "YouTube" },
  { kind: "app", target: "x", label: "X" },
  { kind: "app", target: "reddit", label: "Reddit" },
];

const ADULT: BlockRule = { kind: "category", target: "adult", label: "Erwachsenen-Inhalte" };
const DELAYS = [0, 5, 15, 30, 60];

function ruleKey(r: BlockRule): string {
  return `${r.kind}:${r.target}`;
}

function normalizeDomain(input: string): string | null {
  const host = input.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export default function BlockerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [scheduled, setScheduled] = useState(true);
  const [from, setFrom] = useState("21:00");
  const [until, setUntil] = useState("07:00");
  const [delay, setDelay] = useState(15);
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    api
      .urges()
      .then((res) => {
        const t = res.trackers.find((x) => x.id === id) ?? null;
        setTracker(t);
        setNotFound(t === null);
        if (!t) return;
        const b = t.blocker;
        setEnabled(b.enabled);
        setScheduled(b.from !== null);
        if (b.from) setFrom(b.from);
        if (b.until) setUntil(b.until);
        setDelay(b.unlockDelayMinutes);
        setRules(b.rules);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  const has = (r: BlockRule) => rules.some((x) => ruleKey(x) === ruleKey(r));
  function setRule(r: BlockRule, on: boolean) {
    setSavedAt(null);
    setRules((prev) => (on ? [...prev.filter((x) => ruleKey(x) !== ruleKey(r)), r] : prev.filter((x) => ruleKey(x) !== ruleKey(r))));
  }
  const websites = rules.filter((r) => r.kind === "website");

  function change<T>(setter: (v: T) => void) {
    return (v: T) => {
      setSavedAt(null);
      setter(v);
    };
  }

  function addDomain() {
    const domain = normalizeDomain(domainInput);
    if (!domain) {
      setDomainError("Bitte eine Domain wie beispiel.de eingeben.");
      return;
    }
    setRule({ kind: "website", target: domain, label: domain }, true);
    setDomainInput("");
    setDomainError(null);
  }

  function stepDelay(dir: 1 | -1) {
    const next = dir === 1 ? DELAYS.find((d) => d > delay) : [...DELAYS].reverse().find((d) => d < delay);
    if (next !== undefined) change(setDelay)(next);
  }

  async function save() {
    if (!tracker) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveBlocker(tracker.id, { enabled, from: scheduled ? from : null, until: scheduled ? until : null, unlockDelayMinutes: delay, rules });
      setSavedAt(Date.now());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTracker() {
    if (!tracker) return;
    if (!(await confirm(`Tracker „${tracker.name}“ mit Verlauf und Blocker löschen?`, "Tracker löschen"))) return;
    setDeleting(true);
    try {
      await api.deleteTracker(tracker.id);
      router.replace("/urges");
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.muted}>Diesen Tracker gibt es nicht (mehr).</Text>
        <Pressable style={styles.outlineButton} onPress={() => router.replace("/urges")}>
          <Text style={styles.outlineButtonLabel}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  const appCount = APPS.filter(has).length;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Zurück zum Sucht-Tracker">
          <Ionicons name="arrow-back" size={17} color={colors.ink} />
        </Pressable>
        <View style={styles.grow}>
          <Text style={styles.title}>App-Blocker</Text>
          <Text style={styles.subtitle}>für „{tracker?.name ?? "…"}“</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={[styles.masterCard, enabled && styles.masterCardOn]}>
          <View style={[styles.iconBadge, enabled && styles.iconBadgeSolid]}>
            <Ionicons name="lock-closed-outline" size={20} color={enabled ? "#fff" : colors.ink} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.masterTitle}>{enabled ? "Blocker ist aktiv" : "Blocker ist aus"}</Text>
            <Text style={styles.masterSub}>{enabled ? `${scheduled ? `${from}–${until} Uhr` : "Rund um die Uhr"} · ${rules.length} Sperren` : "Nichts wird gesperrt"}</Text>
          </View>
          <Toggle checked={enabled} onChange={change(setEnabled)} label="Blocker an oder aus" />
        </View>

        <View style={[styles.sections, !enabled && styles.sectionsDimmed]}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Wann sperren?</Text>
            <View style={styles.segmented}>
              <Pressable style={[styles.segmentedItem, !scheduled && styles.segmentedItemSelected]} onPress={() => change(setScheduled)(false)}>
                <Text style={[styles.segmentedLabel, !scheduled && styles.segmentedLabelSelected]}>Immer</Text>
              </Pressable>
              <Pressable style={[styles.segmentedItem, scheduled && styles.segmentedItemSelected]} onPress={() => change(setScheduled)(true)}>
                <Text style={[styles.segmentedLabel, scheduled && styles.segmentedLabelSelected]}>Zeitplan</Text>
              </Pressable>
            </View>
            {scheduled && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Von</Text>
                <TextInput style={[styles.input, styles.timeInput]} value={from} onChangeText={change(setFrom)} placeholder="21:00" placeholderTextColor={colors.inkFaint} />
                <Text style={styles.timeLabel}>bis</Text>
                <TextInput style={[styles.input, styles.timeInput]} value={until} onChangeText={change(setUntil)} placeholder="07:00" placeholderTextColor={colors.inkFaint} />
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardEyebrow}>Apps</Text>
              <Text style={styles.mutedSmall}>{appCount} gesperrt</Text>
            </View>
            {APPS.map((app) => (
              <View key={app.target} style={styles.listRow}>
                <View style={styles.appInitial}>
                  <Text style={styles.appInitialText}>{app.label.charAt(0)}</Text>
                </View>
                <Text style={[styles.grow, styles.listRowTitle]}>{app.label}</Text>
                <Toggle checked={has(app)} onChange={(on) => setRule(app, on)} label={`${app.label} sperren`} />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Webseiten</Text>
            <View style={[styles.listRow, styles.listRowNoBorder]}>
              <View style={styles.grow}>
                <Text style={styles.listRowTitle}>Erwachsenen-Inhalte</Text>
                <Text style={styles.masterSub}>Filter für Pornoseiten in allen Browsern</Text>
              </View>
              <Toggle checked={has(ADULT)} onChange={(on) => setRule(ADULT, on)} label="Erwachsenen-Filter" />
            </View>
            {websites.map((site) => (
              <View key={site.target} style={styles.listRow}>
                <Text style={[styles.grow, styles.listRowTitle]}>{site.label}</Text>
                <Pressable hitSlop={8} onPress={() => setRule(site, false)} accessibilityLabel={`${site.label} entfernen`}>
                  <Ionicons name="trash-outline" size={15} color={colors.inkFaint} />
                </Pressable>
              </View>
            ))}
            <View style={styles.inlineForm}>
              <TextInput
                style={[styles.input, styles.grow]}
                placeholder="Eigene Seite, z.B. reddit.com"
                placeholderTextColor={colors.inkFaint}
                value={domainInput}
                onChangeText={setDomainInput}
                autoCapitalize="none"
              />
              <Pressable style={styles.compactButton} onPress={addDomain}>
                <Text style={styles.outlineButtonLabel}>Hinzufügen</Text>
              </Pressable>
            </View>
            {domainError && <Text style={styles.fieldError}>{domainError}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Notfall-Entsperren</Text>
            <Text style={styles.cardText}>Entsperren geht nur mit Wartezeit, damit der erste Impuls vorbeigeht. Dein Coach fragt danach nach, was los war.</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => stepDelay(-1)} disabled={delay <= DELAYS[0]} hitSlop={8}>
                <Text style={styles.stepperButton}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{delay === 0 ? "Keine Wartezeit" : `${delay} Min. Wartezeit`}</Text>
              <Pressable onPress={() => stepDelay(1)} disabled={delay >= DELAYS[DELAYS.length - 1]} hitSlop={8}>
                <Text style={styles.stepperButton}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.note}>Die Sperre selbst greift auf deinem Handy. Hier legst du fest, was gesperrt wird – die Einstellungen werden mit deinem Konto synchronisiert.</Text>

        <Pressable style={styles.button} onPress={save} disabled={saving || !tracker}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonLabel}>{savedAt ? "Gespeichert" : "Einstellungen speichern"}</Text>}
        </Pressable>

        <Pressable style={styles.dangerLink} onPress={deleteTracker} disabled={deleting}>
          {deleting ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.dangerLinkLabel}>Tracker löschen</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, paddingTop: spacing.xxl },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 21 },
  subtitle: { color: colors.inkSoft, fontSize: 12.5, marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  masterCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  masterCardOn: { borderColor: colors.accent },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  iconBadgeSolid: { backgroundColor: colors.accent },
  masterTitle: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  masterSub: { color: colors.inkFaint, fontSize: 12.5, marginTop: 2 },
  sections: { gap: spacing.md },
  sectionsDimmed: { opacity: 0.5 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardEyebrow: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12.5 },
  mutedSmall: { color: colors.inkFaint, fontSize: 12 },
  segmented: { flexDirection: "row", backgroundColor: colors.surface2, borderRadius: radius.md, padding: 3 },
  segmentedItem: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: radius.sm },
  segmentedItemSelected: { backgroundColor: colors.accent },
  segmentedLabel: { color: colors.inkSoft, fontSize: 13, fontFamily: fontFamily.bodyMedium },
  segmentedLabelSelected: { color: "#fff", fontFamily: fontFamily.bodySemiBold },
  timeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeLabel: { color: colors.inkSoft, fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, color: colors.ink, fontFamily: fontFamily.body },
  timeInput: { width: 78, textAlign: "center" },
  listRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  listRowNoBorder: { borderTopWidth: 0 },
  listRowTitle: { color: colors.ink, fontSize: 14 },
  appInitial: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  appInitialText: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  inlineForm: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  compactButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  fieldError: { color: colors.danger, fontSize: 12.5 },
  cardText: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  stepperButton: { color: colors.ink, fontSize: 22, fontFamily: fontFamily.bodySemiBold, width: 32, textAlign: "center" },
  stepperValue: { color: colors.ink, fontSize: 13.5, minWidth: 130, textAlign: "center" },
  note: { color: colors.inkFaint, fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  outlineButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: spacing.md, alignItems: "center" },
  outlineButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 13.5 },
  dangerLink: { alignItems: "center", paddingVertical: spacing.md },
  dangerLinkLabel: { color: colors.inkFaint, fontSize: 13, textDecorationLine: "underline" },
  muted: { color: colors.inkFaint, fontSize: 13.5 },
});
