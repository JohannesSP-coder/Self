import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, api, errorMessage } from "../../api";
import { useAuth } from "../../auth";
import { Avatar } from "../../components/Avatar";
import { Toggle } from "../../components/Toggle";
import { confirm } from "../../confirm";
import { disablePushReminders, enablePushReminders, getStoredPushToken } from "../../push";
import { colors, fontFamily, radius, spacing } from "../../theme";

export default function ProfileScreen() {
  const { user, updateAvatarFromLibrary, updateAvatarFromCamera, removeAvatar, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = Boolean(user?.avatarVersion);

  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.pushPublicKey().catch(() => ({ publicKey: null })), getStoredPushToken()]).then(([{ publicKey }, token]) => {
      setPushAvailable(Boolean(publicKey));
      setPushEnabled(token !== null);
    });
  }, []);

  async function onTogglePush(next: boolean) {
    setPushBusy(true);
    setPushError(null);
    try {
      if (next) await enablePushReminders();
      else await disablePushReminders();
      setPushEnabled(next);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen. Bitte versuch es erneut.");
    } finally {
      setPushBusy(false);
    }
  }

  function pickPhoto() {
    Alert.alert("Profilbild", undefined, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Kamera", onPress: () => run(updateAvatarFromCamera) },
      { text: "Galerie", onPress: () => run(updateAvatarFromLibrary) },
    ]);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error && !(err instanceof ApiError) ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!(await confirm("Profilbild wirklich entfernen?", "Entfernen"))) return;
    setBusy(true);
    setError(null);
    try {
      await removeAvatar();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Zurück zu Home">
          <Ionicons name="arrow-back" size={17} color={colors.ink} />
        </Pressable>
        <View>
          <Text style={styles.overline}>Konto</Text>
          <Text style={styles.title}>Profil</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.profileCard}>
          <View style={[styles.photoWrap, busy && styles.photoWrapBusy]}>
            <Avatar size={104} />
            <Pressable style={styles.photoBadge} onPress={pickPhoto} disabled={busy} accessibilityLabel="Foto ändern">
              <Ionicons name="camera-outline" size={17} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.mail}>{user?.email}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={pickPhoto} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonLabel}>{hasPhoto ? "Foto ändern" : "Profilbild hinzufügen"}</Text>}
            </Pressable>
            {hasPhoto && (
              <Pressable style={styles.outlineButton} onPress={onRemove} disabled={busy}>
                <Text style={styles.outlineButtonLabel}>Foto entfernen</Text>
              </Pressable>
            )}
          </View>
          {!hasPhoto && <Text style={styles.hint}>Wähl ein Foto aus deiner Galerie oder mach direkt ein neues. Wir schneiden es quadratisch zu.</Text>}
        </View>

        {pushAvailable && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderRow}>
              <View style={styles.grow}>
                <Text style={styles.reminderTitle}>Erinnerungen</Text>
                <Text style={styles.reminderHint}>Ein kurzer Hinweis am Nachmittag oder Abend, wenn noch ein Habit offen ist.</Text>
              </View>
              <Toggle checked={pushEnabled} onChange={onTogglePush} label="Erinnerungen an oder aus" />
            </View>
            {pushBusy && <Text style={styles.hint}>Wird eingerichtet…</Text>}
            {pushError && (
              <View style={styles.error}>
                <Text style={styles.errorText}>{pushError}</Text>
              </View>
            )}
          </View>
        )}

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={17} color={colors.ink} />
          <Text style={styles.outlineButtonLabel}>Abmelden</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, paddingTop: spacing.xxl },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  overline: { color: colors.inkFaint, fontSize: 12, fontFamily: fontFamily.bodyMedium },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 21 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  profileCard: { alignItems: "center", gap: spacing.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl },
  photoWrap: { marginBottom: spacing.sm },
  photoWrapBusy: { opacity: 0.6 },
  photoBadge: { position: "absolute", right: -2, bottom: -2, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  name: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 21 },
  mail: { color: colors.inkFaint, fontSize: 13 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, width: "100%" },
  grow: { flex: 1 },
  button: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  outlineButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  hint: { color: colors.inkFaint, fontSize: 12.5, textAlign: "center", marginTop: spacing.sm, lineHeight: 18 },
  reminderCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  reminderTitle: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14.5 },
  reminderHint: { color: colors.inkFaint, fontSize: 12.5, marginTop: 2 },
  logoutButton: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14 },
});
