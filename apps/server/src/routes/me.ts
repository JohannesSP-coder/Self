import { Router } from "express";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Nutzer nicht gefunden" });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});
