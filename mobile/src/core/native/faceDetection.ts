import FaceDetection, {
  type Face,
} from '@react-native-ml-kit/face-detection';

export type { Face };

export interface FaceCheck {
  ok: boolean;
  reason?: 'no_face' | 'multiple_faces' | 'off_center' | 'too_far' | 'closed_eyes';
  face?: Face;
}

interface ImageDimensions {
  width?: number;
  height?: number;
}

/**
 * Runs ML Kit's on-device face detector against a local image URI and returns
 * a friendly "good enough for skin analysis?" verdict. Skin analysis wants
 * exactly one face, roughly centered, eyes open, close enough to fill the frame.
 */
export async function checkSelfie(
  uri: string,
  image: ImageDimensions = {}
): Promise<FaceCheck> {
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

  // False positives on objects are much less likely to contain a coherent
  // set of facial landmarks. Require the central features used by the scan.
  const landmarks = face.landmarks;
  const requiredLandmarks = [
    landmarks?.leftEye,
    landmarks?.rightEye,
    landmarks?.noseBase,
    landmarks?.mouthLeft,
    landmarks?.mouthRight,
  ];
  if (requiredLandmarks.filter(Boolean).length < 4) {
    return { ok: false, reason: 'no_face' };
  }

  // Skin scans need a near-frontal face; large yaw/roll produces unreliable
  // region comparisons even if ML Kit can still recognize it as a face.
  if (Math.abs(face.rotationY) > 25 || Math.abs(face.rotationZ) > 20) {
    return { ok: false, reason: 'off_center', face };
  }

  if (image.width && image.height) {
    const framing = bestFraming(face.frame, image.width, image.height);
    if (framing.widthRatio < 0.22 || framing.heightRatio < 0.25) {
      return { ok: false, reason: 'too_far', face };
    }
    if (framing.centerOffsetX > 0.22 || framing.centerOffsetY > 0.24) {
      return { ok: false, reason: 'off_center', face };
    }
  }

  const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
  const rightEyeOpen = face.rightEyeOpenProbability ?? 1;
  if (leftEyeOpen < 0.4 || rightEyeOpen < 0.4) {
    return { ok: false, reason: 'closed_eyes', face };
  }

  return { ok: true, face };
}

function bestFraming(
  frame: Face['frame'],
  photoWidth: number,
  photoHeight: number
): {
  widthRatio: number;
  heightRatio: number;
  centerOffsetX: number;
  centerOffsetY: number;
} {
  const score = (width: number, height: number) => {
    const faceCenterX = frame.left + frame.width / 2;
    const faceCenterY = frame.top + frame.height / 2;
    return {
      widthRatio: frame.width / width,
      heightRatio: frame.height / height,
      centerOffsetX: Math.abs(faceCenterX - width / 2) / width,
      centerOffsetY: Math.abs(faceCenterY - height / 2) / height,
    };
  };

  // Camera metadata and ML Kit coordinates can disagree about whether EXIF
  // rotation has already been applied. Evaluate both orientations and keep
  // the one whose center coordinates fit best.
  const normal = score(photoWidth, photoHeight);
  const rotated = score(photoHeight, photoWidth);
  const normalOffset = normal.centerOffsetX + normal.centerOffsetY;
  const rotatedOffset = rotated.centerOffsetX + rotated.centerOffsetY;
  return normalOffset <= rotatedOffset ? normal : rotated;
}
