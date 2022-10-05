import { useEffect, useMemo } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Box, Stack } from '@chakra-ui/react'
import { isEmpty, times } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme, LogicDto } from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'
import { FormFieldValues } from '~templates/Field'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import {
  augmentWithMyInfo,
  extractPreviewValue,
  hasExistingFieldValue,
} from '~features/myinfo/utils'
import { useFetchPrefillQuery } from '~features/public-form/hooks/useFetchPrefillQuery'

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
  useFetchPrefillQuery()
  const [searchParams] = useSearchParams()

  const fieldPrefillMap = useMemo(() => {
    // Return object containing field id and query param value only if id exists in form fields.
    return formFields.reduce((acc, field) => {
      if (
        field.fieldType === BasicField.ShortText &&
        field.allowPrefill &&
        searchParams.has(field._id)
      ) {
        acc[field._id] = searchParams.get(field._id) ?? ''
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

  const {
    reset,
    formState: { isDirty },
  } = formMethods

  // Reset default values when they change
  useEffect(() => {
    if (!isDirty) {
      reset(defaultFormValues)
    }
  }, [defaultFormValues, isDirty, reset])

  return (
    <FormProvider {...formMethods}>
      <form noValidate>
        {!!formFields?.length && (
          <Box bg={'white'} py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
            <Stack spacing="2.25rem">
              {!isEmpty(fieldPrefillMap) && (
                <InlineMessage variant="warning">
                  The highlighted fields in this form have been pre-filled
                  according to the link that you clicked. Please check that
                  these values are what you intend to submit, and edit if
                  necessary.
                </InlineMessage>
              )}
              <VisibleFormFields
                colorTheme={colorTheme}
                control={formMethods.control}
                formFields={augmentedFormFields}
                formLogics={formLogics}
                fieldPrefillMap={fieldPrefillMap}
              />
            </Stack>
          </Box>
        )}
        <PublicFormSubmitButton
          onSubmit={formMethods.handleSubmit(onSubmit)}
          formFields={augmentedFormFields}
          formLogics={formLogics}
          colorTheme={colorTheme}
        />
      </form>
    </FormProvider>
  )
}
