import { Box, Divider, Flex, Text } from '@chakra-ui/react'

import {
  ExtractTypeFromArray,
  FormColorTheme,
  FormResponseMode,
  GetPaymentInfoDto,
  PaymentType,
  PublicFormDto,
} from '~shared/types'

import { centsToDollars } from '~utils/payments'

import { FixedPaymentItemDetailsBlock } from './FixedPaymentItemDetailsBlock'

const LineItem = ({
  productItem,
}: {
  productItem: ExtractTypeFromArray<NonNullable<GetPaymentInfoDto['products']>>
}) => {
  return (
    <Flex textStyle={'body-2'} mb="1rem" justifyContent={'space-between'}>
      <Text>
        {productItem.quantity}x {productItem.data.name}
      </Text>
      <Text>
        S${centsToDollars(productItem.quantity * productItem.data.amount_cents)}
      </Text>
    </Flex>
  )
}
const ProductsPaymentSummary = ({
  paymentInfoData,
  colorTheme,
  paymentAmount,
}: {
  paymentInfoData: GetPaymentInfoDto
  colorTheme: FormColorTheme
  paymentAmount: number // explicitly use the payment amount listed in the payment intent instead of calculation
}) => {
  if (!paymentInfoData.products) {
    return <></>
  }

  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      {paymentInfoData.products.map((productItem) => {
        return <LineItem key={productItem.data._id} productItem={productItem} />
      })}
      <Divider my="1rem" />
      <Flex justifyContent="flex-end">
        <Text mr="0.25rem" textStyle="body-1" alignSelf="flex-end">
          Total:
        </Text>
        <Text textStyle="h4">S${centsToDollars(paymentAmount ?? 0)}</Text>
      </Flex>
    </Box>
  )
}
export const PaymentSummary = ({
  form,
  paymentAmount,
  paymentItemName,
  colorTheme,
  paymentInfoData,
}: {
  form: PublicFormDto
  paymentAmount: number
  paymentItemName?: string | null
  colorTheme: FormColorTheme
  paymentInfoData: GetPaymentInfoDto
}) => {
  if (form.responseMode !== FormResponseMode.Encrypt) {
    return <></>
  }
  if (form.payments_field.payment_type === PaymentType.Products) {
    return (
      <ProductsPaymentSummary
        paymentInfoData={paymentInfoData}
        colorTheme={colorTheme}
        paymentAmount={paymentAmount}
      />
    )
  }

  return (
    <FixedPaymentItemDetailsBlock
      paymentItemName={
        paymentItemName ? paymentItemName : form.payments_field.name
      }
      paymentDescription={form.payments_field.description}
      colorTheme={colorTheme}
      paymentAmount={paymentAmount}
    />
  )
}
