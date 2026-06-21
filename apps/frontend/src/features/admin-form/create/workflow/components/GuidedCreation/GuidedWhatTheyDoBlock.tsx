import { useCallback, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types'

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

const TOTAL_SUB_STEPS = 3
const APPROVAL_FIELD_NAME = 'approval_field'

const WALKTHROUGH_MESSAGES = [
  'Most steps just need people to fill in their assigned fields.',
  'Choose this when someone needs to approve before the form moves to the next step.',
]

interface GuidedWhatTheyDoBlockProps {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
  onComplete: () => void
  onBack: () => void
  isActive: boolean
}

export const GuidedWhatTheyDoBlock = ({
  stepNumber,
  formMethods,
  onComplete,
  onBack,
  isActive,
}: GuidedWhatTheyDoBlockProps): JSX.Element => {
  const { t } = useTranslation()
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
  const isWalkthroughDisabled = !allRevealed

  // During walkthrough, nothing selected. After, use actual selection.
  const radioGroupValue = allRevealed ? stepType : undefined

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

  const handleNext = () => {
    if (subStep < TOTAL_SUB_STEPS - 1) {
      setSubStep((s) => s + 1)
    } else if (subStep === TOTAL_SUB_STEPS - 1) {
      setStepType('collect')
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
    onComplete()
  }

  const infoboxText = allRevealed
    ? `Now choose what they do in Step ${stepNumber + 1}. You can also come back to this later.`
    : WALKTHROUGH_MESSAGES[subStep - 1]

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2">What they do</Text>

        <Radio.RadioGroup
          value={radioGroupValue}
          onChange={(val) => {
            if (allRevealed) handleStepTypeChange(val as StepType)
          }}
        >
          {/* Option 1: Fill in fields only */}
          <Box
            opacity={isWalkthroughDisabled ? 0.6 : 1}
            pointerEvents={isWalkthroughDisabled ? 'none' : 'auto'}
            transition="opacity 0.2s ease"
          >
            <Radio
              isDisabled={isLoading || isWalkthroughDisabled}
              isLabelFullWidth
              allowDeselect={false}
              value="collect"
              px="0.5rem"
              __css={{ _focusWithin: { boxShadow: 'none' } }}
            >
              <Text>Fill in fields only</Text>
              {allRevealed && stepType === 'collect' && (
                <Text textStyle="body-2" color="secondary.400" pt="0.25rem">
                  This person fills in the fields assigned to them.
                </Text>
              )}
            </Radio>
          </Box>
          {isActive && subStep === 1 && (
            <Box px="0.5rem">
              <InlineMessage variant="info">
                {WALKTHROUGH_MESSAGES[0]}
              </InlineMessage>
            </Box>
          )}

          {/* Option 2: Fill in fields and approve */}
          <Box
            opacity={isWalkthroughDisabled ? 0.6 : 1}
            pointerEvents={isWalkthroughDisabled ? 'none' : 'auto'}
            transition="opacity 0.2s ease"
          >
            <Radio
              isDisabled={isLoading || isWalkthroughDisabled}
              isLabelFullWidth
              allowDeselect={false}
              value="review"
              px="0.5rem"
              __css={{ _focusWithin: { boxShadow: 'none' } }}
            >
              <Text>Fill in fields and approve</Text>
              {allRevealed && stepType === 'review' && (
                <Stack spacing="0.5rem" pt="0.25rem">
                  <Text textStyle="body-2" color="secondary.400">
                    This person fills in their fields, then approves or rejects.
                    If rejected, the workflow stops.
                  </Text>

                  <FormControl isInvalid={!!errors.approval_field?.message}>
                    <Text textStyle="subhead-2" mb="0.5rem">
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
                              approvalFieldsFromOtherSteps.includes(value)
                            ) {
                              return t(
                                'features.adminForm.sidebar.workflow.approvals.validation.fieldAlreadyUsed',
                              )
                            }
                            if (value && !selectedEditFields.includes(value)) {
                              return t(
                                'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUser',
                              )
                            }
                          },
                        }}
                        render={({ field: { value = '', ...rest } }) => (
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
                          You don&apos;t have a Yes/No field for approvers to
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
                </Stack>
              )}
            </Radio>
          </Box>
          {isActive && subStep === 2 && (
            <Box px="0.5rem">
              <InlineMessage variant="info">
                {WALKTHROUGH_MESSAGES[1]}
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
