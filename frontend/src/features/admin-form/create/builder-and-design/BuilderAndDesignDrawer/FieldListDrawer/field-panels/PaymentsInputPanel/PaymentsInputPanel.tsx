import { useCallback, useEffect, useMemo } from 'react'
import {
  Control,
  Controller,
  FormState,
  useForm,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  useWatch,
} from 'react-hook-form'
import { Link as ReactLink } from 'react-router-dom'
import { useDebounce } from 'react-use'
import {
  Box,
  Divider,
  FormControl,
  Link,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
  PaymentType,
} from '~shared/types'
import { centsToDollars, dollarsToCents } from '~shared/utils/payments'

import { ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE } from '~constants/routes'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useSessionStorage } from '~hooks/useSessionStorage'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import { useCreatePageSidebar } from '../../../../../common'
import { FieldListTabIndex } from '../../../../constants'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../../../../useDirtyFieldStore'
import { FormFieldDrawerActions } from '../../../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'
import {
  dataSelector,
  PaymentStore,
  resetDataSelector,
  setDataSelector,
  setToEditingPaymentSelector,
  setToInactiveSelector,
  usePaymentStore,
} from '../usePaymentStore'

import { FixedPaymentAmountField } from './FixedPaymentAmountField'
import { ProductServiceBox } from './ProductServiceBox'
import { VariablePaymentAmountField } from './VariablePaymentAmountField'

export type FormPaymentsInput = Omit<
  FormPaymentsField,
  'amount_cents' | 'min_amount' | 'max_amount'
> & {
  display_amount: string
  display_min_amount: string
  display_max_amount: string
}

const PaymentInnerContainer = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return <Box px="1.5rem">{children}</Box>
}
const PaymentContainer = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Stack
      py="2rem"
      flexDir="column"
      flex={1}
      pos="relative"
      overflow="auto"
      divider={<Divider />}
      spacing="2rem"
    >
      {children}
    </Stack>
  )
}

const ProductsPaymentSection = ({
  isDisabled,
  isSelectionDisabled,
  errors,
  register,
  setValue,
  paymentsMutation,
  watch,
}: {
  isDisabled: boolean
  isSelectionDisabled: boolean
  errors: FormState<FormPaymentsInput>['errors']
  register: UseFormRegister<FormPaymentsInput>
  setValue: UseFormSetValue<FormPaymentsInput>
  watch: UseFormWatch<FormPaymentsInput>
  paymentsMutation: ReturnType<typeof useMutateFormPage>['paymentsMutation']
}) => {
  const watchMultiQtyEnabled = watch('products_meta.multi_product')
  return (
    <>
      <PaymentInnerContainer>
        <ProductServiceBox
          isLoading={paymentsMutation.isLoading}
          errors={errors}
          paymentIsEnabled={!isDisabled}
          updateProductListStore={(newProducts) => {
            if (newProducts.length <= 1) {
              setValue('products_meta.multi_product', false)
            }
            setValue('products', newProducts)
          }}
        />
      </PaymentInnerContainer>
      <Divider my="2rem" />
      <PaymentInnerContainer>
        <FormControl
          isReadOnly={paymentsMutation.isLoading}
          isDisabled={isDisabled || isSelectionDisabled}
        >
          <Toggle
            {...register('products_meta.multi_product', {
              value: watchMultiQtyEnabled,
            })}
            label="Allow selection of multiple types of products/services"
            isChecked={watchMultiQtyEnabled} // component is not re-mounted, need to override internal <Checkbox /> state
          />
        </FormControl>
      </PaymentInnerContainer>
    </>
  )
}

const PaymentTypeSelector = ({
  isEncryptMode,
  control,
  paymentsMutation,
  showFixedPaymentSelection,
}: {
  isEncryptMode: boolean
  control: Control<FormPaymentsInput>
  paymentsMutation: ReturnType<typeof useMutateFormPage>['paymentsMutation']
  showFixedPaymentSelection: boolean
}) => {
  return (
    <PaymentInnerContainer>
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
                  value: PaymentType.Products,
                  label: 'Product or service',
                  description:
                    'Respondents pay based on products or services they select. e.g. Courses, tickets with tiered prices',
                },
                {
                  value: PaymentType.Variable,
                  label: 'Respondents choose what to pay',
                  description:
                    'Respondents enter the amount to pay. e.g. Donations, fines',
                },
                ...(showFixedPaymentSelection
                  ? [
                      {
                        value: PaymentType.Fixed,
                        label: 'Fixed amount',
                        description:
                          'Every respondent pays the same amount, as set by the admin. e.g. Flat-rate tickets',
                      },
                    ]
                  : []),
              ]}
              {...field}
            />
          )}
        />
      </FormControl>
    </PaymentInnerContainer>
  )
}

const PaymentInputFields = ({
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
    setValue,
    watch,
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
      } as FormPaymentsField)
    },
    [setData],
  )

  const watchedInputs = useWatch({
    control,
  }) as FormPaymentsInput

  // trigger a re-render on children by failing the shallow comparator
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

  const isProducts = paymentsData?.payment_type === PaymentType.Products
  const isFixed = paymentsData?.payment_type === PaymentType.Fixed
  const isSavingDisabled =
    isDisabled || (isProducts && paymentsData.products.length <= 0)
  return (
    <PaymentContainer>
      <PaymentTypeSelector
        isEncryptMode={isEncryptMode}
        control={control}
        paymentsMutation={paymentsMutation}
        showFixedPaymentSelection={isFixed}
      />

      {isProducts ? (
        <ProductsPaymentSection
          isDisabled={isDisabled}
          errors={errors}
          register={register}
          paymentsMutation={paymentsMutation}
          setValue={setValue}
          isSelectionDisabled={paymentsData.products.length <= 1}
          watch={watch}
        />
      ) : (
        <FixedAndVariablePaymentSection
          isDisabled={isDisabled}
          errors={errors}
          register={register}
          paymentsMutation={paymentsMutation}
          paymentsData={paymentsData}
          control={control}
          formInputValues={clonedWatchedInputs}
        />
      )}

      <PaymentInnerContainer>
        <FormFieldDrawerActions
          isLoading={paymentsMutation.isLoading}
          handleClick={handleUpdatePayments}
          handleCancel={handleClose}
          buttonText="Save field"
          isDisabled={isSavingDisabled}
        />
      </PaymentInnerContainer>
    </PaymentContainer>
  )
}

const FixedAndVariablePaymentSection = ({
  paymentsMutation,
  errors,
  isDisabled,
  register,
  paymentsData,
  control,
  formInputValues,
}: {
  formInputValues: FormPaymentsInput
  control: Control<FormPaymentsInput>
  errors: FormState<FormPaymentsInput>['errors']
  isDisabled: boolean
  paymentsData: PaymentStore['data']
  paymentsMutation: ReturnType<typeof useMutateFormPage>['paymentsMutation']
  register: UseFormRegister<FormPaymentsInput>
}) => {
  return (
    <>
      <PaymentInnerContainer>
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
            <Textarea {...register('description')} />
            <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
          </FormControl>
        </Stack>
      </PaymentInnerContainer>
      <Divider my="2rem" />
      <PaymentInnerContainer>
        {paymentsData?.payment_type === PaymentType.Variable ? (
          <VariablePaymentAmountField
            isLoading={paymentsMutation.isLoading}
            errors={errors}
            isDisabled={isDisabled}
            control={control}
            input={formInputValues}
          />
        ) : (
          <FixedPaymentAmountField
            isLoading={paymentsMutation.isLoading}
            errors={errors}
            isDisabled={isDisabled}
            control={control}
            input={formInputValues}
          />
        )}
      </PaymentInnerContainer>
    </>
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
    <Text>
      Payments are not available for{' '}
      {form?.responseMode === FormResponseMode.Email
        ? 'email mode'
        : 'multi-respondent'}{' '}
      forms.
    </Text>
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
        <Box px="1.5rem" pt="2rem">
          <InlineMessage variant="info">{paymentDisabledMessage}</InlineMessage>
        </Box>
      )}
      <PaymentInputFields
        isDisabled={isPaymentDisabled}
        isEncryptMode={isEncryptMode}
      />
    </>
  )
}
