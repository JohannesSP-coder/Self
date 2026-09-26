import { prisma } from "../db.js";

/**
 * Starter segments created for every new user. Schlaf is included by default (not just
 * offered as an option) because sleep quality is foundational to every other area - the
 * coach also treats it as a first-class topic, see coachContext.ts.
 */
const DEFAULT_SEGMENTS: Array<{
  name: string;
  icon: string;
  color: string;
  habits: Array<{ title: string; targetPerWeek: number }>;
}> = [
  {
    name: "Fitness",
    icon: "dumbbell",
    color: "#2A6350",
    habits: [{ title: "Training", targetPerWeek: 4 }],
  },
  {
    name: "Mindset",
    icon: "leaf",
    color: "#5F4270",
    habits: [{ title: "10 Min. Meditation", targetPerWeek: 5 }],
  },
  {
    name: "Schlaf",
    icon: "moon",
    color: "#33538C",
    habits: [
      { title: "Bildschirm aus bis 22 Uhr", targetPerWeek: 7 },
      { title: "Vor Mitternacht im Bett", targetPerWeek: 7 },
    ],
  },
  {
    name: "Finanzen",
    icon: "chart",
    color: "#8A5A12",
    habits: [{ title: "Ausgaben eintragen", targetPerWeek: 7 }],
  },
];

export async function createDefaultSegmentsForUser(userId: string): Promise<void> {
  for (const [index, segment] of DEFAULT_SEGMENTS.entries()) {
    await prisma.segment.create({
      data: {
        userId,
        name: segment.name,
        icon: segment.icon,
        color: segment.color,
        sortOrder: index,
        habits: { create: segment.habits },
      },
    });
  }
}
