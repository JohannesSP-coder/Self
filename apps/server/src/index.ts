import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { coachRouter } from "./routes/coach.js";
import { habitsRouter } from "./routes/habits.js";
import { journalRouter } from "./routes/journal.js";
import { meRouter } from "./routes/me.js";
import { proofsRouter } from "./routes/proofs.js";
import { pushRouter } from "./routes/push.js";
import { segmentsRouter } from "./routes/segments.js";
import { urgesRouter } from "./routes/urges.js";
import { startReminderScheduler } from "./lib/reminderScheduler.js";

const app = express();
app.use(cors());
// Proof photos arrive as base64 data URLs (≤700 KB of image ≈ 950 KB of JSON).
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/segments", segmentsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/proofs", proofsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/urges", urgesRouter);
app.use("/api/coach", coachRouter);
app.use("/api/push", pushRouter);

app.listen(env.port, () => {
  console.log(`Meglio server listening on http://localhost:${env.port}`);
  if (!env.anthropicApiKey) {
    console.warn("ANTHROPIC_API_KEY is not set - the coach will answer 503 until it is configured in .env");
  }
  if (!env.vapidPublicKey || !env.vapidPrivateKey) {
    console.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are not set - reminder push notifications stay off until configured in .env");
  }
  startReminderScheduler();
});
