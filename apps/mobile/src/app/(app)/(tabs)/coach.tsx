import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, api, errorMessage, type CoachMessage } from "../../../api";
import { useAuth } from "../../../auth";
import { colors, fontFamily, radius, spacing } from "../../../theme";

const SUGGESTIONS = ["Wie schlafe ich besser?", "Ich hatte heute einen Rückfall", "Plan für diese Woche"];

export default function CoachScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function load() {
    try {
      const res = await api.coachConversation();
      setMessages(res.messages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    const optimistic: CoachMessage = { id: `local-${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    try {
      const res = await api.sendCoachMessage(message);
      setMessages((prev) => [...(prev ?? []), res.message]);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && (err.status === 400 || err.status === 503)) setDraft(message);
      await load();
    } finally {
      setSending(false);
    }
  }

  const empty = messages !== null && messages.length === 0;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.ink} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Dein Coach</Text>
          <Text style={styles.headerSub}>kennt deine Streaks & Journal-Einträge</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages === null && !error && <Text style={[styles.muted, styles.center]}>Lädt…</Text>}
        {empty && (
          <>
            <View style={styles.bubbleRow}>
              <Text style={styles.bubble}>
                Hey {user?.name}! Ich bin dein Coach. Ich kenne deine Bereiche, Streaks und Journal-Einträge und helfe dir, dranzubleiben. Womit fangen wir an?
              </Text>
            </View>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestion} onPress={() => send(s)} disabled={sending}>
                  <Text style={styles.suggestionLabel}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {messages?.map((m) => (
          <View key={m.id} style={[styles.bubbleRow, m.role === "user" && styles.bubbleRowUser]}>
            <Text style={[styles.bubble, m.role === "user" && styles.bubbleUser]}>{m.content}</Text>
          </View>
        ))}
        {sending && (
          <View style={styles.bubbleRow}>
            <Text style={styles.bubble}>…</Text>
          </View>
        )}
        {error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Schreib deinem Coach…"
          placeholderTextColor={colors.inkFaint}
          value={draft}
          onChangeText={setDraft}
          maxLength={4000}
        />
        <Pressable style={styles.sendButton} onPress={() => send(draft)} disabled={sending || !draft.trim()} accessibilityLabel="Senden">
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.xxl },
  headerIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 17 },
  headerSub: { color: colors.inkFaint, fontSize: 11.5, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.sm },
  center: { textAlign: "center" },
  muted: { color: colors.inkFaint, fontSize: 13.5 },
  bubbleRow: { alignItems: "flex-start" },
  bubbleRowUser: { alignItems: "flex-end" },
  bubble: { backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, lineHeight: 20, maxWidth: "85%", overflow: "hidden" },
  bubbleUser: { backgroundColor: colors.accent, color: "#fff" },
  suggestions: { gap: spacing.xs },
  suggestion: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignSelf: "flex-start" },
  suggestionLabel: { color: colors.inkSoft, fontSize: 13 },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  inputRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 11, color: colors.ink, fontFamily: fontFamily.body },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
});
