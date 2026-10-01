import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'

import { BasicField, WorkflowType } from 'formsg-shared/types'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'
import { useStageFieldAndNavigate } from '../../../../../hooks/useStageFieldAndNavigate'
import { FieldEmptyState } from '../../EmptyStates'

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
  const { t } = useTranslation(workflowNs)
  const {
    register,
    formState: { errors },
    control,
    getValues,
  } = formMethods

  const workflowTypeValidation = useWorkflowTypeValidation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const stageFieldAndNavigate = useStageFieldAndNavigate()
  const isSavePermissive = useIsWorkflowSavePermissive()

  const showEmptyState = isRedesign && !emailFieldItems?.length

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
        <Text>{t('dynamicRespondent.title')}</Text>
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
                        ? 'dynamicRespondent.requiredRedesign'
                        : 'dynamicRespondent.required',
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
                        ? 'dynamicRespondent.mustBeEmailRedesign'
                        : 'dynamicRespondent.mustBeEmail',
                    )
                  )
                },
              }}
              render={({ field: { value = '', ...rest } }) =>
                showEmptyState ? (
                  <FieldEmptyState
                    picker="email"
                    message={t('emptyStates.noEmailField')}
                    actionLabel={t('emptyStates.noEmailFieldAction')}
                    onAction={() =>
                      stageFieldAndNavigate(BasicField.Email, getValues())
                    }
                  />
                ) : (
                  <SingleSelect
                    isDisabled={isLoading}
                    isClearable={false}
                    placeholder={t('dynamicRespondent.select')}
                    items={emailFieldItems}
                    value={value}
                    {...rest}
                  />
                )
              }
            />
            <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}
