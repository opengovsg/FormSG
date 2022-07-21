import { useMemo } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Box, Stack } from '@chakra-ui/react'
import { times } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme, LogicDto } from '~shared/types/form'

import { FormFieldValues } from '~templates/Field'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import {
  augmentWithMyInfo,
  extractPreviewValue,
  hasExistingFieldValue,
} from '~features/myinfo/utils'

import { PublicFormSubmitButton } from './PublicFormSubmitButton'
import { VisibleFormFields } from './VisibleFormFields'

export interface FormFieldsProps {
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  colorTheme: FormColorTheme
  onSubmit: SubmitHandler<FormFieldValues>
}

export const FormFields = ({
  formFields,
  formLogics,
  colorTheme,
  onSubmit,
}: FormFieldsProps): JSX.Element => {
  const [searchParams] = useSearchParams()

  const fieldPrefillMap = useMemo(() => {
    const queryParams = Object.fromEntries([...searchParams])
    const ids = new Set(Object.keys(queryParams))

    // Return object containing field id and query param value only if id exists in form fields.
    return formFields.reduce((acc, field) => {
      if (
        field.fieldType === BasicField.ShortText &&
        field.allowPrefill &&
        ids.has(field._id)
      ) {
        acc[field._id] = queryParams[field._id]
      }
      return acc
    }, {} as Record<string, string>)
  }, [formFields, searchParams])

  const augmentedFormFields = useMemo(
    () => formFields.map(augmentWithMyInfo),
    [formFields],
  )

  const defaultFormValues = useMemo(() => {
    return augmentedFormFields.reduce<FormFieldValues>((acc, field) => {
      // If server returns field with default value, use that.
      if (hasExistingFieldValue(field)) {
        acc[field._id] = extractPreviewValue(field)
        return acc
      }

      // Use prefill value if exists.
      if (fieldPrefillMap[field._id]) {
        acc[field._id] = fieldPrefillMap[field._id]
        return acc
      }

      switch (field.fieldType) {
        // Required so table column fields will render due to useFieldArray usage.
        // See https://react-hook-form.com/api/usefieldarray
        case BasicField.Table:
          acc[field._id] = times(field.minimumRows || 0, () =>
            createTableRow(field),
          )
          break
      }
      return acc
    }, {})
  }, [augmentedFormFields, fieldPrefillMap])

  const formMethods = useForm<FormFieldValues>({
    defaultValues: defaultFormValues,
    mode: 'onTouched',
    shouldUnregister: true,
  })

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <Box bg="white" py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
          <Stack spacing="2.25rem">
            <VisibleFormFields
              colorTheme={colorTheme}
              control={formMethods.control}
              formFields={augmentedFormFields}
              formLogics={formLogics}
              fieldPrefillMap={fieldPrefillMap}
            />
          </Stack>
        </Box>
        <PublicFormSubmitButton
          formFields={augmentedFormFields}
          formLogics={formLogics}
          colorTheme={colorTheme}
        />
      </form>
    </FormProvider>
  )
}
