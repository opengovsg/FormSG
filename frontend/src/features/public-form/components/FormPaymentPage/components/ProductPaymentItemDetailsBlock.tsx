import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { PAYMENT_PRODUCT_FIELD_ID } from '~shared/constants'
import {
  FormColorTheme,
  ProductItem,
  ProductsPaymentField,
} from '~shared/types'
import { calculatePrice } from '~shared/utils/paymentProductPrice'
import { centsToDollars, formatCurrency } from '~shared/utils/payments'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import PaymentQuantityModal from './PaymentQuantityModal'

const ItemQuantityButton = ({
  product,
  onClick,
}: {
  product: ProductItem
  onClick: () => void
}) => {
  if (!product.data.multi_qty) {
    return <></>
  }
  return (
    <Box minWidth="6.75rem" height="2.75rem" onClick={onClick}>
      <Button
        rightIcon={<BxsChevronDown fontSize="1.5rem" />}
        colorScheme="secondary"
        aria-label="Change"
        variant="clear"
      >
        Qty: {product.quantity}
      </Button>
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
  const paymentQuantityModalDisclosure = useDisclosure()
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
            <ItemQuantityButton
              product={product}
              onClick={paymentQuantityModalDisclosure.onOpen}
            />
          </Flex>
        </Box>
      </ChoiceElement>

      <PaymentQuantityModal
        isOpen={paymentQuantityModalDisclosure.isOpen}
        itemName={product.data.name}
        onCancel={paymentQuantityModalDisclosure.onClose}
        initialQty={product.quantity || 1}
        onSubmit={(qty) => {
          paymentQuantityModalDisclosure.onClose()
          onItemChange(product.data._id, true, qty)
        }}
        onClose={paymentQuantityModalDisclosure.onClose}
        minQty={product.data.min_qty}
        maxQty={product.data.max_qty}
      />
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
      </FormControl>
      <Divider />
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
