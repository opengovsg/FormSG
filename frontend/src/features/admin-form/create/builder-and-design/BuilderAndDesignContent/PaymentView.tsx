import { useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Box } from '@chakra-ui/react'

import { FormFieldDto, FormResponseMode } from '~shared/types'

import { PaymentPreview } from '~templates/Field/PaymentPreview/PaymentPreview'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import {
  dataSelector,
  PaymentState,
  setToEditingPaymentSelector,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FieldListTabIndex } from '../constants'
import {
  DesignState,
  setStateSelector as setDesignStateSelector,
  useDesignStore,
} from '../useDesignStore'
import { isDirtySelector, useDirtyFieldStore } from '../useDirtyFieldStore'
import {
  setToInactiveSelector as setFieldBuilderToInactiveSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

export const PaymentView = () => {
  const { data: form } = useAdminForm()
  const { handleClose, handleBuilderClick, setFieldListTabIndex } =
    useCreatePageSidebar()
  const { paymentFromStore, paymentState, setToEditingPayment } =
    usePaymentStore((state) => ({
      paymentFromStore: dataSelector(state),
      paymentState: stateSelector(state),
      setToEditingPayment: setToEditingPaymentSelector(state),
    }))

  const setFieldBuilderToInactive = useFieldBuilderStore(
    setFieldBuilderToInactiveSelector,
  )
  const setDesignState = useDesignStore(setDesignStateSelector)
  const isDirty = useDirtyFieldStore(isDirtySelector)

  const formMethods = useForm<FormFieldDto>({
    mode: 'onChange',
  })

  const paymentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (paymentState === PaymentState.EditingPayment) {
      paymentRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [paymentState])

  if (form?.responseMode !== FormResponseMode.Encrypt) return null

  const isActive = paymentState === PaymentState.EditingPayment

  const paymentDetails = paymentFromStore ?? form.payments_field

  const isDirtyAndPaymentInactive =
    isDirty && paymentState === PaymentState.Inactive

  const handlePaymentClick = () => {
    if (isDirtyAndPaymentInactive) {
      return setToEditingPayment(true)
    }

    setToEditingPayment()
    setFieldBuilderToInactive()
    setDesignState(DesignState.Inactive)

    handleClose(false)
    handleBuilderClick(false)
    setFieldListTabIndex(FieldListTabIndex.Payments)
  }

  return (
    <Box w="100%" maxW="57rem" alignSelf="center" ref={paymentRef}>
      <FormProvider {...formMethods}>
        <PaymentPreview
          colorTheme={form?.startPage.colorTheme}
          paymentDetails={paymentDetails}
          isBuilder
          isActive={isActive}
          onClick={handlePaymentClick}
        />
      </FormProvider>
    </Box>
  )
}
