import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth";
import { colors, fontFamily, radius, spacing } from "../theme";

interface Scene {
  zone: "red" | "black";
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  callout?: string;
}

const SCENES: Scene[] = [
  {
    zone: "red",
    icon: "sparkles-outline",
    eyebrow: "Willkommen bei Meglio",
    title: "Bevor's losgeht: 3 Dinge, die wirklich zählen",
    body: "Meglio dreht sich nicht nur ums Häkchen-Setzen. Drei Bereiche entscheiden mehr als alles andere darüber, wie du dich fühlst und was du leistest: Fitness, Erholung und Schlaf. In 2-3 Minuten zeigen wir dir, warum.",
  },
  {
    zone: "black",
    icon: "barbell-outline",
    eyebrow: "Bereich 1 · Fitness",
    title: "Fitness ist dein Fundament",
    body: "Regelmäßige Bewegung wirkt sich nachweislich auf Stimmung, Energielevel und sogar dein Gedächtnis aus – unabhängig davon, mit welchem Fitnesslevel du startest. Es zählt nicht die perfekte Einheit, sondern die Konstanz über Wochen und Monate.",
    callout: "Bewegung wirkt nachweislich stimmungsaufhellend – oft schon nach wenigen Minuten.",
  },
  {
    zone: "red",
    icon: "battery-half-outline",
    eyebrow: "Bereich 2 · Erholung",
    title: "Erholung ist kein Nice-to-have",
    body: "Dein Körper und dein Kopf brauchen bewusste Pausen, um Trainingsreize, Stress und neue Eindrücke zu verarbeiten. Ohne Erholung bringt selbst das beste Training langfristig wenig – Übertraining und Erschöpfung sind die Folge.",
    callout: "Fortschritt entsteht in der Erholung nach der Belastung – nicht nur während des Trainings.",
  },
  {
    zone: "black",
    icon: "moon-outline",
    eyebrow: "Bereich 3 · Schlaf",
    title: "Schlaf ist dein größter Hebel",
    body: "Kaum ein Faktor beeinflusst Fitness, Mindset und Selbstkontrolle so stark wie guter Schlaf. In der Schlafforschung herrscht Einigkeit: Tiefschlafphasen sind zentral für Gedächtniskonsolidierung, Zellreparatur und emotionale Regulation.",
    callout: "Tiefschlaf ist zentral für Gedächtnis, Zellreparatur und emotionale Balance.",
  },
  {
    zone: "red",
    icon: "moon-outline",
    eyebrow: "Bereich 3 · Schlaf",
    title: "Deshalb hat Schlaf bei dir Priorität",
    body: "Schlechter Schlaf schwächt nachweislich die Impulskontrolle – etwa beim Umgang mit Süchten oder schlechten Gewohnheiten. Deshalb hast du in Meglio von Anfang an einen eigenen Schlaf-Bereich, nicht als Extra, sondern als Basis.",
    callout: "Dein Schlaf-Bereich wartet schon: kleine Routinen wie ein fester Bildschirm-aus-Zeitpunkt machen oft mehr Unterschied als jede zusätzliche Trainingseinheit.",
  },
  {
    zone: "black",
    icon: "arrow-up-circle-outline",
    eyebrow: "Bereit?",
    title: "Bereit, ein bisschen besser zu werden?",
    body: "Fitness, Erholung und Schlaf sind ab jetzt Teil deines Alltags in Meglio. Leg direkt los – dein Schlaf-Bereich wartet schon auf dich.",
  },
];

export default function OnboardingScreen() {
  const { finishOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;

  function finish() {
    finishOnboarding();
    router.replace("/");
  }

  function next() {
    if (isLast) finish();
    else setIndex(index + 1);
  }

  return (
    <View style={[styles.page, { backgroundColor: scene.zone === "red" ? colors.accent : colors.bg }]}>
      <View style={styles.top}>
        <View style={styles.progress}>
          {SCENES.map((_, i) => (
            <View key={i} style={styles.track}>
              <View style={[styles.fill, i <= index && styles.fillActive]} />
            </View>
          ))}
        </View>
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <Text style={styles.skip}>Überspringen</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.ringWrap}>
        <View style={[styles.ring, isLast && styles.ringSolid]}>
          <Ionicons name={scene.icon} size={40} color={isLast ? "#fff" : scene.zone === "red" ? "#fff" : colors.accentText} />
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.eyebrow}>{scene.eyebrow}</Text>
          <Text style={styles.title}>{scene.title}</Text>
          <Text style={styles.body}>{scene.body}</Text>
          {scene.callout && (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>{scene.callout}</Text>
            </View>
          )}
        </ScrollView>
        <Pressable style={styles.button} onPress={next}>
          <Text style={styles.buttonLabel}>{isLast ? "Los geht's" : "Weiter"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, paddingTop: spacing.xl },
  progress: { flex: 1, flexDirection: "row", gap: spacing.xs },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
  fill: { flex: 1, backgroundColor: "transparent" },
  fillActive: { backgroundColor: "#fff" },
  skip: { color: "rgba(255,255,255,0.85)", fontFamily: fontFamily.bodyMedium, fontSize: 13 },
  ringWrap: { alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringSolid: { backgroundColor: colors.accent, borderColor: colors.accent },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sheetContent: { gap: spacing.md, flexGrow: 1 },
  eyebrow: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 12 },
  title: { color: colors.ink, fontFamily: fontFamily.display, fontSize: 24, lineHeight: 30 },
  body: { color: colors.inkSoft, fontSize: 14.5, lineHeight: 22 },
  callout: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md },
  calloutText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: "center" },
  buttonLabel: { color: "#fff", fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
});
