import { useMemo } from 'react'
import { Controller, RegisterOptions, useForm, useWatch } from 'react-hook-form'
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
import { cloneDeep } from 'lodash'

import { Product } from '~shared/types'
import {
  centsToDollars,
  dollarsToCents,
  formatCurrency,
} from '~shared/utils/payments'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useEnv } from '~features/env/queries'

type ProductInput = Product & {
  display_amount: string
}

const MIN_QTY_KEY = `min_qty`
const MAX_QTY_KEY = `max_qty`
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

  const watchedInputs = useWatch({
    control,
  }) as ProductInput

  // trigger a re-render on children by failing the shallow comparator
  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  const {
    data: {
      maxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()

  const amountValidation: RegisterOptions<ProductInput, 'display_amount'> = {
    validate: (val) => {
      // Validate that it is a money value.
      // Regex allows leading and trailing spaces, max 2dp
      const validateMoney = /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '')
      if (!validateMoney) return 'Please enter a valid payment amount'

      const validateMin = !!val && dollarsToCents(val) >= minPaymentAmountCents
      // Repeat the check on minPaymentAmountCents for correct typing
      if (!!minPaymentAmountCents && !validateMin) {
        return `Please enter a payment amount above ${formatCurrency(
          Number(centsToDollars(minPaymentAmountCents)),
        )}`
      }

      const validateMax = !!val && dollarsToCents(val) <= maxPaymentAmountCents
      // Repeat the check on maxPaymentAmountCents for correct typing
      if (!!maxPaymentAmountCents && !validateMax) {
        return `Please enter a payment amount below ${formatCurrency(
          Number(centsToDollars(maxPaymentAmountCents)),
        )}`
      }

      if (
        dollarsToCents(val) * clonedWatchedInputs.max_qty >
        maxPaymentAmountCents
      ) {
        return 'Item and Quantity exceeded limit. Either lower your quantity or lower payment amount.'
      }
      return true
    },
  }

  const watchMultiQtyEnabled = watch('multi_qty', product?.multi_qty ?? false)
  const handleSaveProduct = handleSubmit((product) => {
    const { display_amount, ...rest } = product
    onSaveProduct({ ...rest, amount_cents: dollarsToCents(display_amount) })
    onClose()
  })

  const minQtyValidation: RegisterOptions<ProductInput, typeof MIN_QTY_KEY> = {
    validate: (val) => {
      if (val <= 0) {
        return 'Please enter a value greater than 0'
      }
      if (val > clonedWatchedInputs[MAX_QTY_KEY]) {
        return 'Please enter a value smaller than the maximum quantity'
      }
      return true
    },
  }
  const maxQtyValidation: RegisterOptions<ProductInput, typeof MAX_QTY_KEY> = {
    validate: (val) => {
      if (val <= 0) {
        return 'Please enter a value greater than 0'
      }

      if (val * clonedWatchedInputs.amount_cents > maxPaymentAmountCents) {
        return 'Item and Quantity exceeded limit. Either lower your quantity or lower payment amount.'
      }
      if (val < clonedWatchedInputs[MIN_QTY_KEY]) {
        return 'Please enter a value greater than the minimum quantity'
      }
      return true
    },
  }

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
              <FormControl isInvalid={!!errors.name} pb="1.5rem">
                <FormLabel
                  isRequired
                  description="This will appear on proof of payment"
                >
                  Product/service name
                </FormLabel>
                <Input
                  {...register('name', { required: 'This field is required' })}
                  isInvalid={!!errors.name}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Input
                  {...register('description')}
                  isInvalid={!!errors.description}
                />
                <FormErrorMessage>
                  {errors.description?.message}
                </FormErrorMessage>
              </FormControl>

              <Divider py="1.5rem" />
              <FormControl isInvalid={!!errors.display_amount}>
                <FormLabel isRequired description="Including GST">
                  Amount
                </FormLabel>
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
                  {...register('multi_qty')}
                  description="Customise the range that users can select from"
                  label="Allow multiple quantities"
                />
              </FormControl>
              <FormControl
                hidden={!watchMultiQtyEnabled}
                isInvalid={!!errors[MIN_QTY_KEY] || !!errors[MAX_QTY_KEY]}
              >
                <Flex flexDirection="row">
                  <FormControl
                    isInvalid={!!errors[MIN_QTY_KEY]}
                    isDisabled={!watchMultiQtyEnabled}
                    mr="0.5rem"
                  >
                    <Controller
                      name={MIN_QTY_KEY}
                      control={control}
                      rules={minQtyValidation}
                      render={({ field }) => (
                        <Input
                          {...register(MIN_QTY_KEY, {
                            required: watchMultiQtyEnabled,
                          })}
                          isInvalid={!!errors.min_qty}
                          {...field}
                        />
                      )}
                    />
                  </FormControl>
                  <FormControl
                    isInvalid={!!errors[MAX_QTY_KEY]}
                    isDisabled={!watchMultiQtyEnabled}
                  >
                    <Controller
                      name={MAX_QTY_KEY}
                      control={control}
                      rules={maxQtyValidation}
                      render={({ field }) => (
                        <Input
                          {...register(MAX_QTY_KEY, {
                            required: watchMultiQtyEnabled,
                          })}
                          isInvalid={!!errors.max_qty}
                          {...field}
                        />
                      )}
                    />
                  </FormControl>
                </Flex>
                <FormErrorMessage>
                  {errors[MIN_QTY_KEY]?.message}
                </FormErrorMessage>
                <FormErrorMessage>
                  {errors[MAX_QTY_KEY]?.message}
                </FormErrorMessage>
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
