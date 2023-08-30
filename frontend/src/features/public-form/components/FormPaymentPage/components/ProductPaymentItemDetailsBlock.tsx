import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Divider, Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_PRODUCT_FIELD_ID } from '~shared/constants'
import { ProductItem } from '~shared/types'
import { calculatePrice } from '~shared/utils/paymentProductPrice'
import { centsToDollars, formatCurrency } from '~shared/utils/payments'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { ProductPaymentCard } from './ProductPaymentCard'
import { ProductItemDetailProps } from './types'

const isProductSelected = (productItems: Array<ProductItem>) => {
  const isSelected = productItems.some((item) => item.selected)
  return isSelected
}

export const ProductPaymentItemDetailsBlock = ({
  paymentDetails,
  colorTheme,
}: ProductItemDetailProps) => {
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
    <Stack spacing="2.25rem">
      <FormControl isInvalid={!!errors.payment_products}>
        <Stack spacing="1rem" divider={<Divider />}>
          {productItems.map((product, idx) => (
            <ProductPaymentCard
              colorTheme={colorTheme}
              key={product.data._id || idx}
              product={product}
              onItemChange={handleItemChange}
              isMultiSelect={productsMeta.multi_product}
            />
          ))}
        </Stack>
        <FormErrorMessage>{errors?.payment_products?.message}</FormErrorMessage>
      </FormControl>
      <Divider />
      <Flex justifyContent={'end'} alignItems="baseline">
        <Text textAlign={'right'} mr={'0.5rem'} justifySelf="end">
          Total:
        </Text>
        <Text textStyle={'h2'}>
          S{formatCurrency(Number(centsToDollars(totalPrice)))}
        </Text>
      </Flex>
    </Stack>
  )
}
