import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { Link as ReactLink } from 'react-router-dom'
import { useDebounce } from 'react-use'
import { Box, FormControl, Link, Stack, Text } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
  PaymentType,
} from '~shared/types'

import { ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE } from '~constants/routes'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useSessionStorage } from '~hooks/useSessionStorage'
import { centsToDollars, dollarsToCents } from '~utils/payments'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

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
import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToEditingPaymentSelector,
  setToInactiveSelector,
  usePaymentStore,
} from '../usePaymentStore'

import { FixedPaymentAmountField } from './FixedPaymentAmountField'
import { VariablePaymentAmountField } from './VariablePaymentAmountField'

export type FormPaymentsInput = Omit<
  FormPaymentsField,
  'amount_cents' | 'min_amount' | 'max_amount'
> & {
  display_amount: string
  display_min_amount: string
  display_max_amount: string
}

const PaymentInput = ({
  isDisabled,
  isEncryptMode,
}: {
  isDisabled: boolean
  isEncryptMode: boolean
}) => {
  const { paymentsMutation } = useMutateFormPage()

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { paymentsData, setData, setToInactive } = usePaymentStore((state) => ({
    paymentsData: dataSelector(state),
    setData: setDataSelector(state),
    setToInactive: setToInactiveSelector(state),
  }))

  const { setFieldListTabIndex } = useCreatePageSidebar()

  const handleClose = () => setFieldListTabIndex(FieldListTabIndex.Basic)

  const [, setisAdminFeedbackEligible] = useSessionStorage<boolean>(
    ADMIN_FEEDBACK_SESSION_KEY,
  )

  // unpack payment data for paymentAmount if it exists
  const formDefaultValues =
    paymentsData?.payment_type === PaymentType.Variable
      ? {
          display_min_amount: centsToDollars(paymentsData?.min_amount ?? 0),
          display_max_amount: centsToDollars(paymentsData?.max_amount ?? 0),
        }
      : { display_amount: centsToDollars(paymentsData?.amount_cents ?? 0) }
  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
  } = useForm<FormPaymentsInput>({
    mode: 'onChange',
    defaultValues: {
      ...paymentsData,
      ...formDefaultValues,
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
      const {
        display_amount,
        display_min_amount,
        display_max_amount,
        ...rest
      } = paymentsInputs
      setData({
        ...rest,
        min_amount: dollarsToCents(display_min_amount ?? '0'),
        max_amount: dollarsToCents(display_max_amount ?? '0'),
        amount_cents: dollarsToCents(display_amount ?? '0'),
      })
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

  const handleUpdatePayments = handleSubmit(() => {
    if (isDisabled || !paymentsData) {
      // do not mutate if payments is disabled or unavailable
      return () => {
        setToInactive()
        handleClose()
      }
    }

    // update sessionStorage to enable admin feedback
    setisAdminFeedbackEligible(true)
    return paymentsMutation.mutate(
      { ...paymentsData, enabled: true },
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
        isRequired
        isDisabled={!isEncryptMode} // only encrypt mode forms can be payment forms
        isReadOnly={paymentsMutation.isLoading}
      >
        <FormLabel>Payment type</FormLabel>
        <Controller
          name={'payment_type'}
          control={control}
          render={({ field }) => (
            <SingleSelect
              isClearable={false}
              placeholder="Select Payment Type"
              fullWidth
              items={[
                {
                  value: PaymentType.Fixed,
                  label: 'Fixed amount',
                  description:
                    'Payment amount is defined by form admin. Suitable for a product or service.',
                },
                {
                  value: PaymentType.Variable,
                  label: 'Variable amount',
                  description:
                    'Payment amount is defined by respondent. Suitable for donations or amounts unique to each respondent.',
                },
              ]}
              {...field}
            />
          )}
        />
      </FormControl>
      <Stack spacing="2rem">
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isInvalid={!!errors.name}
          isDisabled={isDisabled}
          isRequired
        >
          <FormLabel description="This will be reflected on the proof of payment">
            Product/service name
          </FormLabel>
          <Input
            {...register('name', {
              required: 'This field is required',
            })}
          />
          <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isDisabled={isDisabled}
          isRequired
        >
          <FormLabel>Description</FormLabel>
          <Input {...register('description')} />
          <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
        </FormControl>
      </Stack>
      {paymentsData?.payment_type === PaymentType.Variable ? (
        <VariablePaymentAmountField
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          isDisabled={isDisabled}
          control={control}
          input={clonedWatchedInputs}
        />
      ) : (
        <FixedPaymentAmountField
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          isDisabled={isDisabled}
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
      <Link as={ReactLink} to={ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE}>
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
      <PaymentInput
        isDisabled={isPaymentDisabled}
        isEncryptMode={isEncryptMode}
      />
    </>
  )
}
