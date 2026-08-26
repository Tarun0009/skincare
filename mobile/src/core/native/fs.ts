import RNFS from 'react-native-fs';

/**
 * On-device photo cache. We keep a local copy of every scan photo under
 * DocumentDirectory/scans/{scanId}.jpg so history views stay snappy and
 * work offline. The server has the source of truth.
 */
const SCANS_DIR = `${RNFS.DocumentDirectoryPath}/scans`;

async function ensureDir(): Promise<void> {
  const exists = await RNFS.exists(SCANS_DIR);
  if (!exists) await RNFS.mkdir(SCANS_DIR);
}

export const scanFileStore = {
  async saveFromUri(scanId: string, sourceUri: string): Promise<string> {
    await ensureDir();
    const dest = `${SCANS_DIR}/${scanId}.jpg`;
    // copyFile handles content:// and file:// on Android, ph:// / file:// on iOS.
    await RNFS.copyFile(sourceUri, dest);
    return `file://${dest}`;
  },

  localPath(scanId: string): string {
    return `file://${SCANS_DIR}/${scanId}.jpg`;
  },

  async exists(scanId: string): Promise<boolean> {
    return RNFS.exists(`${SCANS_DIR}/${scanId}.jpg`);
  },

  async remove(scanId: string): Promise<void> {
    const path = `${SCANS_DIR}/${scanId}.jpg`;
    if (await RNFS.exists(path)) await RNFS.unlink(path);
  },

  async clear(): Promise<void> {
    if (await RNFS.exists(SCANS_DIR)) await RNFS.unlink(SCANS_DIR);
    await ensureDir();
  },
};
