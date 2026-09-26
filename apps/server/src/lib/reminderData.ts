import { prisma } from "../db.js";
import { todayKey } from "./dates.js";
import type { ReminderSegment } from "./reminders.js";

/** The minimal shape `pickReminder` needs for one user — lighter than the full /api/segments query. */
export async function loadReminderSegments(userId: string): Promise<ReminderSegment[]> {
  const today = todayKey();
  const segments = await prisma.segment.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      icon: true,
      habits: {
        where: { archived: false },
        select: {
          id: true,
          title: true,
          logs: { where: { date: today, completed: true }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  return segments.map((segment) => ({
    id: segment.id,
    icon: segment.icon,
    habits: segment.habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      doneToday: habit.logs.length > 0,
    })),
  }));
}
