import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth";
import { colors } from "../theme";

export function Avatar({ size = 40 }: { size?: number }) {
  const { user, avatarUri } = useAuth();
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (avatarUri) {
    return <Image source={{ uri: avatarUri }} style={style} contentFit="cover" />;
  }
  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.38) }]}>{user?.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: "#fff",
    fontWeight: "700",
  },
});
