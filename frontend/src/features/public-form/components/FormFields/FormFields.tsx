import { FieldValues, FormProvider, useForm } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

import { FormFieldDto } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form'

import Button from '~components/Button'

import { FormField } from './FormField'

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
  // TODO: Inject default values if field is MyInfo, or prefilled.
  const formMethods = useForm()

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing="2.25rem">
          {formFields.map((field) => (
            <FormField key={field._id} field={field} colorTheme={colorTheme} />
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
