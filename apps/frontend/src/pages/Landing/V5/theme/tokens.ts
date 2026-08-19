/**
 * The single source for the V5 landing page's palette.
 *
 * Two consumers read from here and they must not drift:
 *  - `landingV5Theme` exposes these as `colors.landing.*` for Chakra props.
 *  - the same theme emits them as `--lv5-*` custom properties on `.landing-v5`,
 *    which is how `landing-v5.css` reaches them.
 *
 * So a colour is written once, in this file. Anything static that only CSS ever
 * reads (the blade mask, the grain, the easing curve) lives in `landing-v5.css`
 * instead — it cannot drift because nothing in TypeScript refers to it.
 *
 * Values transcribed from the exploration prototype's `:root` block,
 * `FormSG-brand-exploration/public/prototypes/v5-hero-carousel.html`.
 */

export const LANDING_V5_COLORS = {
  ink: '#1e1e1e',
  paper: '#faf8f4',
  paperDeep: '#f3f0e9',
  greyRow: '#f2f3f7',
  blue: '#4a61c0',
  blueDeep: '#2451b4',
  bluePale: '#dfe7fa',
  mint: '#05e3ab',
  mintDeep: '#03c78f',
  mintInk: '#045c43',
  muted: '#6f6f6f',
  hairline: '#e2ddd2',
  fadedInk: '#c9c3b6',
} as const

/**
 * Body copy greys. The prototype uses two near-blacks below `ink` for running
 * text; they are deliberately not part of the palette above because they are
 * type colours rather than brand colours.
 */
export const LANDING_V5_TEXT_COLORS = {
  bodyInk: '#333333',
  ledeInk: '#4a4a4a',
} as const

/**
 * `--lv5-<kebab>` for every palette entry, for `landing-v5.css` to consume.
 */
export const landingV5CssVars: Record<string, string> = Object.fromEntries(
  Object.entries({ ...LANDING_V5_COLORS, ...LANDING_V5_TEXT_COLORS }).map(
    ([name, value]) => [
      `--lv5-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
      value,
    ],
  ),
)
