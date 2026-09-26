import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { coachRouter } from "./routes/coach.js";
import { habitsRouter } from "./routes/habits.js";
import { journalRouter } from "./routes/journal.js";
import { meRouter } from "./routes/me.js";
import { segmentsRouter } from "./routes/segments.js";
import { urgesRouter } from "./routes/urges.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/segments", segmentsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/urges", urgesRouter);
app.use("/api/coach", coachRouter);

app.listen(env.port, () => {
  console.log(`Meglio server listening on http://localhost:${env.port}`);
});
