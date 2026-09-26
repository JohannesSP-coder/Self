import { Switch } from "react-native";
import { colors } from "../theme";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: colors.surface2, true: colors.accent }}
      thumbColor="#fff"
      ios_backgroundColor={colors.surface2}
    />
  );
}
