import { useState } from 'react'
import { FormState } from 'react-hook-form'
import { BiPlus } from 'react-icons/bi'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { Button, FormLabel } from '@opengovsg/design-system-react'

import { FormPaymentsField, Product } from '~shared/types'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

import { dataSelector, usePaymentStore } from '../usePaymentStore'

import { FormPaymentsInput } from './PaymentsInputPanel'
import { ProductItem } from './ProductItem'
import { ProductModal } from './ProductModal'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const AddProductButton = ({
  isDisabled,
  onClick,
}: {
  isDisabled: boolean
  onClick: () => void
}) => {
  return (
    <Flex
      flexDirection="row"
      onClick={isDisabled ? noop : onClick}
      alignItems="center"
      mt="0.5rem"
    >
      <Button
        isDisabled={isDisabled}
        leftIcon={<BiPlus />}
        color="brand.primary.500"
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
  paymentIsEnabled,
}: {
  products: Product[]
  handleAddOrEditClick: (product: Product | null) => void
  handleDeleteClick: (product: Product) => void
  paymentIsEnabled: boolean
}) => {
  if (products.length <= 0) {
    return (
      <>
        <Box px="1rem" py="1rem" backgroundColor={'#F9F9F9'} mb="1.5rem">
          <Text textStyle="subhead-1" pb="0.25rem" color="brand.secondary.500">
            You haven't added any product/service
          </Text>
        </Box>
        <Divider />
        <AddProductButton
          isDisabled={!paymentIsEnabled}
          onClick={() => handleAddOrEditClick(null)}
        />
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
            isDisabled={!paymentIsEnabled}
            onEditClick={() => handleAddOrEditClick(productDetail)}
            onDeleteClick={() => handleDeleteClick(productDetail)}
          />
        ))}
      </Stack>
      <Divider />
      <AddProductButton
        isDisabled={!paymentIsEnabled}
        onClick={() => handleAddOrEditClick(null)}
      />
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
        <FormLabel>Product/service</FormLabel>
        <ProductList
          paymentIsEnabled={paymentIsEnabled}
          products={products}
          handleAddOrEditClick={handleOnOpen}
          handleDeleteClick={handleDeleteProduct}
        />
      </FormControl>
    </>
  )
}
