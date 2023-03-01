import { PaymentContent } from './PaymentContent'
import { PaymentDrawer } from './PaymentDrawer'

export const PaymentTab = (): JSX.Element => {
  return (
    <>
      <PaymentDrawer />
      <PaymentContent />
    </>
  )
}
