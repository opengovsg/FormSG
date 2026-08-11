import { useEffect, useMemo, useRef } from 'react'
import { Box, VisuallyHidden } from '@chakra-ui/react'

import { FormDto } from 'formsg-shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'
import { SubmissionData } from '~features/public-form/PublicFormContext'

import { DownloadReceiptBlock } from '../../../public-form/components/FormPaymentPage/stripe/components'

import { paymentTypeSelection } from './payment.utils'

export interface PaymentEndPageBlockProps {
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  focusOnMount?: boolean
}

export const PaymentEndPageBlock = ({
  endPage,
  submissionData,
  focusOnMount,
}: PaymentEndPageBlockProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  // All supported response modes carry payment config; the structural check
  // exists only to narrow away the deprecated email mode.
  const isPaymentEnabled =
    !!form && 'payments_field' in form && form.payments_field.enabled

  const submittedAriaText = useMemo(() => {
    if (form?.title) {
      return `You have successfully submitted your response for ${form?.title}.`
    }
    return 'You have successfully submitted your response.'
  }, [form?.title])

  const handleButtonClick = () => {
    window.location.reload()
  }

  if (!isPaymentEnabled) {
    return <></>
  }

  const { paymentProducts, totalAmount } = paymentTypeSelection(form)

  return (
    <Box>
      <Box ref={focusRef} bg="white">
        <VisuallyHidden aria-live="assertive">
          {submittedAriaText}
        </VisuallyHidden>
      </Box>
      <DownloadReceiptBlock
        formId={''}
        submissionId={submissionData.id as string}
        paymentId={''}
        endPage={endPage}
        amount={totalAmount}
        products={paymentProducts}
        name={'Product/ Service'}
        paymentDate={new Date()}
        onClick={handleButtonClick}
      />
    </Box>
  )
}
