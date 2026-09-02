import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { RadialGradient, Rect, Defs, Stop } from 'react-native-svg';
import { Screen, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useCapture } from '../hooks/useCapture';
import { Camera, useFrontCamera, useCameraPermissionState } from '../../../core/native/camera';
import type { TabScreenProps } from '../../../app/navigation/types';

export function CaptureScreen({ navigation }: TabScreenProps<'Capture'>) {
  const isFocused = useIsFocused();
  const { hasPermission, permissionStatus, requestPermission } = useCameraPermissionState();
  const device = useFrontCamera();
  const requestedPermission = useRef(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSession, setCameraSession] = useState(0);
  // Tracks whether we've already asked the OS this session. On Android a
  // second denial usually means "Don't ask again" is set and the dialog
  // won't reappear — that's when we fall back to the settings deep-link.
  const [hasRequestedThisSession, setHasRequestedThisSession] = useState(false);
  const {
    cameraRef,
    status,
    photo,
    error: captureError,
    captureFromCamera,
    captureFromLibrary,
    reset,
  } = useCapture();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  const handleRequestCamera = useCallback(async () => {
    setHasRequestedThisSession(true);
    await requestPermission();
  }, [requestPermission]);

  // Auto-fire the OS dialog once on focus if we've never asked. Covers the
  // fresh-install case; explicit taps handle every other path.
  useEffect(() => {
    if (
      isFocused &&
      permissionStatus === 'not-determined' &&
      !requestedPermission.current
    ) {
      requestedPermission.current = true;
      void handleRequestCamera();
    }
  }, [isFocused, permissionStatus, handleRequestCamera]);

  const cameraIsActive =
    isFocused && appState === 'active' && hasPermission && device != null;

  useEffect(() => {
    if (status !== 'ready_to_upload' || !photo) return;
    navigation.navigate('Analyzing', {
      photo: { uri: photo.uri, fileName: photo.fileName, type: photo.type },
    });
    reset();
  }, [status, photo, reset, navigation]);

  const hint = cameraHint({
    hasPermission,
    hasDevice: device != null,
    cameraReady,
    cameraError,
    captureError,
    status,
    photo,
  });

  const retryCamera = () => {
    setCameraReady(false);
    setCameraError(null);
    setCameraSession((value) => value + 1);
  };

  const cameraLabel = cameraError
    ? 'Camera error'
    : status === 'capturing'
      ? 'Taking photo'
      : status === 'validating'
        ? 'Checking photo'
        : status === 'invalid'
          ? 'Try another photo'
          : status === 'ready_to_upload'
            ? 'Photo ready'
            : cameraReady
              ? 'Camera ready'
              : hasPermission
                ? 'Opening camera'
                : 'Permission needed';

  return (
    <Screen bleed background={palette.bgDeep}>
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="40%" rx="70%" ry="46%">
            <Stop offset="0%" stopColor="#3A3128" />
            <Stop offset="55%" stopColor="#1B1713" />
            <Stop offset="100%" stopColor={palette.bgDeep} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      {hasPermission && device && (
        <Camera
          key={`${device.id}-${cameraSession}`}
          ref={cameraRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          device={device}
          isActive={cameraIsActive}
          photo
          onInitialized={() => {
            setCameraError(null);
          }}
          onPreviewStarted={() => setCameraReady(true)}
          onPreviewStopped={() => setCameraReady(false)}
          onError={(error) => {
            setCameraReady(false);
            setCameraError(error.message);
          }}
        />
      )}

      {hasPermission && device && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 9, 8, 0.42)',
          }}
        />
      )}

      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, paddingHorizontal: spacing.xl }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text variant="labelLg" tone="muted">
              Cancel
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: radii.pill,
              backgroundColor: 'rgba(10,9,8,0.6)',
              borderWidth: 1,
              borderColor: palette.hairlineStrong,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: palette.sage }} />
            <Text variant="tiny" tone="muted">
              {cameraLabel}
            </Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        {/* Face guide oval */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 252,
              height: 340,
              borderWidth: 2,
              borderColor: 'rgba(232,220,196,0.85)',
              borderTopLeftRadius: 180,
              borderTopRightRadius: 180,
              borderBottomLeftRadius: 160,
              borderBottomRightRadius: 160,
              position: 'relative',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -14,
                left: -14,
                right: -14,
                bottom: -14,
                borderWidth: 1,
                borderColor: 'rgba(232,220,196,0.16)',
                borderTopLeftRadius: 200,
                borderTopRightRadius: 200,
                borderBottomLeftRadius: 180,
                borderBottomRightRadius: 180,
              }}
            />
            <View
              style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(232,220,196,0.14)' }}
            />
            <View
              style={{ position: 'absolute', left: 0, right: 0, top: '44%', height: 1, backgroundColor: 'rgba(232,220,196,0.14)' }}
            />
            {/* Landmark dots */}
            <Dot left={52} top={120} />
            <Dot right={52} top={120} />
            <Dot left="50%" top={196} centered />
            <Dot left="50%" top={252} centered />
          </View>
          <Text variant="tiny" tone="faint" style={{ marginTop: spacing.xxl }}>
            Face quality is checked after capture
          </Text>
        </View>

        {/* Hint chips */}
        <View style={{ gap: 12, alignItems: 'center' }}>
          {hint.chips.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {hint.chips.map((c, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingVertical: 9,
                    paddingHorizontal: 13,
                    borderRadius: radii.pill,
                    backgroundColor: c.tone === 'warn' ? 'rgba(217,162,63,0.14)' : 'rgba(147,168,122,0.12)',
                    borderWidth: 1,
                    borderColor: c.tone === 'warn' ? 'rgba(217,162,63,0.4)' : 'rgba(147,168,122,0.3)',
                  }}
                >
                  {c.tone === 'warn' && (
                    <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: palette.gold }} />
                  )}
                  <Text
                    variant="tiny"
                    style={{ color: c.tone === 'warn' ? palette.goldSoft : palette.sageSoft }}
                  >
                    {c.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text variant="bodySm" tone="muted" align="center" style={{ maxWidth: 280 }}>
            {hint.helper}
          </Text>
          {!hasPermission && (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  hasRequestedThisSession
                    ? 'Open camera permission settings'
                    : 'Allow camera access'
                }
                onPress={() =>
                  hasRequestedThisSession
                    ? void Linking.openSettings()
                    : void handleRequestCamera()
                }
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: radii.pill,
                  backgroundColor: palette.cream,
                }}
              >
                <Text variant="label" style={{ color: palette.bgDeep }}>
                  {hasRequestedThisSession ? 'Open settings' : 'Allow camera access'}
                </Text>
              </Pressable>
              {hasRequestedThisSession && (
                <Pressable onPress={() => void handleRequestCamera()} hitSlop={6}>
                  <Text variant="caption" tone="muted">
                    Try asking again
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          {hasPermission && cameraError && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry camera"
              onPress={retryCamera}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: radii.pill,
                backgroundColor: palette.cream,
              }}
            >
              <Text variant="label" style={{ color: palette.bgDeep }}>
                Retry camera
              </Text>
            </Pressable>
          )}
        </View>

        {/* Bottom controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.xxxl,
            paddingHorizontal: spacing.md,
          }}
        >
          <Pressable onPress={captureFromLibrary}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                backgroundColor: 'rgba(242,237,228,0.08)',
                borderWidth: 1,
                borderColor: palette.hairlineStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="tiny" tone="muted" align="center">
                Photo{'\n'}library
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={captureFromCamera}
            disabled={
              !cameraReady ||
              !cameraIsActive ||
              status === 'capturing' ||
              status === 'validating'
            }
            accessibilityRole="button"
            accessibilityLabel="Take scan photo"
            hitSlop={12}
          >
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 999,
                borderWidth: 3,
                borderColor: 'rgba(232,220,196,0.9)',
                padding: 5,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 999,
                  backgroundColor: palette.cream,
                  opacity:
                    !cameraReady || status === 'capturing' || status === 'validating' ? 0.45 : 1,
                }}
              />
            </View>
          </Pressable>

          <View style={{ width: 52, height: 52 }} />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

function Dot({ left, right, top, centered }: { left?: number | string; right?: number; top: number; centered?: boolean }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: left as number | undefined,
        right,
        top,
        width: 12,
        height: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(232,220,196,0.5)',
        marginLeft: centered ? -6 : 0,
      }}
    />
  );
}

function cameraHint({
  hasPermission,
  hasDevice,
  cameraReady,
  cameraError,
  captureError,
  status,
  photo,
}: {
  hasPermission: boolean;
  hasDevice: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  captureError: string | null;
  status: ReturnType<typeof useCapture>['status'];
  photo: ReturnType<typeof useCapture>['photo'];
}): { chips: { tone: 'ok' | 'warn'; text: string }[]; helper: string } {
  if (!hasPermission) {
    return {
      chips: [{ tone: 'warn', text: 'Camera access needed' }],
      helper: 'Allow camera access to take a scan, or choose a photo from your library.',
    };
  }
  if (!hasDevice) {
    return {
      chips: [{ tone: 'warn', text: 'Front camera unavailable' }],
      helper: 'This device has no usable front camera. You can still choose a photo.',
    };
  }
  if (cameraError) {
    return {
      chips: [{ tone: 'warn', text: 'Camera could not start' }],
      helper: cameraError,
    };
  }
  if (captureError) {
    return {
      chips: [{ tone: 'warn', text: 'Photo was not captured' }],
      helper: captureError,
    };
  }
  if (!cameraReady) {
    return {
      chips: [{ tone: 'ok', text: 'Starting camera' }],
      helper: 'The preview will be ready in a moment.',
    };
  }
  return hintForStatus(status, photo);
}

function hintForStatus(
  status: ReturnType<typeof useCapture>['status'],
  photo: ReturnType<typeof useCapture>['photo']
): { chips: { tone: 'ok' | 'warn'; text: string }[]; helper: string } {
  if (status === 'validating') {
    return {
      chips: [{ tone: 'ok', text: 'Checking face and eyes' }],
      helper: 'Hold steady while we run the face check.',
    };
  }
  if (status === 'invalid' && photo) {
    const reasonMap: Record<string, string> = {
      no_face: 'No face detected',
      multiple_faces: 'More than one face in frame',
      off_center: 'Face is off-centre',
      too_far: 'Too far — fill the guide',
      closed_eyes: 'Eyes closed',
    };
    const reason = photo.faceCheck.reason;
    const msg = reason ? (reasonMap[reason] ?? 'Try again') : 'Try again';
    return {
      chips: [{ tone: 'warn', text: msg }],
      helper: 'Reposition and tap the shutter again.',
    };
  }
  return {
    chips: [{ tone: 'ok', text: 'Camera ready' }],
    helper: 'Center one face in the guide, use even lighting, and look straight ahead.',
  };
}
