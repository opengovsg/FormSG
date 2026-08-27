import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from 'formsg-shared/types'

import Button from '~components/Button'
import Toggle from '~components/Toggle'

import { useUser } from '~features/user/queries'

import {
  currentSectionSelector,
  useGuidedWorkflowStore,
} from '../../guidedWorkflowStore'
import { useWorkflowMutations } from '../../mutations'
import { EditStepInputs } from '../../types'
import { FadeInUp } from '../FadeInUp'
import { Spotlight } from '../Spotlight'
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
// currentSection is 1-indexed.

const FIRST_STEP_TOTAL_SECTIONS = 3
const LATER_STEP_TOTAL_SECTIONS = 4

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
            if (!values.field) {
              // No field selected yet, save as static so the backend accepts it
              step = {
                ...workflowStepBase,
                workflow_type: WorkflowType.Static,
                emails: [],
              }
            } else {
              step = {
                ...workflowStepBase,
                workflow_type: WorkflowType.Dynamic,
                field: values.field,
              }
            }
            break
          }
          case WorkflowType.Conditional: {
            if (!values.conditional_field) {
              step = {
                ...workflowStepBase,
                workflow_type: WorkflowType.Static,
                emails: [],
              }
            } else {
              step = {
                ...workflowStepBase,
                workflow_type: WorkflowType.Conditional,
                conditional_field: values.conditional_field,
              }
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
          <Text
            textStyle="body-2"
            color="secondary.400"
            pb="1rem"
            px={{ base: '1.5rem', md: '2rem' }}
          >
            Now try it yourself! Use the guide toggle in the top right if you
            need help.
          </Text>
        )}
        <Spotlight
          isActive={currentSection === 1}
          isEnabled={!showSkipGuidedHint}
        >
          <StepNameBlock
            formMethods={formMethods}
            stepNumber={stepNumber}
            showGuidedHint={currentSection === 1 && !showSkipGuidedHint}
            guidedHintText={
              isFirstStep
                ? undefined
                : `Name this step, or keep it as 'Step ${stepNumber + 1}'.`
            }
            hideHeader
          />
        </Spotlight>
        {renderContinueButton(1)}
      </Box>,
    )
  }

  if (isFirstStep) {
    // Section 2: RespondentBlock
    if (currentSection >= 2) {
      sections.push(<Divider key="divider-1" />)
      sections.push(
        <FadeInUp key="respondent">
          <Spotlight
            isActive={currentSection === 2}
            isEnabled={!showSkipGuidedHint}
          >
            <RespondentBlock
              user={user}
              stepNumber={stepNumber}
              formMethods={formMethods}
              isLoading={isUserLoading}
              showGuidedHint={currentSection === 2}
            />
          </Spotlight>
          {renderContinueButton(2)}
        </FadeInUp>,
      )
    }

    // Section 3: QuestionsBlock
    if (currentSection >= 3) {
      sections.push(<Divider key="divider-2" />)
      sections.push(
        <FadeInUp key="questions">
          <Spotlight
            isActive={currentSection === 3}
            isEnabled={!showSkipGuidedHint}
          >
            <QuestionsBlock
              formMethods={formMethods}
              isLoading={isUserLoading}
              isFirstStep={isFirstStep}
              showGuidedHint
            />
          </Spotlight>
          {renderContinueButton(3)}
        </FadeInUp>,
      )
    }
  } else {
    // Step 2+: StepName -> Respondent -> WhatTheyDo -> Questions

    // Section 2: GuidedRespondentBlock (all options shown at once)
    if (currentSection >= 2) {
      sections.push(<Divider key="divider-1" />)
      sections.push(
        <FadeInUp key="respondent">
          <Spotlight
            isActive={currentSection === 2}
            isEnabled={!showSkipGuidedHint}
          >
            <GuidedRespondentBlock
              stepNumber={stepNumber}
              formMethods={formMethods}
              isLoading={isUserLoading}
              isActive={currentSection === 2}
            />
          </Spotlight>
          {renderContinueButton(2)}
        </FadeInUp>,
      )
    }

    // Section 3: GuidedWhatTheyDoBlock (all options shown at once)
    if (currentSection >= 3) {
      sections.push(<Divider key="divider-2" />)
      sections.push(
        <FadeInUp key="what-they-do">
          <Spotlight
            isActive={currentSection === 3}
            isEnabled={!showSkipGuidedHint}
          >
            <GuidedWhatTheyDoBlock
              stepNumber={stepNumber}
              formMethods={formMethods}
              isActive={currentSection === 3}
            />
          </Spotlight>
          {renderContinueButton(3)}
        </FadeInUp>,
      )
    }

    // Section 4: QuestionsBlock
    if (currentSection >= 4) {
      sections.push(<Divider key="divider-3" />)
      sections.push(
        <FadeInUp key="questions">
          <Spotlight
            isActive={currentSection === 4}
            isEnabled={!showSkipGuidedHint}
          >
            <QuestionsBlock
              formMethods={formMethods}
              isLoading={isUserLoading}
              isFirstStep={isFirstStep}
              showGuidedHint={!showSkipGuidedHint}
            />
          </Spotlight>
          {renderContinueButton(4)}
        </FadeInUp>,
      )
    }
  }

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1rem"
      borderRadius="8px"
      bg={showSkipGuidedHint ? 'primary.100' : 'white'}
      border={showSkipGuidedHint ? '2px solid' : '1px solid'}
      borderColor={showSkipGuidedHint ? 'primary.500' : 'neutral.300'}
      transition="background-color 0.3s ease, border-color 0.3s ease"
    >
      {/* Step badge + guided toggle (outside spotlight) */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        px={{ base: '1.5rem', md: '2rem' }}
      >
        <Text
          display="inline-block"
          py="0.5rem"
          px="1rem"
          borderWidth="1px"
          borderColor="secondary.300"
          borderRadius="8px"
          bg="white"
          textStyle="subhead-1"
          opacity={currentSection > 1 && !showSkipGuidedHint ? 0.5 : 1}
          transition="opacity 0.3s ease"
        >
          {stepNumber + 1}
        </Text>
        {isLaterStep && (
          <Flex alignItems="center" gap="0.5rem">
            <Text textStyle="caption-1" color="secondary.400">
              Guided mode
            </Text>
            <Toggle.Switch
              isChecked={guidedEdit}
              onChange={handleToggleGuide}
              aria-label="Guided mode"
            />
          </Flex>
        )}
      </Flex>
      {sections}
    </Stack>
  )
}
