import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { anthropic, COACH_MODEL } from "../lib/anthropic.js";
import { buildUserContextSummary, COACH_SYSTEM_PROMPT } from "../lib/coachContext.js";
import type Anthropic from "@anthropic-ai/sdk";

export const coachRouter = Router();
coachRouter.use(requireAuth);

// Meglio currently gives each user a single ongoing coach conversation.
async function getOrCreateConversation(userId: string) {
  const existing = await prisma.coachConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.coachConversation.create({ data: { userId } });
}

coachRouter.get("/conversation", async (req: AuthedRequest, res) => {
  const conversation = await getOrCreateConversation(req.userId!);
  const messages = await prisma.coachMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ conversationId: conversation.id, messages });
});

const messageSchema = z.object({ message: z.string().min(1).max(4000) });

coachRouter.post("/message", async (req: AuthedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bitte gib eine Nachricht ein" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "Der Coach ist gerade nicht verfügbar. Bitte versuch es später erneut." });
    return;
  }

  const userId = req.userId!;
  const conversation = await getOrCreateConversation(userId);

  const history = await prisma.coachMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 40, // keep the last N turns in context to bound token usage
  });

  await prisma.coachMessage.create({
    data: { conversationId: conversation.id, role: "user", content: parsed.data.message },
  });

  const contextSummary = await buildUserContextSummary(userId);

  const anthropicMessages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
    { role: "user", content: parsed.data.message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 1024,
      system: `${COACH_SYSTEM_PROMPT}\n\nAktueller Stand des Nutzers:\n${contextSummary}`,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const replyText = textBlock?.text ?? "…";

    const assistantMessage = await prisma.coachMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: replyText },
    });

    res.json({ message: assistantMessage });
  } catch (err) {
    console.error("Coach request failed", err);
    res.status(502).json({ error: "Der Coach konnte nicht antworten. Bitte versuch es erneut." });
  }
});
