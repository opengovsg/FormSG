import { useCallback, useEffect, useMemo } from 'react'
import { UnpackNestedValue, useForm, useWatch } from 'react-hook-form'
import { Link as ReactLink } from 'react-router-dom'
import { useDebounce } from 'react-use'
import { Box, FormControl, Link, Text } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import {
  FormPaymentsField,
  FormResponseMode,
  PaymentChannel,
} from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Toggle from '~components/Toggle'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import {
  CreatePageDrawerContentContainer,
  useCreatePageSidebar,
} from '../../../../../../common'
import { FieldListTabIndex } from '../../../../../constants'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../../../../../useDirtyFieldStore'
import { FormFieldDrawerActions } from '../../../../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'
import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToEditingPaymentSelector,
  setToInactiveSelector,
  usePaymentStore,
} from '../usePaymentStore'

import { ProductServiceBoxv2 } from './ProductServiceBox'

type FormPaymentsInput = FormPaymentsField & {
  display_amount: string
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
      version: 2,
    },
  })

  register('products')

  // Update dirty state of payment so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length !== 0)

    return () => {
      setIsDirty(false)
    }
  }, [dirtyFields, setIsDirty])

  const handlePaymentsChanges = useCallback(
    (paymentsInputs: FormPaymentsInput) => {
      setData(paymentsInputs)
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
    return paymentsMutation.mutate(paymentsData, {
      onSuccess: () => {
        setToInactive()
        handleClose()
      },
    })
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
      <ProductServiceBoxv2
        isLoading={paymentsMutation.isLoading}
        errors={errors}
        paymentIsEnabled={paymentIsEnabled}
        setValue={(newProducts) => setValue('products', newProducts)}
      />

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

export const PaymentsInputPanelV2 = (): JSX.Element | null => {
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
