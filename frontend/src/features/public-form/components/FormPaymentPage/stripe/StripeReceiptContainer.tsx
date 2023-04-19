import { useCallback, useState } from 'react'
import { useToast } from '@chakra-ui/react'

import { usePublicFormMutations } from '~features/public-form/mutations'

import {
  FeedbackBlock,
  FeedbackFormInput,
} from '../../FormEndPage/components/FeedbackBlock'
import { useGetPaymentReceiptStatus } from '../queries'

import {
  DownloadReceiptBlock,
  GenericMessageBlock,
  PaymentStack,
} from './components'

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

  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  const { submitFormFeedbackMutation } = usePublicFormMutations(
    formId,
    paymentId,
  )

  const handleSubmitFeedback = useCallback(
    (inputs: FeedbackFormInput) => {
      return submitFormFeedbackMutation.mutateAsync(inputs, {
        onSuccess: () => {
          toast({
            description: 'Thank you for submitting your feedback!',
            status: 'success',
            isClosable: true,
          })
          setIsFeedbackSubmitted(true)
        },
      })
    },
    [submitFormFeedbackMutation, toast],
  )

  if (isLoading || error || !data) {
    return (
      <PaymentStack>
        <GenericMessageBlock
          title="Your payment has been received."
          subtitle="We are waiting to get your proof of payment from our payment provider. You may come back to the same link to download your receipt later."
          paymentId={paymentId}
        />
      </PaymentStack>
    )
  }
  return (
    /**
     * PaymentStack is explictly added in this component due to https://github.com/chakra-ui/chakra-ui/issues/6757
     */
    <PaymentStack>
      <DownloadReceiptBlock formId={formId} paymentId={paymentId} />
      {!isFeedbackSubmitted && (
        <FeedbackBlock onSubmit={handleSubmitFeedback} />
      )}
    </PaymentStack>
  )
}
