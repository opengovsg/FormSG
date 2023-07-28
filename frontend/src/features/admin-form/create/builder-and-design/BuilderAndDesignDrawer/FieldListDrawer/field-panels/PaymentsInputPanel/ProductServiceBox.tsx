import { useState } from 'react'
import { FormState } from 'react-hook-form'
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

import { FormPaymentsField, Product } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

import { dataSelector, usePaymentStore } from '../usePaymentStore'

import { FormPaymentsInput } from './PaymentsInputPanel'
import { ProductModal } from './ProductModal'

const ProductItem = ({
  product,
  onEditClick,
  onDeleteClick,
}: {
  product: Product
  onEditClick: () => void
  onDeleteClick: () => void
}) => {
  return (
    <>
      <Box px="1rem" py="1rem" backgroundColor={'#F8F9FD'}>
        <Flex justifyContent="center">
          <Box flexGrow={1}>
            <Text textStyle="subhead-1" pb="0.25rem" color="secondary.500">
              {product.name}
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
              onClick={onEditClick}
            />
            <IconButton
              icon={<BiTrash />}
              color="danger.500"
              aria-label={'Delete'}
              onClick={onDeleteClick}
            />
          </ButtonGroup>
        </Flex>
      </Box>
    </>
  )
}

const AddProductButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Flex flexDirection="row" onClick={onClick} alignItems="center" mt="0.5rem">
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

const ProductList = ({
  products,
  handleAddOrEditClick,
  handleDeleteClick,
}: {
  products: Product[]
  handleAddOrEditClick: (product: Product | null) => void
  handleDeleteClick: (product: Product) => void
}) => {
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
        <AddProductButton onClick={() => handleAddOrEditClick(null)} />
      </>
    )
  }
  return (
    <>
      <Stack spacing="1.5rem" mb="1.5rem">
        {products.map((productDetail, idx) => (
          <ProductItem
            key={idx}
            product={productDetail}
            onEditClick={() => handleAddOrEditClick(productDetail)}
            onDeleteClick={() => handleDeleteClick(productDetail)}
          />
        ))}
      </Stack>
      <hr />
      <AddProductButton onClick={() => handleAddOrEditClick(null)} />
    </>
  )
}

/**
 * By Products ProductServiceBox
 * @param param0
 * @returns
 */
export const ProductServiceBox = ({
  isLoading,
  errors,
  paymentIsEnabled,
  updateProductListStore,
}: {
  isLoading: boolean
  errors: FormState<FormPaymentsInput>['errors']
  paymentIsEnabled: boolean
  updateProductListStore: (value: Product[]) => void
}) => {
  const { onOpen, onClose, isOpen } = useDisclosure({
    defaultIsOpen: false,
  })

  const { paymentsProductMutation } = useMutateFormPage()

  const { _paymentsData } = usePaymentStore((state) => ({
    _paymentsData: dataSelector(state),
  }))

  const [editProduct, setEditProduct] = useState<Product | null>(null)
  if (!_paymentsData) return <></>

  const paymentsData = _paymentsData as FormPaymentsField
  const { products = [] } = paymentsData

  const handleSaveProduct = (newProduct: Product) => {
    const foundIdx = products.findIndex(
      (product) => product._id === newProduct._id,
    )
    const updatedProductList =
      foundIdx >= 0
        ? [
            ...products.slice(0, foundIdx),
            newProduct,
            ...products.slice(foundIdx + 1),
          ]
        : [...products, newProduct]
    paymentsProductMutation.mutate(updatedProductList, {
      onSuccess: updateProductListStore,
    })
  }

  const handleDeleteProduct = (productToBeDeleted: Product) => {
    const foundIdx = products.findIndex(
      (product) => product._id === productToBeDeleted._id,
    )
    const updatedProductList =
      foundIdx >= 0
        ? [...products.slice(0, foundIdx), ...products.slice(foundIdx + 1)]
        : products
    paymentsProductMutation.mutate(updatedProductList, {
      onSuccess: updateProductListStore,
    })
  }

  const handleOnOpen = (product: Product | null) => {
    setEditProduct(product)
    onOpen()
  }

  const handleOnClose = () => {
    setEditProduct(null)
    onClose()
  }
  return (
    <>
      {isOpen ? (
        <ProductModal
          onClose={handleOnClose}
          onSaveProduct={handleSaveProduct}
          product={editProduct}
        />
      ) : null}

      <FormControl
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
        isDisabled={!paymentIsEnabled}
        isRequired
      >
        <FormLabel>Product/service name</FormLabel>
        <ProductList
          products={products}
          handleAddOrEditClick={handleOnOpen}
          handleDeleteClick={handleDeleteProduct}
        />
      </FormControl>
    </>
  )
}
