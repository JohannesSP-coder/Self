import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export const SEGMENT_ICONS: Record<string, { label: string; ionicon: keyof typeof Ionicons.glyphMap }> = {
  dumbbell: { label: "Fitness", ionicon: "barbell-outline" },
  leaf: { label: "Mindset", ionicon: "leaf-outline" },
  moon: { label: "Schlaf", ionicon: "moon-outline" },
  chart: { label: "Finanzen", ionicon: "bar-chart-outline" },
  book: { label: "Lernen", ionicon: "book-outline" },
  star: { label: "Sonstiges", ionicon: "star-outline" },
};

export function SegmentIcon({ icon, size = 20, color = colors.ink }: { icon: string | null; size?: number; color?: string }) {
  const entry = SEGMENT_ICONS[icon ?? ""] ?? SEGMENT_ICONS.star;
  return <Ionicons name={entry.ionicon} size={size} color={color} />;
}
