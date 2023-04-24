import { MouseEventHandler, useMemo, useState } from 'react'
import { useFormState, UseFormTrigger, useWatch } from 'react-hook-form'
import { Stack, useDisclosure, VisuallyHidden } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  FormField,
  FormResponseMode,
  LogicDto,
  MyInfoFormField,
  PaymentStatus,
} from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { getLogicUnitPreventingSubmit } from '~features/logic/utils'

import { usePublicFormContext } from '../../PublicFormContext'
import { DuplicatePaymentModal } from '../DuplicatePaymentModal/DuplicatePaymentModal'
import { FormPaymentModal } from '../FormPaymentModal/FormPaymentModal'
import { getPreviousPayment } from '../FormPaymentPage/FormPaymentService'

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
  const [isDuplicate, setDuplicate] = useState(false)
  const [paymentId, setPaymentId] = useState('')

  const isMobile = useIsMobile()
  const { isSubmitting } = useFormState()
  const formInputs = useWatch<FormFieldValues>({}) as FormFieldValues
  const { form, formId } = usePublicFormContext()

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
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: false })

  const checkBeforeOpen = async () => {
    const result = await trigger()

    if (result) {
      // get previous payment
      const payment = await getPreviousPayment(paymentEmailField.value, formId)
      // check if duplicate
      if (payment) {
        setDuplicate(payment.status === PaymentStatus.Succeeded)
        setPaymentId(payment._id)
      }
      onOpen()
    }
  }

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form?.payments_field?.enabled

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      {isOpen ? (
        isDuplicate ? (
          <DuplicatePaymentModal
            onSubmit={onSubmit}
            onClose={onClose}
            isSubmitting={isSubmitting}
            formId={formId}
            paymentId={paymentId}
          />
        ) : (
          <FormPaymentModal
            onSubmit={onSubmit}
            onClose={onClose}
            isSubmitting={isSubmitting}
          />
        )
      ) : null}
      <Button
        isFullWidth={isMobile}
        w="100%"
        colorScheme={`theme-${colorTheme}` as ThemeColorScheme}
        type="button"
        isLoading={isSubmitting}
        isDisabled={!!preventSubmissionLogic || !onSubmit}
        loadingText="Submitting"
        onClick={isPaymentEnabled ? checkBeforeOpen : onSubmit}
      >
        <VisuallyHidden>End of form.</VisuallyHidden>
        {preventSubmissionLogic
          ? 'Submission disabled'
          : isPaymentEnabled
          ? 'Proceed to pay'
          : 'Submit now'}
      </Button>
      {preventSubmissionLogic ? (
        <InlineMessage variant="warning">
          {preventSubmissionLogic.preventSubmitMessage}
        </InlineMessage>
      ) : null}
    </Stack>
  )
}
