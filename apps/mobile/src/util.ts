import type { Blocker, Segment } from "./api";

export function isFocusSegment(segment: Segment): boolean {
  return segment.icon === "moon" || segment.name.trim().toLowerCase() === "schlaf";
}

/** The example shown on a habit that has no proof photo yet, matched to its life area. */
export function proofHint(segment: Segment): string {
  if (isFocusSegment(segment)) {
    return "Mach abends ein Foto, z.B. von deiner Schlafmaske, deiner Blaulichtfilterbrille oder deinem Bett. So machst du dir klar, dass jetzt Abend ist, und das Habit zählt für heute als erledigt.";
  }
  return "Beweisfoto machen, z.B. im Gym beim Training oder von deinen Heften beim Lernen. Das Habit zählt dann für heute als erledigt.";
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Heute, 07:40" / "Gestern, 22:10" / "So., 21. Sep., 19:05" */
export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return `Heute, ${time}`;
  if (diffDays === 1) return `Gestern, ${time}`;
  const day = date.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  return `${day}, ${time}`;
}

/** "Heute" / "Gestern" / "24.9." for a proof photo's day. */
export function formatProofDay(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

export function blockerSummary(blocker: Blocker): string | null {
  if (!blocker.enabled || blocker.rules.length === 0) return null;
  const targets = blocker.rules.map((r) => r.label).join(", ");
  const window = blocker.from && blocker.until ? `${blocker.from}–${blocker.until} Uhr` : "rund um die Uhr";
  return `${targets} · ${window}`;
}
