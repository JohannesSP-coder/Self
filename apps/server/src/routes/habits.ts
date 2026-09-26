import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { todayKey } from "../lib/dates.js";
import { parseImageDataUrl } from "../lib/images.js";

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

const habitSchema = z.object({
  segmentId: z.string(),
  title: z.string().min(1),
  notes: z.string().optional(),
  targetPerWeek: z.number().int().min(1).max(7).optional(),
});

async function assertOwnsSegment(userId: string | undefined, segmentId: string) {
  return prisma.segment.findFirst({ where: { id: segmentId, userId } });
}

habitsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" });
    return;
  }

  const segment = await assertOwnsSegment(req.userId, parsed.data.segmentId);
  if (!segment) {
    res.status(404).json({ error: "Segment nicht gefunden" });
    return;
  }

  const habit = await prisma.habit.create({ data: parsed.data });
  res.status(201).json({ habit });
});

habitsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, segment: { userId: req.userId } },
  });
  if (!habit) {
    res.status(404).json({ error: "Habit nicht gefunden" });
    return;
  }
  await prisma.habit.delete({ where: { id: habit.id } });
  res.status(204).send();
});

// Toggle today's completion for a habit (idempotent check-in used by the daily tracker UI).
habitsRouter.post("/:id/toggle-today", async (req: AuthedRequest, res) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, segment: { userId: req.userId } },
  });
  if (!habit) {
    res.status(404).json({ error: "Habit nicht gefunden" });
    return;
  }

  const date = todayKey();
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: habit.id, date } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    res.json({ doneToday: false });
    return;
  }

  await prisma.habitLog.create({ data: { habitId: habit.id, date, completed: true } });
  res.json({ doneToday: true });
});

const proofSchema = z.object({ image: z.string().max(1_000_000) });

// Upload a proof photo; it also counts as today's check-in.
habitsRouter.post("/:id/proofs", async (req: AuthedRequest, res) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, segment: { userId: req.userId } },
  });
  if (!habit) {
    res.status(404).json({ error: "Habit nicht gefunden" });
    return;
  }
  const parsed = proofSchema.safeParse(req.body);
  const image = parsed.success ? parseImageDataUrl(parsed.data.image) : null;
  if (!image) {
    res.status(400).json({ error: "Bitte ein JPG-, PNG- oder WebP-Foto bis 700 KB hochladen." });
    return;
  }

  const date = todayKey();
  const [proof] = await prisma.$transaction([
    prisma.habitProof.create({
      data: { habitId: habit.id, date, mimeType: image.mimeType, data: new Uint8Array(image.data) },
      select: { id: true, date: true, createdAt: true },
    }),
    prisma.habitLog.upsert({
      where: { habitId_date: { habitId: habit.id, date } },
      create: { habitId: habit.id, date, completed: true },
      update: { completed: true },
    }),
  ]);
  res.status(201).json({ proof, doneToday: true });
});
