import { View } from 'react-native';
import { palette } from '../theme/tokens';

export function Divider({ inset = 0, strong = false }: { inset?: number; strong?: boolean }) {
  return (
    <View
      style={{
        height: 1,
        marginHorizontal: inset,
        backgroundColor: strong ? palette.hairlineStrong : palette.hairline,
      }}
    />
  );
}
