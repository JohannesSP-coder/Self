import { Alert } from "react-native";

/** Native confirm dialog (no window.confirm workaround needed here, unlike the web/demo). */
export function confirm(title: string, confirmLabel = "Löschen"): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, undefined, [
      { text: "Abbrechen", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
