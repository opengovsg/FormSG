import { Box, Stack } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import { CompletionPeekMomentType } from './utils/completionPeekContent'
import {
  CompletionPeekCard,
  CompletionPeekCardProps,
} from './CompletionPeekCard'

const redesignOn = new GrowthBook({
  features: { [featureFlags.workflowBuilderRedesign]: { defaultValue: true } },
})

/**
 * Stand-in for the card the peek card reports on. The tucked treatment only
 * reads correctly beneath a card of matching width, so the tucked stories show
 * one rather than floating the peek card alone.
 */
const CardAbove = (): JSX.Element => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="neutral.300"
    borderRadius="4px"
    p="2rem"
  >
    The card that was just finished
  </Box>
)

export default {
  title:
    'Features/AdminForm/create/workflow/components/GuidedCreation/CompletionPeekCard',
  component: CompletionPeekCard,
  decorators: [
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={redesignOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
} as Meta<CompletionPeekCardProps>

const TuckedTemplate: StoryFn<CompletionPeekCardProps> = (args) => (
  <Stack spacing="0" maxW="42rem">
    <CardAbove />
    <CompletionPeekCard {...args} />
  </Stack>
)

const FreeStandingTemplate: StoryFn<CompletionPeekCardProps> = (args) => (
  <Box maxW="42rem">
    <CompletionPeekCard {...args} />
  </Box>
)

export const StepOneDone = TuckedTemplate.bind({})
StepOneDone.storyName = 'Step 1 done'
StepOneDone.args = {
  type: CompletionPeekMomentType.StepOneDone,
  onDeclineAnotherStep: () => undefined,
  onAddAnotherStep: () => undefined,
}
StepOneDone.parameters = {
  docs: {
    description: {
      story:
        'Step 1 gets its own wording because it is the only step whose respondents the admin does not choose.',
    },
  },
}

export const LaterStepDone = TuckedTemplate.bind({})
LaterStepDone.storyName = 'Step 2+ done'
LaterStepDone.args = {
  type: CompletionPeekMomentType.LaterStepDone,
  stepNumber: 1,
  onDeclineAnotherStep: () => undefined,
  onAddAnotherStep: () => undefined,
}
LaterStepDone.parameters = {
  docs: {
    description: {
      story:
        'stepNumber is zero-based, as everywhere else in the workflow, so index 1 reads "Step 2".',
    },
  },
}

export const EmailSetUp = FreeStandingTemplate.bind({})
EmailSetUp.storyName = 'Email set up'
EmailSetUp.args = {
  type: CompletionPeekMomentType.EmailSetUp,
  onContinue: () => undefined,
}
EmailSetUp.parameters = {
  docs: {
    description: {
      story:
        'The one free-standing moment. It follows the end-of-workflow block rather than a card, so it takes a full radius and no negative margin.',
    },
  },
}

export const StatusTracking = TuckedTemplate.bind({})
StatusTracking.storyName = 'Status tracking'
StatusTracking.args = {
  type: CompletionPeekMomentType.StatusTracking,
  onFinish: () => undefined,
}
StatusTracking.parameters = {
  docs: {
    description: {
      story:
        'The one moment that does not report a completion. The title gives the admin the completion they earned and the subtitle offers the setting as optional.',
    },
  },
}

export const GuidedSetupFinished = TuckedTemplate.bind({})
GuidedSetupFinished.storyName = 'Guided setup finished'
GuidedSetupFinished.args = {
  type: CompletionPeekMomentType.GuidedSetupFinished,
  onFinish: () => undefined,
}
