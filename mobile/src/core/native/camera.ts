import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type CameraDevice,
  type PhotoFile,
} from 'react-native-vision-camera';

export { Camera };
export type { CameraDevice, PhotoFile };

/**
 * Hooks the capture screen will use. Vision Camera is a native module (not
 * Expo) — permission handling and device selection are done natively.
 */
export function useFrontCamera(): CameraDevice | undefined {
  return useCameraDevice('front');
}

export function useCameraPermissionState() {
  const { hasPermission, requestPermission } = useCameraPermission();
  return { hasPermission, requestPermission };
}
