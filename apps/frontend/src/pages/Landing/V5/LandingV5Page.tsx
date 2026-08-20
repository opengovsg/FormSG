import './landing-v5.css'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { LandingV5Root } from './components/LandingV5Root'

/**
 * V5 landing page — the "sheet that scrolls sideways" exploration, built for
 * production. Lives on its own route; `/` is untouched.
 *
 * The header and footer sit outside `LandingV5Root` on purpose. They are shared
 * product chrome, and the brief was to keep the standard footer rather than
 * port the prototype's colophon, so they should keep the product theme. Only
 * the page body gets the paper palette.
 */
export const LandingV5Page = (): JSX.Element => {
  return (
    <>
      <AppPublicHeader />
      <LandingV5Root minH="60vh" />
      <AppFooter />
    </>
  )
}
