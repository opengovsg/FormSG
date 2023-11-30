import { useEffect, useMemo } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Box, Stack } from '@chakra-ui/react'
import { format } from 'date-fns'
import { isEmpty, times, zip } from 'lodash'

import { PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID } from '~shared/constants'
import { CountryRegion } from '~shared/constants/countryRegion'
import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme, FormResponseMode, LogicDto } from '~shared/types/form'
import { centsToDollars } from '~shared/utils/payments'

import InlineMessage from '~components/InlineMessage'
import { FormFieldValues } from '~templates/Field'
import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/CheckboxField'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/RadioField'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import { AugmentedDecryptedResponse } from '~features/admin-form/responses/ResponsesPage/storage/utils/augmentDecryptedResponses'
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
  previousResponses?: AugmentedDecryptedResponse[]
  responseMode: FormResponseMode
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
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
  responseMode,
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
        acc[field._id] = {
          prefillValue: searchParams.get(field._id) ?? '',
          lockPrefill: field.lockPrefill ?? false,
        }
      }
      return acc
    }, {} as PrefillMap)
  }, [formFields, searchParams])

  const augmentedFormFields = useMemo(
    () => formFields.map(augmentWithMyInfo),
    [formFields],
  )

  const defaultFormValues = useMemo(() => {
    return augmentedFormFields.reduce<FormFieldValues>((acc, field) => {
      // If this is part of a MRF flow, use that.
      const response = previousResponses?.find(
        (response) => response._id === field._id,
      )
      if (response) {
        switch (field.fieldType) {
          case BasicField.Number:
          case BasicField.Decimal:
          case BasicField.ShortText:
          case BasicField.LongText:
          case BasicField.HomeNo:
          case BasicField.Dropdown:
          case BasicField.Nric:
          case BasicField.Uen:
          case BasicField.YesNo:
          case BasicField.Rating:
            if (response.answer) acc[field._id] = response.answer
            break
          case BasicField.CountryRegion:
            if (response.answer) {
              acc[field._id] = Object.values(CountryRegion).find(
                (countryRegion) =>
                  countryRegion.toUpperCase() === response.answer.toUpperCase(),
              ) as string
            }
            break
          case BasicField.Date:
            if (response.answer) {
              acc[field._id] = format(new Date(response.answer), 'dd/MM/yyyy')
            }
            break
          case BasicField.Attachment:
            //TODO
            break
          case BasicField.Email:
          case BasicField.Mobile:
            if (response.answer) {
              acc[field._id] = {
                value: response.answer,
                signature: response.signature,
              }
            }
            break
          case BasicField.Table:
            // TODO: Fix this
            if (response.answerArray) {
              acc[field._id] = (response.answerArray as string[][]).map(
                (row) => {
                  const columns: Record<string, string> = {}
                  zip(field.columns, row).forEach(([column, answer]) => {
                    if (!column || !answer) return
                    columns[column._id] = answer
                  })
                  return columns
                },
              )
            }
            break
          case BasicField.Radio:
            if (response.answer) {
              //TODO: Hackish... fix this.
              if (response.answer.startsWith('Others: ')) {
                acc[field._id] = {
                  value: RADIO_OTHERS_INPUT_VALUE,
                  othersInput: response.answer.slice(8),
                }
                break
              }
              acc[field._id] = { value: response.answer }
            }
            break
          case BasicField.Checkbox:
            //TODO: This doesn't work
            if (response.answerArray) {
              const answerArray = response.answerArray as string[]
              const othersAnswerIdx = answerArray.findIndex((answer) =>
                answer.startsWith('Others: '),
              )
              if (othersAnswerIdx < 0) {
                acc[field._id] = { value: answerArray }
                break
              }
              const othersAnswer = answerArray.splice(othersAnswerIdx, 1)[0]
              acc[field._id] = {
                value: [...answerArray, CHECKBOX_OTHERS_INPUT_VALUE],
                othersInput: othersAnswer.slice(8),
              }
            }
            break
          case BasicField.Children:
            //TODO
            break
          case BasicField.Section:
          case BasicField.Image:
          case BasicField.Statement:
            break
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = field
            throw new Error('Invalid field type encountered')
          }
        }
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
  }, [augmentedFormFields, previousResponses, fieldPrefillMap])

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
                responseMode={responseMode}
                formFields={augmentedFormFields}
                formLogics={formLogics}
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
        <PublicFormSubmitButton
          onSubmit={onSubmit ? formMethods.handleSubmit(onSubmit) : undefined}
          formFields={augmentedFormFields}
          formLogics={formLogics}
          colorTheme={colorTheme}
          trigger={trigger}
        />
      </form>
    </FormProvider>
  )
}
