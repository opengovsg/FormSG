import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { UserDto, WorkflowType } from 'formsg-shared/types'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import Radio from '~components/Radio'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { EditStepBlockContainer } from '../WorkflowContent/EditStepBlock/EditStepBlockContainer'
import { ConditionalRoutingOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/ConditionalRoutingOption'
import { DynamicRespondentOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/DynamicRespondentOption'
import { StaticRespondentOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/StaticRespondentOption'

const TOTAL_SUB_STEPS = 4

const WALKTHROUGH_MESSAGES = [
  'Best when you already know who should fill this in. You choose specific email addresses.',
  "Best when the previous step's respondent decides who's next. They fill in an email field that routes the form.",
  'Best for routing to different people based on an answer. You map each dropdown option to an email address.',
]

interface GuidedRespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  user: UserDto | undefined
  onComplete: () => void
  onBack: () => void
  isActive: boolean
}

export const GuidedRespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
  onComplete,
  onBack,
  isActive,
}: GuidedRespondentBlockProps): JSX.Element => {
  const [subStep, setSubStep] = useState(isActive ? 1 : TOTAL_SUB_STEPS)

  const { emailFormFields = [], dropdownFormFields = [] } =
    useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const selectedWorkflowType = formMethods.watch('workflow_type')
  const allRevealed = subStep >= TOTAL_SUB_STEPS
  const isWalkthroughDisabled = !allRevealed

  // During walkthrough, nothing is selected. After, use actual selection.
  const radioGroupValue = allRevealed ? selectedWorkflowType : undefined

  const handleNext = () => {
    if (subStep < TOTAL_SUB_STEPS - 1) {
      setSubStep((s) => s + 1)
    } else if (subStep === TOTAL_SUB_STEPS - 1) {
      formMethods.setValue('workflow_type', WorkflowType.Static)
      setSubStep(TOTAL_SUB_STEPS)
    }
  }

  const handleBack = () => {
    if (subStep > 1) {
      setSubStep((s) => s - 1)
    } else {
      onBack()
    }
  }

  const handleComplete = () => {
    formMethods.setValue(
      'workflow_type',
      formMethods.getValues('workflow_type') || WorkflowType.Static,
    )
    onComplete()
  }

  const infoboxText = allRevealed
    ? `Now pick who fills in Step ${stepNumber + 1}. You can also come back to this later.`
    : WALKTHROUGH_MESSAGES[subStep - 1]

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2">Who fills in this step</Text>

        <Radio.RadioGroup value={radioGroupValue}>
          <StaticRespondentOption
            selectedWorkflowType={radioGroupValue ?? WorkflowType.Static}
            formMethods={formMethods}
            isLoading={isLoading}
            isWalkthroughDisabled={isWalkthroughDisabled}
          />
          {isActive && subStep === 1 && (
            <Box px="0.5rem">
              <InlineMessage variant="info">
                {WALKTHROUGH_MESSAGES[0]}
              </InlineMessage>
            </Box>
          )}

          <DynamicRespondentOption
            selectedWorkflowType={radioGroupValue ?? WorkflowType.Static}
            emailFieldItems={emailFieldItems}
            formMethods={formMethods}
            isLoading={isLoading}
            isWalkthroughDisabled={isWalkthroughDisabled}
          />
          {isActive && subStep === 2 && (
            <Box px="0.5rem">
              <InlineMessage variant="info">
                {WALKTHROUGH_MESSAGES[1]}
              </InlineMessage>
            </Box>
          )}

          <ConditionalRoutingOption
            selectedWorkflowType={radioGroupValue ?? WorkflowType.Static}
            conditionalFormFields={dropdownFormFields}
            formMethods={formMethods}
            isLoading={isLoading}
            isWalkthroughDisabled={isWalkthroughDisabled}
          />
          {isActive && subStep === 3 && (
            <Box px="0.5rem">
              <InlineMessage variant="info">
                {WALKTHROUGH_MESSAGES[2]}
              </InlineMessage>
            </Box>
          )}
        </Radio.RadioGroup>

        {isActive && allRevealed && (
          <InlineMessage variant="info">{infoboxText}</InlineMessage>
        )}
      </Stack>

      {isActive && (
        <Box pt="1rem">
          <Flex justifyContent="flex-end" gap="0.75rem">
            <Button variant="clear" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={allRevealed ? handleComplete : handleNext}>
              {allRevealed ? 'Continue' : 'Next'}
            </Button>
          </Flex>
        </Box>
      )}
    </EditStepBlockContainer>
  )
}
