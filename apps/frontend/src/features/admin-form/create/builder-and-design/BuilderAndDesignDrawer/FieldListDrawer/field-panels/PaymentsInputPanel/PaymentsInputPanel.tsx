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
import { useTranslation } from 'react-i18next'
import { Link as ReactLink, useParams } from 'react-router-dom'
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
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { cloneDeep } from 'lodash'

import { featureFlags } from 'formsg-shared/constants'
import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
  PaymentType,
} from 'formsg-shared/types'
import { centsToDollars, dollarsToCents } from 'formsg-shared/utils/payments'

import { ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE } from '~constants/routes'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'
import { useAdminFeedbackStore } from '~features/workspace/components/AdminFeedbackContainer/adminFeedbackStore'

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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.paymentsInputPanel',
  })
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
            label={t('multiProduct.label')}
            isChecked={watchMultiQtyEnabled} // component is not re-mounted, need to override internal <Checkbox /> state
          />
        </FormControl>
      </PaymentInnerContainer>
    </>
  )
}

const PaymentTypeSelector = ({
  isSelectorDisabled,
  control,
  paymentsMutation,
  showFixedPaymentSelection,
}: {
  isSelectorDisabled: boolean
  control: Control<FormPaymentsInput>
  paymentsMutation: ReturnType<typeof useMutateFormPage>['paymentsMutation']
  showFixedPaymentSelection: boolean
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.paymentsInputPanel',
  })
  return (
    <PaymentInnerContainer>
      <FormControl
        isRequired
        isDisabled={isSelectorDisabled} // only payment-capable forms can configure payments
        isReadOnly={paymentsMutation.isLoading}
      >
        <FormLabel>{t('paymentType.label')}</FormLabel>
        <Controller
          name={'payment_type'}
          control={control}
          render={({ field }) => (
            <SingleSelect
              isClearable={false}
              placeholder={t('paymentType.placeholder')}
              fullWidth
              items={[
                {
                  value: PaymentType.Products,
                  label: t('paymentType.options.products.label'),
                  description: t('paymentType.options.products.description'),
                },
                {
                  value: PaymentType.Variable,
                  label: t('paymentType.options.variable.label'),
                  description: t('paymentType.options.variable.description'),
                },
                ...(showFixedPaymentSelection
                  ? [
                      {
                        value: PaymentType.Fixed,
                        label: t('paymentType.options.fixed.label'),
                        description: t('paymentType.options.fixed.description'),
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
  isSelectorDisabled,
}: {
  isDisabled: boolean
  isSelectorDisabled: boolean
}) => {
  const { t: tPayments } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.paymentsInputPanel',
  })
  const { paymentsMutation } = useMutateFormPage()

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { paymentsData, setData, setToInactive } = usePaymentStore((state) => ({
    paymentsData: dataSelector(state),
    setData: setDataSelector(state),
    setToInactive: setToInactiveSelector(state),
  }))

  const { setFieldListTabIndex } = useCreatePageSidebar()

  const handleClose = () => setFieldListTabIndex(FieldListTabIndex.Basic)

  const { formId } = useParams()

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

    return paymentsMutation.mutate(
      { ...paymentsData, enabled: true },
      {
        onSuccess: () => {
          setToInactive()
          handleClose()
          // enable admin feedback after the panel closes
          useAdminFeedbackStore.getState().setEligible('field-edit', formId)
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
        isSelectorDisabled={isSelectorDisabled}
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
          buttonText={tPayments('saveField')}
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.paymentsInputPanel',
  })
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
            <FormLabel description={t('productServiceName.description')}>
              {t('productServiceName.label')}
            </FormLabel>
            <Input
              {...register('name', {
                required: t('productServiceName.required'),
              })}
            />
            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isReadOnly={paymentsMutation.isLoading}
            isDisabled={isDisabled}
            isRequired
          >
            <FormLabel>{t('description.label')}</FormLabel>
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.paymentsInputPanel',
  })
  const { data: form } = useAdminForm()
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const isMrfPaymentsEnabled = useFeatureIsOn(featureFlags.mrfPayments)

  const isEncryptMode = form?.responseMode === FormResponseMode.Encrypt
  const isMrfMode = form?.responseMode === FormResponseMode.Multirespondent
  // Multirespondent forms may only collect payments when they have no
  // workflow steps; the payment field and workflow steps are mutually
  // exclusive.
  const hasWorkflowSteps = isMrfMode && (form.workflow?.length ?? 0) > 0
  const isPaymentCapable = isEncryptMode || (isMrfMode && isMrfPaymentsEnabled)
  const isStripeConnected =
    isPaymentCapable && form.payments_channel.channel === PaymentChannel.Stripe
  const paymentsField = isPaymentCapable ? form.payments_field : undefined

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

  const paymentDisabledMessage = !isPaymentCapable ? (
    <Text>
      {/* TODO [MRF-CUTOVER]: Remove cutover copy override after cutover. */}
      {isMrfCutoverEnabled
        ? t('disabled.cutoverLegacyOnly')
        : t('disabled.storageModeOnly')}
    </Text>
  ) : hasWorkflowSteps ? (
    <Text>{t('disabled.mrfWorkflowSteps')}</Text>
  ) : !isStripeConnected ? (
    <Text>
      {t('disabled.stripeNotConnectedBefore')}{' '}
      <Link as={ReactLink} to={ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE}>
        {t('disabled.stripeNotConnectedSettings')}
      </Link>{' '}
      {t('disabled.stripeNotConnectedAfter')}
    </Text>
  ) : null

  // payment eligibility will be dependent on whether paymentDisabledMessage is non empty
  const isPaymentDisabled = !!paymentDisabledMessage

  if (isPaymentCapable && !paymentsData) return null

  return (
    <>
      {isPaymentDisabled && (
        <Box px="1.5rem" pt="2rem">
          <InlineMessage variant="info">{paymentDisabledMessage}</InlineMessage>
        </Box>
      )}
      <PaymentInputFields
        isDisabled={isPaymentDisabled}
        isSelectorDisabled={!isPaymentCapable || hasWorkflowSteps}
      />
    </>
  )
}
