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
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../builder-and-design/useDirtyFieldStore'
import { validateNumberInput } from '../builder-and-design/utils/validateNumberInput'
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
    defaultValues: paymentsData,
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

  const amountValidation: RegisterOptions<FormPayments, 'amount_cents'> =
    useMemo(
      () => ({
        validate: {
          validNumber: (val) => {
            // Check whether input is a valid number, avoid e
            return !isNaN(Number(val)) || 'Please enter a valid number'
          },
        },
        min: {
          value: 1,
          message: 'Please enter a positive number',
        },
      }),
      [],
    )

  const handleUpdatePayments = handleSubmit((payments) =>
    paymentsMutation.mutate(payments.enabled ? payments : { enabled: false }, {
      onSuccess: () => {
        setToInactive()
        handleCloseDrawer()
      },
    }),
  )

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
              isInvalid={!!errors.amount_cents}
            >
              <FormLabel isRequired>Amount in cents</FormLabel>
              <Controller
                name="amount_cents"
                control={control}
                rules={amountValidation}
                render={({ field: { onChange, ...rest } }) => (
                  <NumberInput
                    flex={1}
                    inputMode="numeric"
                    showSteppers={false}
                    placeholder="Number of characters"
                    onChange={validateNumberInput(onChange)}
                    {...rest}
                  />
                )}
              />
              <FormErrorMessage>
                {errors.amount_cents?.message}
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
