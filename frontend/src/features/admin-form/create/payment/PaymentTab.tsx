import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { PaymentContent } from './PaymentContent'
import { PaymentDrawer } from './PaymentDrawer'
import { defaultPaymentsField } from './usePaymentStore'

export const PaymentTab = (): JSX.Element => {
  const { data: form } = useAdminForm()

  const isEncryptMode = form?.responseMode === FormResponseMode.Encrypt

  const paymentsField =
    isEncryptMode && form?.payments_field
      ? form.payments_field
      : defaultPaymentsField

  // Check if payment channel
  const isStripeConnected =
    isEncryptMode &&
    form.payments_channel?.target_account_id !== undefined &&
    form.payments_channel?.target_account_id !== ''

  return (
    <>
      <PaymentDrawer
        isEncryptMode={isEncryptMode}
        isStripeConnected={isStripeConnected}
        paymentsField={paymentsField}
      />
      <PaymentContent paymentsField={paymentsField} />
    </>
  )
}
