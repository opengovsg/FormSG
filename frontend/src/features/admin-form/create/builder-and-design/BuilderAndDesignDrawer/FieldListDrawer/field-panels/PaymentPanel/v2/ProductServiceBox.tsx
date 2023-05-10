import { BiEditAlt, BiPlus, BiTrash } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Flex,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { FormPaymentsFieldV2, Product } from '~shared/types'

import { centsToDollars, dollarsToCents } from '~utils/payments'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

import { ProductModal } from '../ProductModal'
import {
  dataSelector,
  setDataSelector,
  usePaymentStore,
} from '../usePaymentStore'

const ProductItem = ({ product }) => {
  return (
    <>
      <Box px="1rem" py="1rem" backgroundColor={'#F8F9FD'}>
        <Flex justifyContent="center">
          <Box flexGrow={1}>
            <Text textStyle="subhead-1" pb="0.25rem" color="secondary.500">
              {product.title}
            </Text>
            <Text textStyle="caption-1" color="secondary.500">
              ${centsToDollars(product.amount_cents)}
            </Text>
          </Box>

          <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
            <IconButton
              icon={<BiEditAlt type="solid" />}
              color="primary.500"
              aria-label={'Edit'}
            />
            <IconButton
              icon={<BiTrash />}
              color="danger.500"
              aria-label={'Delete'}
            />
          </ButtonGroup>
        </Flex>
      </Box>
    </>
  )
}

const AddProductButton = ({ onOpen }) => {
  return (
    <Flex
      flexDirection="row"
      onClick={() => onOpen()}
      alignItems="center"
      mt="0.5rem"
    >
      <Button
        leftIcon={<BiPlus />}
        color="primary.500"
        aria-label="Add"
        variant="clear"
      >
        Add
      </Button>
    </Flex>
  )
}

const ProductsBlock = ({ products, onOpen }) => {
  if (products.length <= 0) {
    return (
      <>
        <Box px="1rem" py="1rem" backgroundColor={'#F9F9F9'} mb="1.5rem">
          <Text textStyle="subhead-1" pb="0.25rem" color="secondary.500">
            You haven't added any product/service
          </Text>
          <Text textStyle="caption-1" color="secondary.500">
            Click 'Add' to configure your product/service
          </Text>
        </Box>
        <hr />
        <AddProductButton onOpen={onOpen} />
      </>
    )
  }
  return (
    <>
      <Stack spacing="1.5rem" mb="1.5rem">
        {products.map((productDetail, idx) => (
          <ProductItem key={idx} product={productDetail} />
        ))}
      </Stack>
      <hr />
      <AddProductButton onOpen={onOpen} />
    </>
  )
}

export const ProductServiceBoxv2 = ({
  isLoading,
  errors,
  paymentIsEnabled,
  setValue,
}: {
  isLoading: boolean
  errors: any
  paymentIsEnabled: boolean
  setValue: any
}) => {
  const { onOpen, onClose, isOpen } = useDisclosure({
    defaultIsOpen: false,
  })

  const { paymentsProductMutation } = useMutateFormPage()

  const { paymentsData: _paymentsData } = usePaymentStore((state) => ({
    paymentsData: dataSelector(state),
    setData: setDataSelector(state),
  }))

  if (!_paymentsData) return <></>

  const paymentsData = _paymentsData as FormPaymentsFieldV2
  const { products = [] } = paymentsData

  const handleAddProduct = (newProduct: Product) => {
    const updatedProductList = [...products, newProduct]
    paymentsProductMutation.mutate(updatedProductList)
    setValue(updatedProductList)
  }

  return (
    <>
      {isOpen ? (
        <ProductModal
          onClose={onClose}
          onSaveProduct={handleAddProduct}
          product={null}
        />
      ) : null}

      <FormControl
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
        isDisabled={!paymentIsEnabled}
        isRequired
      >
        <FormLabel>Product/service name</FormLabel>
        <ProductsBlock products={products} onOpen={onOpen} />
      </FormControl>
    </>
  )
}
