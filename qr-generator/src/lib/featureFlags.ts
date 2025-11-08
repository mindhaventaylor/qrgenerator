export const FEATURE_FLAGS = {
  LANDINGPAGE_CONVERSION: 'landingpage-conversion',
} as const

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

