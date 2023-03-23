import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { PaymentContent } from './PaymentContent'
import { PaymentDrawer } from './PaymentDrawer'

export const PaymentTab = (): JSX.Element => {
  const { data: form } = useAdminForm()

  return form?.responseMode === FormResponseMode.Encrypt &&
    form?.payments_field ? (
    <>
      <PaymentDrawer paymentsField={form.payments_field} />
      <PaymentContent paymentsField={form.payments_field} />
    </>
  ) : (
    // TODO: Handle PaymentTab for email mode forms
    <></>
  )
}
