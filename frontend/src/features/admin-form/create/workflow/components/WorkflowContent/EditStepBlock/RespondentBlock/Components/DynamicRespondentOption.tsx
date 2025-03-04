import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'

import { WorkflowType } from '~shared/types'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useWorkflowTypeValidation } from './hooks'
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
            isReadOnly={isLoading}
            id="field"
            isRequired
            isInvalid={!!errors.field}
          >
            <Controller
              control={control}
              name="field"
              rules={{
                required: t(
                  'features.adminForm.sidebar.workflow.dynamicRespondent.required',
                ),
                validate: (selectedValue) => {
                  return (
                    isLoading ||
                    !emailFieldItems ||
                    emailFieldItems.some(
                      ({ value: fieldValue }) => fieldValue === selectedValue,
                    ) ||
                    t(
                      'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmail',
                    )
                  )
                },
              }}
              render={({ field: { value = '', ...rest } }) => (
                <SingleSelect
                  isDisabled={isLoading}
                  isClearable={false}
                  placeholder={t(
                    'features.adminForm.sidebar.workflow.dynamicRespondent.select',
                  )}
                  items={emailFieldItems}
                  value={value}
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
