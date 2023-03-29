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

  return (
    <>
      <PaymentDrawer
        isEncryptMode={isEncryptMode}
        paymentsField={paymentsField}
      />
      <PaymentContent paymentsField={paymentsField} />
    </>
  )
}
