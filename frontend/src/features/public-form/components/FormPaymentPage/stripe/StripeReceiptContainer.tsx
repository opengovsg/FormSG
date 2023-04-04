import { useGetPaymentReceiptStatus } from '../queries'

import { DownloadReceiptBlock } from './components/StripeDownloadReceiptBlock'
import { StripeLoadingReceiptBlock } from './components/StripeLoadingReceiptBlock'

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
    return <StripeLoadingReceiptBlock paymentId={paymentId} />
  }
  return <DownloadReceiptBlock formId={formId} paymentId={paymentId} />
}
