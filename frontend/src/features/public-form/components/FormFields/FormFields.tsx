import { useEffect } from 'react'
import { SubmitHandler, useFormContext } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { isEmpty } from 'lodash'

import { featureFlags } from '~shared/constants'
import { FieldResponsesV3 } from '~shared/types'
import { FormFieldDto } from '~shared/types/field'
import {
  FormColorTheme,
  FormResponseMode,
  FormWorkflowStepDto,
  LogicDto,
} from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'
import { FormFieldValues } from '~templates/Field'

import { useFetchPrefillQuery } from '~features/public-form/hooks/useFetchPrefillQuery'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { PaymentPreview } from '../../../../templates/Field/PaymentPreview/PaymentPreview'
import { PublicFormPaymentResumeModal } from '../FormPaymentPage/FormPaymentResumeModal'

import { PublicFormSubmitButton } from './PublicFormSubmitButton'
import { PublicRespondentEmailField } from './PublicRespondentEmailField'
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
  formFields,
  formLogics,
  workflowStep,
  colorTheme,
  onSubmit,
}: FormFieldsProps): JSX.Element => {
  // TODO: (respondent copy): Remove when respondent copy is out of beta
  const isRespondentCopyEnabled = useFeatureIsOn(featureFlags.respondentCopy)

  useFetchPrefillQuery()

  const { defaultFormValues, fieldPrefillMap, form, augmentedFormFields } =
    usePublicFormContext()

  const {
    reset,
    formState: { isDirty },
    trigger,
    handleSubmit,
    control,
  } = useFormContext<FormFieldValues>()

  // Reset default values when they change
  useEffect(() => {
    if (!isDirty) {
      reset(defaultFormValues)
    }
  }, [defaultFormValues, isDirty, reset])

  const hasLockedPrefills = Object.values(fieldPrefillMap).some(
    (field) => field.lockPrefill && field.prefillValue,
  )
  const hasNormalPrefills = Object.values(fieldPrefillMap).some(
    (field) => !field.lockPrefill && field.prefillValue,
  )

  const hasLockedNormalPrefills = hasLockedPrefills && hasNormalPrefills

  return (
    <form noValidate>
      {!!formFields?.length && (
        <Box bg="white" py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
          <Stack spacing="2.25rem">
            {isEmpty(fieldPrefillMap) ? null : hasLockedNormalPrefills ? (
              // If there are both locked and non-locked prefills, show this message.
              <InlineMessage variant="warning">
                Some fields below have been pre-filled.
              </InlineMessage>
            ) : null}
            <VisibleFormFields
              colorTheme={colorTheme}
              control={control}
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
      {/* TODO: (respondent copy): Remove when respondent copy is out of beta */}
      {form?.hasRespondentCopy && isRespondentCopyEnabled ? (
        <Box mt="2.5rem" px={{ base: '1rem', md: 0 }}>
          <PublicRespondentEmailField />
        </Box>
      ) : null}
      <PublicFormPaymentResumeModal />
      <PublicFormSubmitButton
        onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
        formFields={augmentedFormFields}
        formLogics={formLogics}
        colorTheme={colorTheme}
        trigger={trigger}
      />
    </form>
  )
}
