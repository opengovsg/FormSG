import { useMemo } from 'react'
import { FieldValues, FormProvider, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'
import { times } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form'

import Button from '~components/Button'

import { FieldFactory } from './FieldFactory'

export interface FormFieldsProps {
  formFields: FormFieldDto[]
  colorTheme: FormColorTheme
  onSubmit: (values: FieldValues) => void
}

export const FormFields = ({
  formFields,
  colorTheme,
  onSubmit,
}: FormFieldsProps): JSX.Element => {
  // TODO: Cleanup messy code
  // TODO: Inject default values if field is MyInfo, or prefilled.
  const defaultFormValues = useMemo(() => {
    return formFields.reduce<FieldValues>((acc, field) => {
      switch (field.fieldType) {
        // Required so table column fields will render due to useFieldArray usage.
        // See https://react-hook-form.com/api/usefieldarray
        case BasicField.Table:
          acc[field._id] = times(field.minimumRows, () =>
            field.columns.reduce<FieldValues>((acc, c) => {
              acc[c._id] = ''
              return acc
            }, {}),
          )
      }

      return acc
    }, {})
  }, [formFields])

  const formMethods = useForm({
    defaultValues: defaultFormValues,
    mode: 'onTouched',
  })

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing="2.25rem">
          {formFields.map((field) => (
            <FieldFactory
              field={field}
              colorTheme={colorTheme}
              key={field._id}
            />
          ))}
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
