import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { computeStreak, lastDayKeys, todayKey } from "../lib/dates.js";

export const segmentsRouter = Router();
segmentsRouter.use(requireAuth);

const segmentSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Segments with their habits, each habit annotated with today's status and current streak.
segmentsRouter.get("/", async (req: AuthedRequest, res) => {
  const segments = await prisma.segment.findMany({
    where: { userId: req.userId },
    orderBy: { sortOrder: "asc" },
    include: {
      habits: {
        where: { archived: false },
        include: {
          logs: true,
          proofs: { select: { id: true, date: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 12 },
        },
      },
    },
  });

  const today = todayKey();
  const week = lastDayKeys(7);
  const shaped = segments.map((segment) => ({
    id: segment.id,
    name: segment.name,
    icon: segment.icon,
    color: segment.color,
    habits: segment.habits.map((habit) => {
      const completedDates = habit.logs.filter((l) => l.completed).map((l) => l.date);
      const completed = new Set(completedDates);
      return {
        id: habit.id,
        title: habit.title,
        notes: habit.notes,
        targetPerWeek: habit.targetPerWeek,
        doneToday: completed.has(today),
        streak: computeStreak(completedDates),
        last7: week.map((d) => completed.has(d)),
        proofs: habit.proofs,
      };
    }),
  }));

  res.json({ segments: shaped });
});

segmentsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = segmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" });
    return;
  }

  const count = await prisma.segment.count({ where: { userId: req.userId } });
  const segment = await prisma.segment.create({
    data: { ...parsed.data, userId: req.userId!, sortOrder: count },
  });
  res.status(201).json({ segment });
});

segmentsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const segment = await prisma.segment.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!segment) {
    res.status(404).json({ error: "Segment nicht gefunden" });
    return;
  }
  await prisma.segment.delete({ where: { id: segment.id } });
  res.status(204).send();
});
