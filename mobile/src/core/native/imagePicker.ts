import {
  launchImageLibrary,
  type ImagePickerResponse,
  type Asset,
} from 'react-native-image-picker';

export interface PickedImage {
  uri: string;
  fileName: string;
  type: string;
  fileSize: number;
}

/**
 * Thin wrapper over react-native-image-picker so screens don't have to know
 * about the raw response shape. Returns null on cancel/error.
 */
export async function pickSelfieFromLibrary(): Promise<PickedImage | null> {
  const res: ImagePickerResponse = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.9,
    includeExtra: false,
    selectionLimit: 1,
  });

  if (res.didCancel || res.errorCode) return null;
  const asset: Asset | undefined = res.assets?.[0];
  if (!asset?.uri) return null;

  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `selfie-${Date.now()}.jpg`,
    type: asset.type ?? 'image/jpeg',
    fileSize: asset.fileSize ?? 0,
  };
}
