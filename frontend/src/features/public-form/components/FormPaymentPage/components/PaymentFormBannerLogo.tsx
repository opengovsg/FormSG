import { FormLogoState } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormBannerLogo, useFormBannerLogo } from '../../FormLogo'

export const PaymentFormBannerLogo = (): JSX.Element => {
  const { form, spcpSession, handleLogout, isLoading } = usePublicFormContext()

  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl,
    logo: form?.startPage.logo,
    agency: form?.admin.agency,
    showDefaultLogoIfNoLogo: true,
    colorTheme: form?.startPage.colorTheme,
  })

  return (
    <FormBannerLogo
      isLoading={isLoading}
      loggedInId={spcpSession?.userName}
      onLogout={handleLogout}
      {...formBannerLogoProps}
    />
  )
}
