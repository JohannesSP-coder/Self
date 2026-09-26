/**
 * Picks one short, present-tense nudge for an unfinished habit — never more than one at a time.
 *
 * This file is intentionally duplicated (apps/server/src/lib/reminders.ts and
 * apps/web/src/reminders.ts, byte-for-byte identical): the server uses it to decide when to send
 * a push notification, the web app uses the exact same logic to show an in-app banner (which also
 * works in the claude.ai demo, where real push isn't available). Keep both copies in sync.
 *
 * Times are evaluated in Europe/Berlin regardless of the server host's or the viewer's own time
 * zone, so the server (deciding whether to push) and the client (deciding whether to show the
 * banner) always agree on which slot is active.
 */

export interface ReminderHabit {
  id: string;
  title: string;
  doneToday: boolean;
}

export interface ReminderSegment {
  id: string;
  icon: string | null;
  habits: ReminderHabit[];
}

export interface Reminder {
  /** Stable for the same local day + slot + habit — use it to dedupe sends and to remember a dismissal. */
  id: string;
  segmentId: string;
  habitId: string;
  /** Short push notification title. */
  title: string;
  /** The nudge itself, with the habit's own title filled in. */
  body: string;
}

type Kind = "fitness" | "study" | "mindset" | "finance" | "sleep" | "generic";

function iconKind(icon: string | null): Kind {
  switch (icon) {
    case "dumbbell":
      return "fitness";
    case "book":
      return "study";
    case "leaf":
      return "mindset";
    case "chart":
      return "finance";
    case "moon":
      return "sleep";
    default:
      return "generic";
  }
}

// Every variant keeps the habit's own title as a label ("{habit} — ...") rather than weaving it
// into a sentence, so it reads fine whatever the user typed ("Training" or "Bildschirm aus bis 22
// Uhr" or "Warm duschen"). Short on purpose: nobody reads a long push notification.
const COPY: Record<Kind, string[]> = {
  fitness: [
    "{habit} — noch nicht erledigt. Zieh dir die Schuhe an.",
    "{habit} steht noch aus. Heute noch verausgaben. Jetzt.",
  ],
  study: [
    "{habit} — noch nicht erledigt. Ran an die Hefte.",
    "{habit} steht noch aus. Kurz konzentrieren. Jetzt.",
  ],
  mindset: [
    "{habit} — noch nicht erledigt. Kurz durchatmen. Jetzt.",
    "{habit} steht noch aus. Kopf freimachen. Jetzt.",
  ],
  finance: [
    "{habit} — noch nicht erledigt. Zwei Minuten. Dann fertig.",
    "{habit} steht noch aus. Kurz eintragen. Jetzt.",
  ],
  sleep: [
    "{habit} — noch nicht erledigt. Licht aus, mach's jetzt.",
    "{habit} steht noch aus. Bettruhe. Jetzt nachholen.",
  ],
  generic: [
    "{habit} — noch nicht erledigt. Jetzt nachholen, nicht morgen.",
    "{habit} steht noch aus. Los. Genau jetzt.",
  ],
};

const TITLES: Record<Kind, string> = {
  fitness: "Sport-Check",
  study: "Lern-Check",
  mindset: "Mindset-Check",
  finance: "Finanz-Check",
  sleep: "Schlafenszeit",
  generic: "Meglio",
};

interface Slot {
  id: string;
  startMin: number;
  endMin: number; // exclusive
  kinds: Kind[];
}

// One slot active at a time, each with the kinds worth nudging about during it, in priority order.
const SLOTS: Slot[] = [
  { id: "afternoon", startMin: 15 * 60, endMin: 19 * 60, kinds: ["fitness", "study"] },
  { id: "evening", startMin: 19 * 60, endMin: 21 * 60 + 30, kinds: ["mindset", "finance", "generic"] },
  { id: "night", startMin: 21 * 60 + 30, endMin: 24 * 60, kinds: ["sleep", "generic"] },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function berlinParts(now: Date): { dateKey: string; minutesSinceMidnight: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) parts[p.type] = p.value;
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const minutesSinceMidnight = ((Number(parts.hour) % 24) + 24) % 24 * 60 + Number(parts.minute);
  return { dateKey, minutesSinceMidnight };
}

/** Returns the single most relevant reminder right now, or null if nothing is due. */
export function pickReminder(now: Date, segments: ReminderSegment[]): Reminder | null {
  const { dateKey, minutesSinceMidnight } = berlinParts(now);
  const slot = SLOTS.find((s) => minutesSinceMidnight >= s.startMin && minutesSinceMidnight < s.endMin);
  if (!slot) return null;

  for (const kind of slot.kinds) {
    for (const segment of segments) {
      if (iconKind(segment.icon) !== kind) continue;
      const habit = segment.habits.find((h) => !h.doneToday);
      if (!habit) continue;
      const variants = COPY[kind];
      const variant = variants[hashString(`${dateKey}:${slot.id}:${habit.id}`) % variants.length];
      return {
        id: `${dateKey}:${slot.id}:${habit.id}`,
        segmentId: segment.id,
        habitId: habit.id,
        title: TITLES[kind],
        body: variant.replace("{habit}", habit.title),
      };
    }
  }
  return null;
}
