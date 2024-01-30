import { Box, Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { FormColorTheme, FormDto } from '~shared/types/form'

import {
  SubmissionData,
  usePublicFormContext,
} from '~features/public-form/PublicFormContext'

import { FeedbackBlock, FeedbackFormInput } from './FeedbackBlock'
import { PaymentEndPageBlock } from './PaymentEndPageBlock'
import { PaymentsThankYouSvgr } from './ThankYouSvgr'

export interface PaymentEndPagePreviewProps {
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  handleSubmitFeedback: (inputs: FeedbackFormInput) => void
  isFeedbackSubmitted: boolean
  colorTheme: FormColorTheme
}

export const PaymentEndPagePreview = ({
  handleSubmitFeedback,
  isFeedbackSubmitted,
  colorTheme,
  ...endPageProps
}: PaymentEndPagePreviewProps): JSX.Element => {
  const { isPaymentEnabled } = usePublicFormContext()
  return (
    <>
      <Flex flexDir="column" align="center">
        <PaymentsThankYouSvgr h="100%" pt="2.5rem" />
        <Stack
          //   spacing={{ base: '1.5rem', md: '3rem' }}
          py={{ base: '1rem', md: '1.5rem' }}
          mx={{ base: '1.5rem', md: '2rem' }}
          bg="transparent"
        >
          <PaymentEndPageBlock
            focusOnMount
            {...endPageProps}
            isPaymentEnabled={isPaymentEnabled}
          />
          {isFeedbackSubmitted ? null : (
            <Box backgroundColor="white" p="2rem">
              <FeedbackBlock onSubmit={handleSubmitFeedback} />
            </Box>
          )}
        </Stack>
      </Flex>
    </>
  )
}
