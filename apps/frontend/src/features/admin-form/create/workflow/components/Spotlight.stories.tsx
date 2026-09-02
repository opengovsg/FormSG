import { Box, Divider, Stack, Text } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import Button from '~components/Button'
import Input from '~components/Input'

import { Spotlight, SpotlightProps } from './Spotlight'

const withFlag = (isOn: boolean) =>
  new GrowthBook({
    features: {
      [featureFlags.workflowBuilderRedesign]: { defaultValue: isOn },
    },
  })

export default {
  title: 'Features/AdminForm/create/workflow/components/Spotlight',
  component: Spotlight,
} as Meta<SpotlightProps>

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
 * card with three sections rather than a single wrapper in isolation.
 */
const CardTemplate =
  (
    activeSection: number,
    { isEnabled = true, isFlagOn = true } = {},
  ): StoryFn =>
  () => (
    <GrowthBookProvider growthbook={withFlag(isFlagOn)}>
      <Box
        maxW="42rem"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        borderRadius="4px"
        py="2rem"
      >
        <Stack spacing="0">
          {/* Outside the spotlight and always at full opacity: the buttons are
              the way forward, and dimming them would look unavailable. */}
          <Stack spacing="0">
            <Spotlight isActive={activeSection === 1} isEnabled={isEnabled}>
              <Section name="Step name" />
            </Spotlight>
            <Divider />
            <Spotlight isActive={activeSection === 2} isEnabled={isEnabled}>
              <Section name="Who fills this in" />
            </Spotlight>
            <Divider />
            <Spotlight isActive={activeSection === 3} isEnabled={isEnabled}>
              <Section name="What they can see" />
            </Spotlight>
          </Stack>
          <Divider />
          <Stack direction="row" justify="flex-end" px="2rem" pt="1.5rem">
            <Button variant="clear" colorScheme="secondary">
              Back
            </Button>
            <Button>Continue</Button>
          </Stack>
        </Stack>
      </Box>
    </GrowthBookProvider>
  )

export const FirstSectionActive = CardTemplate(1)
FirstSectionActive.storyName = 'Section 1 active'
FirstSectionActive.parameters = {
  docs: {
    description: {
      story:
        'One section carries the Active treatment and the rest go inert. Note the active section is inset by 2rem, narrower than the sections around it, which is deliberate.',
    },
  },
}

export const MiddleSectionActive = CardTemplate(2)
MiddleSectionActive.storyName = 'Section 2 active'
MiddleSectionActive.parameters = {
  docs: {
    description: {
      story:
        'With a dimmed section above and below, which is where the reserved transparent border matters: nothing shifts as the spotlight moves.',
    },
  },
}

export const LastSectionActive = CardTemplate(3)
LastSectionActive.storyName = 'Section 3 active'

export const Disabled = CardTemplate(1, { isEnabled: false })
Disabled.storyName = 'Spotlight off (step 3+, guidance off)'
Disabled.parameters = {
  docs: {
    description: {
      story:
        'Children render untouched: no background, no border, no padding, no dimming. Compare against section 1 active to confirm no wrapper styling leaks through.',
    },
  },
}

export const FlagOff = CardTemplate(1, { isFlagOn: false })
FlagOff.storyName = 'Redesign flag off'
FlagOff.parameters = {
  docs: {
    description: {
      story:
        'Identical to the disabled story. Flag-off has to be untouched children everywhere, which is the same thing isEnabled already means.',
    },
  },
}
