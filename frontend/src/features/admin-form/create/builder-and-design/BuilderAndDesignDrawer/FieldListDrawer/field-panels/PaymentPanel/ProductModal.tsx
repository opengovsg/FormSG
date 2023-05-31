import { Controller, RegisterOptions, useForm } from 'react-hook-form'
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

import { Product } from '~shared/types'

import { centsToDollars, dollarsToCents, formatCurrency } from '~utils/payments'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useEnv } from '~features/env/queries'

type ProductInput = Product & {
  display_amount: string
}
export const ProductModal = ({
  onClose,
  onSaveProduct,
  product, // pass non-null product to edit
}: {
  onClose: () => void
  onSaveProduct: (product: Product) => void
  product: Product | null
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductInput>(
    product
      ? {
          defaultValues: {
            ...product,
            display_amount: centsToDollars(product.amount_cents ?? 0),
          },
        }
      : undefined,
  )

  const { data: { maxPaymentAmountCents, minPaymentAmountCents } = {} } =
    useEnv()

  const amountValidation: RegisterOptions<ProductInput, 'display_amount'> = {
    validate: (val) => {
      // Validate that it is a money value.
      // Regex allows leading and trailing spaces, max 2dp
      const validateMoney = /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '')
      if (!validateMoney) return 'Please enter a valid payment amount'

      const validateMin =
        !!minPaymentAmountCents &&
        !!val &&
        dollarsToCents(val) >= minPaymentAmountCents
      // Repeat the check on minPaymentAmountCents for correct typing
      if (!!minPaymentAmountCents && !validateMin) {
        return `Please enter a payment amount above ${formatCurrency(
          Number(centsToDollars(minPaymentAmountCents)),
        )}`
      }

      const validateMax =
        !!maxPaymentAmountCents &&
        !!val &&
        dollarsToCents(val) <= maxPaymentAmountCents
      // Repeat the check on maxPaymentAmountCents for correct typing
      if (!!maxPaymentAmountCents && !validateMax) {
        return `Please enter a payment amount below ${formatCurrency(
          Number(centsToDollars(maxPaymentAmountCents)),
        )}`
      }
      return true
    },
  }

  const watchMultiQtyEnabled = watch('multi_qty', false)
  const handleSaveProduct = handleSubmit((product) => {
    const { display_amount, ...rest } = product
    onSaveProduct({ ...rest, amount_cents: dollarsToCents(display_amount) })
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
                  {...register('name', { required: true })}
                  isInvalid={!!errors.name}
                />
              </FormControl>

              <FormControl>
                <FormLabel isRequired>Description</FormLabel>
                <Textarea
                  {...register('description', { required: true })}
                  isInvalid={!!errors.description}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.display_amount}>
                <FormLabel isRequired>Payment Amount</FormLabel>
                <Controller
                  name="display_amount"
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
                  {errors.display_amount?.message}
                </FormErrorMessage>
              </FormControl>
            </Stack>
            <Box>
              <FormControl>
                <Toggle
                  {...register('multi_qty', {
                    // Retrigger validation to remove errors when payment is toggled from enabled -> disabled
                    onChange: () => {
                      //
                    },
                  })}
                  description="Customise the range that users can select from"
                  label="Allow multiple quantities"
                />
              </FormControl>
              <FormControl hidden={!watchMultiQtyEnabled}>
                <Flex flexDirection="row">
                  <Input
                    mr="0.5rem"
                    {...register('min_qty', {
                      required: watchMultiQtyEnabled,
                    })}
                    isInvalid={!!errors.min_qty}
                  />
                  <Input
                    {...register('max_qty', {
                      required: watchMultiQtyEnabled,
                    })}
                    isInvalid={!!errors.max_qty}
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
