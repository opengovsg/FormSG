import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from 'formsg-shared/types'

import Button from '~components/Button'
import Toggle from '~components/Toggle'
import { UnsavedChangesModal } from '~templates/NavigationPrompt'

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { useUser } from '~features/user/queries'

import {
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { EditStepInputs } from '../../../types'
import { GuidedRespondentBlock } from '../../GuidedCreation/GuidedRespondentBlock'
import { GuidedWhatTheyDoBlock } from '../../GuidedCreation/GuidedWhatTheyDoBlock'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'
import { WhatTheyDoBlock } from './WhatTheyDoBlock'

export interface EditLogicBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: FormWorkflowStep) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

const EditSpotlight = ({
  isActive,
  isGuided,
  children,
}: {
  isActive: boolean
  isGuided: boolean
  children: React.ReactNode
}) => {
  if (!isGuided) return <>{children}</>
  return (
    <Box
      bg={isActive ? 'primary.100' : 'transparent'}
      borderRadius={isActive ? '8px' : '0'}
      border={isActive ? '2px solid' : '2px solid transparent'}
      borderColor={isActive ? 'primary.500' : 'transparent'}
      opacity={isActive ? 1 : 0.5}
      transition="opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease"
      mx={isActive ? '2rem' : '0'}
      py={isActive ? '2rem' : '0.5rem'}
    >
      {children}
    </Box>
  )
}

export const FIELDS_TO_EDIT_NAME = 'edit'

export const EditStepBlock = ({
  stepNumber,
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleOpenDeleteModal,
}: EditLogicBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const formMethods = useForm<EditStepInputs>({
    defaultValues,
  })
  const { user, isLoading: isUserLoading } = useUser()
  const _isLoading = isLoading || isUserLoading

  const handleCancel = useCallback(() => {
    if (formMethods.formState.isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      setToInactive()
    }
  }, [formMethods.formState.isDirty, setToInactive])

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        // Block required so parent (with overflow:hidden) will not be scrolled
        // and causing unscrollable white space.
        // See https://stackoverflow.com/questions/48634459/scrollintoview-block-vs-inline/48635751#48635751
        block: 'nearest',
      })
    }
  }, [])

  const handleSubmit = formMethods.handleSubmit((inputs: EditStepInputs) => {
    if (inputs.approval_field === '') {
      inputs.approval_field = undefined
    }

    if (inputs.step_name === '') {
      inputs.step_name = undefined
    }

    if (isFirstStepByStepNumber(stepNumber)) {
      if (inputs.field) {
        return onSubmit({
          ...inputs,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        })
      }
      return onSubmit({
        ...inputs,
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      })
    }

    let step: FormWorkflowStep & { _id: string }

    const workflowStepBase: FormWorkflowStepBase & { _id: string } = {
      _id: inputs._id,
      workflow_type: inputs.workflow_type,
      edit: inputs.edit,
      approval_field: inputs.approval_field,
      step_name: inputs.step_name,
    }

    switch (inputs.workflow_type) {
      case WorkflowType.Static: {
        step = {
          ...workflowStepBase,
          // Need to explicitly set workflow_type in this object to help with typechecking.
          workflow_type: WorkflowType.Static,
          emails: inputs.emails ?? [],
        }
        break
      }
      case WorkflowType.Dynamic: {
        if (!inputs.field) {
          step = {
            ...workflowStepBase,
            workflow_type: WorkflowType.Static,
            emails: [],
          }
        } else {
          step = {
            ...workflowStepBase,
            workflow_type: WorkflowType.Dynamic,
            field: inputs.field,
          }
        }
        break
      }
      case WorkflowType.Conditional: {
        if (!inputs.conditional_field) {
          step = {
            ...workflowStepBase,
            workflow_type: WorkflowType.Static,
            emails: [],
          }
        } else {
          step = {
            ...workflowStepBase,
            workflow_type: WorkflowType.Conditional,
            conditional_field: inputs.conditional_field,
          }
        }
        break
      }
      default: {
        throw new Error('Invalid workflow type')
      }
    }
    onSubmit(step)
  })

  // Auto-save when user clicks another step while editing this one
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completePendingSwitch = useAdminWorkflowStore(
    (s) => s.completePendingSwitch,
  )

  useEffect(() => {
    if (pendingSwitchTo === null) return

    if (!formMethods.formState.isDirty) {
      // No changes, just switch directly
      completePendingSwitch()
      return
    }

    // Build step from current form values, bypassing validation
    const inputs = { ...formMethods.getValues() }
    if (inputs.approval_field === '') inputs.approval_field = undefined
    if (inputs.step_name === '')
      inputs.step_name = undefined as unknown as string

    let step: FormWorkflowStep | null = null

    if (isFirstStep) {
      step = inputs.field
        ? {
            ...inputs,
            workflow_type: WorkflowType.Dynamic,
            field: inputs.field,
          }
        : {
            ...inputs,
            workflow_type: WorkflowType.Static,
            emails: inputs.emails ?? [],
          }
    } else {
      const base: FormWorkflowStepBase & { _id: string } = {
        _id: inputs._id,
        workflow_type: inputs.workflow_type,
        edit: inputs.edit,
        approval_field: inputs.approval_field,
        step_name: inputs.step_name,
      }
      switch (inputs.workflow_type) {
        case WorkflowType.Static:
          step = {
            ...base,
            workflow_type: WorkflowType.Static,
            emails: inputs.emails ?? [],
          }
          break
        case WorkflowType.Dynamic:
          if (inputs.field)
            step = {
              ...base,
              workflow_type: WorkflowType.Dynamic,
              field: inputs.field,
            }
          break
        case WorkflowType.Conditional:
          if (inputs.conditional_field)
            step = {
              ...base,
              workflow_type: WorkflowType.Conditional,
              conditional_field: inputs.conditional_field,
            }
          break
      }
    }

    if (step) {
      // Save via onSubmit (ActiveStepBlock's onSuccess will complete the switch)
      onSubmit(step)
    } else {
      // Can't build valid step, switch without saving
      completePendingSwitch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  // Per-step guidance toggle
  const [guidedEdit, setGuidedEdit] = useState(false)
  const totalSections = isFirstStep ? 3 : 4
  const [guidedSection, setGuidedSection] = useState(1)

  const handleGuidedContinue = () => {
    setGuidedSection((s) => Math.min(s + 1, totalSections))
  }

  const handleGuidedBack = () => {
    setGuidedSection((s) => Math.max(1, s - 1))
  }

  const isSectionVisible = (sectionIndex: number) => {
    if (!guidedEdit) return true
    return sectionIndex <= guidedSection
  }

  const isLastGuidedSection = guidedSection >= totalSections

  // Sprint 25 removed internal nav from GuidedRespondentBlock/GuidedWhatTheyDoBlock
  // so the footer always renders the Back/Continue buttons
  const guidedSectionHasOwnNav = false

  // Hint copy for guided edit (re-entry, concise and functional)
  const GUIDED_HINTS: Record<string, string> = {
    stepName:
      'Edit the step name to tell steps apart. This name shows up in the status tracker too.',
    respondent: isFirstStep
      ? "Anyone with your form link can fill in Step 1. In later steps, you'll choose who to send the form to."
      : 'Pick who fills in this step. You can always change this later.',
    whatTheyDo:
      'Choose what they do in this step. Most steps just need people to fill in fields.',
    questions:
      "Pick the fields they'll fill in. You can always change this later.",
  }

  const renderGuidedHint = (key: string, sectionIndex: number) => {
    if (!guidedEdit) return null
    if (sectionIndex !== guidedSection) return null
    return (
      <Text
        textStyle="body-2"
        color="secondary.400"
        px={{ base: '1.5rem', md: '2rem' }}
      >
        {GUIDED_HINTS[key]}
      </Text>
    )
  }

  return (
    <Stack
      ref={wrapperRef}
      w="100%"
      py="2rem"
      spacing="1.5rem"
      borderRadius="8px"
      bg={guidedEdit ? 'white' : 'primary.100'}
      border={guidedEdit ? '1px solid' : '2px solid'}
      borderColor={guidedEdit ? 'neutral.300' : 'primary.500'}
      transitionProperty="common"
      transitionDuration="normal"
    >
      {/* Step badge + guided toggle (always full opacity) */}
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
          opacity={guidedEdit && guidedSection > 1 ? 0.5 : 1}
          transition="opacity 0.3s ease"
        >
          {stepNumber + 1}
        </Text>
        <Flex alignItems="center" gap="0.5rem">
          <Text textStyle="caption-1" color="secondary.400">
            Guided mode
          </Text>
          <Toggle.Switch
            isChecked={guidedEdit}
            onChange={() => {
              setGuidedEdit((v) => !v)
              if (!guidedEdit) {
                setGuidedSection(1)
              }
            }}
            aria-label="Guided mode"
          />
        </Flex>
      </Flex>

      {/* Section 1: Step Name fields */}
      <EditSpotlight
        isActive={guidedEdit && guidedSection === 1}
        isGuided={guidedEdit}
      >
        <StepNameBlock
          formMethods={formMethods}
          stepNumber={stepNumber}
          hideHeader
          showGuidedHint={guidedEdit && guidedSection === 1}
        />
      </EditSpotlight>

      {/* Section 2: Respondent */}
      {isSectionVisible(2) && (
        <>
          <Divider />
          <EditSpotlight
            isActive={guidedEdit && guidedSection === 2}
            isGuided={guidedEdit}
          >
            {guidedEdit && !isFirstStep ? (
              <GuidedRespondentBlock
                stepNumber={stepNumber}
                formMethods={formMethods}
                isLoading={_isLoading}
                isActive={guidedSection === 2}
              />
            ) : (
              <>
                <RespondentBlock
                  user={user}
                  stepNumber={stepNumber}
                  formMethods={formMethods}
                  isLoading={_isLoading}
                />
                {renderGuidedHint('respondent', 2)}
              </>
            )}
          </EditSpotlight>
        </>
      )}

      {/* Section 3 (Step 2+): WhatTheyDo */}
      {!isFirstStep && isSectionVisible(3) && (
        <>
          <Divider />
          <EditSpotlight
            isActive={guidedEdit && guidedSection === 3}
            isGuided={guidedEdit}
          >
            {guidedEdit ? (
              <GuidedWhatTheyDoBlock
                stepNumber={stepNumber}
                formMethods={formMethods}
                isActive={guidedSection === 3}
              />
            ) : (
              <WhatTheyDoBlock
                formMethods={formMethods}
                stepNumber={stepNumber}
              />
            )}
          </EditSpotlight>
        </>
      )}

      {/* Questions (Section 3 for Step 1, Section 4 for Step 2+) */}
      {isSectionVisible(isFirstStep ? 3 : 4) && (
        <>
          <Divider />
          <EditSpotlight
            isActive={guidedEdit && guidedSection === (isFirstStep ? 3 : 4)}
            isGuided={guidedEdit}
          >
            <QuestionsBlock
              formMethods={formMethods}
              isLoading={_isLoading}
              isFirstStep={isFirstStep}
              showGuidedHint={
                guidedEdit && guidedSection === (isFirstStep ? 3 : 4)
              }
            />
          </EditSpotlight>
        </>
      )}

      {/* Footer */}
      {guidedEdit && guidedSectionHasOwnNav ? null : (
        <>
          <Divider />
          {guidedEdit ? (
            <Flex
              px={{ base: '1.5rem', md: '2rem' }}
              justifyContent="flex-end"
              gap="0.75rem"
            >
              {guidedSection > 1 && (
                <Button variant="clear" onClick={handleGuidedBack}>
                  Back
                </Button>
              )}
              {isLastGuidedSection ? (
                <Button isLoading={_isLoading} onClick={handleSubmit}>
                  {submitButtonLabel}
                </Button>
              ) : (
                <Button onClick={handleGuidedContinue}>Continue</Button>
              )}
            </Flex>
          ) : (
            <SaveActionGroup
              isLoading={_isLoading}
              handleSubmit={handleSubmit}
              handleDelete={isFirstStep ? undefined : handleOpenDeleteModal}
              handleCancel={handleCancel}
              submitButtonLabel={submitButtonLabel}
              ariaLabelName="step"
            />
          )}
        </>
      )}
      <UnsavedChangesModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={setToInactive}
        onCancel={() => setIsDiscardModalOpen(false)}
      />
    </Stack>
  )
}
