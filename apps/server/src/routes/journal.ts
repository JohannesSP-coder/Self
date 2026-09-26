import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const journalRouter = Router();
journalRouter.use(requireAuth);

journalRouter.get("/", async (req: AuthedRequest, res) => {
  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ entries });
});

const entrySchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1),
  mood: z.number().int().min(1).max(5).optional(),
});

journalRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" });
    return;
  }
  const entry = await prisma.journalEntry.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ entry });
});

journalRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!entry) {
    res.status(404).json({ error: "Eintrag nicht gefunden" });
    return;
  }
  await prisma.journalEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});
