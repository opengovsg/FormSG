import { MouseEventHandler, useMemo, useState } from 'react'
import { useFormState, UseFormTrigger, useWatch } from 'react-hook-form'
import { Stack, useDisclosure, VisuallyHidden } from '@chakra-ui/react'
import { Button, Infobox } from '@opengovsg/design-system-react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import { FormField, LogicDto, MyInfoFormField } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { getLogicUnitPreventingSubmit } from '~features/logic/utils'

import { usePublicFormContext } from '../../PublicFormContext'
import { DuplicatePaymentModal } from '../DuplicatePaymentModal/DuplicatePaymentModal'
import { FormPaymentModal } from '../FormPaymentModal/FormPaymentModal'
import { getPreviousPaymentId } from '../FormPaymentPage/FormPaymentService'

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
  const [prevPaymentId, setPrevPaymentId] = useState('')

  const isMobile = useIsMobile()
  const { isSubmitting } = useFormState()
  const formInputs = useWatch<FormFieldValues>({}) as FormFieldValues
  const { formId, isPaymentEnabled, isPreview } = usePublicFormContext()

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
      try {
        const paymentId = await getPreviousPaymentId(
          paymentEmailField.value,
          formId,
        )
        setPrevPaymentId(paymentId)
      } catch (err) {
        setPrevPaymentId('')
      }
      onOpen()
    }
  }

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      {isOpen ? (
        prevPaymentId ? (
          <DuplicatePaymentModal
            onSubmit={onSubmit}
            onClose={onClose}
            isSubmitting={isSubmitting}
            formId={formId}
            paymentId={prevPaymentId}
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
        colorScheme={`theme-${colorTheme}`}
        type="button"
        isLoading={isSubmitting}
        isDisabled={!!preventSubmissionLogic || !onSubmit}
        loadingText="Submitting"
        onClick={isPaymentEnabled && !isPreview ? checkBeforeOpen : onSubmit}
      >
        <VisuallyHidden>End of form.</VisuallyHidden>
        {preventSubmissionLogic
          ? 'Submission disabled'
          : isPaymentEnabled
            ? 'Proceed to pay'
            : 'Submit now'}
      </Button>
      {preventSubmissionLogic ? (
        <Infobox variant="warning">
          {preventSubmissionLogic.preventSubmitMessage}
        </Infobox>
      ) : null}
    </Stack>
  )
}
