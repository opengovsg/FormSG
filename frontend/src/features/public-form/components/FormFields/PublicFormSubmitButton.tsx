import { MouseEventHandler, useMemo, useState } from 'react'
import { useFormState, UseFormTrigger, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Stack, useDisclosure, VisuallyHidden } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import { FormField, LogicDto, MyInfoFormField } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { getLogicUnitPreventingSubmit } from '~features/logic/utils'

import { usePublicFormContext } from '../../PublicFormContext'
import { DuplicatePaymentModal } from '../DuplicatePaymentModal/DuplicatePaymentModal'
import { FormPaymentModal } from '../FormPaymentModal/FormPaymentModal'
import { getPreviousPaymentId } from '../FormPaymentPage/FormPaymentService'
import { SingleSubmissionModal } from '../SingleSubmissionModal/SingleSubmissionModal'

interface PublicFormSubmitButtonProps {
  formFields: MyInfoFormField<FormField>[]
  formLogics: LogicDto[]
  colorTheme: string
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined
  trigger: UseFormTrigger<FormFieldValues>
}

/**
 * This component is split up so that input changes will not rerender the
 * entire FormFields component leading to terrible performance.
 */
export const PublicFormSubmitButton = ({
  formFields,
  formLogics,
  colorTheme,
  onSubmit,
  trigger,
}: PublicFormSubmitButtonProps): JSX.Element => {
  const { t } = useTranslation()
  const [prevPaymentId, setPrevPaymentId] = useState('')

  const isMobile = useIsMobile()
  const { isSubmitting } = useFormState()
  const formInputs = useWatch<FormFieldValues>({}) as FormFieldValues
  const {
    formId,
    isPaymentEnabled,
    isPreview,
    hasSingleSubmissionValidationError,
    setHasSingleSubmissionValidationError,
  } = usePublicFormContext()

  const paymentEmailField = formInputs[
    PAYMENT_CONTACT_FIELD_ID
  ] as VerifiableFieldValues

  const preventSubmissionLogic = useMemo(() => {
    return getLogicUnitPreventingSubmit({
      formInputs,
      formFields,
      formLogics,
    })
  }, [formInputs, formFields, formLogics])

  // For payments submit and pay modal
  const {
    isOpen: isPaymentsModalOpen,
    onOpen: onPaymentsModalOpen,
    onClose: onPaymentsModalClose,
  } = useDisclosure({ defaultIsOpen: false })

  const checkBeforeOpen = async () => {
    const result = await trigger()

    if (result) {
      // get previous payment
      try {
        const paymentId = await getPreviousPaymentId(
          paymentEmailField.value,
          formId,
        )
        setPrevPaymentId(paymentId)
      } catch (err) {
        setPrevPaymentId('')
      }
      onPaymentsModalOpen()
    }
  }

  const isSingleSubmissionOnlyModalOpen = hasSingleSubmissionValidationError
  const onSingleSubmissionModalClose = () => {
    // the setter will only exist for public forms and will be undefined for preview
    if (setHasSingleSubmissionValidationError)
      setHasSingleSubmissionValidationError(false)
  }

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      {isPaymentsModalOpen ? (
        prevPaymentId ? (
          <DuplicatePaymentModal
            onSubmit={onSubmit}
            onClose={onPaymentsModalClose}
            isSubmitting={isSubmitting}
            formId={formId}
            paymentId={prevPaymentId}
          />
        ) : (
          <FormPaymentModal
            onSubmit={onSubmit}
            onClose={onPaymentsModalClose}
            isSubmitting={isSubmitting}
          />
        )
      ) : null}
      <SingleSubmissionModal
        formId={formId}
        isOpen={isSingleSubmissionOnlyModalOpen}
        onClose={onSingleSubmissionModalClose}
      />
      <Button
        isFullWidth={isMobile}
        w="100%"
        colorScheme={`theme-${colorTheme}` as ThemeColorScheme}
        type="button"
        isLoading={isSubmitting}
        isDisabled={!!preventSubmissionLogic || !onSubmit}
        loadingText={t(
          'features.publicForm.components.submitButton.loadingText',
        )}
        onClick={isPaymentEnabled && !isPreview ? checkBeforeOpen : onSubmit}
      >
        <VisuallyHidden>
          {t('features.publicForm.components.submitButton.visuallyHidden')}
        </VisuallyHidden>
        {preventSubmissionLogic
          ? t('features.publicForm.components.submitButton.preventSubmission')
          : isPaymentEnabled
            ? t('features.publicForm.components.submitButton.proceedToPay')
            : t('features.publicForm.components.submitButton.submitNow')}
      </Button>
      {preventSubmissionLogic ? (
        <InlineMessage variant="warning">
          {preventSubmissionLogic.preventSubmitMessage}
        </InlineMessage>
      ) : null}
    </Stack>
  )
}
