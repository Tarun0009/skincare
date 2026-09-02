import { Image, View } from 'react-native';
import { Text } from '../../../ui/primitives';
import { palette, radii } from '../../../ui/theme/tokens';

interface SidePayload {
  photoUrl: string;
  dateLabel: string;
  scoreLabel?: string;
}

interface BeforeAfterPanelProps {
  before: SidePayload;
  after: SidePayload;
  /** Overall panel height. Height is fixed so both sides align in Flexbox. */
  height?: number;
}

const DEFAULT_HEIGHT = 222;
const DIVIDER_LEFT_FRACTION = '52%' as const;
const KNOB_SIZE = 38;

/**
 * Side-by-side "before → after" panel used by History and Comparison.
 * Renders Cloudinary photos in place, falls back to a solid surface when a
 * URL is missing (a scan created while Cloudinary was unconfigured stores an
 * empty public_id and therefore an empty photoUrl on read).
 *
 * Design tokens are preserved from the existing placeholder version: cream
 * hairline divider at 52%, cream circular knob at the midpoint, date labels
 * pinned to the bottom of each panel.
 */
export function BeforeAfterPanel({
  before,
  after,
  height = DEFAULT_HEIGHT,
}: BeforeAfterPanelProps) {
  return (
    <View
      style={{
        position: 'relative',
        height,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.hairlineStrong,
        flexDirection: 'row',
      }}
    >
      <Side payload={before} align="flex-start" widthPct="52%" />
      <Side payload={after} align="flex-end" widthPct="48%" />

      {/* Cream divider between the two sides */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: DIVIDER_LEFT_FRACTION,
          width: 2,
          backgroundColor: palette.cream,
        }}
      />

      {/* Center knob — same visual language as the previous placeholder */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: DIVIDER_LEFT_FRACTION,
          marginLeft: -KNOB_SIZE / 2,
          marginTop: -KNOB_SIZE / 2,
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: 999,
          backgroundColor: palette.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: palette.bg, fontWeight: '700' }}>↔</Text>
      </View>
    </View>
  );
}

interface SideProps {
  payload: SidePayload;
  align: 'flex-start' | 'flex-end';
  widthPct: '52%' | '48%';
}

function Side({ payload, align, widthPct }: SideProps) {
  const hasPhoto = payload.photoUrl.length > 0;
  return (
    <View
      style={{
        width: widthPct,
        backgroundColor: align === 'flex-start' ? '#3E342A' : '#4A4034',
      }}
    >
      {hasPhoto && (
        <Image
          source={{ uri: payload.photoUrl }}
          resizeMode="cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          alignItems: align,
        }}
      >
        <Text
          variant="labelSm"
          tone="muted"
          upper
          style={{
            color: palette.cream,
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowRadius: 4,
          }}
        >
          {payload.dateLabel}
          {payload.scoreLabel ? ` · ${payload.scoreLabel}` : ''}
        </Text>
      </View>
    </View>
  );
}
