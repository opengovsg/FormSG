import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  RegisterOptions,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useDebounce } from 'react-use'
import { Box, Divider, Flex, FormControl, Stack, Text } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import { FormPaymentsField } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import { centsToDollars, dollarsToCents } from '~utils/payments'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

import { useEnv } from '../../../env/queries'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../builder-and-design/useDirtyFieldStore'
import {
  CreatePageDrawerContentContainer,
  useCreatePageSidebar,
} from '../common'
import { CreatePageDrawerCloseButton } from '../common/CreatePageDrawer/CreatePageDrawerCloseButton'
import { CreatePageDrawerContainer } from '../common/CreatePageDrawer/CreatePageDrawerContainer'

import { FormPaymentsDisplay } from './types'
import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToInactiveSelector,
  usePaymentStore,
} from './usePaymentStore'

const formatCurrency = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format
/**
 * Description in payment field will be rendered as 'Name' in the Frontend, but kept as description in the backend
 * This is for design purpose as 'Name' conveys clearer information to the users,
 * Whilst description will still be used in the backend for consistency with Stripe's API
 */
const NAME_INFORMATION = 'Name will be reflected on payment receipt'

export const PaymentInput = ({
  isDisabled,
}: {
  isDisabled: boolean
}): JSX.Element => {
  const isMobile = useIsMobile()
  const { paymentsMutation } = useMutateFormPage()

  const { data: { maxPaymentAmountCents, minPaymentAmountCents } = {} } =
    useEnv()

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { paymentsData, setData, setToInactive } = usePaymentStore(
    useCallback(
      (state) => ({
        paymentsData: dataSelector(state),
        setData: setDataSelector(state),
        setToInactive: setToInactiveSelector(state),
      }),
      [],
    ),
  )

  // unpack payment data for paymentAmount if it exists
  const paymentAmountCents = paymentsData?.amount_cents

  const { handleClose } = useCreatePageSidebar()

  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
  } = useForm<FormPaymentsDisplay>({
    mode: 'onChange',
    defaultValues: {
      ...paymentsData,
      // Change calculate display_amount value from amount_cents
      display_amount: centsToDollars(paymentAmountCents ?? 0),
    },
  })

  // Update dirty state of payment so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length !== 0)

    return () => {
      setIsDirty(false)
    }
  }, [dirtyFields, setIsDirty])

  const handlePaymentsChanges = useCallback(
    (paymentsInputs: FormPaymentsDisplay) => {
      const { display_amount, ...rest } = paymentsInputs
      setData({
        ...rest,
        amount_cents: dollarsToCents(display_amount ?? '0'),
      } as FormPaymentsField)
    },
    [setData],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormPaymentsDisplay>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  const watchedEnabled = useMemo(
    () => clonedWatchedInputs.enabled,
    [clonedWatchedInputs.enabled],
  )

  useDebounce(() => handlePaymentsChanges(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  const handleCloseDrawer = useCallback(() => handleClose(false), [handleClose])

  const amountValidation: RegisterOptions<
    FormPaymentsDisplay,
    'display_amount'
  > = useMemo(
    () => ({
      validate: {
        validateMoney: (val) => {
          return (
            /* Regex allows: 
               - leading and trailing spaces
               - max 2dp
            */
            /^\s*(\d+)(\.\d{0,2})?\s*$/.test(val ?? '') ||
            'Please enter a valid payment amount'
          )
        },
        validateMin: (val) => {
          if (minPaymentAmountCents === undefined) return true
          return (
            // val is in dollars
            (val && dollarsToCents(val) >= minPaymentAmountCents) ||
            `Please enter a payment amount above ${formatCurrency(
              Number(centsToDollars(minPaymentAmountCents)),
            )}`
          )
        },
        validateMax: (val) => {
          if (maxPaymentAmountCents === undefined) return true
          return (
            // val is in dollars
            (val && dollarsToCents(val) <= maxPaymentAmountCents) ||
            `Please enter a payment amount below ${formatCurrency(
              Number(centsToDollars(maxPaymentAmountCents)),
            )}`
          )
        },
      },
    }),
    [maxPaymentAmountCents, minPaymentAmountCents],
  )

  const handleUpdatePayments = handleSubmit(() => {
    if (isDisabled || !paymentsData) {
      // do not mutate if payments is disabled or unavailable
      return () => {
        setToInactive()
        handleCloseDrawer()
      }
    }
    return paymentsMutation.mutate(
      { ...paymentsData, amount_cents: paymentAmountCents },
      {
        onSuccess: () => {
          setToInactive()
          handleCloseDrawer()
        },
      },
    )
  })

  const paymentToggleLabel = 'Enable Payment'

  return (
    <CreatePageDrawerContentContainer>
      <Stack gap="2rem">
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isDisabled={isDisabled}
        >
          {isDisabled ? (
            <Toggle value={1} label={paymentToggleLabel} />
          ) : (
            <Toggle {...register('enabled')} label={paymentToggleLabel} />
          )}
        </FormControl>

        {watchedEnabled && (
          <>
            <FormControl
              isReadOnly={paymentsMutation.isLoading}
              isInvalid={!!errors.description}
              isRequired
              isDisabled={isDisabled}
            >
              <FormLabel description={NAME_INFORMATION}>Name</FormLabel>
              <Input
                {...register('description', {
                  required: 'Please enter a payment description',
                })}
              />
              <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
            </FormControl>
            <Divider />
            <FormControl
              isReadOnly={paymentsMutation.isLoading}
              isInvalid={!!errors.display_amount}
              isDisabled={isDisabled}
            >
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
                  />
                )}
              />
              <FormErrorMessage>
                {errors.display_amount?.message}
              </FormErrorMessage>
            </FormControl>
          </>
        )}
      </Stack>

      <Stack
        direction={{ base: 'column', md: 'row-reverse' }}
        justifyContent="end"
        spacing="1rem"
      >
        <Button
          isFullWidth={isMobile}
          onClick={handleUpdatePayments}
          isLoading={paymentsMutation.isLoading}
          isDisabled={isDisabled}
        >
          Save payment settings
        </Button>
        <Button
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="secondary"
          isDisabled={paymentsMutation.isLoading}
          onClick={handleCloseDrawer}
        >
          Cancel
        </Button>
      </Stack>
    </CreatePageDrawerContentContainer>
  )
}

type PaymentDrawerProps = {
  isEncryptMode: boolean
  isStripeConnected: boolean
  paymentsField?: FormPaymentsField
}

export const PaymentDrawer = ({
  isEncryptMode,
  isStripeConnected,
  paymentsField,
}: PaymentDrawerProps): JSX.Element | null => {
  const { paymentData, setData, resetData } = usePaymentStore(
    useCallback(
      (state) => ({
        paymentData: dataSelector(state),
        setData: setDataSelector(state),
        resetData: resetDataSelector(state),
      }),
      [],
    ),
  )

  useEffect(() => {
    setData(paymentsField)
    return resetData
  }, [paymentsField, resetData, setData])

  const paymentDisabledMessage = !isEncryptMode
    ? 'Payments are not available in email mode forms.'
    : !isStripeConnected
    ? 'Connect your Stripe account in Settings.'
    : ''

  // payment eligibility will be dependent on whether paymentDisabledMessage is non empty
  const isPaymentDisabled = !!paymentDisabledMessage

  // Allows for payment data refresh in encrypt mode
  if (!paymentData && !isPaymentDisabled) return null

  return (
    <CreatePageDrawerContainer>
      {isPaymentDisabled && (
        <Box px="1.5rem" pt="2rem" pb="1.5rem">
          <InlineMessage variant={'info'}>
            <Text>{paymentDisabledMessage}</Text>
          </InlineMessage>
        </Box>
      )}
      <Flex pos="relative" h="100%" display="flex" flexDir="column">
        <Box pt="1rem" px="1.5rem" bg="white">
          <Flex justify="space-between">
            <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
              Edit payment
            </Text>
            <CreatePageDrawerCloseButton />
          </Flex>
          <Divider w="auto" mx="-1.5rem" />
        </Box>
        <PaymentInput isDisabled={isPaymentDisabled} />
      </Flex>
    </CreatePageDrawerContainer>
  )
}
