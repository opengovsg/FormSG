import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_PRODUCT_FIELD_ID } from '~shared/constants'
import { FormColorTheme, FormPaymentsFieldV2, ProductItem } from '~shared/types'
import { calculatePrice } from '~shared/utils/paymentProductPrice'

import { centsToDollars } from '~utils/payments'
import Checkbox from '~components/Checkbox'
import { SingleSelect } from '~components/Dropdown/SingleSelect/SingleSelect'
import Radio from '~components/Radio'

import { generateIntRange } from '../utils'

const ItemQuantity = ({
  product,
  onChange,
}: {
  product: ProductItem
  onChange: any
}) => {
  if (!product.data.multi_qty) {
    return <></>
  }

  const qtyOptions = generateIntRange(
    product.data.min_qty,
    product.data.max_qty + 1,
  ).map((quantity) => ({
    label: String(quantity),
    value: String(quantity),
  }))
  return (
    <Box width="8rem">
      <SingleSelect
        isClearable={false}
        items={qtyOptions}
        placeholder="Quantity"
        onChange={onChange}
        value={String(product.quantity)}
        name={'Quantity'}
        variant={'clear'}
      />
    </Box>
  )
}
const PaymentItemV2 = ({
  product,
  colorTheme,
  onItemChange,
  isMultiSelect,
}: {
  product: ProductItem
  colorTheme: FormColorTheme
  onItemChange: (
    productId: string,
    isSelected: boolean,
    selectedQuantity: number,
  ) => void
  isMultiSelect: boolean
}) => {
  const ChoiceElement = isMultiSelect ? Checkbox : Radio

  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
      width="100%"
    >
      <ChoiceElement
        onChange={() =>
          onItemChange(product.data._id, !product.selected, product.quantity)
        }
        variant="fullWidth"
      >
        <Box flexGrow={1}>
          <Text textStyle="body-1" mb="0.5rem">
            {product.data.name}
          </Text>
          <Text textStyle="body-1" mb="0.5rem">
            {product.data.description}
          </Text>
          <Flex alignItems={'center'}>
            <Box flexGrow={1} as="h2" textStyle="h2">{`${centsToDollars(
              product.data.amount_cents ?? 0,
            )} SGD`}</Box>
            <ItemQuantity
              product={product}
              onChange={(qty: number) =>
                onItemChange(product.data._id, product.selected, qty)
              }
            />
          </Flex>
        </Box>
      </ChoiceElement>
    </Box>
  )
}

export const PaymentItemDetailsBlockV2 = ({
  paymentDetails,
  colorTheme,
}: {
  paymentDetails: FormPaymentsFieldV2
  colorTheme: FormColorTheme
}) => {
  const { register, setValue } = useFormContext()
  register(PAYMENT_PRODUCT_FIELD_ID)

  const [productItems, updateProductItems] = useState<Array<ProductItem>>(
    () => {
      return paymentDetails.products.map((product) => ({
        data: product,
        selected: false,
        quantity: product.multi_qty ? 0 : 1,
      }))
    },
  )

  // lifecycle: getDerivedStateFromProps to track updates from parent
  useEffect(() => {
    updateProductItems(
      paymentDetails.products.map((product) => ({
        data: product,
        selected: false,
        quantity: product.multi_qty ? 0 : 1,
      })),
    )
  }, [paymentDetails.products])

  const totalPrice = calculatePrice(productItems)
  if (!paymentDetails.products) {
    return <></>
  }

  const handleItemChange = (
    productId: string,
    isSelected: boolean,
    selectedQuantity: number,
  ) => {
    const updatedProductItems = productItems.map((product) => {
      if (product.data._id !== productId) return product

      return {
        ...product,
        selected: isSelected,
        quantity: selectedQuantity,
      }
    })
    updateProductItems(updatedProductItems)
    setValue(PAYMENT_PRODUCT_FIELD_ID, updatedProductItems)
  }

  return (
    <Stack spacing="2rem">
      {productItems.map((product) => (
        <PaymentItemV2
          key={product.data._id}
          product={product}
          colorTheme={colorTheme}
          onItemChange={handleItemChange}
          isMultiSelect={true}
        />
      ))}
      <hr />
      <Flex justifyContent={'end'}>
        <Text textAlign={'right'} mr={'1rem'}>
          Total price
        </Text>
        <Text textStyle={'h4'} fontWeight="600" fontSize={'24px'}>
          {centsToDollars(totalPrice)} SGD
        </Text>
      </Flex>
    </Stack>
  )
}
