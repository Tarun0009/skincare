import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  type Permission,
} from 'react-native-permissions';

const CAMERA: Permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
}) as Permission;

const PHOTOS: Permission = PERMISSIONS.IOS.PHOTO_LIBRARY;

async function ensure(p: Permission): Promise<boolean> {
  const current = await check(p);
  if (current === RESULTS.GRANTED || current === RESULTS.LIMITED) return true;
  const next = await request(p);
  return next === RESULTS.GRANTED || next === RESULTS.LIMITED;
}

export const permissions = {
  camera: () => ensure(CAMERA),
  // Android's system photo picker does not require storage permission.
  photos: () => (Platform.OS === 'android' ? Promise.resolve(true) : ensure(PHOTOS)),
};
