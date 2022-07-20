import { useMemo } from 'react'

import { FormAuthType, FormLogoState } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { FormBannerLogo } from '~features/public-form/components/FormStartPage/FormBannerLogo'
import { FormHeader } from '~features/public-form/components/FormStartPage/FormHeader'
import { useFormBannerLogo } from '~features/public-form/components/FormStartPage/useFormBannerLogo'
import { useFormHeader } from '~features/public-form/components/FormStartPage/useFormHeader'

import { useCreateTabForm } from '../useCreateTabForm'
import { startPageDataSelector, useDesignStore } from '../useDesignStore'

export const StartPageView = () => {
  const { data: form } = useCreateTabForm()
  const startPageFromStore = useDesignStore(startPageDataSelector)
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  // Switch over to store's start page once the store is populated (done when
  // user opens the drawer)
  const startPage = useMemo(
    () => (startPageFromStore ? startPageFromStore : form?.startPage),
    [startPageFromStore, form?.startPage],
  )

  // Color theme options and other design stuff, identical to public form
  const { titleColor, titleBg, estTimeString } = useFormHeader(startPage)

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl, // This will be conditional once the logo field is added.
    logo: startPage?.logo,
    agency: form?.admin.agency,
  })

  return (
    <>
      <FormBannerLogo {...formBannerLogoProps} />
      <FormHeader
        title={form?.title}
        estTimeString={estTimeString}
        titleBg={titleBg}
        titleColor={titleColor}
        showHeader
        loggedInId={
          form?.authType !== FormAuthType.NIL ? 'S8899000D' : undefined
        }
      />
    </>
  )
}
