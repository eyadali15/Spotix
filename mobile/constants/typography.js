/**
 * Spotix Design System — Typography
 */

export const FontSizes = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 16,
  subtitle: 18,
  title: 22,
  heading: 28,
  hero: 36,
  display: 48,
};

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

/**
 * Pre-built text style presets
 */
export const TextStyles = {
  caption: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption * LineHeights.normal,
  },
  body: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body * LineHeights.normal,
  },
  bodyBold: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.body * LineHeights.normal,
  },
  subtitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.subtitle * LineHeights.tight,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.title * LineHeights.tight,
  },
  heading: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.extrabold,
    lineHeight: FontSizes.heading * LineHeights.tight,
  },
  hero: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.extrabold,
    lineHeight: FontSizes.hero * LineHeights.tight,
  },
};
