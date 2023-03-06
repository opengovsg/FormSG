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

import { FormPaymentsDisplay } from './types'
import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToInactiveSelector,
  usePaymentStore,
} from './usePaymentStore'

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
  } = useForm<FormPaymentsDisplay>({
    mode: 'onChange',
    defaultValues: {
      enabled: paymentsData ? paymentsData.enabled : false,
      target_account_id: paymentsData?.target_account_id,
      description: paymentsData?.description,
      publishable_key: paymentsData?.publishable_key,
      // Change calculate display_amount value from amount_cents
      display_amount: paymentsData?.amount_cents
        ? paymentsData?.amount_cents / 100
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
    (paymentsInputs: FormPaymentsDisplay) => {
      setData({
        enabled: paymentsInputs.enabled,
        target_account_id: paymentsInputs.target_account_id,
        publishable_key: paymentsInputs.publishable_key,
        description: paymentsInputs.description,
        amount_cents: Math.round(
          paymentsInputs.display_amount
            ? paymentsInputs.display_amount * 100
            : 0,
        ),
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

  const maxPaymentAmount = 1000 // due to IRAS requirements and agency financial institutions are expected to be in SG
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const amountValidation: RegisterOptions<
    FormPaymentsDisplay,
    'display_amount'
  > = useMemo(
    () => ({
      validate: {
        validDecimal: (val) => {
          // Check whether input in a valid decimal, avoid mulitple dots
          return (
            (val ?? 0).toString().split('.').length <= 2 ||
            'Please enter a valid decimal'
          )
        },
        twoDecimalPoints: (val) => {
          // Check that the number of decimal places is within 2dp
          const separatedByDots = (val ?? 0).toString().split('.')
          return (
            (separatedByDots[1] ? separatedByDots[1].length : 0) <= 2 ||
            'Please keep your payment amount to 2 decimal places'
          )
        },
        validNumber: (val) => {
          // Check whether input is a valid number, avoid e
          return !isNaN(Number(val)) || 'Please enter a valid number'
        },
      },
      min: {
        value: 0.01,
        message: 'Please enter a positive number',
      },
      max: {
        value: maxPaymentAmount,
        message: `Please keep payment amount under ${currencyFormatter.format(
          maxPaymentAmount,
        )}`,
      },
    }),
    [],
  )

  const handleUpdatePayments = handleSubmit((payments) => {
    return paymentsMutation.mutate(
      payments.enabled
        ? {
            enabled: payments.enabled,
            target_account_id: payments.target_account_id,
            publishable_key: payments.publishable_key,
            description: payments.description,
            amount_cents: payments.display_amount
              ? Math.round(payments.display_amount * 100)
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
              isInvalid={!!errors.display_amount}
            >
              <FormLabel isRequired>Payment Amount</FormLabel>
              <Controller
                name="display_amount"
                control={control}
                rules={amountValidation}
                render={({ field: { ...rest } }) => (
                  <MoneyInput
                    flex={1}
                    inputMode="decimal"
                    placeholder="0.00"
                    {...rest}
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
