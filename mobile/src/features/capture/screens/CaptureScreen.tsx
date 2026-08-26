import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { RadialGradient, Rect, Defs, Stop } from 'react-native-svg';
import { Screen, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useCapture } from '../hooks/useCapture';
import { Camera, useFrontCamera, useCameraPermissionState } from '../../../core/native/camera';
import type { TabScreenProps } from '../../../app/navigation/types';

export function CaptureScreen({ navigation }: TabScreenProps<'Capture'>) {
  const { hasPermission, requestPermission } = useCameraPermissionState();
  const device = useFrontCamera();
  const {
    cameraRef,
    status,
    photo,
    captureFromCamera,
    captureFromLibrary,
    reset,
  } = useCapture();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (status !== 'ready_to_upload' || !photo) return;
    navigation.navigate('Analyzing', {
      photo: { uri: photo.uri, fileName: photo.fileName, type: photo.type },
    });
    reset();
  }, [status, photo, reset, navigation]);

  const hint = hintForStatus(status, photo);

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
          ref={cameraRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.35 }}
          device={device}
          isActive
          photo
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
              {photo ? 'Photo captured' : 'Face locked'}
            </Text>
          </View>
          <Text variant="labelLg" tone="muted">
            Flash
          </Text>
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
            ML Kit · 68 landmarks
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
        </View>

        {/* 3-angle stepper */}
        <View style={{ marginTop: spacing.xxl, flexDirection: 'row', gap: 10 }}>
          <AngleSlot label="Front" state={photo ? 'done' : 'active'} />
          <AngleSlot label="Left 30°" state={photo ? 'active' : 'next'} />
          <AngleSlot label="Right 30°" state="next" />
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
            disabled={status === 'capturing' || status === 'validating'}
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
                  opacity: status === 'capturing' ? 0.5 : 1,
                }}
              />
            </View>
          </Pressable>

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
            <Text style={{ color: palette.textMuted }}>↺</Text>
          </View>
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

function AngleSlot({ label, state }: { label: string; state: 'done' | 'active' | 'next' }) {
  const style =
    state === 'active'
      ? { bg: 'rgba(232,220,196,0.14)', border: 'rgba(232,220,196,0.3)', text: palette.cream, sub: palette.textMuted, subLabel: 'Capturing' }
      : state === 'done'
        ? { bg: 'rgba(147,168,122,0.14)', border: 'rgba(147,168,122,0.3)', text: palette.sageSoft, sub: palette.sage, subLabel: 'Done' }
        : { bg: 'rgba(242,237,228,0.05)', border: 'transparent', text: palette.textMuted, sub: palette.textFaint, subLabel: 'Next' };

  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: radii.sm,
        backgroundColor: style.bg,
        borderWidth: 1,
        borderColor: style.border,
        alignItems: 'center',
      }}
    >
      <Text variant="label" style={{ color: style.text }}>
        {label}
      </Text>
      <Text variant="tiny" style={{ color: style.sub, marginTop: 5 }}>
        {style.subLabel}
      </Text>
    </View>
  );
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
    chips: [
      { tone: 'warn', text: 'Move toward a window' },
      { tone: 'ok', text: 'No makeup detected' },
    ],
    helper: 'Hold steady and look straight ahead. Neutral expression works best.',
  };
}
