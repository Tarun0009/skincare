import { StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, type ViewStyle, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../theme/tokens';

interface ScreenProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  background?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  /** When true, skip SafeAreaView (use for full-bleed screens like the camera) */
  bleed?: boolean;
  /**
   * Adds a top → bottom fade overlay ("editorial vignette"). Strong at the
   * top, fully transparent by the lower third. Defaults to on for normal
   * screens; off for `bleed` (camera has its own gradient).
   */
  gradient?: boolean;
}

const TOP_STOP_OPACITY = 0.55;
const MID_STOP_OPACITY = 0.15;

export function Screen({
  children,
  style,
  background = palette.bg,
  padding,
  paddingTop,
  paddingBottom,
  bleed,
  edges,
  gradient,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const showGradient = gradient ?? !bleed;
  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: background,
    paddingHorizontal: padding,
    paddingTop: bleed ? undefined : (paddingTop ?? insets.top),
    paddingBottom: bleed ? undefined : (paddingBottom ?? 0),
  };

  // One continuous top-to-bottom gradient: strong at the very top, softening
  // through the upper third, and fully transparent below. Reads like a
  // premium editorial photo where the eye is drawn down from a dim header.
  const gradientOverlay = showGradient ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="screenFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.bgDeep} stopOpacity={TOP_STOP_OPACITY} />
            <Stop offset="0.25" stopColor={palette.bgDeep} stopOpacity={MID_STOP_OPACITY} />
            <Stop offset="0.55" stopColor={palette.bgDeep} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#screenFade)" />
      </Svg>
    </View>
  ) : null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={background} />
      {bleed ? (
        <View style={[baseStyle, style]} {...rest}>
          {children}
          {gradientOverlay}
        </View>
      ) : (
        <SafeAreaView edges={edges ?? ['left', 'right']} style={[baseStyle, style]} {...rest}>
          {children}
          {gradientOverlay}
        </SafeAreaView>
      )}
    </>
  );
}
