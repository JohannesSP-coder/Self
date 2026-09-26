import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { errorMessage } from "../api";
import { useAuth } from "../auth";
import { colors, fontFamily, radius, spacing } from "../theme";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
        router.replace("/onboarding");
      } else {
        await login(email.trim(), password);
        router.replace("/");
      }
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.wordmark}>Meglio</Text>
          <View style={styles.underline} />
        </View>
        <Text style={styles.tagline}>Für alle, die jeden Tag ein bisschen besser werden wollen.</Text>

        <View style={styles.form}>
          {isRegister && (
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Wie sollen wir dich nennen?"
                placeholderTextColor={colors.inkFaint}
                autoComplete="name"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}
          <View style={styles.field}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput
              style={styles.input}
              placeholder="du@beispiel.de"
              placeholderTextColor={colors.inkFaint}
              autoComplete="email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Passwort</Text>
            <TextInput
              style={styles.input}
              placeholder={isRegister ? "Mindestens 8 Zeichen" : "••••••••"}
              placeholderTextColor={colors.inkFaint}
              secureTextEntry
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonPrimaryLabel}>{isRegister ? "Konto erstellen" : "Einloggen"}</Text>}
          </Pressable>

          <Pressable
            style={[styles.button, styles.buttonOutline]}
            onPress={() => {
              setMode(isRegister ? "login" : "register");
              setError(null);
            }}
          >
            <Text style={styles.buttonOutlineLabel}>{isRegister ? "Ich habe schon ein Konto" : "Neues Konto erstellen"}</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>Mit dem Fortfahren stimmst du unseren Nutzungsbedingungen &amp; der Datenschutzerklärung zu.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  hero: { alignItems: "center", gap: spacing.xs },
  wordmark: { color: colors.ink, fontFamily: fontFamily.displayBold, fontSize: 34 },
  underline: { width: 72, height: 3, borderRadius: 2, backgroundColor: colors.accent },
  tagline: { color: colors.inkSoft, textAlign: "center", fontSize: 14 },
  form: { gap: spacing.md, marginTop: spacing.md },
  field: { gap: spacing.xs },
  label: { color: colors.inkSoft, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 15,
  },
  error: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#5A1F1C", borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13.5 },
  button: { borderRadius: radius.md, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonPrimaryLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  buttonOutline: { borderWidth: 1, borderColor: colors.border },
  buttonOutlineLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  legal: { color: colors.inkFaint, fontSize: 11.5, textAlign: "center", marginTop: spacing.lg, lineHeight: 16 },
});
