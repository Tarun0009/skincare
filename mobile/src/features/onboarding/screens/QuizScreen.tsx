import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  Button,
  CircleIcon,
  FadeIn,
  IconArrowLeft,
  IconCheck,
  PressableScale,
  Screen,
  Text,
} from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { QUIZ_QUESTIONS } from '../data/questions';
import { completeOnboarding, setAnswer } from '../state/onboardingSlice';
import type { RootScreenProps } from '../../../app/navigation/types';

export function QuizScreen({ navigation }: RootScreenProps<'Quiz'>) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState<Record<string, string | string[]>>({});
  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[Math.min(step, total - 1)]!;
  const answer = local[question.id];

  const isAnswered = useMemo(() => {
    if (!answer) return false;
    return question.multi ? (answer as string[]).length > 0 : Boolean(answer);
  }, [answer, question.multi]);

  const pick = (value: string) => {
    if (question.multi) {
      const current = (local[question.id] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setLocal({ ...local, [question.id]: next });
    } else {
      setLocal({ ...local, [question.id]: value });
    }
  };

  const advance = () => {
    dispatch(setAnswer({ questionId: question.id, value: answer! }));
    if (step === total - 1) {
      // RootNavigator swaps this screen for MainTabs when `onboarding.completed`
      // flips — no manual navigate/replace needed.
      dispatch(completeOnboarding());
    } else {
      setStep(step + 1);
    }
  };

  const back = () => {
    if (step === 0) navigation.goBack();
    else setStep(step - 1);
  };

  const skip = () => {
    dispatch(completeOnboarding());
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: spacing.xxl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xxl,
        }}
      >
        <Pressable onPress={back} hitSlop={12}>
          <CircleIcon size={34} border={palette.hairlineStrong}>
            <IconArrowLeft color={palette.textMuted} />
          </CircleIcon>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 26,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= step ? palette.cream : 'rgba(242,237,228,0.16)',
              }}
            />
          ))}
        </View>
        <Text variant="label" tone="dim">
          {step + 1}/{total}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <FadeIn key={question.id} slideUp duration={320}>
          <Text variant="labelSm" tone="mauve" upper style={{ marginBottom: spacing.md }}>
            {question.eyebrow}
          </Text>
          <Text variant="display3" style={{ marginBottom: spacing.sm }}>
            {question.title}
          </Text>
          {question.subtitle && (
            <Text variant="body" tone="dim" style={{ marginBottom: spacing.xxl }}>
              {question.subtitle}
            </Text>
          )}

          <View style={{ gap: spacing.md }}>
            {question.options.map((opt) => {
              const isSelected = question.multi
                ? ((local[question.id] as string[] | undefined) ?? []).includes(opt.value)
                : local[question.id] === opt.value;
              return (
                <PressableScale key={opt.value} onPress={() => pick(opt.value)}>
                  <View
                    style={{
                      padding: spacing.lg,
                      borderRadius: radii.md,
                      backgroundColor: isSelected ? palette.surfaceElevated : palette.surface,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? palette.cream : palette.hairline,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: radii.pill,
                        backgroundColor: isSelected ? palette.cream : 'transparent',
                        borderWidth: isSelected ? 0 : 1.5,
                        borderColor: palette.hairlineStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <IconCheck size={12} color={palette.bg} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelLg">{opt.label}</Text>
                      {opt.hint && (
                        <Text variant="caption" tone={isSelected ? 'muted' : 'dim'} style={{ marginTop: spacing.xxs }}>
                          {opt.hint}
                        </Text>
                      )}
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </FadeIn>
      </ScrollView>

      <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
        <Button label="Continue" disabled={!isAnswered} onPress={advance} />
        <Pressable onPress={skip} style={{ alignSelf: 'center' }}>
          <Text variant="label" tone="dim">
            Skip quiz — scan first
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
