/**
 * Second Look — dark graveyard theme tokens (NFR-3).
 *
 * A dark "graveyard" palette: near-black soil background, stone-grey
 * surfaces, moss accent with AA contrast on dark, and status colors
 * for the Library / "Rising soon" / "Buried" views.
 */

export const colors = {
  /** App background — near-black soil. */
  background: '#0C0D10',
  /** Elevated surface — dark stone. */
  surface: '#16181D',
  /** Raised surface (cards on stone) — lighter granite. */
  surfaceRaised: '#1F2229',
  /** Hairline borders between stones. */
  border: '#2A2E37',
  /** Primary text — moonlight. */
  text: '#E6E4DE',
  /** Secondary text — faded epitaph. */
  textMuted: '#9BA0AA',
  /** Accent — graveyard moss. AA (≥4.5:1) on background and surface. */
  accent: '#7FD1A8',
  /** Accent pressed / deep moss. */
  accentDark: '#5BA986',
  /** Tombstone stone — cool granite. */
  stone: '#B9BDC6',
  /** Danger / delete — dried-blood red, AA on dark. */
  danger: '#E5697A',
  /** Warning / expiring soon — lantern amber. */
  warning: '#E3B341',
  /** Success / done — ivy green. */
  success: '#7FD1A8',
  /** Deal price highlight — moss on stone. */
  deal: '#9BE3C0',
  /** Event / Rising soon — lantern amber. */
  event: '#E3B341',
  /** Junk / buried — grave dust. */
  junk: '#6E7280',
  /** Tab bar background. */
  tabBar: '#101216',
} as const;

export type ColorToken = keyof typeof colors;

/** Spacing scale (4px base), gravestone-plot rhythm. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Typography scale. System font stack — RN default, tuned sizes. */
export const typography = {
  /** App title "Second Look". */
  title: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  /** Screen headers. */
  heading: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  /** Card titles / shot titles. */
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  /** Reasons, secondary copy. */
  small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 19 },
  /** Meta text, dates, badges. */
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  /** Buttons and emphasized labels. */
  label: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
} as const;

export type TypographyToken = keyof typeof typography;

/** Radii — soft, worn-stone corners. */
export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  /** Fully rounded pill (badges, tombstone arch helpers). */
  pill: 999,
} as const;

/** Layout constants. */
export const layout = {
  /** Max content width on web/tablet. */
  maxContentWidth: 720,
  /** Library grid thumbnail target (~300px per FR-2.3). */
  thumbSize: 300,
  /** Shot grid columns (phone). */
  gridColumns: 2,
  /** Grid gap. */
  gridGap: spacing.md,
} as const;

/**
 * App-wide labels kept with the theme so the graveyard voice is
 * consistent (NFR-3: "Buried" / "Rising soon").
 */
export const labels = {
  appName: 'Second Look',
  tagline: 'Give your screenshots a second look.',
  library: 'Library',
  risingSoon: 'Rising soon',
  buried: 'Buried',
  search: 'Search',
  ask: 'Ask',
  settings: 'Settings',
  done: 'Done',
  bury: 'Bury',
  demo: 'Try demo',
} as const;

export const theme = { colors, spacing, typography, radii, layout, labels };
export type Theme = typeof theme;
