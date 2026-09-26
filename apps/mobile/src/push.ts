import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "./api";

const TOKEN_KEY = "meglio_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** The token this device last registered with the server, or null if it never has (persists across restarts). */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Registers this device for reminder push notifications and tells the server about it. */
export async function enablePushReminders(): Promise<void> {
  if (!Device.isDevice) {
    throw new Error("Push-Erinnerungen funktionieren nur auf einem echten Gerät, nicht im Simulator.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Erinnerungen",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    throw new Error("Du hast Benachrichtigungen nicht erlaubt. Bitte erlaube sie in den Einstellungen.");
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error("Push-Erinnerungen sind für diese Build noch nicht eingerichtet (fehlende EAS-Projekt-ID).");
  }

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    throw new Error("Push-Erinnerungen konnten nicht aktiviert werden. Versuch es später noch einmal.");
  }

  await api.subscribePush({ kind: "expo", token });
  await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => undefined);
}

/** Unsubscribes this device's current push token from the server, if it has one. */
export async function disablePushReminders(): Promise<void> {
  const token = await getStoredPushToken();
  if (token) await api.unsubscribePush(token).catch(() => undefined);
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
}
