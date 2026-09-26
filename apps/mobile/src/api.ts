import * as SecureStore from "expo-secure-store";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "meglio_token";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarVersion: string | null;
}

export interface Proof {
  id: string;
  date: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  notes: string | null;
  targetPerWeek: number;
  doneToday: boolean;
  streak: number;
  last7: boolean[];
  proofs: Proof[];
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

export type PushSubscriptionInput = { kind: "expo"; token: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let cachedToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // The keychain can be unavailable in rare cases; the session then lasts until the app restarts.
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
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

/** Loads an authenticated image and returns a data URI (a plain <Image> can't send the bearer token). */
async function requestImageDataUri(path: string): Promise<string> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(0, "Server nicht erreichbar. Läuft das Backend?");
  }
  if (!res.ok) throw new ApiError(res.status, "Foto konnte nicht geladen werden.");
  const contentType = res.headers.get("Content-Type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();
  return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // eslint-disable-next-line no-undef -- btoa exists in the Hermes/React Native runtime.
  return btoa(binary);
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
  setAvatar: (image: string) => request<{ user: User }>("/me/avatar", { method: "PUT", body: { image } }),
  removeAvatar: () => request<{ user: User }>("/me/avatar", { method: "DELETE" }),
  avatarImage: () => requestImageDataUri("/me/avatar"),

  segments: () => request<{ segments: Segment[] }>("/segments"),
  createSegment: (name: string, icon: string) =>
    request<unknown>("/segments", { method: "POST", body: { name, icon, color: "#FF5A52" } }),
  deleteSegment: (id: string) => request<void>(`/segments/${id}`, { method: "DELETE" }),

  createHabit: (segmentId: string, title: string, targetPerWeek: number) =>
    request<unknown>("/habits", { method: "POST", body: { segmentId, title, targetPerWeek } }),
  toggleHabit: (id: string) => request<{ doneToday: boolean }>(`/habits/${id}/toggle-today`, { method: "POST" }),
  deleteHabit: (id: string) => request<void>(`/habits/${id}`, { method: "DELETE" }),
  addProof: (habitId: string, image: string) =>
    request<{ proof: Proof; doneToday: boolean }>(`/habits/${habitId}/proofs`, { method: "POST", body: { image } }),
  proofImage: (proofId: string) => requestImageDataUri(`/proofs/${proofId}/image`),
  deleteProof: (proofId: string) => request<void>(`/proofs/${proofId}`, { method: "DELETE" }),

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

  coachConversation: () => request<{ conversationId: string; messages: CoachMessage[] }>("/coach/conversation"),
  sendCoachMessage: (message: string) => request<{ message: CoachMessage }>("/coach/message", { method: "POST", body: { message } }),

  pushPublicKey: () => request<{ publicKey: string | null }>("/push/public-key"),
  subscribePush: (subscription: PushSubscriptionInput) =>
    request<void>("/push/subscribe", { method: "POST", body: subscription }),
  unsubscribePush: (token: string) => request<void>("/push/subscribe", { method: "DELETE", body: { endpoint: token } }),
};
