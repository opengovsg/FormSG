import { useEffect, useMemo, useRef } from 'react'
import { Box, Container, VisuallyHidden } from '@chakra-ui/react'

import { PaymentType } from '~shared/types'
import {
  FormDto,
  FormResponseMode,
  ProductItemForReceipt,
} from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'
import { SubmissionData } from '~features/public-form/PublicFormContext'

import { DownloadReceiptBlock } from '../../FormPaymentPage/stripe/components'

export interface PaymentEndPageBlockProps {
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  focusOnMount?: boolean
  isPaymentEnabled: boolean
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

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form.payments_field.enabled

  const isMultiProduct =
    form?.responseMode === FormResponseMode.Encrypt &&
    form.payments_field.products_meta?.multi_product

  let paymentProducts: ProductItemForReceipt[] = []
  let totalAmount = 0

  if (isPaymentEnabled) {
    switch (form?.payments_field?.payment_type) {
      case PaymentType.Products:
        if (isMultiProduct) {
          paymentProducts = form?.payments_field?.products?.map((product) => {
            totalAmount += product.amount_cents * product.min_qty
            return {
              name: product.name,
              quantity: product.min_qty,
              amount_cents: product.amount_cents,
            }
          }) as ProductItemForReceipt[]
        } else {
          paymentProducts = [
            {
              name:
                isPaymentEnabled && form?.payments_field?.products
                  ? form?.payments_field?.products[0].name
                  : 'Product/Service',
              quantity: form?.payments_field?.products[0].min_qty,
              amount_cents: form?.payments_field?.products[0].amount_cents,
            },
          ] as ProductItemForReceipt[]
          totalAmount =
            paymentProducts[0].quantity * paymentProducts[0].amount_cents
        }
        break

      case PaymentType.Variable:
        paymentProducts = [
          {
            name: form?.payments_field?.name,
            quantity: 1,
            amount_cents: form?.payments_field?.min_amount,
          },
        ] as ProductItemForReceipt[]
        totalAmount = form?.payments_field?.min_amount
        break

      case PaymentType.Fixed:
      default:
        paymentProducts = [
          {
            name:
              isPaymentEnabled && form?.payments_field?.products
                ? form?.payments_field?.products[0].name
                : 'Product/Service',
            quantity: 1,
            amount_cents:
              isPaymentEnabled && form?.payments_field?.products
                ? form?.payments_field?.products[0].amount_cents
                : '0',
          },
        ] as ProductItemForReceipt[]
        totalAmount = paymentProducts[0].amount_cents
    }
  }

  const submittedAriaText = useMemo(() => {
    if (form?.title) {
      return `You have successfully submitted your response for ${form?.title}.`
    }
    return 'You have successfully submitted your response.'
  }, [form?.title])

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
        products={paymentProducts}
        name={'Product/ Service'}
        paymentDate={new Date()}
      />
    </Container>
  )
}
