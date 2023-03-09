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

import { FormPayments } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import { centsToDollars, dollarsToCents } from '~utils/payments'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import MoneyInput from '~components/MoneyInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

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

export const PaymentInput = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { paymentsMutation } = useMutateFormPage()

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const {
    paymentsData: { amount_cents: paymentAmountCents, ...paymentCommon },
    setData,
    setToInactive,
  } = usePaymentStore(
    useCallback(
      (state) => ({
        paymentsData: dataSelector(state),
        setData: setDataSelector(state),
        setToInactive: setToInactiveSelector(state),
      }),
      [],
    ),
  )

  const { handleClose } = useCreatePageSidebar()

  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
  } = useForm<FormPaymentsDisplay>({
    mode: 'onChange',
    defaultValues: {
      ...paymentCommon,
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
      } as FormPayments)
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

  const minPaymentAmount = 0.5 // stipulated by Stripe
  const maxPaymentAmount = 1000 // due to IRAS requirements and agency financial institutions are expected to be in SG

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
               - strictly positive (>0)
            */
            /^\s*0*([1-9]\d*(\.\d{0,2})?|0\.(0[1-9]|[1-9]\d?))\s*$/.test(
              val ?? '',
            ) || 'Please enter a valid payment amount'
          )
        },
        validateMin: (val) => {
          return (
            Number(val?.trim()) >= minPaymentAmount ||
            `Please enter a payment amount above ${formatCurrency(
              minPaymentAmount,
            )}`
          )
        },
        validateMax: (val) => {
          return (
            Number(val?.trim()) <= maxPaymentAmount ||
            `Please keep payment amount under ${formatCurrency(
              maxPaymentAmount,
            )}`
          )
        },
      },
    }),
    [],
  )

  const handleUpdatePayments = handleSubmit(() => {
    return paymentsMutation.mutate(
      { ...paymentCommon, amount_cents: paymentAmountCents },
      {
        onSuccess: () => {
          setToInactive()
          handleCloseDrawer()
        },
      },
    )
  })

  return (
    <CreatePageDrawerContentContainer>
      <Stack gap="2rem">
        <FormControl isReadOnly={paymentsMutation.isLoading}>
          <Toggle {...register('enabled')} label="Enable payment" />
        </FormControl>

        {watchedEnabled && (
          <>
            <FormControl
              isReadOnly={paymentsMutation.isLoading}
              isInvalid={!!errors.display_amount}
            >
              <FormLabel isRequired>Payment Amount</FormLabel>
              <Controller
                name="display_amount"
                control={control}
                rules={amountValidation}
                render={({ field }) => (
                  <MoneyInput
                    flex={1}
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

            <FormControl
              isReadOnly={paymentsMutation.isLoading}
              isInvalid={!!errors.description}
            >
              <FormLabel>Description</FormLabel>
              <Textarea {...register('description')} />
              <FormErrorMessage>
                {errors?.description?.message}
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
        >
          Save payment settings
        </Button>
        <Button
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="secondary"
          isDisabled={paymentsMutation.isLoading}
          onClick={() => handleCloseDrawer()}
        >
          Cancel
        </Button>
      </Stack>
    </CreatePageDrawerContentContainer>
  )
}

export const PaymentDrawer = (): JSX.Element | null => {
  const { data: form } = useAdminForm()
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
    setData(form?.payments)
    return resetData
  }, [form?.payments, resetData, setData])

  if (!paymentData) return null

  return (
    <CreatePageDrawerContainer>
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
        <PaymentInput />
      </Flex>
    </CreatePageDrawerContainer>
  )
}
