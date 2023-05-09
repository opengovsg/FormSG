import { Controller, useForm } from 'react-hook-form'
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Textarea,
} from '@chakra-ui/react'

import { dollarsToCents } from '~utils/payments'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

export const AddProductModal = ({
  onClose,
  amountValidation,
  onAddProduct,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm()

  const watchMultiQtyEnabled = watch('product.multi_qty_enabled', false)
  const handleSaveProduct = handleSubmit(({ product }) => {
    onAddProduct({ ...product, price: dollarsToCents(product.price) })
    onClose()
  })

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Add product/service</ModalHeader>
        <ModalBody>
          <Stack
            spacing={{ base: '1.5rem', md: '2.25rem' }}
            divider={<Divider />}
          >
            <Stack>
              <FormControl>
                <FormLabel isRequired>Name</FormLabel>
                <Input
                  {...register('product.name', { required: true })}
                  isInvalid={!!errors.product?.name}
                />
              </FormControl>

              <FormControl>
                <FormLabel isRequired>Description</FormLabel>
                <Textarea
                  {...register('product.description', { required: true })}
                  isInvalid={!!errors.product?.description}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.product?.price}>
                <FormLabel isRequired>Payment Amount</FormLabel>
                <Controller
                  name="product.price"
                  control={control}
                  rules={amountValidation}
                  render={({ field }) => (
                    <MoneyInput
                      flex={1}
                      step={0}
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                      sx={{ input: { textAlign: 'right' } }}
                    />
                  )}
                />
                <FormErrorMessage>
                  {errors.product?.price?.message}
                </FormErrorMessage>
              </FormControl>
            </Stack>
            <Box>
              <FormControl>
                <Toggle
                  {...register('product.multi_qty_enabled', {
                    // Retrigger validation to remove errors when payment is toggled from enabled -> disabled
                    onChange: () => {
                      //
                    },
                  })}
                  description="Customise the range that users can select from"
                  label="Allow multiple quantities"
                />
              </FormControl>
              <FormControl isDisabled={!watchMultiQtyEnabled}>
                <Flex flexDirection="row">
                  <Input
                    mr="0.5rem"
                    {...register('product.min_qty', {
                      required: watchMultiQtyEnabled,
                    })}
                    isInvalid={errors.product?.min_qty}
                  />
                  <Input
                    {...register('product.max_qty', {
                      required: watchMultiQtyEnabled,
                    })}
                    isInvalid={errors.product?.max_qty}
                  />
                </Flex>
              </FormControl>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" onClick={onClose}>
              Cancel
            </Button>
            <Button loadingText="Saving" onClick={handleSaveProduct}>
              Save product
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
