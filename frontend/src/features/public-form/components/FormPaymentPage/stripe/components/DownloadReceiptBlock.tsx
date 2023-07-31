import { BiDownload } from 'react-icons/bi'

import { useToast } from '~hooks/useToast'
import Button from '~components/Button'

import { getPaymentInvoiceDownloadUrl } from '~features/public-form/utils/urls'

import { GenericMessageBlock } from './GenericMessageBlock'

type DownloadReceiptBlockProps = {
  formId: string
  submissionId: string
  paymentId: string
}

export const DownloadReceiptBlock = ({
  formId,
  submissionId,
  paymentId,
}: DownloadReceiptBlockProps) => {
  const toast = useToast({ status: 'success', isClosable: true })

  const handleInvoiceClick = () => {
    toast({
      description: 'Proof of payment download started',
    })
    window.location.href = getPaymentInvoiceDownloadUrl(formId, paymentId)
  }
  return (
    <GenericMessageBlock
      title={'Your payment has been made successfully.'}
      subtitle={'Your form has been submitted and payment has been made.'}
      submissionId={submissionId}
    >
      <>
        <Button
          mt="2.25rem"
          leftIcon={<BiDownload fontSize="1.5rem" />}
          onClick={handleInvoiceClick}
        >
          Save proof of payment
        </Button>
      </>
    </GenericMessageBlock>
  )
}
