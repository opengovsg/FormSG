import { useGetPaymentReceiptStatus } from '../queries'

import { DownloadReceiptBlock } from './components/StripeDownloadReceiptBlock'
import { StripePaymentGenericMessageBlock } from './components'

export const StripeReceiptContainer = ({
  formId,
  paymentId,
}: {
  formId: string
  paymentId: string
}) => {
  const { data, isLoading, error } = useGetPaymentReceiptStatus(
    formId,
    paymentId,
  )
  if (isLoading || error || !data) {
    return (
      <StripePaymentGenericMessageBlock
        title={'Your payment has been received.'}
        subtitle={
          'We are confirming your payment with Stripe. You may come back to the same link to download your receipt later.'
        }
        paymentId={paymentId}
      />
    )
  }
  return <DownloadReceiptBlock formId={formId} paymentId={paymentId} />
}
