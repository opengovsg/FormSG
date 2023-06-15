import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  RegisterOptions,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
  useWatch,
} from 'react-hook-form'
import { Link as ReactLink } from 'react-router-dom'
import { useDebounce } from 'react-use'
import { Box, FormControl, HStack, Link, Text } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
  PaymentType,
} from '~shared/types'

import { centsToDollars, dollarsToCents } from '~utils/payments'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import MoneyInput from '~components/MoneyInput'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'
import { usePaymentFieldValidation } from '~features/public-form/components/FormPaymentPage/queries'

import {
  CreatePageDrawerContentContainer,
  useCreatePageSidebar,
} from '../../../../common'
import { FieldListTabIndex } from '../../../constants'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../../../useDirtyFieldStore'
import { FormFieldDrawerActions } from '../../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'

import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToEditingPaymentSelector,
  setToInactiveSelector,
  usePaymentStore,
} from './usePaymentStore'

type FormPaymentsInput = Omit<FormPaymentsField, 'amount_cents'> & {
  display_amount: string
  min_amount: string
  max_amount: string
}

const FixedPaymentAmountField = ({
  isLoading,
  errors,
  isDisabled,
  control,
  input,
}: {
  isLoading: boolean
  isDisabled: boolean
  errors: UseFormReturn<FormPaymentsInput>['formState']['errors']
  control: UseFormReturn<FormPaymentsInput>['control']
  input: FormPaymentsInput
}) => {
  const DISPLAY_AMOUNT_FIELD_KEY = 'display_amount'
  const amountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof DISPLAY_AMOUNT_FIELD_KEY
  > = usePaymentFieldValidation<
    FormPaymentsInput,
    typeof DISPLAY_AMOUNT_FIELD_KEY
  >()
  return (
    <FormControl
      isReadOnly={isLoading}
      isDisabled={isDisabled}
      isInvalid={!!errors[DISPLAY_AMOUNT_FIELD_KEY]}
      isRequired
    >
      <FormLabel isRequired description="Amount should include GST">
        Payment amount
      </FormLabel>
      <Controller
        name={DISPLAY_AMOUNT_FIELD_KEY}
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
        {errors[DISPLAY_AMOUNT_FIELD_KEY]?.message}
      </FormErrorMessage>
      {Number(input[DISPLAY_AMOUNT_FIELD_KEY]) > 1000 ? (
        <InlineMessage variant="warning" mt="2rem" useMarkdown>
          You would need to issue your own invoice for amounts above S$1000.
          [Learn more about
          this](https://guide.form.gov.sg/faq/faq/payments#simplified-tax-invoices-versus-regular-tax-invoices)
        </InlineMessage>
      ) : null}
    </FormControl>
  )
}

const VariablePaymentAmountField = ({
  isLoading,
  errors,
  isDisabled,
  control,
  input,
}: {
  isLoading: boolean
  isDisabled: boolean
  errors: UseFormReturn<FormPaymentsInput>['formState']['errors']
  control: UseFormReturn<FormPaymentsInput>['control']
  input: FormPaymentsInput
}) => {
  const MIN_FIELD_KEY = `min_amount`
  const MAX_FIELD_KEY = `max_amount`

  const minAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MIN_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MIN_FIELD_KEY>({
    lesserThanCents: dollarsToCents(input[MAX_FIELD_KEY] || ''),
  })
  const maxAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MAX_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MAX_FIELD_KEY>({
    greaterThanCents: dollarsToCents(input[MIN_FIELD_KEY] || ''),
  })
  return (
    <FormControl
      isReadOnly={isLoading}
      isDisabled={isDisabled}
      isInvalid={!!errors[MIN_FIELD_KEY] || !!errors[MAX_FIELD_KEY]}
      isRequired
    >
      <FormLabel
        isRequired
        description="Customise the amount that respondents are allowed to define"
      >
        Payment amount limit
      </FormLabel>
      <HStack>
        <Controller
          name={MIN_FIELD_KEY}
          control={control}
          rules={minAmountValidation}
          render={({ field }) => (
            <Input
              flex={1}
              step={0}
              inputMode="decimal"
              placeholder="Minimum amount"
              {...field}
            />
          )}
        />
        <Controller
          name={MAX_FIELD_KEY}
          control={control}
          rules={maxAmountValidation}
          render={({ field }) => (
            <Input
              flex={1}
              step={0}
              inputMode="decimal"
              placeholder="Maximum amount"
              {...field}
            />
          )}
        />
      </HStack>
      <FormErrorMessage>
        {errors[MIN_FIELD_KEY]?.message || errors[MAX_FIELD_KEY]?.message}
      </FormErrorMessage>
    </FormControl>
  )
}

const PaymentInput = ({ isDisabled }: { isDisabled: boolean }) => {
  const { paymentsMutation } = useMutateFormPage()

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

  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
    trigger,
  } = useForm<FormPaymentsInput>({
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
    (paymentsInputs: FormPaymentsInput) => {
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
  }) as UnpackNestedValue<FormPaymentsInput>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(() => handlePaymentsChanges(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  const isUsingPayment = clonedWatchedInputs.enabled

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

  return (
    <CreatePageDrawerContentContainer>
      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isDisabled={isDisabled}
      >
        <Toggle
          {...register('enabled', {
            // Retrigger validation to remove errors when payment is toggled from enabled -> disabled
            onChange: () => isUsingPayment && trigger(),
          })}
          description="Payment field will not be shown when this is toggled off. Respondents can still submit the form."
          label="Enable payment"
        />
      </FormControl>

      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isInvalid={!!errors.description}
        isDisabled={!isUsingPayment}
        isRequired
      >
        <FormLabel description="This will be reflected on the payment invoice">
          Product/service name
        </FormLabel>
        <Input
          placeholder="Product/service name"
          {...register('name', {
            required: isUsingPayment && 'Please enter a payment description',
          })}
        />
        <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
      </FormControl>
      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isInvalid={!!errors.description}
        isDisabled={!isUsingPayment}
        isRequired
      >
        <FormLabel description="This will be reflected on the payment invoice">
          Description
        </FormLabel>
        <Input
          placeholder="Product/service name"
          {...register('description', {
            required: isUsingPayment && 'Please enter a payment description',
          })}
        />
        <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
      </FormControl>

      {paymentsData?.paymentType === PaymentType.Variable ? (
        <VariablePaymentAmountField
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          isDisabled={!isUsingPayment}
          control={control}
          input={clonedWatchedInputs}
        />
      ) : (
        <FixedPaymentAmountField
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          isDisabled={!isUsingPayment}
          control={control}
          input={clonedWatchedInputs}
        />
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
