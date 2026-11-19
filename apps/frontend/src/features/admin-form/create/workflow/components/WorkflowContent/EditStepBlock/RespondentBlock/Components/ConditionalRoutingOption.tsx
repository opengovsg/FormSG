import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Stack, Text } from '@chakra-ui/react'

import { BasicField, WorkflowType } from 'formsg-shared/types'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

import {
  DropdownFormField,
  getMappingMismatchError,
  getMissingMappingError,
} from './dropdownMapping'
import { DropdownRecipientsMapping } from './DropdownRecipientsMapping'
import { useWorkflowTypeValidation } from './hooks'
import { NESTED_CONTROL_PR } from './layout'
import { RespondentOptionProps } from './types'

interface ConditionalRoutingOptionProps extends RespondentOptionProps {
  conditionalFormFields: DropdownFormField[]
}

export const ConditionalRoutingOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
  conditionalFormFields,
}: ConditionalRoutingOptionProps) => {
  const { t } = useTranslation()
  const {
    register,
    control,
    watch,
    formState: { errors },
    clearErrors,
  } = formMethods

  const conditionalFieldItems = conditionalFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const selectedConditionalFieldId = watch('conditional_field')
  const selectedConditionalField = conditionalFormFields.find(
    (field) => field._id === selectedConditionalFieldId,
  )

  const validateOptionsToRecipientsMapErrorMessage = getMappingMismatchError(
    selectedConditionalField,
    t,
  )
  const noEmailToOptionsMappingErrorMessage = getMissingMappingError(
    selectedConditionalField,
    t,
  )

  const workflowTypeValidation = useWorkflowTypeValidation()
  const isSavePermissive = useIsWorkflowSavePermissive()

  const { withAddFieldItem, withAddFieldAction } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.dropdown'),
    fieldType: BasicField.Dropdown,
  })

  return (
    <Radio
      isDisabled={isLoading}
      isLabelFullWidth
      allowDeselect={false}
      value={WorkflowType.Conditional}
      {...register('workflow_type', workflowTypeValidation)}
      px="0.5rem"
      __css={{
        _focusWithin: {
          boxShadow: 'none',
        },
      }}
    >
      <Text mb="0.5rem">
        {t('features.adminForm.sidebar.workflow.conditionalRouting.title')}
      </Text>
      {selectedWorkflowType === WorkflowType.Conditional ? (
        <FormControl
          pr={NESTED_CONTROL_PR}
          id="conditional_field"
          isRequired={!isSavePermissive}
          isInvalid={
            !!validateOptionsToRecipientsMapErrorMessage ||
            !!errors.conditional_field
          }
        >
          <Stack spacing="0.625rem">
            <Controller
              control={control}
              name="conditional_field"
              rules={{
                required: isSavePermissive
                  ? false
                  : t(
                      'features.adminForm.sidebar.workflow.conditionalRouting.validation.noField',
                    ),
                validate: (selectedValue) => {
                  if (!selectedValue) return true
                  if (isSavePermissive) return true
                  if (noEmailToOptionsMappingErrorMessage) {
                    return noEmailToOptionsMappingErrorMessage
                  }
                  if (validateOptionsToRecipientsMapErrorMessage) {
                    return validateOptionsToRecipientsMapErrorMessage
                  }
                  return (
                    isLoading ||
                    !conditionalFieldItems ||
                    conditionalFieldItems.some(
                      ({ value: fieldValue }) => fieldValue === selectedValue,
                    ) ||
                    t(
                      'features.adminForm.sidebar.workflow.conditionalRouting.validation.notDropdown',
                    )
                  )
                },
              }}
              render={({ field: { value = '', onChange, ...rest } }) => (
                <SingleSelect
                  isDisabled={isLoading}
                  isClearable={false}
                  placeholder={t(
                    'features.adminForm.sidebar.workflow.dynamicRespondent.select',
                  )}
                  items={withAddFieldItem(conditionalFieldItems)}
                  value={value}
                  onChange={withAddFieldAction(onChange)}
                  {...rest}
                />
              )}
            />
            <DropdownRecipientsMapping
              field={selectedConditionalField}
              isLoading={isLoading}
              onMapped={() => clearErrors('conditional_field')}
            />
          </Stack>
          <FormErrorMessage>
            {validateOptionsToRecipientsMapErrorMessage ||
              errors.conditional_field?.message}
          </FormErrorMessage>
        </FormControl>
      ) : null}
    </Radio>
  )
}
