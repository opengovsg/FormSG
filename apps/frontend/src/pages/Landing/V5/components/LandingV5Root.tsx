import { Box, BoxProps, ChakraProvider } from '@chakra-ui/react'

import { LANDING_V5_ROOT_CLASS, landingV5Theme } from '../theme/landingV5Theme'

import { BladeMaskDefs } from './BladeMaskDefs'

/**
 * The paper surface everything on this page sits on: the scoped Chakra
 * sub-theme, the root class the stylesheet keys off, and the blade defs.
 *
 * Shared by the page and by its stories so a story cannot drift from what
 * actually renders in the app.
 *
 * `resetCSS` is false because the app-level provider has already emitted the
 * reset; emitting it twice would be harmless but pointless.
 *
 * `cssVarsRoot` is not optional. Chakra emits a theme's CSS variables at
 * `:host, :root` by default, so without it this provider would publish its
 * `--chakra-*` values globally and every product page would pick up whatever
 * this theme overrides — the font stack included. Scoping them to the page root
 * is what makes the sub-theme genuinely local.
 *
 * Consequence worth knowing: anything that portals out of this subtree (a
 * Chakra Modal or Tooltip renders into document.body) lands outside
 * `.landing-v5` and so cannot see these variables. Nothing on this page
 * portals today; if something needs to, give it a container inside the root.
 */
export const LandingV5Root = ({
  children,
  ...props
}: BoxProps): JSX.Element => (
  <ChakraProvider
    theme={landingV5Theme}
    resetCSS={false}
    cssVarsRoot={`.${LANDING_V5_ROOT_CLASS}`}
  >
    <Box className={LANDING_V5_ROOT_CLASS} {...props}>
      <BladeMaskDefs />
      {children}
    </Box>
  </ChakraProvider>
)
