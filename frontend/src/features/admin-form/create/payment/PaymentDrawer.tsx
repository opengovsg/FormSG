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

import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToInactiveSelector,
  usePaymentStore,
} from './usePaymentStore'
import { validateMoneyInput } from './validateMoneyInput'

export const PaymentInput = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { paymentsMutation } = useMutateFormPage()

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

  const { handleClose } = useCreatePageSidebar()

  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
  } = useForm<FormPayments>({
    mode: 'onBlur',
    defaultValues: {
      ...paymentsData,
      // Change payment_amount value to 2 decimal places temporarily for the form
      payment_amount: paymentsData?.payment_amount
        ? paymentsData?.payment_amount / 100
        : 0,
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
    (paymentsInputs) => {
      setData({ ...(paymentsInputs as FormPayments) })
    },
    [setData],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormPayments>

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

  const amountValidation: RegisterOptions<FormPayments, 'payment_amount'> =
    useMemo(
      () => ({
        validate: {
          validNumber: (val) => {
            // Check whether input is a valid number, avoid e
            return !isNaN(Number(val)) || 'Please enter a valid number'
          },
        },
        min: {
          value: 0.01,
          message: 'Please enter a positive number',
        },
      }),
      [],
    )

  const handleUpdatePayments = handleSubmit((payments) => {
    return paymentsMutation.mutate(
      payments.enabled
        ? {
            ...payments,
            // Change payment_amount value back to integer for value to be saved in cents
            payment_amount: payments.payment_amount
              ? Math.round(payments.payment_amount * 100)
              : 0,
          }
        : { enabled: false },
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
              isInvalid={!!errors.payment_amount}
            >
              <FormLabel isRequired>Payment Amount</FormLabel>
              <Controller
                name="payment_amount"
                control={control}
                rules={amountValidation}
                render={({ field: { onChange, ...rest } }) => (
                  <MoneyInput
                    flex={1}
                    inputMode="decimal"
                    placeholder="0.00"
                    onChange={validateMoneyInput(onChange)}
                    {...rest}
                  />
                )}
              />
              <FormErrorMessage>
                {errors.payment_amount?.message}
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

            <FormControl
              isRequired
              isReadOnly={paymentsMutation.isLoading}
              isInvalid={!!errors.target_account_id}
            >
              <FormLabel>Target account ID</FormLabel>
              <Textarea {...register('target_account_id')} />
              <FormErrorMessage>
                {errors?.target_account_id?.message}
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
