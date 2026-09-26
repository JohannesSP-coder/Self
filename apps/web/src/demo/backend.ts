// Data layer for the claude.ai demo: everything lives in one document in the viewer's private
// `data/users/<id>/` subtree of the artifact's db, and the coach answers through `sample`.
import {
  ApiError,
  type Api,
  type Blocker,
  type BlockRule,
  type CoachMessage,
  type JournalEntry,
  type Proof,
  type Segment,
  type Tracker,
  type User,
} from "../api";

interface DocSnapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  get(): Promise<DocSnapshot>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  collection(path: string): { doc(id: string): DocRef };
}
interface SampleError {
  code: string;
  text?: string;
}
type Turn = { role: "user" | "assistant"; content: string };
type SampleFn = (
  input: Turn[],
  options: { cache: false; onText?: (u: { text: string }) => void },
) => Promise<{ text: string; truncated: boolean }>;

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

interface StoredHabit {
  id: string;
  title: string;
  notes: string | null;
  targetPerWeek: number;
  logs: string[];
  /** Newest first. Missing on accounts created before proof photos existed. */
  proofs?: Proof[];
}
interface StoredSegment {
  id: string;
  name: string;
  icon: string;
  color: string;
  habits: StoredHabit[];
}
interface StoredTracker {
  id: string;
  name: string;
  streakStartAt: string;
  blocker: Blocker;
  events: { type: "urge_resisted" | "relapse"; createdAt: string }[];
}
interface DemoState {
  version: 1;
  profile: User;
  segments: StoredSegment[];
  journal: JournalEntry[];
  trackers: StoredTracker[];
  coach: CoachMessage[];
}

const DAY_MS = 86_400_000;
const MAX_COACH_MESSAGES = 40;
const MAX_EVENTS = 50;
const MAX_PROOFS_PER_HABIT = 30;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastDayKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

function computeStreak(dates: string[]): number {
  const done = new Set(dates);
  const cursor = new Date();
  if (!done.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

function defaultSegments(): StoredSegment[] {
  const seg = (name: string, icon: string, color: string, habits: [string, number][]): StoredSegment => ({
    id: newId(),
    name,
    icon,
    color,
    habits: habits.map(([title, targetPerWeek]) => ({ id: newId(), title, notes: null, targetPerWeek, logs: [] })),
  });
  return [
    seg("Fitness", "dumbbell", "#FF5A52", [["Training", 4]]),
    seg("Mindset", "leaf", "#FF5A52", [["10 Min. Meditation", 5]]),
    seg("Schlaf", "moon", "#D12A24", [["Bildschirm aus bis 22 Uhr", 7], ["Vor Mitternacht im Bett", 7]]),
    seg("Finanzen", "chart", "#FF5A52", [["Ausgaben eintragen", 7]]),
  ];
}

// ---------- store access ----------

let storePromise: Promise<{ doc: DocRef; sample: SampleFn | null } | null> | null = null;

function connect() {
  storePromise ??= (async () => {
    const claude = window.claude;
    if (!claude) return null;
    const [db, user, sample] = await Promise.all([claude.use("db"), claude.use("user"), claude.use("sample")]);
    if (!db || !user) return null;
    const uid = await (user as { id(): Promise<string | null> }).id();
    if (!uid) return null;
    const doc = (db as { doc(path: string): DocRef }).doc(`data/users/${uid}/meglio`);
    return { doc, sample: (sample as SampleFn | null) ?? null };
  })();
  return storePromise;
}

async function requireStore() {
  const store = await connect();
  if (!store) {
    throw new ApiError(0, "Die Demo kann hier nicht speichern. Öffne sie über claude.ai und melde dich dort an.");
  }
  return store;
}

let cache: DemoState | null | undefined;

async function load(): Promise<DemoState | null> {
  const { doc } = await requireStore();
  if (cache !== undefined) return cache;
  try {
    const snap = await doc.get();
    cache = snap.exists ? (structuredClone(snap.data()) as unknown as DemoState) : null;
  } catch {
    throw new ApiError(0, "Deine Daten konnten nicht geladen werden. Bitte lade die Seite neu.");
  }
  return cache;
}

async function loadAccount(): Promise<DemoState> {
  const state = await load();
  if (!state) throw new ApiError(401, "Bitte melde dich an.");
  return state;
}

async function persist(state: DemoState): Promise<void> {
  const { doc } = await requireStore();
  try {
    await doc.set(state as unknown as Record<string, unknown>);
    cache = state;
  } catch (err) {
    const code = (err as { code?: string }).code;
    throw new ApiError(
      0,
      code === "quota_exceeded" || code === "invalid_argument"
        ? "Der Demo-Speicher ist voll. Lösche ein paar alte Journal-Einträge."
        : "Speichern hat nicht geklappt. Bitte versuch es erneut.",
    );
  }
}

/** Applies `fn` to a copy of the account state and saves it; the cached state only changes on success. */
async function mutate<T>(fn: (state: DemoState) => T): Promise<T> {
  const next = structuredClone(await loadAccount());
  const result = fn(next);
  await persist(next);
  return result;
}

// Each photo is its own document (a document holds at most 256 KiB); the habit keeps only its metadata.
async function proofDoc(proofId: string): Promise<DocRef> {
  const { doc } = await requireStore();
  return doc.collection("proofs").doc(proofId);
}

async function deleteProofImages(ids: string[]): Promise<void> {
  // Best effort: a leftover image is invisible to the user and only costs storage.
  await Promise.all(ids.map(async (id) => (await proofDoc(id)).delete().catch(() => undefined)));
}

// The profile picture is a document of its own too, so the account document stays small.
async function avatarDoc(): Promise<DocRef> {
  const { doc } = await requireStore();
  return doc.collection("profile").doc("avatar");
}

/** Accounts created before profile pictures existed have no `avatarVersion`. */
function profileOf(state: DemoState): User {
  return { ...state.profile, avatarVersion: state.profile.avatarVersion ?? null };
}

function notFound(what: string): never {
  throw new ApiError(404, `${what} nicht gefunden`);
}

function findHabit(state: DemoState, id: string): { segment: StoredSegment; habit: StoredHabit } {
  for (const segment of state.segments) {
    const habit = segment.habits.find((h) => h.id === id);
    if (habit) return { segment, habit };
  }
  return notFound("Habit");
}

function findTracker(state: DemoState, id: string): StoredTracker {
  return state.trackers.find((t) => t.id === id) ?? notFound("Tracker");
}

function toSegment(s: StoredSegment): Segment {
  const today = dayKey(new Date());
  const week = lastDayKeys(7);
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    habits: s.habits.map((h) => ({
      id: h.id,
      title: h.title,
      notes: h.notes,
      targetPerWeek: h.targetPerWeek,
      doneToday: h.logs.includes(today),
      streak: computeStreak(h.logs),
      last7: week.map((d) => h.logs.includes(d)),
      proofs: (h.proofs ?? []).slice(0, 12),
    })),
  };
}

function toTracker(t: StoredTracker): Tracker {
  return { id: t.id, name: t.name, streakDays: daysSince(t.streakStartAt), streakStartAt: t.streakStartAt, blocker: t.blocker };
}

// ---------- coach ----------

const COACH_INSTRUCTIONS = `Du bist der persönliche Life-Coach in der App "Meglio" (italienisch für "besser").
Deine Nutzer:innen sind junge, ambitionierte Menschen, die aktiv an sich arbeiten - in Bereichen wie
Fitness, Mindset, Schlaf, Finanzen und dem Überwinden von Süchten/schlechten Gewohnheiten.

Schlaf hat für dich besonderes Gewicht: schlechter oder unregelmäßiger Schlaf untergräbt praktisch jeden
anderen Bereich (Fitness-Erholung, Impulskontrolle bei Süchten, Stimmung, Fokus). Wenn du im Kontext unten
siehst, dass der Schlaf-Bereich schwache Streaks hat, die Stimmung im Journal gedrückt ist, oder die Person
selbst Schlafprobleme erwähnt, sprich das proaktiv an.

Ton: warm, direkt, auf Augenhöhe - wie ein erfahrener Coach, der ehrlich ist statt nur zu loben. Halte
Antworten kurz und konkret (meist 3-6 Sätze plus ggf. ein bis drei Stichpunkte). Beziehe dich aktiv auf die
konkreten Daten der Person (Streaks, Habits, Journal-Stimmung). Bei Rückfällen reagiere nicht wertend,
sondern hilf, den nächsten Schritt zu finden. Du bist kein Ersatz für professionelle medizinische oder
psychologische Hilfe - weise bei ernsten Anliegen (z.B. Suizidgedanken, schwere Sucht) freundlich darauf
hin, sich zusätzlich professionelle Unterstützung zu suchen. Antworte auf Deutsch, ohne Überschriften.`;

function contextSummary(state: DemoState): string {
  const today = dayKey(new Date());
  const week = new Set(lastDayKeys(7));
  const lines = [`Name: ${state.profile.name}`];
  for (const segment of state.segments) {
    lines.push(`Bereich "${segment.name}":`);
    if (segment.habits.length === 0) lines.push("  (noch keine Habits)");
    for (const h of segment.habits) {
      lines.push(
        `  - "${h.title}" | Streak: ${computeStreak(h.logs)} Tage | heute erledigt: ${h.logs.includes(today) ? "ja" : "nein"} | Ziel: ${h.targetPerWeek}x/Woche | Beweisfotos (7 Tage): ${(h.proofs ?? []).filter((p) => week.has(p.date)).length}`,
      );
    }
  }
  if (state.trackers.length > 0) {
    lines.push("Verhaltens-/Sucht-Tracker:");
    for (const t of state.trackers) {
      lines.push(`  - "${t.name}": ${daysSince(t.streakStartAt)} Tage sauber`);
      if (t.blocker.enabled && t.blocker.rules.length > 0) {
        const window = t.blocker.from && t.blocker.until ? `${t.blocker.from}-${t.blocker.until} Uhr` : "rund um die Uhr";
        lines.push(`    App-Blocker aktiv (${window}): ${t.blocker.rules.map((r) => r.label).join(", ")}`);
      }
    }
  }
  const recent = state.journal.slice(0, 3);
  if (recent.length > 0) {
    lines.push("Letzte Journal-Einträge (neueste zuerst):");
    for (const e of recent) {
      const snippet = e.body.length > 200 ? `${e.body.slice(0, 200)}…` : e.body;
      lines.push(`  - [Stimmung ${e.mood ?? "-"}/5] ${snippet}`);
    }
  }
  return lines.join("\n");
}

function coachErrorMessage(code: string): string {
  switch (code) {
    case "not_granted":
      return "Ohne deine Freigabe kann der Coach nicht antworten. Lade die Seite neu, wenn du sie erteilen möchtest.";
    case "rate_limited":
      return "Gerade kommen zu viele Anfragen an. Versuch es in einer Minute noch einmal.";
    case "session_expired":
      return "Deine claude.ai-Sitzung ist abgelaufen. Bitte melde dich neu an.";
    case "sampling_disabled":
    case "not_declared":
    case "capability_disabled":
    case "capability_removed":
      return "Der Coach ist in dieser Ansicht nicht verfügbar.";
    default:
      return "Der Coach konnte nicht antworten. Bitte versuch es erneut.";
  }
}

// ---------- API ----------

export const demoApi: Api = {
  async login(email) {
    const state = await load();
    if (!state) throw new ApiError(401, "Noch kein Demo-Konto. Erstelle eins mit „Neues Konto erstellen“.");
    if (state.profile.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new ApiError(401, "Diese E-Mail passt nicht zu deinem Demo-Konto.");
    }
    return { token: "demo", user: profileOf(state) };
  },

  async register(name, email) {
    const existing = await load();
    if (existing) {
      throw new ApiError(409, `Du hast schon ein Demo-Konto (${existing.profile.email}). Melde dich damit an.`);
    }
    const state: DemoState = {
      version: 1,
      profile: { id: newId(), name: name.trim(), email: email.trim(), avatarVersion: null },
      segments: defaultSegments(),
      journal: [],
      trackers: [],
      coach: [],
    };
    await persist(state);
    return { token: "demo", user: state.profile };
  },

  async me() {
    return { user: profileOf(await loadAccount()) };
  },

  async setAvatar(image) {
    await loadAccount();
    try {
      await (await avatarDoc()).set({ image });
    } catch {
      throw new ApiError(0, "Das Profilbild konnte nicht gespeichert werden. Bitte versuch es erneut.");
    }
    const user = await mutate((s) => {
      s.profile.avatarVersion = new Date().toISOString();
      return profileOf(s);
    });
    return { user };
  },

  async removeAvatar() {
    const user = await mutate((s) => {
      s.profile.avatarVersion = null;
      return profileOf(s);
    });
    await (await avatarDoc()).delete().catch(() => undefined);
    return { user };
  },

  async avatarImage() {
    const snap = await (await avatarDoc()).get();
    const image = snap.exists ? snap.data()?.image : undefined;
    if (typeof image !== "string") throw new ApiError(404, "Kein Profilbild");
    return image;
  },

  async segments() {
    return { segments: (await loadAccount()).segments.map(toSegment) };
  },

  createSegment: (name, icon) =>
    mutate((s) => {
      s.segments.push({ id: newId(), name: name.trim(), icon, color: "#FF5A52", habits: [] });
    }),

  async deleteSegment(id) {
    const removed = await mutate((s) => {
      const segment = s.segments.find((seg) => seg.id === id);
      s.segments = s.segments.filter((seg) => seg.id !== id);
      return segment?.habits.flatMap((h) => (h.proofs ?? []).map((p) => p.id)) ?? [];
    });
    await deleteProofImages(removed);
  },

  createHabit: (segmentId, title, targetPerWeek) =>
    mutate((s) => {
      const segment = s.segments.find((seg) => seg.id === segmentId) ?? notFound("Bereich");
      segment.habits.push({ id: newId(), title: title.trim(), notes: null, targetPerWeek, logs: [] });
    }),

  toggleHabit: (id) =>
    mutate((s) => {
      const { habit } = findHabit(s, id);
      const today = dayKey(new Date());
      const done = habit.logs.includes(today);
      habit.logs = done ? habit.logs.filter((d) => d !== today) : [...habit.logs, today];
      return { doneToday: !done };
    }),

  async deleteHabit(id) {
    const removed = await mutate((s) => {
      const { segment, habit } = findHabit(s, id);
      segment.habits = segment.habits.filter((h) => h.id !== id);
      return (habit.proofs ?? []).map((p) => p.id);
    });
    await deleteProofImages(removed);
  },

  async addProof(habitId, image) {
    findHabit(await loadAccount(), habitId);
    const proof: Proof = { id: newId(), date: dayKey(new Date()), createdAt: new Date().toISOString() };
    try {
      await (await proofDoc(proof.id)).set({ image, habitId, createdAt: proof.createdAt });
    } catch {
      throw new ApiError(0, "Das Foto konnte nicht gespeichert werden. Bitte versuch es erneut.");
    }
    const dropped = await mutate((s) => {
      const { habit } = findHabit(s, habitId);
      const all = [proof, ...(habit.proofs ?? [])];
      habit.proofs = all.slice(0, MAX_PROOFS_PER_HABIT);
      if (!habit.logs.includes(proof.date)) habit.logs = [...habit.logs, proof.date];
      return all.slice(MAX_PROOFS_PER_HABIT).map((p) => p.id);
    });
    await deleteProofImages(dropped);
    return { proof, doneToday: true };
  },

  async proofImage(proofId) {
    const snap = await (await proofDoc(proofId)).get();
    const image = snap.exists ? snap.data()?.image : undefined;
    if (typeof image !== "string") throw new ApiError(404, "Foto nicht gefunden");
    return image;
  },

  async deleteProof(proofId) {
    await mutate((s) => {
      for (const segment of s.segments) {
        for (const habit of segment.habits) {
          habit.proofs = (habit.proofs ?? []).filter((p) => p.id !== proofId);
        }
      }
    });
    await deleteProofImages([proofId]);
  },

  async journal() {
    return { entries: (await loadAccount()).journal };
  },

  createEntry: (body, mood) =>
    mutate((s) => {
      const entry: JournalEntry = { id: newId(), title: null, body, mood, createdAt: new Date().toISOString() };
      s.journal.unshift(entry);
      return { entry };
    }),

  deleteEntry: (id) =>
    mutate((s) => {
      s.journal = s.journal.filter((e) => e.id !== id);
    }),

  async urges() {
    return { trackers: (await loadAccount()).trackers.map(toTracker) };
  },

  createTracker: (name) =>
    mutate((s) => {
      s.trackers.push({
        id: newId(),
        name: name.trim(),
        streakStartAt: new Date().toISOString(),
        blocker: { enabled: false, from: null, until: null, unlockDelayMinutes: 15, rules: [] },
        events: [],
      });
    }),

  deleteTracker: (id) =>
    mutate((s) => {
      s.trackers = s.trackers.filter((t) => t.id !== id);
    }),

  resist: (id) =>
    mutate((s) => {
      const t = findTracker(s, id);
      t.events = [{ type: "urge_resisted" as const, createdAt: new Date().toISOString() }, ...t.events].slice(0, MAX_EVENTS);
    }),

  relapse: (id) =>
    mutate((s) => {
      const t = findTracker(s, id);
      const now = new Date().toISOString();
      t.streakStartAt = now;
      t.events = [{ type: "relapse" as const, createdAt: now }, ...t.events].slice(0, MAX_EVENTS);
    }),

  saveBlocker: (id, blocker) =>
    mutate((s) => {
      if ((blocker.from === null) !== (blocker.until === null)) {
        throw new ApiError(400, "Start- und Endzeit müssen beide gesetzt oder beide leer sein");
      }
      const unique = new Map<string, BlockRule>(blocker.rules.map((r) => [`${r.kind}:${r.target}`, r]));
      const saved: Blocker = { ...blocker, rules: [...unique.values()] };
      findTracker(s, id).blocker = saved;
      return { blocker: saved };
    }),

  async coachConversation() {
    return { conversationId: "demo", messages: (await loadAccount()).coach };
  },

  async sendCoachMessage(message, onText) {
    const { sample } = await requireStore();
    if (!sample) throw new ApiError(503, "Der Coach ist in dieser Ansicht nicht verfügbar.");
    const state = await loadAccount();

    const turns: Turn[] = [
      { role: "user", content: `${COACH_INSTRUCTIONS}\n\nAktueller Stand der Person:\n${contextSummary(state)}` },
      ...state.coach.slice(-20).map((m): Turn => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let reply: string;
    try {
      const res = await sample(turns, { cache: false, onText: ({ text }) => onText?.(text) });
      reply = res.text;
    } catch (err) {
      // 503: nothing was stored, so the page gives the text back for another try.
      throw new ApiError(503, coachErrorMessage((err as SampleError).code));
    }

    const now = new Date().toISOString();
    const userMsg: CoachMessage = { id: newId(), role: "user", content: message, createdAt: now };
    const assistantMsg: CoachMessage = { id: newId(), role: "assistant", content: reply, createdAt: now };
    await mutate((s) => {
      s.coach = [...s.coach, userMsg, assistantMsg].slice(-MAX_COACH_MESSAGES);
    });
    return { message: assistantMsg };
  },
};
