import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const pushRouter = Router();
pushRouter.use(requireAuth);

// Lets the client know whether it should even offer the "enable reminders" toggle.
pushRouter.get("/public-key", (_req, res) => {
  res.json({ publicKey: env.vapidPublicKey || null });
});

const subscribeSchema = z.union([
  z.object({
    kind: z.literal("web"),
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
  z.object({ kind: z.literal("expo"), token: z.string().min(1) }),
]);

pushRouter.post("/subscribe", async (req: AuthedRequest, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anmeldung für Erinnerungen" });
    return;
  }
  const input = parsed.data;
  const endpoint = input.kind === "web" ? input.endpoint : input.token;
  const data = input.kind === "web" ? JSON.stringify({ keys: input.keys }) : null;

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: req.userId!, endpoint } },
    create: { userId: req.userId!, kind: input.kind, endpoint, data },
    update: { data },
  });
  res.status(204).send();
});

const unsubscribeSchema = z.object({ endpoint: z.string().min(1) });

pushRouter.delete("/subscribe", async (req: AuthedRequest, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Eingabe" });
    return;
  }
  await prisma.pushSubscription.deleteMany({ where: { userId: req.userId, endpoint: parsed.data.endpoint } });
  res.status(204).send();
});
