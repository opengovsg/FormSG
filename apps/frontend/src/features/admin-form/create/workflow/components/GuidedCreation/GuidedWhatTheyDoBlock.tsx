import { useCallback, useEffect, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import InlineMessage from '~components/InlineMessage'
import Radio from '~components/Radio'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  updateCreateStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { useCreatePageSidebar } from '~features/admin-form/create/common'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../types'
import { FIELDS_TO_EDIT_NAME } from '../WorkflowContent/EditStepBlock/EditStepBlock'
import { EditStepBlockContainer } from '../WorkflowContent/EditStepBlock/EditStepBlockContainer'
import { StepType } from '../WorkflowContent/EditStepBlock/WhatTheyDoBlock'

const TOTAL_SUB_STEPS = 4
const APPROVAL_FIELD_NAME = 'approval_field'

const SUB_STEP_INFOBOXES = [
  // Sub-step 1: Just the label
  'This is where you decide what the person in this step needs to do.',
  // Sub-step 2: "Fill up fields" revealed
  'Most steps just need people to fill in their assigned fields.',
  // Sub-step 3: "Fill up fields and approve" revealed
  'Some steps need an approver to review and approve before the workflow continues. If they reject, the workflow stops.',
  // Sub-step 4: All enabled
  '', // placeholder, built dynamically with step number
]

interface GuidedWhatTheyDoBlockProps {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
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

export const GuidedWhatTheyDoBlock = ({
  stepNumber,
  formMethods,
  onComplete,
  onBack,
  isActive,
}: GuidedWhatTheyDoBlockProps): JSX.Element => {
  const { t } = useTranslation()
  // If this section has already been completed (not active), show all sub-steps
  const [subStep, setSubStep] = useState(isActive ? 1 : TOTAL_SUB_STEPS)

  const {
    control,
    setValue,
    formState: { errors },
    clearErrors,
    watch,
  } = formMethods

  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const selectedEditFields = watch(FIELDS_TO_EDIT_NAME)
  const [stepType, setStepType] = useState<StepType>(
    selectedApprovalField ? 'review' : 'collect',
  )

  const {
    yesNoFormFields = [],
    formWorkflow = [],
    isLoading,
  } = useAdminFormWorkflow()

  const { handleBuilderClick } = useCreatePageSidebar()
  const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)
  const { data: form } = useAdminForm()

  const handleCreateYesNoField = () => {
    handleBuilderClick(false)
    const fieldMeta = getFieldCreationMeta(BasicField.YesNo)
    const insertionIndex = form?.form_fields?.length ?? 0
    updateCreateState(fieldMeta, insertionIndex)
  }

  const yesNoFieldItems = yesNoFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )
  const yesNoFieldIds = yesNoFormFields.map(({ _id }) => _id)

  const approvalFieldsFromOtherSteps = formWorkflow
    .map((step, i) => {
      if (i === stepNumber) return null
      return step.approval_field
    })
    .filter(Boolean)

  const hasYesNoFields = yesNoFieldItems.length > 0
  const allRevealed = subStep >= TOTAL_SUB_STEPS
  const isDisabled = !allRevealed

  // During walkthrough, highlight the option being explained
  const SUB_STEP_TO_STEP_TYPE: Record<number, StepType | undefined> = {
    2: 'collect',
    3: 'review',
    4: undefined,
  }
  const displayedStepType = allRevealed
    ? stepType
    : SUB_STEP_TO_STEP_TYPE[subStep]

  const handleStepTypeChange = (value: StepType) => {
    setStepType(value)
    if (value === 'collect') {
      setValue(APPROVAL_FIELD_NAME, '')
      clearErrors(APPROVAL_FIELD_NAME)
    }
  }

  const getValueIfNotDeleted = useCallback(
    (value: string) => {
      if (!isLoading && value && !yesNoFieldIds.includes(value)) {
        setValue(APPROVAL_FIELD_NAME, '')
        return ''
      }
      return value
    },
    [isLoading, setValue, yesNoFieldIds],
  )

  const handleContinue = () => {
    if (subStep < TOTAL_SUB_STEPS) {
      setSubStep((s) => s + 1)
    } else {
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

  const infoboxText = allRevealed
    ? `Now choose what they do in Step ${stepNumber + 1}. You can also come back to this later.`
    : SUB_STEP_INFOBOXES[subStep - 1]

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text style={textStyles.h4}>What they do</Text>

        {subStep >= 2 && (
          <Radio.RadioGroup
            value={displayedStepType}
            onChange={(val) => {
              if (allRevealed) handleStepTypeChange(val as StepType)
            }}
          >
            {/* Sub-step 2: Fill up fields */}
            {subStep >= 2 && (
              <FadeIn key="collect">
                <Box pointerEvents={isDisabled ? 'none' : 'auto'}>
                  <Radio
                    isDisabled={isLoading || isDisabled}
                    isLabelFullWidth
                    allowDeselect={false}
                    value="collect"
                    px="0.5rem"
                    __css={{ _focusWithin: { boxShadow: 'none' } }}
                  >
                    <Text>Fill up fields</Text>
                    {displayedStepType === 'collect' && (
                      <Text
                        textStyle="body-2"
                        color="secondary.400"
                        pt="0.25rem"
                      >
                        This person fills in the fields assigned to them.
                      </Text>
                    )}
                  </Radio>
                </Box>
              </FadeIn>
            )}

            {/* Sub-step 3: Fill up fields and approve */}
            {subStep >= 3 && (
              <FadeIn key="review">
                <Box pointerEvents={isDisabled ? 'none' : 'auto'}>
                  <Radio
                    isDisabled={isLoading || isDisabled}
                    isLabelFullWidth
                    allowDeselect={false}
                    value="review"
                    px="0.5rem"
                    __css={{ _focusWithin: { boxShadow: 'none' } }}
                  >
                    <Text>Fill up fields and approve</Text>
                    {displayedStepType === 'review' && (
                      <Stack spacing="0.5rem" pt="0.25rem">
                        <Text textStyle="body-2" color="secondary.400">
                          This person fills in their fields, then approves or
                          rejects. If rejected, the workflow stops.
                        </Text>

                        {allRevealed && (
                          <FormControl
                            isInvalid={!!errors.approval_field?.message}
                          >
                            <Text style={textStyles.subhead2} mb="0.5rem">
                              Approval field
                            </Text>
                            {hasYesNoFields ? (
                              <Controller
                                name={APPROVAL_FIELD_NAME}
                                control={control}
                                rules={{
                                  validate: (value) => {
                                    if (!value) {
                                      return t(
                                        'features.adminForm.sidebar.workflow.approvals.validation.noField',
                                      )
                                    }
                                    if (
                                      value &&
                                      approvalFieldsFromOtherSteps.includes(
                                        value,
                                      )
                                    ) {
                                      return t(
                                        'features.adminForm.sidebar.workflow.approvals.validation.fieldAlreadyUsed',
                                      )
                                    }
                                    if (
                                      value &&
                                      !selectedEditFields.includes(value)
                                    ) {
                                      return t(
                                        'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUser',
                                      )
                                    }
                                  },
                                }}
                                render={({
                                  field: { value = '', ...rest },
                                }) => (
                                  <SingleSelect
                                    placeholder={t(
                                      'features.adminForm.sidebar.workflow.approvals.toggle.placeholder',
                                    )}
                                    items={yesNoFieldItems}
                                    value={getValueIfNotDeleted(value)}
                                    isClearable
                                    isDisabled={isLoading}
                                    {...rest}
                                  />
                                )}
                              />
                            ) : (
                              <Stack spacing="0.5rem">
                                <Text textStyle="body-2" color="secondary.400">
                                  You don't have a Yes/No field for approvers to
                                  use.
                                </Text>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCreateYesNoField}
                                >
                                  Create Yes/No field
                                </Button>
                              </Stack>
                            )}
                            <FormErrorMessage>
                              {errors.approval_field?.message}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Stack>
                    )}
                  </Radio>
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
