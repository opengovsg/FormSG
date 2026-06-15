import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Stack, Text } from '@chakra-ui/react'

import { BasicField, WorkflowType } from 'formsg-shared/types'

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

  const { handleBuilderClick } = useCreatePageSidebar()
  const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)
  const { data: form } = useAdminForm()

  const handleCreateEmailField = () => {
    handleBuilderClick(false)
    const fieldMeta = getFieldCreationMeta(BasicField.Email)
    const insertionIndex = form?.form_fields?.length ?? 0
    updateCreateState(fieldMeta, insertionIndex)
  }

  const hasEmailFields = emailFieldItems.length > 0

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
        <Text>Emails entered into an email field</Text>
        {selectedWorkflowType === WorkflowType.Dynamic ? (
          <FormControl
            pt="0.5rem"
            isReadOnly={isLoading}
            id="field"
            isRequired={hasEmailFields}
            isInvalid={!!errors.field}
          >
            {hasEmailFields ? (
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
            ) : (
              <Stack spacing="0.5rem">
                <Text textStyle="body-2" color="secondary.400">
                  You don't have any email fields.
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateEmailField}
                >
                  Create email field
                </Button>
              </Stack>
            )}
            <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}
