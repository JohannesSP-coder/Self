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
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      blockRules: { orderBy: { createdAt: "asc" } },
    },
  });

  res.json({
    trackers: trackers.map((t) => ({
      id: t.id,
      name: t.name,
      streakDays: daysSince(t.streakStartAt),
      streakStartAt: t.streakStartAt,
      recentEvents: t.events,
      blocker: {
        enabled: t.blockEnabled,
        from: t.blockFrom,
        until: t.blockUntil,
        unlockDelayMinutes: t.unlockDelayMinutes,
        rules: t.blockRules.map((r) => ({ kind: r.kind, target: r.target, label: r.label })),
      },
    })),
  });
});

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Uhrzeit im Format HH:MM");

const blockerSchema = z
  .object({
    enabled: z.boolean(),
    from: timeOfDay.nullable(),
    until: timeOfDay.nullable(),
    unlockDelayMinutes: z.number().int().min(0).max(120),
    rules: z
      .array(
        z.object({
          kind: z.enum(["app", "website", "category"]),
          target: z.string().min(1).max(200),
          label: z.string().min(1).max(100),
        }),
      )
      .max(100),
  })
  .refine((b) => (b.from === null) === (b.until === null), {
    message: "Start- und Endzeit müssen beide gesetzt oder beide leer sein",
  });

// Replaces the tracker's blocker config and rule list in one go.
urgesRouter.put("/:id/blocker", async (req: AuthedRequest, res) => {
  const tracker = await prisma.urgeTracker.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!tracker) {
    res.status(404).json({ error: "Tracker nicht gefunden" });
    return;
  }
  const parsed = blockerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" });
    return;
  }
  const { enabled, from, until, unlockDelayMinutes, rules } = parsed.data;
  const uniqueRules = [...new Map(rules.map((r) => [`${r.kind}:${r.target}`, r])).values()];

  await prisma.$transaction([
    prisma.urgeTracker.update({
      where: { id: tracker.id },
      data: { blockEnabled: enabled, blockFrom: from, blockUntil: until, unlockDelayMinutes },
    }),
    prisma.blockRule.deleteMany({ where: { trackerId: tracker.id } }),
    prisma.blockRule.createMany({
      data: uniqueRules.map((r) => ({ ...r, trackerId: tracker.id })),
    }),
  ]);

  res.json({ blocker: { enabled, from, until, unlockDelayMinutes, rules: uniqueRules } });
});

// The device enforces the waiting period; this records the attempt so the coach can pick up on it.
const unlockSchema = z.object({ label: z.string().min(1).max(100) });

urgesRouter.post("/:id/unlock-request", async (req: AuthedRequest, res) => {
  const tracker = await prisma.urgeTracker.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!tracker) {
    res.status(404).json({ error: "Tracker nicht gefunden" });
    return;
  }
  const parsed = unlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Eingabe" });
    return;
  }
  await prisma.urgeEvent.create({
    data: { trackerId: tracker.id, type: "unlock_requested", note: parsed.data.label },
  });
  const unlockAt = new Date(Date.now() + tracker.unlockDelayMinutes * 60 * 1000);
  res.status(201).json({ unlockAt });
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
