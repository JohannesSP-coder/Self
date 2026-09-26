import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET"),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Web push for reminders (see lib/reminderScheduler.ts). Generate a pair with
  // `npx web-push generate-vapid-keys`; reminders stay silently off without them.
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidContactEmail: process.env.VAPID_CONTACT_EMAIL || "kontakt@example.com",
};
