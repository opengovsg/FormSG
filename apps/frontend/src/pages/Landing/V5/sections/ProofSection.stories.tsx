import '../landing-v5.css'

import { Button } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { LandingV5Root } from '../components/LandingV5Root'
import { useProofBob } from '../hooks/useProofBob'

import { ProofSection } from './ProofSection'

/**
 * Realistic figures. The shared MOCK_STATS are deliberately extreme (nine
 * billion forms), which is useful for catching overflow but tells you nothing
 * about whether the stickers read well at the real magnitudes.
 */
const REALISTIC_STATS = getLandingStats({
  overrides: {
    agencyCount: 167,
    formCount: 413208,
    submissionCount: 271000000,
  },
})

export default {
  title: 'Pages/LandingV5/ProofSection',
  component: ProofSection,
  parameters: {
    layout: 'fullscreen',
    msw: [REALISTIC_STATS],
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root>
    <ProofSection />
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

/** Stickers hold their shape on an em dash while the request is in flight. */
export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getLandingStats({ delay: 'infinite' })],
}

/** The extreme shared mock, to check nothing overflows its sticker. */
export const ExtremeValues = Template.bind({})
ExtremeValues.parameters = {
  msw: [getLandingStats()],
}

/**
 * The nudge. Not automatic: the hero triggers it in part 9, so here it is on a
 * button to make it reviewable.
 */
export const Nudge: StoryFn = () => {
  const { ref, bob } = useProofBob<HTMLDivElement>()

  return (
    <LandingV5Root>
      <Button variant="landingPill" m="1.5rem" onClick={bob}>
        Trigger the nudge
      </Button>
      <ProofSection bobRef={ref} />
    </LandingV5Root>
  )
}
Nudge.parameters = { msw: [REALISTIC_STATS] }
