import { useMemo } from 'react'
import { FieldValues, FormProvider, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'
import { times } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme, LogicDto } from '~shared/types/form'

import Button from '~components/Button'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import { augmentWithMyInfo } from '~features/myinfo/utils/augmentWithMyInfo'

import { VisibleFormFields } from './VisibleFormFields'

export interface FormFieldsProps {
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  colorTheme: FormColorTheme
  onSubmit: (values: FieldValues) => void
}

export const FormFields = ({
  formFields,
  formLogics,
  colorTheme,
  onSubmit,
}: FormFieldsProps): JSX.Element => {
  // TODO: Inject default values is field is also prefilled.
  const augmentedFormFields = useMemo(
    () => formFields.map(augmentWithMyInfo),
    [formFields],
  )

  const defaultFormValues = useMemo(() => {
    return augmentedFormFields.reduce<FieldValues>((acc, field) => {
      if (field.fieldValue !== undefined) {
        acc[field._id] = field.fieldValue
        return acc
      }
      switch (field.fieldType) {
        // Required so table column fields will render due to useFieldArray usage.
        // See https://react-hook-form.com/api/usefieldarray
        case BasicField.Table:
          acc[field._id] = times(field.minimumRows, () => createTableRow(field))
          break
      }

      return acc
    }, {})
  }, [augmentedFormFields])

  const formMethods = useForm({
    defaultValues: defaultFormValues,
    mode: 'onTouched',
    shouldUnregister: true,
  })

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing="2.25rem">
          <VisibleFormFields
            colorTheme={colorTheme}
            control={formMethods.control}
            formFields={augmentedFormFields}
            formLogics={formLogics}
          />
          <Button
            mt="1rem"
            type="submit"
            isLoading={formMethods.formState.isSubmitting}
            loadingText="Submitting"
          >
            Submit
          </Button>
        </Stack>
      </form>
    </FormProvider>
  )
}
