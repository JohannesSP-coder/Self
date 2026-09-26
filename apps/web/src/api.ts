const BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "meglio_token";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Habit {
  id: string;
  title: string;
  notes: string | null;
  targetPerWeek: number;
  doneToday: boolean;
  streak: number;
  last7: boolean[];
}

export interface Segment {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  habits: Habit[];
}

export interface JournalEntry {
  id: string;
  title: string | null;
  body: string;
  mood: number | null;
  createdAt: string;
}

export type BlockRuleKind = "app" | "website" | "category";

export interface BlockRule {
  kind: BlockRuleKind;
  target: string;
  label: string;
}

export interface Blocker {
  enabled: boolean;
  from: string | null;
  until: string | null;
  unlockDelayMinutes: number;
  rules: BlockRule[];
}

export interface Tracker {
  id: string;
  name: string;
  streakDays: number;
  streakStartAt: string;
  blocker: Blocker;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "Server nicht erreichbar. Läuft das Backend?");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, data.error ?? `Fehler ${res.status}`);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Etwas ist schiefgelaufen. Bitte versuch es erneut.";
}

type AuthResponse = { token: string; user: User };

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: { name, email, password } }),
  me: () => request<{ user: User }>("/me"),

  segments: () => request<{ segments: Segment[] }>("/segments"),
  createSegment: (name: string, icon: string) =>
    request<unknown>("/segments", { method: "POST", body: { name, icon, color: "#FF5A52" } }),
  deleteSegment: (id: string) => request<void>(`/segments/${id}`, { method: "DELETE" }),

  createHabit: (segmentId: string, title: string, targetPerWeek: number) =>
    request<unknown>("/habits", { method: "POST", body: { segmentId, title, targetPerWeek } }),
  toggleHabit: (id: string) =>
    request<{ doneToday: boolean }>(`/habits/${id}/toggle-today`, { method: "POST" }),
  deleteHabit: (id: string) => request<void>(`/habits/${id}`, { method: "DELETE" }),

  journal: () => request<{ entries: JournalEntry[] }>("/journal"),
  createEntry: (body: string, mood: number) =>
    request<{ entry: JournalEntry }>("/journal", { method: "POST", body: { body, mood } }),
  deleteEntry: (id: string) => request<void>(`/journal/${id}`, { method: "DELETE" }),

  urges: () => request<{ trackers: Tracker[] }>("/urges"),
  createTracker: (name: string) => request<unknown>("/urges", { method: "POST", body: { name } }),
  deleteTracker: (id: string) => request<void>(`/urges/${id}`, { method: "DELETE" }),
  resist: (id: string) => request<unknown>(`/urges/${id}/resist`, { method: "POST", body: {} }),
  relapse: (id: string) => request<unknown>(`/urges/${id}/relapse`, { method: "POST", body: {} }),
  saveBlocker: (id: string, blocker: Blocker) =>
    request<{ blocker: Blocker }>(`/urges/${id}/blocker`, { method: "PUT", body: blocker }),

  coachConversation: () =>
    request<{ conversationId: string; messages: CoachMessage[] }>("/coach/conversation"),
  sendCoachMessage: (message: string) =>
    request<{ message: CoachMessage }>("/coach/message", { method: "POST", body: { message } }),
};
