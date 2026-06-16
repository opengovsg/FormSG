import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Divider, Flex, Stack } from '@chakra-ui/react'

import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from 'formsg-shared/types'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useUser } from '~features/user/queries'

import {
  currentSectionSelector,
  useGuidedWorkflowStore,
} from '../../guidedWorkflowStore'
import { useWorkflowMutations } from '../../mutations'
import { EditStepInputs } from '../../types'
import { QuestionsBlock } from '../WorkflowContent/EditStepBlock/QuestionsBlock'
import { RespondentBlock } from '../WorkflowContent/EditStepBlock/RespondentBlock'
import { StepNameBlock } from '../WorkflowContent/EditStepBlock/StepNameBlock'

import { GuidedRespondentBlock } from './GuidedRespondentBlock'
import { GuidedWhatTheyDoBlock } from './GuidedWhatTheyDoBlock'

interface GuidedStepProps {
  stepIndex: number
  isFirstStep: boolean
}

// Sections for step 1: StepName, Respondent, Questions
// Sections for step 2+: StepName, Respondent, WhatTheyDo, Questions
// currentSection is 1-indexed. Each guided block (Respondent, WhatTheyDo) manages its own sub-steps internally.
// For step 1: section 1 = StepName, section 2 = Respondent, section 3 = Questions
// For step 2+: section 1 = StepName, section 2 = Respondent, section 3 = WhatTheyDo, section 4 = Questions

const FIRST_STEP_TOTAL_SECTIONS = 3
const LATER_STEP_TOTAL_SECTIONS = 4

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

export const GuidedStep = ({
  stepIndex,
  isFirstStep,
}: GuidedStepProps): JSX.Element => {
  const currentSection = useGuidedWorkflowStore(currentSectionSelector)
  const revealNextSection = useGuidedWorkflowStore((s) => s.revealNextSection)
  const goBackSection = useGuidedWorkflowStore((s) => s.goBackSection)
  const setCurrentSection = useGuidedWorkflowStore((s) => s.setCurrentSection)
  const cancelCurrentStep = useGuidedWorkflowStore((s) => s.cancelCurrentStep)
  const completeCurrentStep = useGuidedWorkflowStore(
    (s) => s.completeCurrentStep,
  )

  const { user, isLoading: isUserLoading } = useUser()
  const { createStepMutation } = useWorkflowMutations()

  const formMethods = useForm<EditStepInputs>({
    defaultValues: {
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: '',
    },
  })

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

  useEffect(() => {
    if (currentSection > 1 && wrapperRef.current) {
      setTimeout(() => {
        wrapperRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }, 100)
    }
  }, [currentSection])

  const totalSections = isFirstStep
    ? FIRST_STEP_TOTAL_SECTIONS
    : LATER_STEP_TOTAL_SECTIONS

  const isLastSection = currentSection >= totalSections
  const isLaterStep = stepIndex >= 2

  // Per-step guided toggle for step 3+
  const [guidedEdit, setGuidedEdit] = useState(false)
  // Show the "you know what to do" hint only when step 3+ has all sections
  // revealed AND guided mode is off
  const showSkipGuidedHint = isLaterStep && isLastSection && !guidedEdit

  const handleToggleGuide = () => {
    if (guidedEdit) {
      // Turn off: reveal all sections
      setCurrentSection(totalSections)
      setGuidedEdit(false)
    } else {
      // Turn on: reset to section 1
      setCurrentSection(1)
      setGuidedEdit(true)
    }
  }

  // stepIndex is 0-indexed, matching the existing stepNumber convention
  // (isFirstStepByStepNumber checks stepNumber === 0)
  const stepNumber = stepIndex

  const handleDone = formMethods.handleSubmit(
    (values: EditStepInputs) => {
      console.log('[GuidedStep] Form submitted with values:', values)
      if (values.step_name === '') {
        values.step_name = undefined as unknown as string
      }
      if (values.approval_field === '') {
        values.approval_field = undefined
      }

      let step: FormWorkflowStep

      if (isFirstStep) {
        step = {
          workflow_type: WorkflowType.Static,
          emails: values.emails ?? [],
          edit: values.edit || [],
          step_name: values.step_name || undefined,
        }
      } else {
        const workflowStepBase: FormWorkflowStepBase = {
          workflow_type: values.workflow_type,
          edit: values.edit,
          approval_field: values.approval_field,
          step_name: values.step_name,
        }

        switch (values.workflow_type) {
          case WorkflowType.Static: {
            step = {
              ...workflowStepBase,
              workflow_type: WorkflowType.Static,
              emails: values.emails ?? [],
            }
            break
          }
          case WorkflowType.Dynamic: {
            if (!values.field) return
            step = {
              ...workflowStepBase,
              workflow_type: WorkflowType.Dynamic,
              field: values.field,
            }
            break
          }
          case WorkflowType.Conditional: {
            if (!values.conditional_field) return
            step = {
              ...workflowStepBase,
              workflow_type: WorkflowType.Conditional,
              conditional_field: values.conditional_field,
            }
            break
          }
          default: {
            throw new Error('Invalid workflow type')
          }
        }
      }

      createStepMutation.mutate(step, {
        onSuccess: () => {
          completeCurrentStep()
        },
      })
    },
    (errors) => {
      console.error('[GuidedStep] Form validation errors:', errors)
    },
  )

  const renderContinueButton = (sectionIndex: number) => {
    // Only show button on the active (most recently revealed) section
    if (sectionIndex !== currentSection) return null

    if (isLastSection) {
      return (
        <Box px={{ base: '1.5rem', md: '2rem' }} pt="1rem">
          <Flex justifyContent="flex-end" gap="0.75rem">
            {showSkipGuidedHint ? (
              <Button variant="clear" onClick={cancelCurrentStep}>
                Cancel
              </Button>
            ) : sectionIndex > 1 ? (
              <Button variant="clear" onClick={goBackSection}>
                Back
              </Button>
            ) : null}
            <Button
              isLoading={createStepMutation.isLoading}
              onClick={handleDone}
            >
              Done
            </Button>
          </Flex>
        </Box>
      )
    }

    return (
      <Box px={{ base: '1.5rem', md: '2rem' }} pt="1rem">
        <Flex justifyContent="flex-end" gap="0.75rem">
          {sectionIndex === 1 && !isFirstStep && (
            <Button variant="clear" onClick={cancelCurrentStep}>
              Cancel
            </Button>
          )}
          {sectionIndex > 1 && (
            <Button variant="clear" onClick={goBackSection}>
              Back
            </Button>
          )}
          <Button onClick={revealNextSection}>Continue</Button>
        </Flex>
      </Box>
    )
  }

  // Build the sections list based on step type
  const sections: JSX.Element[] = []

  // Section 1: StepNameBlock (always visible)
  if (currentSection >= 1) {
    sections.push(
      <Box key="step-name">
        {showSkipGuidedHint && (
          <Box px={{ base: '1.5rem', md: '2rem' }} pb="0.5rem">
            <InlineMessage variant="info">
              You already know what to do. Need help later? Use the guide toggle
              in the top right when editing any step.
            </InlineMessage>
          </Box>
        )}
        <StepNameBlock
          formMethods={formMethods}
          stepNumber={stepNumber}
          showGuidedHint={currentSection === 1 && !showSkipGuidedHint}
          guidedHintText={
            isFirstStep
              ? undefined
              : 'Rename the step if you feel like it. You know what to do.'
          }
          {...(isLaterStep
            ? {
                guidedEdit,
                onToggleGuide: handleToggleGuide,
              }
            : {})}
        />
        {renderContinueButton(1)}
      </Box>,
    )
  }

  if (isFirstStep) {
    // Section 2: RespondentBlock
    if (currentSection >= 2) {
      sections.push(<Divider key="divider-1" />)
      sections.push(
        <FadeIn key="respondent">
          <RespondentBlock
            user={user}
            stepNumber={stepNumber}
            formMethods={formMethods}
            isLoading={isUserLoading}
            showGuidedHint={currentSection === 2}
          />
          {renderContinueButton(2)}
        </FadeIn>,
      )
    }

    // Section 3: QuestionsBlock
    if (currentSection >= 3) {
      sections.push(<Divider key="divider-2" />)
      sections.push(
        <FadeIn key="questions">
          <QuestionsBlock
            formMethods={formMethods}
            isLoading={isUserLoading}
            isFirstStep={isFirstStep}
            showGuidedHint
          />
          {renderContinueButton(3)}
        </FadeIn>,
      )
    }
  } else {
    // Step 2+: StepName -> Respondent (guided sub-steps) -> Approvals -> Questions

    // Section 2: GuidedRespondentBlock (handles its own sub-step reveal + buttons)
    if (currentSection >= 2) {
      sections.push(<Divider key="divider-1" />)
      sections.push(
        <FadeIn key="respondent">
          <GuidedRespondentBlock
            user={user}
            stepNumber={stepNumber}
            formMethods={formMethods}
            isLoading={isUserLoading}
            onComplete={revealNextSection}
            onBack={goBackSection}
            isActive={currentSection === 2}
          />
        </FadeIn>,
      )
    }

    // Section 3: GuidedWhatTheyDoBlock (handles its own sub-step reveal + buttons)
    if (currentSection >= 3) {
      sections.push(<Divider key="divider-2" />)
      sections.push(
        <FadeIn key="what-they-do">
          <GuidedWhatTheyDoBlock
            stepNumber={stepNumber}
            formMethods={formMethods}
            onComplete={revealNextSection}
            onBack={goBackSection}
            isActive={currentSection === 3}
          />
        </FadeIn>,
      )
    }

    // Section 4: QuestionsBlock
    if (currentSection >= 4) {
      sections.push(<Divider key="divider-3" />)
      sections.push(
        <FadeIn key="questions">
          <QuestionsBlock
            formMethods={formMethods}
            isLoading={isUserLoading}
            isFirstStep={isFirstStep}
            showGuidedHint={!showSkipGuidedHint}
          />
          {renderContinueButton(4)}
        </FadeIn>,
      )
    }
  }

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1rem"
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      {sections}
    </Stack>
  )
}
