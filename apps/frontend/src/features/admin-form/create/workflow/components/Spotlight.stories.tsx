import { Box, Stack, Text } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import Button from '~components/Button'
import Input from '~components/Input'

import { SpotlightGroup, SpotlightGroupProps } from './Spotlight'

const withFlag = (isOn: boolean) =>
  new GrowthBook({
    features: {
      [featureFlags.workflowBuilderRedesign]: { defaultValue: isOn },
    },
  })

export default {
  title: 'Features/AdminForm/create/workflow/components/Spotlight',
  component: SpotlightGroup,
} as Meta<SpotlightGroupProps>

/**
 * Stand-in for one section of a step card: a label, a hint and an input. The
 * spotlight wraps whatever a section renders, so the contents are incidental.
 */
const Section = ({ name }: { name: string }): JSX.Element => (
  <Stack spacing="0.5rem" px="2rem">
    <Text textStyle="subhead-1">{name}</Text>
    <Text textStyle="body-2" color="secondary.400">
      Hint text explaining what this section is for.
    </Text>
    <Input placeholder={`${name} value`} />
  </Stack>
)

/**
 * The whole point is one section lit and the rest dimmed, so the stories show a
 * card with three sections rather than a single band in isolation.
 *
 * The card is deliberately not `overflow: hidden`. The lit band is 2% wider
 * than the card and is meant to cross its border, which is only visible with a
 * real card edge to cross.
 *
 * `pt` is `0.5rem` rather than the card's usual `2rem` because the group
 * contributes the other `1.5rem` itself. `EditStepBlock` makes the same swap
 * when it adopts the group.
 */
const CardTemplate =
  (
    activeIndex: number | null,
    { isEnabled = true, isFlagOn = true } = {},
  ): StoryFn =>
  () => (
    <GrowthBookProvider growthbook={withFlag(isFlagOn)}>
      {/* Story-only gutter. The lit band is wider than the card, so without
          room either side the left overhang is clipped by the canvas edge and
          the treatment looks asymmetric. */}
      <Box p="1.5rem">
        <Box
          maxW="42rem"
          bg="white"
          border="1px solid"
          borderColor="neutral.300"
          borderRadius="4px"
          pt="0.5rem"
          pb="2rem"
        >
          <Stack spacing="0">
            <SpotlightGroup activeIndex={activeIndex} isEnabled={isEnabled}>
              <Section name="Step name" />
              <Section name="Who fills this in" />
              <Section name="What they can see" />
            </SpotlightGroup>
            {/* Outside the group and always at full opacity: the buttons are
                the way forward, and dimming them would look unavailable. The
                divider above them is the group's trailing boundary, so it is
                rendered there and not here. */}
            <Stack direction="row" justify="flex-end" px="2rem" pt="1.5rem">
              <Button variant="clear" colorScheme="secondary">
                Back
              </Button>
              <Button>Continue</Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </GrowthBookProvider>
  )

export const FirstSectionActive = CardTemplate(0)
FirstSectionActive.storyName = 'Section 1 active'
FirstSectionActive.parameters = {
  docs: {
    description: {
      story:
        'One band carries the Active treatment and the rest go inert. The lit band is enlarged 2% at full card width, so it crosses the card border on both sides rather than being inset. Its contents are the same size as every other section, only scaled with the band.',
    },
  },
}

export const MiddleSectionActive = CardTemplate(1)
MiddleSectionActive.storyName = 'Section 2 active'
MiddleSectionActive.parameters = {
  docs: {
    description: {
      story:
        'With a dimmed section above and below, which is where the boundary lines matter: the outline is drawn on the two lines that bound the section, and both grey lines are suppressed so no hairline shows inside the blue.',
    },
  },
}

export const LastSectionActive = CardTemplate(2)
LastSectionActive.storyName = 'Section 3 active'
LastSectionActive.parameters = {
  docs: {
    description: {
      story:
        "The last section's lower boundary is the divider above the buttons, which stays put: it belongs to the button row, not to the group.",
    },
  },
}

export const Disabled = CardTemplate(0, { isEnabled: false })
Disabled.storyName = 'Spotlight off (step 3+, guidance off)'
Disabled.parameters = {
  docs: {
    description: {
      story:
        'Sections render untouched, in the pre-redesign structure: sibling dividers, the same 1.5rem rhythm, no band, no outline, no enlargement, no dimming. Compare against section 1 active to confirm no band styling leaks through.',
    },
  },
}

export const FlagOff = CardTemplate(0, { isFlagOn: false })
FlagOff.storyName = 'Redesign flag off'
FlagOff.parameters = {
  docs: {
    description: {
      story:
        'Identical to the disabled story. Flag-off has to be untouched sections everywhere, which is the same thing isEnabled already means.',
    },
  },
}
