import {
  Camera,
  useCameraDevice,
  type CameraDevice,
  type CameraPermissionStatus,
  type PhotoFile,
} from 'react-native-vision-camera';
import { AppState } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

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
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>(() =>
    Camera.getCameraPermissionStatus()
  );

  const refreshPermission = useCallback(() => {
    setPermissionStatus(Camera.getCameraPermissionStatus());
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const requestPermission = useCallback(async () => {
    const result = await Camera.requestCameraPermission();
    setPermissionStatus(result);
    return result === 'granted';
  }, []);

  return {
    hasPermission: permissionStatus === 'granted',
    permissionStatus,
    requestPermission,
    refreshPermission,
  };
}
