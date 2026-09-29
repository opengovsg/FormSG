import './landing-v5.css'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { LandingV5Root } from './components/LandingV5Root'
import { useIsAtTop } from './hooks/useIsAtTop'
import { useProofBob } from './hooks/useProofBob'
import { CapabilitiesSection } from './sections/CapabilitiesSection'
import { CloseSection } from './sections/CloseSection'
import { ExamplesSection } from './sections/ExamplesSection'
import { HeroSection } from './sections/HeroSection'
import { ProofSection } from './sections/ProofSection'
import { SecuritySection } from './sections/SecuritySection'
import { TestimonialSection } from './sections/TestimonialSection'
import { LANDING_V5_COLORS } from './theme/tokens'

/**
 * V5 landing page — the "sheet that scrolls sideways" exploration, built for
 * production. Lives on its own route; `/` is untouched.
 *
 * The header and footer sit outside `LandingV5Root` on purpose. They are shared
 * product chrome, and the brief was to keep the standard footer rather than
 * port the prototype's colophon. The header is the compact variant so it sits
 * as low as the prototype's nav, and the footer takes the paper background so
 * the page does not end on a white band.
 */
export const LandingV5Page = (): JSX.Element => {
  /* The nudge belongs to the proof section but is triggered by the hero, when
     the sideways story runs out. The page owns the wiring because it is the only
     thing that sees both. */
  const { ref: bobRef, bob } = useProofBob<HTMLDivElement>()
  const isAtTop = useIsAtTop()

  return (
    <>
      <AppPublicHeader compact />
      <LandingV5Root>
        <HeroSection onReachEnd={bob} />
        <ProofSection bobRef={bobRef} isAtTop={isAtTop} />
        <SecuritySection />
        <CapabilitiesSection />
        <ExamplesSection />
        <TestimonialSection />
        <CloseSection />
      </LandingV5Root>
      <AppFooter containerProps={{ bg: LANDING_V5_COLORS.paper }} />
    </>
  )
}
