import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Habit, Proof } from "../api";
import { confirm } from "../confirm";
import { proofUri } from "../proofImages";
import { colors, fontFamily, radius, spacing } from "../theme";
import { formatEntryDate, formatProofDay } from "../util";

function useProofUri(id: string): string | null {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    proofUri(id)
      .then((u) => active && setUri(u))
      .catch(() => active && setUri(null));
    return () => {
      active = false;
    };
  }, [id]);
  return uri;
}

function ProofThumb({ proof, onOpen }: { proof: Proof; onOpen: () => void }) {
  const uri = useProofUri(proof.id);
  const day = formatProofDay(proof.createdAt);
  return (
    <Pressable style={styles.thumb} onPress={onOpen} accessibilityLabel={`Beweisfoto von ${day} ansehen`}>
      <View style={[styles.thumbImage, day === "Heute" && styles.thumbImageToday]}>
        {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
      </View>
      <Text style={styles.thumbDay}>{day}</Text>
    </Pressable>
  );
}

export function ProofStrip({
  habit,
  hint,
  uploading,
  onPick,
  onOpen,
}: {
  habit: Habit;
  hint: string;
  uploading: boolean;
  onPick: () => void;
  onOpen: (proof: Proof) => void;
}) {
  return (
    <View style={styles.strip}>
      <Pressable style={[styles.addTile, uploading && styles.addTileBusy]} onPress={onPick} disabled={uploading} accessibilityLabel={`${habit.title}: Beweisfoto hinzufügen`}>
        {uploading ? <ActivityIndicator color={colors.accentText} /> : <Ionicons name="camera-outline" size={20} color={colors.accentText} />}
        <Text style={styles.addTileLabel}>{uploading ? "Lädt…" : "Foto"}</Text>
      </Pressable>
      {habit.proofs.length === 0 ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : (
        habit.proofs.map((p) => <ProofThumb key={p.id} proof={p} onOpen={() => onOpen(p)} />)
      )}
    </View>
  );
}

export function ProofViewer({
  habitTitle,
  proof,
  deleting,
  onDelete,
  onClose,
}: {
  habitTitle: string;
  proof: Proof;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const uri = useProofUri(proof.id);

  async function requestDelete() {
    if (await confirm("Dieses Beweisfoto löschen? Das Habit bleibt für den Tag abgehakt.", "Löschen")) onDelete();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHead}>
            <View>
              <Text style={styles.modalTitle}>{habitTitle}</Text>
              <Text style={styles.modalSub}>{formatEntryDate(proof.createdAt)}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Schließen" hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.modalImage}>
            {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" /> : <ActivityIndicator color={colors.inkFaint} />}
          </View>
          <Pressable style={styles.deleteButton} onPress={requestDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={16} color={colors.ink} />
            <Text style={styles.deleteButtonLabel}>{deleting ? "Löscht…" : "Foto löschen"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.sm },
  addTile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accentText,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addTileBusy: { opacity: 0.6 },
  addTileLabel: { color: colors.accentText, fontFamily: fontFamily.bodySemiBold, fontSize: 11 },
  hint: { flex: 1, color: colors.inkFaint, fontSize: 12.5, lineHeight: 17, paddingTop: spacing.xs },
  thumb: { width: 64, alignItems: "center", gap: spacing.xs },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  thumbImageToday: { borderWidth: 2, borderColor: colors.accent },
  thumbDay: { color: colors.inkFaint, fontSize: 11 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: spacing.lg },
  modalPanel: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 15 },
  modalSub: { color: colors.inkFaint, fontSize: 12, marginTop: 2 },
  modalImage: { aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  deleteButton: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  deleteButtonLabel: { color: colors.ink, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
});
