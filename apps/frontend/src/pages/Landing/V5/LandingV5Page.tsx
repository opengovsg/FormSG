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
 */
export const LandingV5Page = (): JSX.Element => {
  return (
    <>
      <AppPublicHeader />
      <ChakraProvider theme={landingV5Theme} resetCSS={false}>
        <Box className={LANDING_V5_ROOT_CLASS} minH="60vh" />
      </ChakraProvider>
      <AppFooter />
    </>
  )
}
