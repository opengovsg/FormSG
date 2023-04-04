import { FormResponseMode, PaymentChannel } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { PaymentContent } from './PaymentContent'
import { PaymentDrawer } from './PaymentDrawer'

export const PaymentTab = (): JSX.Element => {
  const { data: form } = useAdminForm()

  const isEncryptMode = form?.responseMode === FormResponseMode.Encrypt

  const isStripeConnected =
    isEncryptMode && form.payments_channel.channel === PaymentChannel.Stripe

  return isEncryptMode && isStripeConnected ? (
    <>
      <PaymentDrawer
        isEncryptMode={isEncryptMode}
        isStripeConnected={isStripeConnected}
        paymentsField={form.payments_field}
      />
      <PaymentContent paymentsField={form.payments_field} />
    </>
  ) : (
    <>
      <PaymentDrawer
        isEncryptMode={isEncryptMode}
        isStripeConnected={isStripeConnected}
      />
      <PaymentContent />
    </>
  )
}
