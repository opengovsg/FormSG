import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'

import { BasicField, WorkflowType } from 'formsg-shared/types'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'
import { useStageFieldAndNavigate } from '../../../../../hooks/useStageFieldAndNavigate'
import { FieldEmptyState } from '../../EmptyStates'

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
  const isRedesign = useIsWorkflowBuilderRedesign()
  const stageFieldAndNavigate = useStageFieldAndNavigate()

  // The radio stays selectable. The admin picks the routing option, then
  // finds out what it needs. Disabling it would hide the reason.
  //
  // The empty state swaps out what the Controller renders, never the
  // Controller itself. Unmounting it would unregister the `required` rule, so
  // Save would pass validation, fail to build a step, and return silently.
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
                      isRedesign
                        ? 'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmailRedesign'
                        : 'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmail',
                    )
                  )
                },
              }}
              render={({ field: { value = '', ...rest } }) =>
                showEmptyState ? (
                  <FieldEmptyState
                    picker="email"
                    message={t(
                      'features.adminForm.sidebar.workflow.emptyStates.noEmailField',
                    )}
                    actionLabel={t(
                      'features.adminForm.sidebar.workflow.emptyStates.noEmailFieldAction',
                    )}
                    onAction={() => stageFieldAndNavigate(BasicField.Email)}
                  />
                ) : (
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
