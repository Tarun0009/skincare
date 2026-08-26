import { StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, type ViewStyle, type ViewProps } from 'react-native';
import { palette } from '../theme/tokens';

interface ScreenProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  background?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  /** When true, skip SafeAreaView (use for full-bleed screens like the camera) */
  bleed?: boolean;
}

export function Screen({
  children,
  style,
  background = palette.bg,
  padding,
  paddingTop,
  paddingBottom,
  bleed,
  edges,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: background,
    paddingHorizontal: padding,
    paddingTop: bleed ? undefined : (paddingTop ?? insets.top),
    paddingBottom: bleed ? undefined : (paddingBottom ?? 0),
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={background} />
      {bleed ? (
        <View style={[baseStyle, style]} {...rest}>
          {children}
        </View>
      ) : (
        <SafeAreaView edges={edges ?? ['left', 'right']} style={[baseStyle, style]} {...rest}>
          {children}
        </SafeAreaView>
      )}
    </>
  );
}
