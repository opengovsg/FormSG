import { useCallback, useState } from 'react'
import { Box, Stack, useToast } from '@chakra-ui/react'

import { FormPaymentsField, ProductItemForReceipt } from '~shared/types'

import { useSubmitFormFeedbackMutation } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import {
  FeedbackBlock,
  FeedbackFormInput,
} from '../../FormEndPage/components/FeedbackBlock'
import { PaymentStack } from '../components'
import { useGetPaymentReceiptStatus } from '../queries'

import { DownloadReceiptBlock, GenericMessageBlock } from './components'

export const StripeReceiptContainer = ({
  formId,
  submissionId,
  paymentId,
  amount,
  products,
  paymentFieldsSnapshot,
}: {
  formId: string
  submissionId: string
  paymentId: string
  amount: number
  products: ProductItemForReceipt[]
  paymentFieldsSnapshot: FormPaymentsField
}) => {
  const {
    data: paymentReceiptStatus,
    isLoading,
    error,
  } = useGetPaymentReceiptStatus(formId, paymentId)

  const { form } = usePublicFormContext()
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  const { submitFormFeedbackMutation } = useSubmitFormFeedbackMutation(
    formId,
    submissionId,
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

  if (isLoading || error || !paymentReceiptStatus?.isReady || !form) {
    return (
      <Stack my="1.5rem" mx={{ base: '1rem', md: 'auto' }}>
        <Box
          bg="white"
          py={{ base: '1.5rem', md: '2rem' }}
          px={{ base: '1rem', md: '2rem' }}
          w="100%"
        >
          <GenericMessageBlock
            title="Thank you, your payment has been made successfully."
            subtitle="We are waiting to get your proof of payment from our payment provider. You may come back to the same link to download your invoice later."
            submissionId={submissionId}
          />
        </Box>
      </Stack>
    )
  }
  return (
    /**
     * PaymentStack is explictly added in this component due to https://github.com/chakra-ui/chakra-ui/issues/6757
     */
    <Stack>
      <PaymentStack noBg>
        <DownloadReceiptBlock
          formId={formId}
          submissionId={submissionId}
          paymentId={paymentId}
          amount={amount}
          products={products}
          paymentType={paymentFieldsSnapshot.payment_type}
          name={paymentFieldsSnapshot.name || ''}
          paymentDate={paymentReceiptStatus.paymentDate}
          endPage={form.endPage}
        />
      </PaymentStack>
      <Stack px={{ base: '1rem', md: '4rem' }} bg="transparent">
        {!isFeedbackSubmitted && (
          <Box
            backgroundColor="white"
            py={{ base: '1.5rem', md: '2rem' }}
            px={{ base: '1rem', md: '2rem' }}
          >
            <FeedbackBlock onSubmit={handleSubmitFeedback} />
          </Box>
        )}
      </Stack>
    </Stack>
  )
}
