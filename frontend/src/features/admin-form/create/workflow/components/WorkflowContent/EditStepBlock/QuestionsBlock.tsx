import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'

import { FormStepWithHeader } from './FormStepWithHeader'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
}: QuestionsBlockProps): JSX.Element => {
  const { formFields = [], idToFieldMap } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
  } = formMethods

  const items = formFields
    .filter(
      (f) =>
        // Only retain actual inputs (exclude header, statement, image)
        !NON_RESPONSE_FIELD_SET.has(f.fieldType),
    )
    .map((f) => ({
      value: f._id,
      label: getLogicFieldLabel(idToFieldMap[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

  return (
    <FormStepWithHeader
      headerText="Fields to fill"
      tooltipText="Respondent will only be able to fill the fields you have selected"
    >
      <FormControl
        isReadOnly={isLoading}
        id="edit"
        isRequired
        isInvalid={!!errors.edit}
      >
        <Controller
          control={control}
          name="edit"
          render={({ field: { value, ...field } }) => (
            <MultiSelect
              isDisabled={isLoading}
              placeholder="Select fields from your form"
              items={items}
              isSelectedItemFullWidth
              values={value}
              {...field}
            />
          )}
        />
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </FormStepWithHeader>
  )
}
