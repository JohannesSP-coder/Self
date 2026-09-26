import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const urgesRouter = Router();
urgesRouter.use(requireAuth);

function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

urgesRouter.get("/", async (req: AuthedRequest, res) => {
  const trackers = await prisma.urgeTracker.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    include: { events: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  res.json({
    trackers: trackers.map((t) => ({
      id: t.id,
      name: t.name,
      streakDays: daysSince(t.streakStartAt),
      streakStartAt: t.streakStartAt,
      recentEvents: t.events,
    })),
  });
});

const createSchema = z.object({ name: z.string().min(1) });

urgesRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Eingabe" });
    return;
  }
  const tracker = await prisma.urgeTracker.create({
    data: { name: parsed.data.name, userId: req.userId! },
  });
  res.status(201).json({ tracker });
});

// Log a resisted urge - doesn't reset the streak, just records a win.
urgesRouter.post("/:id/resist", async (req: AuthedRequest, res) => {
  const tracker = await prisma.urgeTracker.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!tracker) {
    res.status(404).json({ error: "Tracker nicht gefunden" });
    return;
  }
  const event = await prisma.urgeEvent.create({
    data: { trackerId: tracker.id, type: "urge_resisted", note: req.body?.note },
  });
  res.status(201).json({ event });
});

// Log a relapse - resets the streak start to now.
const relapseSchema = z.object({ note: z.string().optional() });

urgesRouter.post("/:id/relapse", async (req: AuthedRequest, res) => {
  const tracker = await prisma.urgeTracker.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!tracker) {
    res.status(404).json({ error: "Tracker nicht gefunden" });
    return;
  }
  const parsed = relapseSchema.safeParse(req.body ?? {});
  const note = parsed.success ? parsed.data.note : undefined;

  const [, updated] = await prisma.$transaction([
    prisma.urgeEvent.create({ data: { trackerId: tracker.id, type: "relapse", note } }),
    prisma.urgeTracker.update({ where: { id: tracker.id }, data: { streakStartAt: new Date() } }),
  ]);

  res.json({ streakStartAt: updated.streakStartAt });
});

urgesRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const tracker = await prisma.urgeTracker.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!tracker) {
    res.status(404).json({ error: "Tracker nicht gefunden" });
    return;
  }
  await prisma.urgeTracker.delete({ where: { id: tracker.id } });
  res.status(204).send();
});
