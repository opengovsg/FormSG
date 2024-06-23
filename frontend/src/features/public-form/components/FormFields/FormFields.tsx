import { useEffect, useMemo } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Box, Stack } from '@chakra-ui/react'
import { isEmpty, times } from 'lodash'

import { PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID } from '~shared/constants'
import { CountryRegion } from '~shared/constants/countryRegion'
import { AttachmentFieldResponseV3, FieldResponsesV3 } from '~shared/types'
import { BasicField, FormFieldDto } from '~shared/types/field'
import {
  FormColorTheme,
  FormResponseMode,
  FormWorkflowStepDto,
  LogicDto,
} from '~shared/types/form'
import { centsToDollars } from '~shared/utils/payments'

import bufferToFile from '~utils/bufferToFile'
import InlineMessage from '~components/InlineMessage'
import { FormFieldValue, FormFieldValues } from '~templates/Field'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import { augmentWithWorkflowDisabling } from '~features/form/utils/augmentWithWorkflowDisabling'
import {
  augmentWithMyInfo,
  extractPreviewValue,
  hasExistingFieldValue,
} from '~features/myinfo/utils'
import { useFetchPrefillQuery } from '~features/public-form/hooks/useFetchPrefillQuery'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { PaymentPreview } from '../../../../templates/Field/PaymentPreview/PaymentPreview'
import { PublicFormPaymentResumeModal } from '../FormPaymentPage/FormPaymentResumeModal'

import { PublicFormSubmitButton } from './PublicFormSubmitButton'
import { VisibleFormFields } from './VisibleFormFields'

export interface FormFieldsProps {
  previousResponses?: FieldResponsesV3
  previousAttachments?: Record<string, ArrayBuffer>
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  workflowStep?: FormWorkflowStepDto
  colorTheme: FormColorTheme
  onSubmit: SubmitHandler<FormFieldValues> | undefined
}

export type PrefillMap = {
  [fieldId: string]: {
    prefillValue: string
    lockPrefill: boolean
  }
}

export const FormFields = ({
  previousResponses,
  previousAttachments,
  formFields,
  formLogics,
  workflowStep,
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
        acc[field._id] = {
          prefillValue: searchParams.get(field._id) ?? '',
          lockPrefill: field.lockPrefill ?? false,
        }
      }
      return acc
    }, {} as PrefillMap)
  }, [formFields, searchParams])

  const augmentedFormFields = useMemo(
    () =>
      formFields
        .map(augmentWithMyInfo)
        .map((fields) => augmentWithWorkflowDisabling(workflowStep, fields)),
    [formFields, workflowStep],
  )

  const defaultFormValues = useMemo(() => {
    return augmentedFormFields.reduce<FormFieldValues>((acc, field) => {
      // If this is part of a MRF flow, use that.
      const previousResponse = previousResponses?.[field._id]
      if (previousResponse) {
        switch (field.fieldType) {
          case BasicField.CountryRegion: {
            const selected = Object.values(CountryRegion).find(
              (option) => option.toUpperCase() === previousResponse.answer,
            )
            if (selected) {
              acc[field._id] = selected
            }
            break
          }
          case BasicField.Attachment: {
            const attachmentData =
              previousResponse.answer as AttachmentFieldResponseV3
            const fileName = attachmentData.answer
            const fileData = previousAttachments?.[field._id]
            if (fileData) {
              acc[field._id] = bufferToFile(fileData, fileName)
            }

            break
          }
          default:
            acc[field._id] = previousResponse.answer as FormFieldValue
        }
        return acc
      }

      // If server returns field with default value, use that.
      if (hasExistingFieldValue(field)) {
        acc[field._id] = extractPreviewValue(field)
        return acc
      }

      // Use prefill value if exists.
      if (fieldPrefillMap[field._id]) {
        acc[field._id] = fieldPrefillMap[field._id].prefillValue
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
  }, [
    augmentedFormFields,
    previousResponses,
    fieldPrefillMap,
    previousAttachments,
  ])

  // payment prefills - only for variable payments
  if (searchParams.has(PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID)) {
    const paymentParamValue = Number.parseInt(
      searchParams.get(PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID) ?? '',
      10,
    )
    if (Number.isInteger(paymentParamValue) && paymentParamValue > 0) {
      const paymentAmount = centsToDollars(Number(paymentParamValue))
      defaultFormValues[PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID] = paymentAmount
    }
  }

  const formMethods = useForm<FormFieldValues>({
    defaultValues: defaultFormValues,
    mode: 'onTouched',
  })

  const {
    reset,
    formState: { isDirty },
    trigger,
  } = formMethods

  // Reset default values when they change
  useEffect(() => {
    if (!isDirty) {
      reset(defaultFormValues)
    }
  }, [defaultFormValues, isDirty, reset])

  const { form } = usePublicFormContext()

  const hasLockedPrefills = Object.values(fieldPrefillMap).some(
    (field) => field.lockPrefill && field.prefillValue,
  )

  const hasNormalPrefills = Object.values(fieldPrefillMap).some(
    (field) => !field.lockPrefill && field.prefillValue,
  )

  const hasLockedNormalPrefills = hasLockedPrefills && hasNormalPrefills

  return (
    <FormProvider {...formMethods}>
      <form noValidate>
        {!!formFields?.length && (
          <Box bg="white" py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
            <Stack spacing="2.25rem">
              {isEmpty(fieldPrefillMap) ? null : hasLockedNormalPrefills ? (
                // If there are both locked and non-locked prefills, show this message.
                <InlineMessage variant="warning">
                  Highlighted fields below have been pre-filled according to the
                  form link you clicked. You may edit these fields if necessary,
                  except non-editable fields with a lock icon.
                </InlineMessage>
              ) : hasLockedPrefills ? (
                // If there are only locked prefills, show this message.
                <InlineMessage variant="warning">
                  Highlighted fields below have been pre-filled according to the
                  form link you clicked. These are non-editable fields.
                </InlineMessage>
              ) : hasNormalPrefills ? (
                // If there are only non-locked prefills, show this message.
                <InlineMessage variant="warning">
                  Highlighted fields below have been pre-filled according to the
                  form link you clicked. You may edit these fields if necessary.
                </InlineMessage>
              ) : null}
              <VisibleFormFields
                colorTheme={colorTheme}
                control={formMethods.control}
                formFields={augmentedFormFields}
                formLogics={formLogics}
                workflowStep={workflowStep}
                fieldPrefillMap={fieldPrefillMap}
              />
            </Stack>
          </Box>
        )}
        {form?.responseMode === FormResponseMode.Encrypt &&
          form?.payments_field.enabled && (
            <Box
              mt="2.5rem"
              bg="white"
              py="2.5rem"
              px={{ base: '1rem', md: '2.5rem' }}
            >
              <PaymentPreview
                colorTheme={colorTheme}
                paymentDetails={form?.payments_field}
              />
            </Box>
          )}
        <PublicFormPaymentResumeModal />
        {/* <PublicFormSubmitButton
          onSubmit={onSubmit ? formMethods.handleSubmit(onSubmit) : undefined}
          formFields={augmentedFormFields}
          formLogics={formLogics}
          colorTheme={colorTheme}
          trigger={trigger}
        /> */}
      </form>
    </FormProvider>
  )
}
