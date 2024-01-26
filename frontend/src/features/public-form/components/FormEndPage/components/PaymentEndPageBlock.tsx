import { useEffect, useMemo, useRef } from 'react'
import { Box, Container, VisuallyHidden } from '@chakra-ui/react'

import {
  FormColorTheme,
  FormDto,
  ProductItemForReceipt,
} from '~shared/types/form'

import { SubmissionData } from '~features/public-form/PublicFormContext'

import { DownloadReceiptBlock } from '../../FormPaymentPage/stripe/components'

export interface PaymentEndPageBlockProps {
  formTitle: FormDto['title'] | undefined
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme?: FormColorTheme
  focusOnMount?: boolean
  isPaymentEnabled: boolean
  products: ProductItemForReceipt[]
  totalAmount: number
  name: string
}

export const PaymentEndPageBlock = ({
  formTitle,
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
  products,
  totalAmount,
  name,
}: PaymentEndPageBlockProps): JSX.Element => {
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return `You have successfully submitted your response for ${formTitle}.`
    }
    return 'You have successfully submitted your response.'
  }, [formTitle])

  return (
    <Container pb={{ base: '1.5rem', md: '3rem' }}>
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
        products={products}
        name={'Product/ Service'}
        paymentDate={new Date()}
      />
    </Container>
  )
}
