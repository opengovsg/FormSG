import { useCallback, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Stack, Text } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  updateCreateStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { useCreatePageSidebar } from '~features/admin-form/create/common'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

export type StepType = 'collect' | 'review'

interface WhatTheyDoBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

const APPROVAL_FIELD_NAME = 'approval_field'

export const WhatTheyDoBlock = ({
  formMethods,
  stepNumber,
}: WhatTheyDoBlockProps): JSX.Element => {
  const { t } = useTranslation()
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

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2">What they do</Text>
        <Radio.RadioGroup
          value={stepType}
          onChange={(val) => handleStepTypeChange(val as StepType)}
        >
          <Radio
            isDisabled={isLoading}
            isLabelFullWidth
            allowDeselect={false}
            value="collect"
            px="0.5rem"
            __css={{ _focusWithin: { boxShadow: 'none' } }}
          >
            <Text>Fill in fields only</Text>
            {stepType === 'collect' && (
              <Text textStyle="body-2" color="secondary.400" pt="0.25rem">
                This person fills in the fields assigned to them.
              </Text>
            )}
          </Radio>

          <Radio
            isDisabled={isLoading}
            isLabelFullWidth
            allowDeselect={false}
            value="review"
            px="0.5rem"
            __css={{ _focusWithin: { boxShadow: 'none' } }}
          >
            <Text>Fill in fields and approve</Text>
            {stepType === 'review' && (
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
                        You don't have a Yes/No field for approvers to use.
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
        </Radio.RadioGroup>
      </Stack>
    </EditStepBlockContainer>
  )
}
