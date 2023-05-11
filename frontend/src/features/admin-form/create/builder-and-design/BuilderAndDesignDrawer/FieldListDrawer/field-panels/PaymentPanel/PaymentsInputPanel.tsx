import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  RegisterOptions,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { Link as ReactLink } from 'react-router-dom'
import { useDebounce } from 'react-use'
import { Box, FormControl, Link, Text } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
} from '~shared/types'

import { centsToDollars, dollarsToCents, formatCurrency } from '~utils/payments'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'
import { useEnv } from '~features/env/queries'

import {
  CreatePageDrawerContentContainer,
  useCreatePageSidebar,
} from '../../../../../common'
import { FieldListTabIndex } from '../../../../constants'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../../../../useDirtyFieldStore'
import { FormFieldDrawerActions } from '../../../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'

import { ProductServiceBoxv2 } from './v2/ProductServiceBox'
import { ProductServiceBox } from './ProductServiceBox'
import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToEditingPaymentSelector,
  setToInactiveSelector,
  usePaymentStore,
} from './usePaymentStore'

export type FormPaymentsInput = FormPaymentsField & {
  display_amount: string
}

export const PaymentInput = ({ isDisabled }: { isDisabled: boolean }) => {
  const { paymentsMutation } = useMutateFormPage()
  // #TODO: check this from beta flags?
  const PAYMENT_VERSION = 2

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { paymentsData, setData, setToInactive } = usePaymentStore((state) => ({
    paymentsData: dataSelector(state),
    setData: setDataSelector(state),
    setToInactive: setToInactiveSelector(state),
  }))

  const { setFieldListTabIndex } = useCreatePageSidebar()

  const handleClose = () => setFieldListTabIndex(FieldListTabIndex.Basic)

  // unpack payment data for paymentAmount if it exists
  const paymentAmountCents = paymentsData?.amount_cents

  const paymentDocumentVersion = PAYMENT_VERSION === 2 ? 2 : 1
  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
    trigger,
    setValue,
  } = useForm<FormPaymentsInput>({
    mode: 'onChange',
    defaultValues: {
      ...paymentsData,
      version: paymentDocumentVersion,
      // Change calculate display_amount value from amount_cents
      display_amount: centsToDollars(paymentAmountCents ?? 0),
    },
  })

  if (PAYMENT_VERSION === 2) {
    register('products')
  }

  // Update dirty state of payment so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length !== 0)

    return () => {
      setIsDirty(false)
    }
  }, [dirtyFields, setIsDirty])

  const handlePaymentsChanges = useCallback(
    (paymentsInputs: FormPaymentsInput) => {
      const { display_amount, ...rest } = paymentsInputs
      console.log({ paymentsInputs })
      setData({
        ...rest,
        amount_cents: dollarsToCents(display_amount ?? '0'),
      } as FormPaymentsField)
    },
    [setData],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormPaymentsInput>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(() => handlePaymentsChanges(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  const paymentIsEnabled = clonedWatchedInputs.enabled

  const handleUpdatePayments = handleSubmit(() => {
    if (isDisabled || !paymentsData) {
      // do not mutate if payments is disabled or unavailable
      return () => {
        setToInactive()
        handleClose()
      }
    }
    return paymentsMutation.mutate(
      { ...paymentsData, amount_cents: paymentAmountCents },
      {
        onSuccess: () => {
          setToInactive()
          handleClose()
        },
      },
    )
  })

  const { data: { maxPaymentAmountCents, minPaymentAmountCents } = {} } =
    useEnv()
  const amountValidation: RegisterOptions<FormPaymentsInput, 'display_amount'> =
    {
      validate: (val) => {
        if (!paymentIsEnabled) return true

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

  return (
    <CreatePageDrawerContentContainer>
      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isDisabled={isDisabled}
      >
        <Toggle
          {...register('enabled', {
            // Retrigger validation to remove errors when payment is toggled from enabled -> disabled
            onChange: () => paymentIsEnabled && trigger(),
          })}
          description="Payment field will not be shown when this is toggled off. Respondents can still submit the form."
          label="Enable payment"
        />
      </FormControl>

      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isRequired
        isDisabled={!paymentIsEnabled}
      >
        <FormLabel isRequired>Title</FormLabel>
        <Input
          {...register('description', {
            required: paymentIsEnabled,
          })}
        />
      </FormControl>
      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isInvalid={!!errors.display_amount}
        isDisabled={!paymentIsEnabled}
        isRequired
      >
        <FormLabel isRequired description="Amount should include GST">
          Payment amount
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
      </FormControl>
      {PAYMENT_VERSION === 2 ? (
        <ProductServiceBoxv2
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          paymentIsEnabled={paymentIsEnabled}
          setValue={(newProducts) => setValue('products', newProducts)}
        />
      ) : (
        <ProductServiceBox
          register={register}
          paymentsMutation={paymentsMutation}
          errors={errors}
          paymentIsEnabled={paymentIsEnabled}
        />
      )}
      {PAYMENT_VERSION === 2 ? (
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isDisabled={!paymentIsEnabled}
        >
          <Toggle
            {...register('products_meta.multi_product', {
              onChange: () => paymentIsEnabled,
            })}
            label="Allow selection of multiple types of products/services"
          />
        </FormControl>
      ) : (
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isInvalid={!!errors.display_amount}
          isDisabled={!paymentIsEnabled}
          isRequired
        >
          <FormLabel isRequired>Payment amount</FormLabel>
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
          <FormErrorMessage>{errors.display_amount?.message}</FormErrorMessage>
        </FormControl>
      )}

      <FormFieldDrawerActions
        isLoading={paymentsMutation.isLoading}
        handleClick={handleUpdatePayments}
        handleCancel={handleClose}
        buttonText="Save field"
        isDisabled={isDisabled}
      />
    </CreatePageDrawerContentContainer>
  )
}

export const PaymentsInputPanel = (): JSX.Element | null => {
  const { data: form } = useAdminForm()

  const isEncryptMode = form?.responseMode === FormResponseMode.Encrypt
  const isStripeConnected =
    isEncryptMode && form.payments_channel.channel === PaymentChannel.Stripe
  const paymentsField = isEncryptMode ? form.payments_field : undefined

  const {
    paymentsData,
    setToEditingPayment,
    setToInactive,
    setData,
    resetData,
  } = usePaymentStore((state) => ({
    paymentsData: dataSelector(state),
    setToEditingPayment: setToEditingPaymentSelector(state),
    setToInactive: setToInactiveSelector(state),
    setData: setDataSelector(state),
    resetData: resetDataSelector(state),
  }))

  useEffect(() => {
    setToEditingPayment()
    setData(paymentsField)
    return () => {
      resetData()
      setToInactive()
    }
  }, [paymentsField, resetData, setData, setToEditingPayment, setToInactive])

  const paymentDisabledMessage = !isEncryptMode ? (
    <Text>Payments are not available in email mode forms.</Text>
  ) : !isStripeConnected ? (
    <Text>
      Connect your Stripe account in{' '}
      <Link as={ReactLink} to={`settings/payments`}>
        Settings
      </Link>{' '}
      to add payment field.
    </Text>
  ) : null

  // payment eligibility will be dependent on whether paymentDisabledMessage is non empty
  const isPaymentDisabled = !!paymentDisabledMessage

  if (isEncryptMode && !paymentsData) return null

  return (
    <>
      {isPaymentDisabled && (
        <Box px="1.5rem" pt="2rem" pb="1.5rem">
          <InlineMessage variant="info">{paymentDisabledMessage}</InlineMessage>
        </Box>
      )}
      <PaymentInput isDisabled={isPaymentDisabled} />
    </>
  )
}
