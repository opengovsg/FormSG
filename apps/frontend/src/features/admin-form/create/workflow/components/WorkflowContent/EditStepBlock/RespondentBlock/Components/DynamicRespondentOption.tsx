import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'

import { BasicField, WorkflowType } from 'formsg-shared/types'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

import { useWorkflowTypeValidation } from './hooks'
import { NESTED_CONTROL_PR } from './layout'
import { FieldItem, RespondentOptionProps } from './types'

interface DynamicRespondentOptionProps extends RespondentOptionProps {
  emailFieldItems: FieldItem[]
}

export const DynamicRespondentOption = ({
  isLoading,
  selectedWorkflowType,
  formMethods,
  emailFieldItems,
}: DynamicRespondentOptionProps) => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    control,
  } = formMethods

  const workflowTypeValidation = useWorkflowTypeValidation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isSavePermissive = useIsWorkflowSavePermissive()
  const { withAddFieldItem, withAddFieldAction } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.email'),
    fieldType: BasicField.Email,
    enabled: isRedesign,
  })

  return (
    <>
      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Dynamic}
        {...register('workflow_type', workflowTypeValidation)}
        px="0.5rem"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text>
          {t('features.adminForm.sidebar.workflow.dynamicRespondent.title')}
        </Text>
        {selectedWorkflowType === WorkflowType.Dynamic ? (
          <FormControl
            pt="0.5rem"
            pr={NESTED_CONTROL_PR}
            isReadOnly={isLoading}
            id="field"
            isRequired={!isSavePermissive}
            isInvalid={!!errors.field}
          >
            <Controller
              control={control}
              name="field"
              rules={{
                required: isSavePermissive
                  ? false
                  : t(
                      isRedesign
                        ? 'features.adminForm.sidebar.workflow.dynamicRespondent.requiredRedesign'
                        : 'features.adminForm.sidebar.workflow.dynamicRespondent.required',
                    ),
                validate: (selectedValue) => {
                  if (!selectedValue) return true
                  return (
                    isLoading ||
                    !emailFieldItems ||
                    emailFieldItems.some(
                      ({ value: fieldValue }) => fieldValue === selectedValue,
                    ) ||
                    t(
                      isRedesign
                        ? 'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmailRedesign'
                        : 'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmail',
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
                  items={withAddFieldItem(emailFieldItems)}
                  value={value}
                  onChange={withAddFieldAction(onChange)}
                  {...rest}
                />
              )}
            />
            <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}
