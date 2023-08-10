import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Box, Divider, Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_PRODUCT_FIELD_ID } from '~shared/constants'
import {
  FormColorTheme,
  ProductItem,
  ProductsPaymentField,
} from '~shared/types'
import { calculatePrice } from '~shared/utils/paymentProductPrice'
import { centsToDollars, formatCurrency } from '~shared/utils/payments'

import Checkbox from '~components/Checkbox'
import { SingleSelect } from '~components/Dropdown/SingleSelect/SingleSelect'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { generateIntRange } from './utils'

const ItemQuantity = ({
  product,
  onChange,
}: {
  product: ProductItem
  onChange: (quantity: number) => void
}) => {
  if (!product.data.multi_qty) {
    return <></>
  }

  const qtyOptions = generateIntRange(
    product.data.min_qty,
    product.data.max_qty,
  ).map((quantity) => ({
    label: String(quantity),
    value: String(quantity),
  }))
  return (
    <Box width="6rem">
      <SingleSelect
        isClearable={false}
        items={qtyOptions}
        onChange={(val) => onChange(Number(val))}
        value={String(product.quantity)}
        name={'Quantity'}
        variant={'clear'}
      />
    </Box>
  )
}
const PaymentItem = ({
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
        isChecked={product.selected}
        onChange={() =>
          onItemChange(product.data._id, !product.selected, product.quantity)
        }
        variant="fullWidth"
      >
        <Box flexGrow={1}>
          <Text textStyle="subhead-1">{product.data.name}</Text>
          <Text textStyle="body-2" mb="0.5rem">
            {product.data.description}
          </Text>
          <Flex alignItems={'center'}>
            <Box flexGrow={1} as="h2" textStyle="h2">
              S
              {formatCurrency(
                Number(centsToDollars(product.data.amount_cents ?? 0)),
              )}
            </Box>
            <ItemQuantity
              product={product}
              onChange={(qty) => onItemChange(product.data._id, true, qty)}
            />
          </Flex>
        </Box>
      </ChoiceElement>
    </Box>
  )
}

const isProductSelected = (productItems: Array<ProductItem>) => {
  const isSelected = productItems.some((item) => item.selected)
  return isSelected
}

export const ProductPaymentItemDetailsBlock = ({
  paymentDetails,
  colorTheme,
}: {
  paymentDetails: ProductsPaymentField
  colorTheme: FormColorTheme
}) => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext()
  register(PAYMENT_PRODUCT_FIELD_ID, {
    validate: (value) => {
      // Check if at least 1 product is selected
      const selected = isProductSelected(value || [])
      if (!selected) {
        return 'Please select at least 1 option'
      }
    },
  })

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
        quantity: product.multi_qty ? product.min_qty : 1,
      })),
    )
  }, [paymentDetails.products])

  const totalPrice = calculatePrice(productItems)
  const productsMeta = paymentDetails.products_meta
  if (!paymentDetails.products || productsMeta == null) {
    return <></>
  }

  const handleItemChange = (
    productId: string,
    isSelected: boolean,
    selectedQuantity: number,
  ) => {
    const updatedProductItems = productItems.map((product) => {
      if (product.data._id !== productId) {
        if (!paymentDetails.products_meta?.multi_product) {
          return { ...product, selected: false }
        }
        return product
      }

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
      <FormControl isInvalid={!!errors.payment_products}>
        <Stack spacing="2rem">
          {productItems.map((product, idx) => (
            <PaymentItem
              key={product.data._id || idx}
              product={product}
              colorTheme={colorTheme}
              onItemChange={handleItemChange}
              isMultiSelect={productsMeta.multi_product}
            />
          ))}
        </Stack>
        <FormErrorMessage>{errors?.payment_products?.message}</FormErrorMessage>
        <Divider />
      </FormControl>
      <Flex justifyContent={'end'}>
        <Text textAlign={'right'} mr={'1rem'}>
          Total price
        </Text>
        <Text textStyle={'h4'} fontWeight="600" fontSize={'24px'}>
          S{formatCurrency(Number(centsToDollars(totalPrice)))}
        </Text>
      </Flex>
    </Stack>
  )
}
