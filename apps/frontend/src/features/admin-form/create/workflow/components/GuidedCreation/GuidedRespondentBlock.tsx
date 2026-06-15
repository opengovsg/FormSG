import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { UserDto, WorkflowType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
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

const TOTAL_SUB_STEPS = 5

const SUB_STEP_INFOBOXES = [
  // Sub-step 1: Just the label
  'This is where you choose how the form reaches the next person.',
  // Sub-step 2: Static option revealed
  'Best when you already know who should fill this up. You type in their email addresses directly.',
  // Sub-step 3: Dynamic option revealed
  "Best when the previous respondent decides who's next. They'll enter the email of whoever should fill up the next step.",
  // Sub-step 4: Conditional option revealed
  'Best for routing to different people based on an answer. You map each dropdown option to a different email.',
  // Sub-step 5: All enabled
  '', // placeholder, built dynamically with step number
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

const FadeIn = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Box
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(8px)'}
      transition="opacity 0.3s ease, transform 0.3s ease"
    >
      {children}
    </Box>
  )
}

export const GuidedRespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
  onComplete,
  onBack,
  isActive,
}: GuidedRespondentBlockProps): JSX.Element => {
  // If this section has already been completed (not active), show all sub-steps
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
  const isDisabled = !allRevealed

  // Map each sub-step to the workflow type being showcased
  const SUB_STEP_TO_WORKFLOW_TYPE: Record<number, WorkflowType | undefined> = {
    2: WorkflowType.Static,
    3: WorkflowType.Dynamic,
    4: WorkflowType.Conditional,
  }

  // During walkthrough, highlight the currently-shown option as selected
  const displayedWorkflowType = allRevealed
    ? selectedWorkflowType
    : SUB_STEP_TO_WORKFLOW_TYPE[subStep]

  const handleContinue = () => {
    if (subStep < TOTAL_SUB_STEPS) {
      setSubStep((s) => s + 1)
    } else {
      // Ensure workflow_type is explicitly set so validation passes
      formMethods.setValue(
        'workflow_type',
        formMethods.getValues('workflow_type') || WorkflowType.Static,
      )
      onComplete()
    }
  }

  const handleBack = () => {
    if (subStep > 1) {
      setSubStep((s) => s - 1)
    } else {
      onBack()
    }
  }

  const infoboxText =
    subStep === TOTAL_SUB_STEPS
      ? `Now pick who will fill up Step ${stepNumber + 1}. You can also come back to this later.`
      : SUB_STEP_INFOBOXES[subStep - 1]

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text style={textStyles.h4}>People who are filling up this step</Text>

        {subStep >= 2 && (
          <Radio.RadioGroup value={displayedWorkflowType}>
            {/* Sub-step 2: Static option */}
            {subStep >= 2 && (
              <FadeIn key="static">
                <Box pointerEvents={isDisabled ? 'none' : 'auto'}>
                  <StaticRespondentOption
                    selectedWorkflowType={displayedWorkflowType}
                    formMethods={formMethods}
                    isLoading={isLoading || isDisabled}
                  />
                </Box>
              </FadeIn>
            )}

            {/* Sub-step 3: Dynamic option */}
            {subStep >= 3 && (
              <FadeIn key="dynamic">
                <Box pointerEvents={isDisabled ? 'none' : 'auto'}>
                  <DynamicRespondentOption
                    selectedWorkflowType={displayedWorkflowType}
                    emailFieldItems={emailFieldItems}
                    formMethods={formMethods}
                    isLoading={isLoading || isDisabled}
                  />
                </Box>
              </FadeIn>
            )}

            {/* Sub-step 4: Conditional option */}
            {subStep >= 4 && (
              <FadeIn key="conditional">
                <Box pointerEvents={isDisabled ? 'none' : 'auto'}>
                  <ConditionalRoutingOption
                    selectedWorkflowType={displayedWorkflowType}
                    conditionalFormFields={dropdownFormFields}
                    formMethods={formMethods}
                    isLoading={isLoading || isDisabled}
                  />
                </Box>
              </FadeIn>
            )}
          </Radio.RadioGroup>
        )}

        {isActive && (
          <InlineMessage variant="info">{infoboxText}</InlineMessage>
        )}
      </Stack>

      {isActive && (
        <Box pt="1rem">
          <Flex justifyContent="flex-end" gap="0.75rem">
            <Button variant="clear" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleContinue}>Continue</Button>
          </Flex>
        </Box>
      )}
    </EditStepBlockContainer>
  )
}
