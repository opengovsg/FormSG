import { useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import {
  FormColorTheme,
  FormPaymentsField,
  FormPaymentsFieldV1,
  FormPaymentsFieldV2,
} from '~shared/types'

import { centsToDollars } from '~utils/payments'

import { ProductItem } from './types'
import { calculatePrice } from './utils'

export interface PaymentItemDetailsBlockProps {
  colorTheme: FormColorTheme
  paymentDetails: FormPaymentsField
}

const PaymentItem = ({
  paymentItemName,
  paymentAmount,
  colorTheme,
}: {
  paymentItemName: string
  paymentAmount: number
  colorTheme: FormColorTheme
}) => {
  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      <Text textStyle="body-1" mb="0.5rem">
        {paymentItemName}
      </Text>
      <Box as="h2" textStyle="h2">{`${centsToDollars(
        paymentAmount ?? 0,
      )} SGD`}</Box>
    </Box>
  )
}

const PaymentItemV2 = ({
  paymentItemName,
  paymentAmount,
  colorTheme,
  onChange,
}: {
  paymentItemName: string
  paymentAmount: number
  colorTheme: FormColorTheme
  onChange: (isSelected, selectedQuantity) => void
}) => {
  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      <Text textStyle="body-1" mb="0.5rem">
        {paymentItemName}
      </Text>
      <Box as="h2" textStyle="h2">{`${centsToDollars(
        paymentAmount ?? 0,
      )} SGD`}</Box>
    </Box>
  )
}

const PaymentItemBlockV1 = ({
  paymentDetails,
  colorTheme,
}: {
  paymentDetails: FormPaymentsFieldV1
  colorTheme: FormColorTheme
}) => {
  return (
    <PaymentItem
      paymentItemName={paymentDetails.description || ''}
      paymentAmount={paymentDetails.amount_cents || 0}
      colorTheme={colorTheme}
    />
  )
}

const PaymentItemBlockV2 = ({
  paymentDetails,
  colorTheme,
}: {
  paymentDetails: FormPaymentsFieldV2
  colorTheme: FormColorTheme
}) => {
  const [productItems, updateProductItems] = useState<Array<ProductItem>>(
    () => {
      return paymentDetails.products.map((product) => ({
        data: product,
        selected: false,
        quantity: 0,
      }))
    },
  )

  const totalPrice = calculatePrice(productItems)
  if (!paymentDetails.products) {
    return <></>
  }
  //

  return (
    <Stack spacing="2rem">
      {paymentDetails.products.map((product) => (
        <PaymentItemV2
          paymentItemName={product.description}
          paymentAmount={product.amount_cents}
          colorTheme={colorTheme}
          onChange={() => {
            //
          }}
        />
      ))}
      <hr />
      <Flex justifyContent={'end'}>
        <Text textAlign={'right'} mr={'1rem'}>
          Total price
        </Text>
        <Text textStyle={'h4'} fontWeight="600" fontSize={'24px'}>
          {totalPrice} SGD
        </Text>
      </Flex>
    </Stack>
  )
}

export const PaymentItemDetailsBlock = ({
  colorTheme,
  paymentDetails,
}: PaymentItemDetailsBlockProps): JSX.Element => {
  if (paymentDetails.version === 1) {
    return (
      <PaymentItemBlockV1
        paymentDetails={paymentDetails}
        colorTheme={colorTheme}
      />
    )
  }
  return (
    <PaymentItemBlockV2
      paymentDetails={paymentDetails}
      colorTheme={colorTheme}
    />
  )
}
