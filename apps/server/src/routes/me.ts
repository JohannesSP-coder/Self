import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { parseImageDataUrl } from "../lib/images.js";
import { publicUser, publicUserSelect } from "../lib/users.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: publicUserSelect });
  if (!user) {
    res.status(404).json({ error: "Nutzer nicht gefunden" });
    return;
  }
  res.json({ user: publicUser(user) });
});

const avatarSchema = z.object({ image: z.string().max(1_000_000) });

meRouter.put("/avatar", async (req: AuthedRequest, res) => {
  const parsed = avatarSchema.safeParse(req.body);
  const image = parsed.success ? parseImageDataUrl(parsed.data.image) : null;
  if (!image) {
    res.status(400).json({ error: "Bitte ein JPG-, PNG- oder WebP-Foto bis 700 KB hochladen." });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: new Uint8Array(image.data), avatarMimeType: image.mimeType, avatarUpdatedAt: new Date() },
    select: publicUserSelect,
  });
  res.json({ user: publicUser(user) });
});

meRouter.delete("/avatar", async (req: AuthedRequest, res) => {
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: null, avatarMimeType: null, avatarUpdatedAt: null },
    select: publicUserSelect,
  });
  res.json({ user: publicUser(user) });
});

// Loaded with the bearer token, like proof photos, so the picture never needs a public URL.
meRouter.get("/avatar", async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { avatar: true, avatarMimeType: true },
  });
  if (!user?.avatar || !user.avatarMimeType) {
    res.status(404).json({ error: "Kein Profilbild" });
    return;
  }
  res.set("Content-Type", user.avatarMimeType);
  res.set("Cache-Control", "private, max-age=86400");
  res.set("X-Content-Type-Options", "nosniff");
  res.send(Buffer.from(user.avatar));
});
