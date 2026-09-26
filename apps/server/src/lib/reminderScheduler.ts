import webPush from "web-push";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { loadReminderSegments } from "./reminderData.js";
import { pickReminder } from "./reminders.js";

const webPushConfigured = Boolean(env.vapidPublicKey && env.vapidPrivateKey);
if (webPushConfigured) {
  webPush.setVapidDetails(`mailto:${env.vapidContactEmail}`, env.vapidPublicKey, env.vapidPrivateKey);
}

interface WebPushKeys {
  keys: { p256dh: string; auth: string };
}

async function sendToSubscription(
  sub: { id: string; kind: string; endpoint: string; data: string | null },
  title: string,
  body: string,
): Promise<void> {
  if (sub.kind === "web") {
    if (!webPushConfigured || !sub.data) return;
    try {
      const { keys } = JSON.parse(sub.data) as WebPushKeys;
      await webPush.sendNotification({ endpoint: sub.endpoint, keys }, JSON.stringify({ title, body }));
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // The browser dropped this subscription (uninstalled, cleared data, …) - forget it too.
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      } else {
        console.error("Web-Push fehlgeschlagen:", err);
      }
    }
    return;
  }

  // Expo's push service needs no credentials for a basic send.
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: sub.endpoint, title, body, sound: "default" }),
    });
    const json = (await res.json().catch(() => null)) as { data?: { status?: string; details?: { error?: string } } } | null;
    if (json?.data?.status === "error" && json.data.details?.error === "DeviceNotRegistered") {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
    }
  } catch (err) {
    console.error("Expo-Push fehlgeschlagen:", err);
  }
}

/** Exported for tests; runs one pass over every user who has at least one registered device. */
export async function runReminderTick(now: Date = new Date()): Promise<void> {
  // Keep the table small; a sent id is only ever looked up for "today", so a few days is plenty.
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  await prisma.sentReminder.deleteMany({ where: { createdAt: { lt: threeDaysAgo } } });

  const users = await prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] });
  for (const { userId } of users) {
    const segments = await loadReminderSegments(userId);
    const reminder = pickReminder(now, segments);
    if (!reminder) continue;

    const alreadySent = await prisma.sentReminder.findUnique({
      where: { userId_reminderId: { userId, reminderId: reminder.id } },
    });
    if (alreadySent) continue;

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(subs.map((sub) => sendToSubscription(sub, reminder.title, reminder.body)));
    await prisma.sentReminder.create({ data: { userId, reminderId: reminder.id } }).catch(() => undefined);
  }
}

let interval: ReturnType<typeof setInterval> | null = null;

/** Checks every few minutes whether any registered device is due a reminder push. */
export function startReminderScheduler(): void {
  if (interval) return;
  interval = setInterval(() => {
    runReminderTick().catch((err) => console.error("Reminder-Tick fehlgeschlagen:", err));
  }, 5 * 60 * 1000);
  interval.unref();
}
