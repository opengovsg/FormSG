import { useState } from 'react'
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

import { centsToDollars } from '~utils/payments'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'

import { AddProductModal } from './AddProductModal'

export const PROD_DATA: Array<Record<string, unknown>> = []

const ProductItem = ({ product }) => {
  console.log({ product })
  return (
    <>
      <Box px="1rem" py="1rem" backgroundColor={'#F8F9FD'}>
        <Flex justifyContent="center">
          <Box flexGrow={1}>
            <Text textStyle="subhead-1" pb="0.25rem" color="secondary.500">
              {product.name}
            </Text>
            <Text textStyle="caption-1" color="secondary.500">
              ${centsToDollars(product.price)}
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

const ProductsBlock = ({ prodData, onOpen }) => {
  if (prodData.length <= 0) {
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
        {prodData.map((productDetail) => (
          <ProductItem product={productDetail} />
        ))}
      </Stack>
      <hr />
      <AddProductButton onOpen={onOpen} />
    </>
  )
}

export const ProductServiceBoxv2 = ({
  paymentsMutation,
  errors,
  paymentIsEnabled,
  amountValidation,
}) => {
  const { onOpen, onClose, isOpen } = useDisclosure({
    defaultIsOpen: false,
  })
  const [prodData, setProdData] = useState(PROD_DATA)
  const handleAddProduct = (data) => {
    prodData.push(data)
    setProdData([...prodData])
  }

  return (
    <>
      {isOpen ? (
        <AddProductModal
          onClose={onClose}
          amountValidation={amountValidation}
          onAddProduct={handleAddProduct}
        />
      ) : null}

      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isInvalid={!!errors.description}
        isDisabled={!paymentIsEnabled}
        isRequired
      >
        <FormLabel>Product/service name</FormLabel>
        <ProductsBlock prodData={prodData} onOpen={onOpen} />
      </FormControl>
    </>
  )
}
