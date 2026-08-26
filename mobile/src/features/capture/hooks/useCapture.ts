import { useCallback, useRef, useState } from 'react';
import { Camera, type PhotoFile } from '../../../core/native/camera';
import { checkSelfie, type FaceCheck } from '../../../core/native/faceDetection';
import { pickSelfieFromLibrary, type PickedImage } from '../../../core/native/imagePicker';
import { scanFileStore } from '../../../core/native/fs';
import { permissions } from '../../../core/native/permissions';

export type CaptureStatus =
  | 'idle'
  | 'checking_permission'
  | 'ready'
  | 'capturing'
  | 'validating'
  | 'invalid'
  | 'ready_to_upload';

export interface CapturedPhoto {
  uri: string;
  fileName: string;
  type: string;
  faceCheck: FaceCheck;
}

/**
 * Owns the capture-then-validate flow so both the camera screen and the
 * "pick from library" fallback route go through the same face-detection check
 * before we spend a Gemini call on a bad photo.
 */
export function useCapture() {
  const cameraRef = useRef<Camera>(null);
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (uri: string, fileName: string, type: string) => {
    setStatus('validating');
    const faceCheck = await checkSelfie(uri);
    if (!faceCheck.ok) {
      setPhoto({ uri, fileName, type, faceCheck });
      setStatus('invalid');
      return;
    }
    setPhoto({ uri, fileName, type, faceCheck });
    setStatus('ready_to_upload');
  }, []);

  const captureFromCamera = useCallback(async () => {
    if (!cameraRef.current) return;
    setStatus('capturing');
    try {
      const p: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      const uri = p.path.startsWith('file://') ? p.path : `file://${p.path}`;
      await validate(uri, `capture-${Date.now()}.jpg`, 'image/jpeg');
    } catch (e) {
      setError((e as Error).message);
      setStatus('idle');
    }
  }, [validate]);

  const captureFromLibrary = useCallback(async () => {
    const ok = await permissions.photos();
    if (!ok) {
      setError('photo_permission_denied');
      return;
    }
    const picked: PickedImage | null = await pickSelfieFromLibrary();
    if (!picked) return;
    await validate(picked.uri, picked.fileName, picked.type);
  }, [validate]);

  const persistLocally = useCallback(
    async (scanId: string) => {
      if (!photo) return null;
      const localUri = await scanFileStore.saveFromUri(scanId, photo.uri);
      return localUri;
    },
    [photo]
  );

  const reset = useCallback(() => {
    setPhoto(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    cameraRef,
    status,
    photo,
    error,
    captureFromCamera,
    captureFromLibrary,
    persistLocally,
    reset,
  };
}
