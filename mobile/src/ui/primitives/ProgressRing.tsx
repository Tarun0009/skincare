import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../theme/tokens';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 124,
  stroke = 9,
  color = palette.mauve,
  trackColor = 'rgba(242,237,228,0.09)',
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(100, value)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
