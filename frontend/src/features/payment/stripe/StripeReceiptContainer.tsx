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
  console.log({ isLoading, error, data })

  if (isLoading || error) {
    return <StripeLoadingReceiptBlock paymentId={paymentPageId} />
  }
  return <DownloadReceiptBlock formId={formId} paymentPageId={paymentPageId} />
}
