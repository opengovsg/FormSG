import { FormLogoState } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../../FormFields/FormSectionsContext'
import { FormBannerLogo, useFormBannerLogo } from '../../FormLogo'
import { FormHeader } from '../../FormStartPage/FormHeader'
import { useFormHeader } from '../../FormStartPage/useFormHeader'

export const PaymentHeader = (): JSX.Element => {
  const {
    form,
    spcpSession,
    //   submissionData,
    miniHeaderRef,
    onMobileDrawerOpen,
    handleLogout,
  } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  const formHeaderProps = useFormHeader({ startPage: form?.startPage })

  return (
    <FormHeader
      showHeader
      showMiniHeader
      title={form?.title}
      loggedInId={spcpSession?.userName}
      activeSectionId={activeSectionId}
      miniHeaderRef={miniHeaderRef}
      onMobileDrawerOpen={onMobileDrawerOpen}
      handleLogout={handleLogout}
      {...formHeaderProps}
    />
  )
}
