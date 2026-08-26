import FaceDetection, {
  type Face,
} from '@react-native-ml-kit/face-detection';

export type { Face };

export interface FaceCheck {
  ok: boolean;
  reason?: 'no_face' | 'multiple_faces' | 'off_center' | 'too_far' | 'closed_eyes';
  face?: Face;
}

/**
 * Runs ML Kit's on-device face detector against a local image URI and returns
 * a friendly "good enough for skin analysis?" verdict. Skin analysis wants
 * exactly one face, roughly centered, eyes open, close enough to fill the frame.
 */
export async function checkSelfie(uri: string): Promise<FaceCheck> {
  const faces = await FaceDetection.detect(uri, {
    performanceMode: 'accurate',
    landmarkMode: 'all',
    contourMode: 'none',
    classificationMode: 'all',
    minFaceSize: 0.15,
  });

  if (faces.length === 0) return { ok: false, reason: 'no_face' };
  if (faces.length > 1) return { ok: false, reason: 'multiple_faces' };

  const face = faces[0]!;

  const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
  const rightEyeOpen = face.rightEyeOpenProbability ?? 1;
  if (leftEyeOpen < 0.4 || rightEyeOpen < 0.4) {
    return { ok: false, reason: 'closed_eyes', face };
  }

  return { ok: true, face };
}
