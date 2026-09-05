import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import {
  Button,
  CircleIcon,
  FadeIn,
  IconCheck,
  IconClose,
  PressableScale,
  Screen,
  Text,
} from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { setPlan, type Plan } from '../state/billingSlice';
import type { RootScreenProps } from '../../../app/navigation/types';

const BENEFITS: { title: string; body: string }[] = [
  {
    title: 'Unlimited scans',
    body: 'Rescan every four weeks, or whenever something changes',
  },
  {
    title: 'Side-by-side progress',
    body: 'Aligned photos and per-condition deltas over time',
  },
  {
    title: 'Routine that adapts',
    body: 'Steps ramp and retire based on what your scans show',
  },
  {
    title: 'Exportable summary',
    body: 'A one-page PDF to bring to a dermatologist',
  },
];

export function PaywallScreen({ navigation }: RootScreenProps<'Paywall'>) {
  const dispatch = useDispatch();
  const [choice, setChoice] = useState<Plan>('yearly');

  const startTrial = () => {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const renew = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
    dispatch(
      setPlan({
        plan: 'trial',
        trialEndsAt: trialEnd.toISOString(),
        renewsAt: choice === 'yearly' ? renew.toISOString() : null,
      })
    );
    navigation.goBack();
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: 0 }}>
      <Svg
        width="100%"
        height={420}
        style={{ position: 'absolute', top: -120, left: 0, right: 0 }}
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="30%" rx="80%" ry="60%">
            <Stop offset="0" stopColor="rgba(176,100,141,0.28)" />
            <Stop offset="1" stopColor={palette.bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxl }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <CircleIcon size={32} bg="rgba(242,237,228,0.08)">
              <IconClose color={palette.textMuted} />
            </CircleIcon>
          </Pressable>
        </View>

        <FadeIn slideUp>
          <Text variant="labelSm" tone="mauve" upper style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
            Pro
          </Text>
          <Text variant="display2">You’ve used{'\n'}your free scan</Text>
          <Text variant="bodyLg" tone="muted" style={{ marginTop: spacing.md, maxWidth: 300 }}>
            One scan tells you where you stand. Tracking is what tells you if anything is working.
          </Text>
        </FadeIn>

        <FadeIn delay={100} style={{ marginTop: spacing.xxxl, gap: spacing.lg }}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <CircleIcon size={19} bg={palette.mauveTint} style={{ marginTop: 1 }}>
                <IconCheck size={11} color={palette.mauveSoft} />
              </CircleIcon>
              <View style={{ flex: 1 }}>
                <Text variant="labelLg">{b.title}</Text>
                <Text variant="caption" tone="dim" style={{ marginTop: spacing.xxs }}>
                  {b.body}
                </Text>
              </View>
            </View>
          ))}
        </FadeIn>

        <FadeIn delay={200} style={{ marginTop: spacing.huge, gap: spacing.md }}>
          <PlanOption
            selected={choice === 'yearly'}
            onPress={() => setChoice('yearly')}
            title="Yearly · ₹499"
            body="₹41/mo · save 30%"
            badge="BEST"
          />
          <PlanOption
            selected={choice === 'monthly'}
            onPress={() => setChoice('monthly')}
            title="Monthly · ₹50"
            body="Cancel anytime"
          />
          <View style={{ marginTop: spacing.xs }}>
            <Button label="Start 7-day free trial" onPress={startTrial} />
          </View>
          <Text variant="caption" tone="faint" align="center">
            Then ₹499/year. Cancel in Settings. Not a medical service.
          </Text>
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}

function PlanOption({
  selected,
  title,
  body,
  badge,
  onPress,
}: {
  selected: boolean;
  title: string;
  body: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress}>
      <View
        style={{
          padding: spacing.lg,
          borderRadius: radii.md,
          backgroundColor: selected ? palette.surfaceElevated : palette.surface,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? palette.cream : palette.hairlineStrong,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: radii.pill,
            backgroundColor: selected ? palette.cream : 'transparent',
            borderWidth: selected ? 0 : 1.5,
            borderColor: palette.hairlineStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <IconCheck size={11} color={palette.bg} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelLg">{title}</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: spacing.xs }}>
            {body}
          </Text>
        </View>
        {badge && (
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 5,
              borderRadius: radii.xs,
              backgroundColor: palette.cream,
            }}
          >
            <Text variant="tiny" style={{ color: palette.bg, letterSpacing: 1.2 }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}
