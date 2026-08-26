/**
 * Design tokens for the Skin Analyzer app.
 *
 * Fonts: Instrument Serif + Instrument Sans. The .ttf files live in
 * `mobile/assets/fonts/` and are picked up by `react-native.config.js`. If a
 * font file is missing at runtime, RN silently falls back to the system font,
 * which still looks reasonable against these tokens.
 */

export const font = {
  serif: 'InstrumentSerif-Regular',
  serifItalic: 'InstrumentSerif-Italic',
  sans: 'InstrumentSans-Regular',
  sansMedium: 'InstrumentSans-Medium',
  sansSemibold: 'InstrumentSans-SemiBold',
  sansBold: 'InstrumentSans-Bold',
} as const;

export const palette = {
  bg: '#14120F',
  bgDeep: '#0A0908',
  surface: '#1D1A16',
  surfaceElevated: '#2B2419',
  surfaceSubtle: '#1A1714',

  text: '#F2EDE4',
  textMuted: 'rgba(242,237,228,0.55)',
  textDim: 'rgba(242,237,228,0.4)',
  textFaint: 'rgba(242,237,228,0.28)',

  hairline: 'rgba(242,237,228,0.07)',
  hairlineStrong: 'rgba(242,237,228,0.12)',

  cream: '#E8DCC4',
  creamDeep: '#D9CAA8',

  mauve: '#B0648D',
  mauveSoft: '#E4B6CE',
  mauveTint: 'rgba(176,100,141,0.16)',

  coral: '#D4674A',
  coralSoft: '#E8917A',
  coralTint: 'rgba(212,103,74,0.16)',

  gold: '#D9A23F',
  goldSoft: '#E8C27E',
  goldTint: 'rgba(217,162,63,0.14)',

  sage: '#93A87A',
  sageSoft: '#B4C79C',
  sageTint: 'rgba(147,168,122,0.16)',

  danger: '#E8917A',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

/**
 * Typography scale. Serif for display, Sans for UI and body.
 * Numbers mirror the mockup exactly.
 */
export const typography = {
  display1: { fontFamily: font.serif, fontSize: 68, lineHeight: 66, letterSpacing: -1.4 },
  display2: { fontFamily: font.serif, fontSize: 44, lineHeight: 46, letterSpacing: -0.6 },
  display3: { fontFamily: font.serif, fontSize: 38, lineHeight: 42 },
  h1:       { fontFamily: font.serif, fontSize: 34, lineHeight: 36 },
  h2:       { fontFamily: font.serif, fontSize: 30, lineHeight: 34 },
  h3:       { fontFamily: font.serif, fontSize: 26, lineHeight: 30 },
  numeric:  { fontFamily: font.serif, fontSize: 24, lineHeight: 24 },

  bodyLg:   { fontFamily: font.sans, fontSize: 15, lineHeight: 22 },
  body:     { fontFamily: font.sans, fontSize: 14, lineHeight: 21 },
  bodySm:   { fontFamily: font.sans, fontSize: 13, lineHeight: 19 },
  caption:  { fontFamily: font.sans, fontSize: 12, lineHeight: 17 },
  tiny:     { fontFamily: font.sansMedium, fontSize: 11, lineHeight: 15 },

  labelLg:  { fontFamily: font.sansSemibold, fontSize: 15, lineHeight: 18 },
  label:    { fontFamily: font.sansSemibold, fontSize: 13, lineHeight: 16 },
  labelSm:  { fontFamily: font.sansSemibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6 },
  button:   { fontFamily: font.sansSemibold, fontSize: 16, lineHeight: 18 },
} as const;

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
