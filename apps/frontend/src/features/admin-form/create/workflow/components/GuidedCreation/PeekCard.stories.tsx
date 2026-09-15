import { Box, Stack } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { PeekCard, PeekCardProps } from './PeekCard'

export default {
  title:
    'Features/AdminForm/create/workflow/components/GuidedCreation/PeekCard',
  component: PeekCard,
} as Meta<PeekCardProps>

/**
 * The tucked variant only reads correctly beneath a card of matching width, so
 * the stories that use it supply a stand-in for the card above rather than
 * floating the peek card on its own.
 */
const CardAbove = (): JSX.Element => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="neutral.300"
    borderRadius="4px"
    p="2rem"
  >
    Stand-in for the card that was just finished
  </Box>
)

const TuckedTemplate: StoryFn<PeekCardProps> = (args) => (
  <Stack spacing="0" maxW="42rem">
    <CardAbove />
    <PeekCard {...args} />
  </Stack>
)

const FreeStandingTemplate: StoryFn<PeekCardProps> = (args) => (
  <Box maxW="42rem">
    <PeekCard {...args} />
  </Box>
)

export const TwoActions = TuckedTemplate.bind({})
TwoActions.storyName = 'Tucked, two actions'
TwoActions.args = {
  title: 'Nice, Step 2 is all set',
  subtitle: 'Would you like to add another step?',
  actions: [
    { label: "No, I'm done", onClick: () => undefined },
    { label: 'Yes, add a step', onClick: () => undefined },
  ],
}
TwoActions.parameters = {
  docs: {
    description: {
      story:
        'The case that shapes the API. The secondary is a clear variant and the primary is solid, with the primary last.',
    },
  },
}

export const OneAction = TuckedTemplate.bind({})
OneAction.storyName = 'Tucked, one action'
OneAction.args = {
  title: 'Your workflow is ready',
  subtitle:
    'Before you finish, you can let people check the status of their response.',
  actions: [{ label: 'Done', onClick: () => undefined }],
}

export const FreeStanding = FreeStandingTemplate.bind({})
FreeStanding.storyName = 'Free-standing'
FreeStanding.args = {
  title: "You've set up the completion email.",
  subtitle: 'Next, set up an extra workflow setting.',
  actions: [{ label: 'Continue', onClick: () => undefined }],
  isTucked: false,
}
FreeStanding.parameters = {
  docs: {
    description: {
      story:
        'Full radius and no negative margin, for a card that follows a block rather than sitting under another card.',
    },
  },
}

export const NoSubtitle = TuckedTemplate.bind({})
NoSubtitle.storyName = 'Tucked, no subtitle'
NoSubtitle.args = {
  title: "You've finished guided setup",
  actions: [{ label: 'Done', onClick: () => undefined }],
}
NoSubtitle.parameters = {
  docs: {
    description: {
      story:
        'The subtitle is optional, so the title and actions close up without leaving a gap where it would have been.',
    },
  },
}
