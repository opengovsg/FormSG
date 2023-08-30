import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react'

import { ProductItem } from '~shared/types'
import { centsToDollars, formatCurrency } from '~shared/utils/payments'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
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

export const ProductPaymentCard = ({
  product,
  onItemChange,
  isMultiSelect,
}: {
  product: ProductItem
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
    <Box w="100%">
      <ChoiceElement
        isChecked={product.selected}
        onChange={() =>
          onItemChange(product.data._id, !product.selected, product.quantity)
        }
        variant="fullWidth"
        p="1rem"
        minH="6.75rem"
      >
        <Box flexGrow={1}>
          <Text textStyle="h3" lineHeight="1.5rem">
            {product.data.name}
          </Text>
          <Text textStyle="body-1" mb="0.5rem">
            {product.data.description}
          </Text>
          <Flex alignItems={'center'}>
            <Box flexGrow={1} as="h2" textStyle="h3">
              S
              {formatCurrency(
                Number(centsToDollars(product.data.amount_cents)),
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
        initialQty={product.quantity || product.data.min_qty}
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
