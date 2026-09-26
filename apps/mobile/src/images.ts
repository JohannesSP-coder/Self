import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

const MAX_DATA_URL_CHARS = 190_000;
const SIZES = [1080, 900, 720];
const QUALITIES = [0.72, 0.6, 0.5];

function toDataUri(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

/** Resizes+compresses to a JPEG data URI small enough to store, stepping size/quality down until it fits. */
async function compress(uri: string): Promise<string> {
  let last = "";
  for (const size of SIZES) {
    for (const quality of QUALITIES) {
      const context = ImageManipulator.ImageManipulator.manipulate(uri);
      context.resize({ width: size });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: quality, base64: true });
      context.release?.();
      rendered.release?.();
      if (!result.base64) continue;
      last = toDataUri(result.base64);
      if (last.length <= MAX_DATA_URL_CHARS) return last;
    }
  }
  return last;
}

/** Center-crops to a square, then resizes+compresses to a small 256×256 JPEG data URI. */
async function compressAvatar(uri: string): Promise<string> {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: 256, height: 256 });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.82, base64: true });
  context.release?.();
  rendered.release?.();
  if (!result.base64) throw new Error("Das Foto konnte nicht verarbeitet werden.");
  return toDataUri(result.base64);
}

/** Picks a photo from the library and returns a compressed data URI, or null if the user cancels. */
export async function pickProofPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Zugriff nötig", "Meglio braucht Zugriff auf deine Fotos, um ein Beweisfoto auszuwählen.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return compress(result.assets[0].uri);
}

/** Takes a photo with the camera and returns a compressed data URI, or null if the user cancels. */
export async function takeProofPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Zugriff nötig", "Meglio braucht Zugriff auf deine Kamera, um ein Beweisfoto aufzunehmen.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return compress(result.assets[0].uri);
}

/** Picks a profile picture from the library (native square crop UI), or null if the user cancels. */
export async function pickAvatarFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Zugriff nötig", "Meglio braucht Zugriff auf deine Fotos, um ein Profilbild auszuwählen.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  return compressAvatar(result.assets[0].uri);
}

/** Takes a profile picture with the camera (native square crop UI), or null if the user cancels. */
export async function pickAvatarFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Zugriff nötig", "Meglio braucht Zugriff auf deine Kamera, um ein Profilbild aufzunehmen.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return compressAvatar(result.assets[0].uri);
}
