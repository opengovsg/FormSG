import { useCallback, useMemo } from 'react'

import { FormAuthType, FormLogoState } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { usePublicAuthMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormBannerLogo } from './FormBannerLogo'
import { FormHeader } from './FormHeader'
import { useFormBannerLogo } from './useFormBannerLogo'
import { useFormHeader } from './useFormHeader'

export const FormStartPage = (): JSX.Element => {
  const {
    form,
    spcpSession,
    formId,
    submissionData,
    miniHeaderRef,
    onMobileDrawerOpen,
  } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const showHeaderAndMiniHeader = useMemo(
    () => !submissionData,
    [submissionData],
  )

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl,
    logo: form?.startPage.logo,
    agency: form?.admin.agency,
  })

  const formHeaderProps = useFormHeader(form?.startPage)

  const { handleLogoutMutation } = usePublicAuthMutations(formId)
  const handleLogout = useCallback(() => {
    if (!form || form?.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(form.authType)
  }, [form, handleLogoutMutation])

  return (
    <>
      <FormBannerLogo {...formBannerLogoProps} />
      <FormHeader
        title={form?.title}
        showHeader={showHeaderAndMiniHeader}
        loggedInId={spcpSession?.userName}
        showMiniHeader={showHeaderAndMiniHeader}
        activeSectionId={activeSectionId}
        miniHeaderRef={miniHeaderRef}
        onMobileDrawerOpen={onMobileDrawerOpen}
        handleLogout={handleLogout}
        {...formHeaderProps}
      />
    </>
  )
}
