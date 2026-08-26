import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CircleIcon, IconCheck, IconLock, Screen, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { scanFileStore } from '../../../core/native/fs';
import { useCreateScanMutation } from '../api/scansApi';
import type { RootScreenProps } from '../../../app/navigation/types';

interface StepDescriptor {
  id: string;
  label: string;
  meta: string;
}

const STEPS: StepDescriptor[] = [
  { id: 'detect', label: 'Face detected and aligned', meta: 'ML Kit' },
  { id: 'map', label: 'Facial zones mapped', meta: 'On device' },
  { id: 'vision', label: 'Assessing lesions, texture, tone', meta: 'Vision API' },
  { id: 'routine', label: 'Generating your routine', meta: '' },
];

type StepState = 'done' | 'active' | 'pending';

function stateFor(stepIndex: number, active: number): StepState {
  if (stepIndex < active) return 'done';
  if (stepIndex === active) return 'active';
  return 'pending';
}

export function AnalyzingScreen({ route, navigation }: RootScreenProps<'Analyzing'>) {
  const { photo } = route.params;
  const [createScan] = useCreateScanMutation();
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now()).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(tick);
  }, [startedAt]);

  // On mount: run the upload. The two device-side steps flip to done immediately
  // (they already happened before we got here); the vision step is active until
  // the mutation resolves, then routine flips to done.
  useEffect(() => {
    setActiveStep(2);
    let cancelled = false;
    (async () => {
      try {
        const scan = await createScan(photo).unwrap();
        if (cancelled) return;
        await scanFileStore.saveFromUri(scan.id, photo.uri);
        setActiveStep(4);
        navigation.replace('ScanResult', { scanId: scan.id });
      } catch {
        if (!cancelled) navigation.goBack();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createScan, navigation, photo]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const elapsedLabel = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [elapsed]);

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxl }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <View style={{ width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={190} height={190} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="face" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#332B22" />
                <Stop offset="1" stopColor="#1D1A16" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={190} height={190} rx={95} fill="url(#face)" />
          </Svg>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '56%',
              height: 2,
              backgroundColor: palette.cream,
              opacity: 0.9,
            }}
          />
          <Animated.View
            style={{ position: 'absolute', width: 222, height: 222, transform: [{ rotate }] }}
          >
            <Svg width={222} height={222}>
              <Circle
                cx={111}
                cy={111}
                r={109}
                fill="none"
                stroke={palette.mauve}
                strokeWidth={2}
                strokeDasharray="60 500"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="h2">Reading your skin</Text>
          <Text variant="body" tone="dim" style={{ marginTop: 8 }}>
            Elapsed {elapsedLabel}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.xxl }}>
        {STEPS.map((s, i) => {
          const state = stateFor(i, activeStep);
          return (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 15,
                paddingHorizontal: 4,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: palette.hairline,
                opacity: state === 'pending' ? 0.45 : 1,
              }}
            >
              {state === 'done' ? (
                <CircleIcon size={22} bg={palette.sage}>
                  <IconCheck size={13} color={palette.bg} />
                </CircleIcon>
              ) : state === 'active' ? (
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <Svg width={22} height={22}>
                    <Circle
                      cx={11}
                      cy={11}
                      r={9.5}
                      fill="none"
                      stroke={palette.mauve}
                      strokeWidth={2}
                      strokeDasharray="18 40"
                      strokeLinecap="round"
                    />
                  </Svg>
                </Animated.View>
              ) : (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: 'rgba(242,237,228,0.25)',
                  }}
                />
              )}
              <Text variant="labelLg" style={{ flex: 1 }}>
                {s.label}
              </Text>
              {s.meta ? (
                <Text
                  variant="caption"
                  tone={state === 'active' ? 'mauve' : 'faint'}
                >
                  {s.meta}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <View
        style={{
          padding: 15,
          borderRadius: radii.md,
          backgroundColor: palette.surfaceSubtle,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 11,
        }}
      >
        <View style={{ marginTop: 2 }}>
          <IconLock />
        </View>
        <Text variant="caption" tone="dim" style={{ flex: 1 }}>
          Images are sent for analysis over TLS and are not retained by the model provider.
          Originals stay on your device.
        </Text>
      </View>
    </Screen>
  );
}
