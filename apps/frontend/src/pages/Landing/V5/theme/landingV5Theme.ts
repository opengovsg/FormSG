import { extendTheme } from '@chakra-ui/react'

import { theme } from '~theme/index'

import {
  LANDING_V5_COLORS,
  LANDING_V5_TEXT_COLORS,
  landingV5CssVars,
} from './tokens'

/**
 * Class applied to the page's root element. Everything scoped by
 * `landing-v5.css`, and the CSS custom properties below, hang off it — so
 * nothing in this file can reach a product page even by accident.
 */
export const LANDING_V5_ROOT_CLASS = 'landing-v5'

/**
 * Type styles for the V5 landing page.
 *
 * Deliberately nested under `landing` rather than following the repo's flat
 * `display-1` / `display-1-mobile` naming: these are page-local and must not be
 * reached for from product code, and a namespace makes that visible at the call
 * site (`textStyle="landing.heroHead"`). The `-mobile` sibling convention is
 * kept, as are rem units.
 *
 * Only styles the prototype uses more than once are named here. The rest stay
 * inline in the section that owns them; later parts add to this list as the
 * repetition actually shows up, rather than guessing it in advance.
 */
const landingTextStyles = {
  /** Hero h1. Prototype: 50px / 44px on mobile. */
  heroHead: {
    fontWeight: 600,
    fontSize: '3.125rem',
    lineHeight: 1.06,
    letterSpacing: '-0.032em',
  },
  'heroHead-mobile': {
    fontWeight: 600,
    fontSize: '2.75rem',
    lineHeight: 1.06,
    letterSpacing: '-0.032em',
  },
  /** Section h3, as used by the proof and security sections. 54px / 36px. */
  sectionHead: {
    fontWeight: 600,
    fontSize: '3.375rem',
    lineHeight: 1.02,
    letterSpacing: '-0.03em',
  },
  'sectionHead-mobile': {
    fontWeight: 600,
    fontSize: '2.25rem',
    lineHeight: 1.02,
    letterSpacing: '-0.03em',
  },
  /** The largest heading, used by capabilities and examples. 64px. */
  displayHead: {
    fontWeight: 600,
    fontSize: '4rem',
    lineHeight: 1,
    letterSpacing: '-0.035em',
  },
  'displayHead-mobile': {
    fontWeight: 600,
    fontSize: '2.375rem',
    lineHeight: 1,
    letterSpacing: '-0.035em',
  },
  /** Standfirst under a display head. */
  lede: {
    fontSize: '1.1875rem',
    lineHeight: 1.5,
    color: LANDING_V5_TEXT_COLORS.ledeInk,
  },
  /** Running body copy. */
  body: {
    fontSize: '1rem',
    lineHeight: 1.55,
    color: LANDING_V5_TEXT_COLORS.bodyInk,
  },
  /** Mono eyebrow: wide-tracked small caps, the page's recurring label voice. */
  monoEyebrow: {
    fontFamily: 'var(--lv5-mono)',
    fontSize: '0.6875rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  },
  /** As above but tighter-set and bolder, for stamps and clearance markers. */
  monoLabel: {
    fontFamily: 'var(--lv5-mono)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
}

/**
 * The brand-blue pill CTA.
 *
 * Note the two overrides that are not optional: the shared Button `baseStyle`
 * sets `border: '1px solid'` with no colour (so it would paint a white hairline
 * over the blue) and `borderRadius: '0.25rem'`, and it spreads the `subhead-1`
 * text style, which carries its own font size and weight.
 */
const variantLandingPill = {
  border: 'none',
  borderRadius: '22px',
  px: '26px',
  py: '13px',
  fontSize: '0.9375rem',
  fontWeight: 500,
  bg: 'landing.blue',
  color: 'white',
  boxShadow: '0 2px 8px rgba(38,58,112,0.22)',
  transition: 'background 0.2s, color 0.2s',
  _hover: {
    bg: 'landing.blueDeep',
  },
  _active: {
    bg: 'landing.blueDeep',
  },
}

/**
 * Additive sub-theme, applied by a nested `ChakraProvider` around the page body
 * only. Passing the app's `theme` as the last argument is what makes it
 * additive: `extendTheme` uses its final argument as the base when that
 * argument is a complete Chakra theme. Drop it and every FormSG component style
 * silently falls back to stock Chakra.
 */
export const landingV5Theme = extendTheme(
  {
    colors: {
      landing: LANDING_V5_COLORS,
    },
    textStyles: {
      landing: landingTextStyles,
    },
    components: {
      Button: {
        variants: {
          landingPill: variantLandingPill,
        },
      },
    },
    styles: {
      global: {
        [`.${LANDING_V5_ROOT_CLASS}`]: {
          ...landingV5CssVars,
          color: LANDING_V5_COLORS.ink,
          bg: LANDING_V5_COLORS.paper,
        },
      },
    },
  },
  theme,
)
