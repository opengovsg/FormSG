import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'

import { Product, StorageFormSettings } from '~shared/types'
import {
  centsToDollars,
  dollarsToCents,
  formatCurrency,
} from '~shared/utils/payments'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'
import { useEnv } from '~features/env/queries'

type ProductInput = Product & {
  display_amount: string
}

const MIN_QTY_KEY = `min_qty`
const MAX_QTY_KEY = `max_qty`
const DISPLAY_AMOUNT_KEY = 'display_amount'
const MULTI_QTY_KEY = 'multi_qty'

const parseIntElseNull = (val: string) => {
  const parsedInt = parseInt(val, 10)
  return Number.isNaN(parsedInt) ? null : parsedInt
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
    trigger,
    getValues,
  } = useForm<ProductInput>({
    defaultValues: product
      ? {
          ...product,
          display_amount: centsToDollars(product.amount_cents ?? 0),
        }
      : {
          [MULTI_QTY_KEY]: false,
          [MIN_QTY_KEY]: 1,
          [MAX_QTY_KEY]: 99,
        },
    mode: 'all',
  })

  const isMobile = useIsMobile()

  const {
    data: {
      maxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()

  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()
  const hasGST =
    (settings as StorageFormSettings)?.payments_field.gst_enabled ?? false

  const amountValidation: RegisterOptions<
    ProductInput,
    typeof DISPLAY_AMOUNT_KEY
  > = {
    validate: (val) => {
      // Validate that it is a money value.
      // Regex allows leading and trailing spaces, max 2dp
      const validateMoney = /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '')
      if (!validateMoney)
        return `Enter an amount between S${formatCurrency(
          Number(centsToDollars(minPaymentAmountCents)),
        )} and S${formatCurrency(
          Number(centsToDollars(maxPaymentAmountCents)),
        )}`

      const validateMin = !!val && dollarsToCents(val) >= minPaymentAmountCents
      // Repeat the check on minPaymentAmountCents for correct typing
      if (!!minPaymentAmountCents && !validateMin) {
        return `The minimum amount is S${formatCurrency(
          Number(centsToDollars(minPaymentAmountCents)),
        )}`
      }

      const validateMax = !!val && dollarsToCents(val) <= maxPaymentAmountCents
      // Repeat the check on maxPaymentAmountCents for correct typing
      if (!!maxPaymentAmountCents && !validateMax) {
        return `The maximum amount is S${formatCurrency(
          Number(centsToDollars(maxPaymentAmountCents)),
        )}`
      }
      return true
    },
  }

  const watchMultiQtyEnabled = watch(MULTI_QTY_KEY, product?.multi_qty ?? false)
  const handleSaveProduct = handleSubmit((product) => {
    const { display_amount, _id, ...rest } = product
    onSaveProduct({
      ...rest,
      // TODO: can this be undefined? Since Product may be null
      _id: _id as Product['_id'], // react-hook-form types might have undone the Opaque type
      amount_cents: dollarsToCents(display_amount),
    })
    onClose()
  })

  const minQtyValidation: RegisterOptions = {
    validate: (valStr: string) => {
      if (!getValues(MULTI_QTY_KEY)) return true

      const valNumber = parseIntElseNull(valStr)
      if (!valNumber || valNumber <= 0) {
        return 'Enter a value greater than 0'
      }

      const maxNumber =
        parseIntElseNull(getValues(MAX_QTY_KEY) as unknown as string) ||
        Number.MAX_SAFE_INTEGER

      if (valNumber > maxNumber) {
        return 'Enter a value smaller than the maximum quantity'
      }
      return true
    },
  }
  const maxQtyValidation: RegisterOptions = {
    validate: (valStr: string) => {
      if (!getValues(MULTI_QTY_KEY)) return true

      const valNumber = parseIntElseNull(valStr)
      if (!valNumber || valNumber <= 0) {
        return 'Enter a value greater than 0'
      }

      const amount = dollarsToCents(getValues(DISPLAY_AMOUNT_KEY) ?? '')

      if (valNumber * amount > maxPaymentAmountCents) {
        const maxQty = Math.floor(maxPaymentAmountCents / amount)
        if (maxQty <= 0) {
          return `Quantity limit could not be set because amount is above S${formatCurrency(
            Number(centsToDollars(maxPaymentAmountCents)),
          )}`
        }
        return `The maximum quantity for this amount is ${maxQty}`
      }
      const minNumber =
        parseIntElseNull(getValues(MIN_QTY_KEY) as unknown as string) ||
        Number.MIN_SAFE_INTEGER

      if (valNumber < minNumber) {
        return 'Enter a value greater than the minimum quantity'
      }
      return true
    },
  }
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal isOpen onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{product ? 'Edit' : 'Add'} product/service</ModalHeader>
        <ModalBody>
          <Stack spacing={{ base: '1rem', md: '1.5rem' }} divider={<Divider />}>
            <Stack mb="0.5rem">
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
            </Stack>

            <Box my="0.5rem">
              <FormControl isInvalid={!!errors.display_amount}>
                <Skeleton isLoaded={!isLoadingSettings}>
                  <FormLabel
                    isRequired
                    description={hasGST ? 'Including GST' : undefined}
                  >
                    Amount
                  </FormLabel>
                </Skeleton>
                <Skeleton isLoaded={!isLoadingSettings}>
                  <Controller
                    name={DISPLAY_AMOUNT_KEY}
                    control={control}
                    rules={amountValidation}
                    render={({ field }) => (
                      <MoneyInput
                        flex={1}
                        step={0}
                        inputMode="decimal"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          trigger([
                            MIN_QTY_KEY,
                            MAX_QTY_KEY,
                            DISPLAY_AMOUNT_KEY,
                          ])
                        }}
                      />
                    )}
                  />
                  <FormErrorMessage>
                    {errors.display_amount?.message}
                  </FormErrorMessage>
                </Skeleton>
              </FormControl>
            </Box>
            <Box mt="0.5rem">
              <FormControl>
                <Controller
                  name={MULTI_QTY_KEY}
                  control={control}
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Toggle
                      {...rest}
                      isChecked={value}
                      onChange={(e) => {
                        onChange(e)
                        trigger([MIN_QTY_KEY, MAX_QTY_KEY, DISPLAY_AMOUNT_KEY])
                      }}
                      label="Quantity limit"
                      description="Set the minimum and maximum quantities respondents can select"
                    />
                  )}
                />
              </FormControl>
              <FormControl
                hidden={!watchMultiQtyEnabled}
                isInvalid={!!errors[MIN_QTY_KEY] || !!errors[MAX_QTY_KEY]}
              >
                <Flex flexDirection="row" mt="0.5rem">
                  <FormControl
                    isInvalid={!!errors[MIN_QTY_KEY]}
                    isDisabled={!watchMultiQtyEnabled}
                    mr="0.5rem"
                  >
                    <FormLabel isRequired>Minimum quantity</FormLabel>
                    <Controller
                      name={MIN_QTY_KEY}
                      control={control}
                      rules={minQtyValidation}
                      render={({ field }) => (
                        <Input
                          {...register(MIN_QTY_KEY, {
                            required:
                              watchMultiQtyEnabled &&
                              'The minimum quantity is 1',
                          })}
                          isInvalid={!!errors[MIN_QTY_KEY]}
                          placeholder={'1'}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            trigger([
                              MIN_QTY_KEY,
                              MAX_QTY_KEY,
                              DISPLAY_AMOUNT_KEY,
                            ])
                          }}
                        />
                      )}
                    />
                  </FormControl>
                  <FormControl
                    isInvalid={!!errors[MAX_QTY_KEY]}
                    isDisabled={!watchMultiQtyEnabled}
                  >
                    <FormLabel isRequired>Maximum quantity</FormLabel>
                    <Controller
                      name={MAX_QTY_KEY}
                      control={control}
                      rules={maxQtyValidation}
                      render={({ field }) => (
                        <Input
                          {...register(MAX_QTY_KEY, {
                            required:
                              watchMultiQtyEnabled &&
                              'Enter a maximum quantity',
                          })}
                          isInvalid={!!errors[MAX_QTY_KEY]}
                          placeholder={'99'}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            trigger([
                              MIN_QTY_KEY,
                              MAX_QTY_KEY,
                              DISPLAY_AMOUNT_KEY,
                            ])
                          }}
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
          <Stack
            w="100%"
            direction={{ base: 'column-reverse', md: 'row' }}
            justifyContent={{ md: 'right' }}
          >
            <Button variant="clear" onClick={onClose} isFullWidth={isMobile}>
              Cancel
            </Button>
            <Button
              loadingText="Saving"
              onClick={handleSaveProduct}
              isDisabled={Object.keys(errors).length > 0}
              isFullWidth={isMobile}
            >
              Save product
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
