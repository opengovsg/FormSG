import './landing-v5.css'

import { Box } from '@chakra-ui/react'

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
 * as low as the prototype's nav, and both take the paper background so the
 * page neither starts on a blue band nor ends on a white one. The outer
 * `landing-v5-page` box exists only to carry the paper grain across all three,
 * so the chrome reads as the same sheet as the body.
 */
export const LandingV5Page = (): JSX.Element => {
  /* The nudge belongs to the proof section but is triggered by the hero, when
     the sideways story runs out. The page owns the wiring because it is the only
     thing that sees both. */
  const { ref: bobRef, bob } = useProofBob<HTMLDivElement>()
  const isAtTop = useIsAtTop()

  return (
    <Box className="landing-v5-page" position="relative">
      <AppPublicHeader
        compact
        containerProps={{ bg: LANDING_V5_COLORS.paper }}
      />
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
    </Box>
  )
}
