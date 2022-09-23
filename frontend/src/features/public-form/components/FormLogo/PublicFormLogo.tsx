import { useMemo } from 'react'

import { FormLogoState } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormBannerLogo } from './FormBannerLogo'
import { useFormBannerLogo } from './useFormBannerLogo'

export const PublicFormLogo = (): JSX.Element => {
  const { form, spcpSession, submissionData, handleLogout, isLoading } =
    usePublicFormContext()

  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const hasSubmitted = useMemo(() => !!submissionData, [submissionData])

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl,
    logo: form?.startPage.logo,
    agency: form?.admin.agency,
    showDefaultLogoIfNoLogo: hasSubmitted,
    colorTheme: form?.startPage.colorTheme,
  })

  const formBannerLoggedInId = useMemo(() => {
    if (!submissionData || !spcpSession) return
    return spcpSession.userName
  }, [spcpSession, submissionData])

  return (
    <FormBannerLogo
      isLoading={isLoading}
      {...formBannerLogoProps}
      loggedInId={formBannerLoggedInId}
      onLogout={handleLogout}
    />
  )
}
