import { textStyles as baseTextStyles } from './foundations/textStyles'

export const textStyles = {
  ...baseTextStyles,
  'responsive-display-heavy': {
    fontWeight: {
      base: baseTextStyles['responsive-display'].heavy.fontWeight,
      md: baseTextStyles['responsive-display']['heavy-480'].fontWeight,
      lg: baseTextStyles['responsive-display']['heavy-1280'].fontWeight,
    },
    lineHeight: {
      base: baseTextStyles['responsive-display'].heavy.lineHeight,
      md: baseTextStyles['responsive-display']['heavy-480'].lineHeight,
      lg: baseTextStyles['responsive-display']['heavy-1280'].lineHeight,
    },
    fontSize: {
      base: baseTextStyles['responsive-display'].heavy.fontSize,
      md: baseTextStyles['responsive-display']['heavy-480'].fontSize,
      lg: baseTextStyles['responsive-display']['heavy-1280'].fontSize,
    },
    letterSpacing: {
      base: baseTextStyles['responsive-display'].heavy.letterSpacing,
      md: baseTextStyles['responsive-display']['heavy-480'].letterSpacing,
      lg: baseTextStyles['responsive-display']['heavy-1280'].letterSpacing,
    },
    fontFamily: 'body',
  },
  'responsive-display-light': {
    fontWeight: {
      base: baseTextStyles['responsive-display'].light.fontWeight,
      md: baseTextStyles['responsive-display']['light-480'].fontWeight,
      lg: baseTextStyles['responsive-display']['light-1280'].fontWeight,
    },
    lineHeight: {
      base: baseTextStyles['responsive-display'].light.lineHeight,
      md: baseTextStyles['responsive-display']['light-480'].lineHeight,
      lg: baseTextStyles['responsive-display']['light-1280'].lineHeight,
    },
    fontSize: {
      base: baseTextStyles['responsive-display'].light.fontSize,
      md: baseTextStyles['responsive-display']['light-480'].fontSize,
      lg: baseTextStyles['responsive-display']['light-1280'].fontSize,
    },
    letterSpacing: {
      base: baseTextStyles['responsive-display'].light.letterSpacing,
      md: baseTextStyles['responsive-display']['light-480'].letterSpacing,
      lg: baseTextStyles['responsive-display']['light-1280'].letterSpacing,
    },
    fontFamily: 'body',
  },
  'responsive-heading-heavy': {
    fontWeight: {
      base: baseTextStyles['responsive-heading'].heavy.fontWeight,
      md: baseTextStyles['responsive-heading']['heavy-480'].fontWeight,
      lg: baseTextStyles['responsive-heading']['heavy-1280'].fontWeight,
    },
    lineHeight: {
      base: baseTextStyles['responsive-heading'].heavy.lineHeight,
      md: baseTextStyles['responsive-heading']['heavy-480'].lineHeight,
      lg: baseTextStyles['responsive-heading']['heavy-1280'].lineHeight,
    },
    fontSize: {
      base: baseTextStyles['responsive-heading'].heavy.fontSize,
      md: baseTextStyles['responsive-heading']['heavy-480'].fontSize,
      lg: baseTextStyles['responsive-heading']['heavy-1280'].fontSize,
    },
    letterSpacing: {
      base: baseTextStyles['responsive-heading'].heavy.letterSpacing,
      md: baseTextStyles['responsive-heading']['heavy-480'].letterSpacing,
      lg: baseTextStyles['responsive-heading']['heavy-1280'].letterSpacing,
    },
    fontFamily: 'body',
  },
  'responsive-heading-light': {
    fontWeight: {
      base: baseTextStyles['responsive-heading'].light.fontWeight,
      md: baseTextStyles['responsive-heading']['light-480'].fontWeight,
      lg: baseTextStyles['responsive-heading']['light-1280'].fontWeight,
    },
    lineHeight: {
      base: baseTextStyles['responsive-heading'].light.lineHeight,
      md: baseTextStyles['responsive-heading']['light-480'].lineHeight,
      lg: baseTextStyles['responsive-heading']['light-1280'].lineHeight,
    },
    fontSize: {
      base: baseTextStyles['responsive-heading'].light.fontSize,
      md: baseTextStyles['responsive-heading']['light-480'].fontSize,
      lg: baseTextStyles['responsive-heading']['light-1280'].fontSize,
    },
    letterSpacing: {
      base: baseTextStyles['responsive-heading'].light.letterSpacing,
      md: baseTextStyles['responsive-heading']['light-480'].letterSpacing,
      lg: baseTextStyles['responsive-heading']['light-1280'].letterSpacing,
    },
    fontFamily: 'body',
  },
}
