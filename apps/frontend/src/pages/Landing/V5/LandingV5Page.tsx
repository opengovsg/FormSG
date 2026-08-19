import './landing-v5.css'

import { Box, ChakraProvider } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { LANDING_V5_ROOT_CLASS, landingV5Theme } from './theme/landingV5Theme'

/**
 * V5 landing page — the "sheet that scrolls sideways" exploration, built for
 * production. Lives on its own route; `/` is untouched.
 *
 * The header and footer sit outside the nested provider on purpose. They are
 * shared product chrome, and the brief was to keep the standard footer rather
 * than port the prototype's colophon, so they should keep the product theme.
 * Only the page body gets the paper palette.
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
export const LandingV5Page = (): JSX.Element => {
  return (
    <>
      <AppPublicHeader />
      <ChakraProvider
        theme={landingV5Theme}
        resetCSS={false}
        cssVarsRoot={`.${LANDING_V5_ROOT_CLASS}`}
      >
        <Box className={LANDING_V5_ROOT_CLASS} minH="60vh" />
      </ChakraProvider>
      <AppFooter />
    </>
  )
}
