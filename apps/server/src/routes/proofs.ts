import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const proofsRouter = Router();
proofsRouter.use(requireAuth);

// Images are fetched with the bearer token (not via a plain <img src>), so only the owner can load them.
proofsRouter.get("/:id/image", async (req: AuthedRequest, res) => {
  const proof = await prisma.habitProof.findFirst({
    where: { id: req.params.id, habit: { segment: { userId: req.userId } } },
    select: { mimeType: true, data: true },
  });
  if (!proof) {
    res.status(404).json({ error: "Foto nicht gefunden" });
    return;
  }
  res.set("Content-Type", proof.mimeType);
  res.set("Cache-Control", "private, max-age=86400");
  res.set("X-Content-Type-Options", "nosniff");
  res.send(Buffer.from(proof.data));
});

proofsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const proof = await prisma.habitProof.findFirst({
    where: { id: req.params.id, habit: { segment: { userId: req.userId } } },
    select: { id: true },
  });
  if (!proof) {
    res.status(404).json({ error: "Foto nicht gefunden" });
    return;
  }
  await prisma.habitProof.delete({ where: { id: proof.id } });
  res.status(204).send();
});
