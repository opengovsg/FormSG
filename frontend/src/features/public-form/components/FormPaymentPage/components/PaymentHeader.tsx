import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormHeader } from '../../FormStartPage/FormHeader'
import { useFormHeader } from '../../FormStartPage/useFormHeader'

export const PaymentHeader = (): JSX.Element => {
  const { form, spcpSession, miniHeaderRef, onMobileDrawerOpen, handleLogout } =
    usePublicFormContext()

  const formHeaderProps = useFormHeader({ startPage: form?.startPage })

  return (
    <FormHeader
      showHeader
      showMiniHeader
      title={form?.title}
      loggedInId={spcpSession?.userName}
      miniHeaderRef={miniHeaderRef}
      onMobileDrawerOpen={onMobileDrawerOpen}
      handleLogout={handleLogout}
      {...formHeaderProps}
    />
  )
}
