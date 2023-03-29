import { useGetPaymentReceiptStatus } from '../queries'

import { DownloadReceiptBlock } from './components/StripeDownloadReceiptBlock'
import { StripeLoadingReceiptBlock } from './components/StripeLoadingReceiptBlock'

export const StripeReceiptContainer = ({
  formId,
  paymentPageId,
}: {
  formId: string
  paymentPageId: string
}) => {
  const { data, isLoading, error } = useGetPaymentReceiptStatus(
    formId,
    paymentPageId,
  )
  if (isLoading || error || !data) {
    return <StripeLoadingReceiptBlock paymentId={paymentPageId} />
  }
  return <DownloadReceiptBlock formId={formId} paymentPageId={paymentPageId} />
}
