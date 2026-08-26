import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '../theme/tokens';

interface Props {
  size?: number;
  color?: string;
}

/** Small line-icon set used across the app. All 24×24, 1.6 stroke. */

export function IconCamera({ size = 24, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={6} width={19} height={14} rx={4} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={1.6} />
      <Path d="M8.5 6l1.3-2.2h4.4L15.5 6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function IconLock({ size = 14, color = palette.textDim }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={10} width={16} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M8 10V7a4 4 0 018 0v3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function IconChevronRight({ size = 18, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconArrowLeft({ size = 18, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconClose({ size = 18, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconSparkle({ size = 20, color = palette.mauveSoft }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.8 5.7L19.5 10.5l-5.7 1.8L12 18l-1.8-5.7L4.5 10.5l5.7-1.8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconHome({ size = 20, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconRoutine({ size = 20, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4h8l1 4v11a2 2 0 01-2 2H9a2 2 0 01-2-2V8l1-4z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M10 12h4M10 15h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconProgress({ size = 20, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 18l5-6 4 3 7-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconUser({ size = 20, color = palette.text }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
      <Path
        d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconCheck({ size = 12, color = palette.bg }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12l6 6L20 6"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
