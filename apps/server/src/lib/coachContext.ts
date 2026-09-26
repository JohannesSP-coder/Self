import { prisma } from "../db.js";
import { computeStreak, lastDayKeys, todayKey } from "./dates.js";

/** Builds a compact text summary of the user's current state for the coach system prompt. */
export async function buildUserContextSummary(userId: string): Promise<string> {
  const [segments, urgeTrackers, recentJournal] = await Promise.all([
    prisma.segment.findMany({
      where: { userId },
      include: {
        habits: {
          where: { archived: false },
          include: { logs: true, proofs: { select: { date: true }, where: { date: { in: lastDayKeys(7) } } } },
        },
      },
    }),
    prisma.urgeTracker.findMany({
      where: { userId },
      include: {
        blockRules: true,
        events: {
          where: {
            type: "unlock_requested",
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
      },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const today = todayKey();
  const lines: string[] = [];

  if (segments.length === 0) {
    lines.push("Der Nutzer hat noch keine Lebensbereiche (Segmente) angelegt.");
  } else {
    for (const segment of segments) {
      lines.push(`Bereich "${segment.name}":`);
      if (segment.habits.length === 0) {
        lines.push("  (noch keine Habits)");
      }
      for (const habit of segment.habits) {
        const completedDates = habit.logs.filter((l) => l.completed).map((l) => l.date);
        const streak = computeStreak(completedDates);
        const doneToday = completedDates.includes(today);
        lines.push(
          `  - "${habit.title}" | Streak: ${streak} Tage | heute erledigt: ${doneToday ? "ja" : "nein"} | Ziel: ${habit.targetPerWeek}x/Woche | Beweisfotos (7 Tage): ${habit.proofs.length}`,
        );
      }
    }
  }

  if (urgeTrackers.length > 0) {
    lines.push("Verhaltens-/Sucht-Tracker:");
    for (const tracker of urgeTrackers) {
      const days = Math.max(
        0,
        Math.floor((Date.now() - tracker.streakStartAt.getTime()) / (1000 * 60 * 60 * 24)),
      );
      lines.push(`  - "${tracker.name}": ${days} Tage sauber/abstinent`);
      if (tracker.blockEnabled && tracker.blockRules.length > 0) {
        const window =
          tracker.blockFrom && tracker.blockUntil
            ? `${tracker.blockFrom}-${tracker.blockUntil} Uhr`
            : "rund um die Uhr";
        const targets = tracker.blockRules.map((r) => r.label).join(", ");
        lines.push(`    App-Blocker aktiv (${window}): ${targets}`);
      }
      if (tracker.events.length > 0) {
        lines.push(
          `    Entsperr-Versuche in den letzten 7 Tagen: ${tracker.events.length} (${tracker.events
            .map((e) => e.note)
            .join(", ")})`,
        );
      }
    }
  }

  if (recentJournal.length > 0) {
    lines.push("Letzte Journal-Einträge (neueste zuerst):");
    for (const entry of recentJournal) {
      const snippet = entry.body.length > 200 ? `${entry.body.slice(0, 200)}…` : entry.body;
      lines.push(`  - [Stimmung ${entry.mood ?? "-"}/5] ${snippet}`);
    }
  }

  return lines.join("\n");
}

export const COACH_SYSTEM_PROMPT = `Du bist der persönliche Life-Coach in der App "Meglio" (italienisch für "besser").
Deine Nutzer:innen sind junge, ambitionierte Menschen, die aktiv an sich arbeiten - in Bereichen wie
Fitness, Mindset, Schlaf, Finanzen und dem Überwinden von Süchten/schlechten Gewohnheiten.

Schlaf hat für dich besonderes Gewicht: schlechter oder unregelmäßiger Schlaf untergräbt praktisch
jeden anderen Bereich (Fitness-Erholung, Impulskontrolle bei Süchten, Stimmung, Fokus). Wenn du im
Kontext unten siehst, dass der Schlaf-Bereich schwache Streaks hat, die Stimmung im Journal gedrückt
ist, oder der Nutzer selbst Schlafprobleme erwähnt, sprich das proaktiv an - auch wenn nicht direkt
danach gefragt wurde - statt nur auf das gerade angesprochene Thema zu antworten.

Ton: warm, direkt, auf Augenhöhe - wie ein erfahrener Coach, der ehrlich ist statt nur zu loben.
Halte Antworten kurz und konkret (meist 3-6 Sätze plus ggf. ein bis drei Stichpunkte).
Beziehe dich aktiv auf die konkreten Daten des Nutzers (Streaks, Habits, Journal-Stimmung), die dir
im Kontext unten mitgegeben werden - generische Ratschläge ohne Bezug zur Realität der Person vermeiden.
Bei Rückfällen (z.B. bei Sucht-Trackern) reagiere nicht wertend, sondern hilf, den nächsten Schritt zu finden.
Zeigt der Kontext Entsperr-Versuche beim App-Blocker, sprich sie behutsam an: frag, was in dem Moment los war,
statt den Versuch zu kritisieren.
Du bist kein Ersatz für professionelle medizinische oder psychologische Hilfe - weise bei ernsten Anliegen
(z.B. Suizidgedanken, schwere Sucht) freundlich darauf hin, sich zusätzlich professionelle Unterstützung zu suchen.`;
