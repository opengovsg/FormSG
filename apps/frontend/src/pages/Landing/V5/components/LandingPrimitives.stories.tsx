import '../landing-v5.css'

import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { Blade } from './BladeMaskDefs'
import { LandingV5Root } from './LandingV5Root'
import { MonoEyebrow } from './MonoEyebrow'
import { Reveal } from './Reveal'

/**
 * The V5 landing page's shared primitives, shown together. These have no
 * consumer until the sections land in later parts, so this is where they are
 * reviewed.
 */
export default {
  title: 'Pages/LandingV5/Primitives',
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root p="3rem">
    <Stack spacing="3rem" maxW="46rem">
      <Box>
        <MonoEyebrow>Mono eyebrow</MonoEyebrow>
        <Text textStyle="landing.sectionHead" mt="0.75rem">
          Section heading
        </Text>
        <Text textStyle="landing.lede" mt="0.875rem">
          The lede that sits under a heading, in Inter Tight at 19px.
        </Text>
        <Text textStyle="landing.body" mt="0.875rem">
          Running body copy, one step darker and tighter than the lede.
        </Text>
      </Box>

      <Box>
        <MonoEyebrow mb="0.75rem">Pill button</MonoEyebrow>
        <Button variant="landingPill">Start building your form</Button>
      </Box>

      <Box>
        <MonoEyebrow mb="0.75rem">
          Blade — a cut corner at --lv5-c: 72px
        </MonoEyebrow>
        {/* --lv5-c drives the clip-path and the blade's size together, so the
            two cannot disagree. Set on the ancestor both of them read. */}
        <Box pos="relative" w="18rem" h="11rem" sx={{ '--lv5-c': '72px' }}>
          <Box
            className="lv5-cut-br"
            pos="absolute"
            inset={0}
            bg="white"
            border="1px solid"
            borderColor="landing.hairline"
          />
          <Blade corner="br" />
        </Box>
      </Box>

      <Box>
        <MonoEyebrow mb="0.75rem">
          Reveals — scroll down, each block rises once
        </MonoEyebrow>
        <Stack spacing="1rem">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Reveal
              key={n}
              bg="white"
              border="1px solid"
              borderColor="landing.hairline"
              borderRadius="0.5rem"
              p="2.5rem"
            >
              <Text textStyle="landing.body">Revealed block {n}</Text>
            </Reveal>
          ))}
        </Stack>
        {/* Tail space, so the last blocks start below the fold and their
            reveal is actually observable. */}
        <Box h="60vh" />
      </Box>
    </Stack>
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
