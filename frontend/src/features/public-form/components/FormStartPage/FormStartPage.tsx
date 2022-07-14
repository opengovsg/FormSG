import { useCallback } from 'react'

import { FormAuthType } from '~shared/types'

import { usePublicAuthMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormBannerLogo } from './FormBannerLogo'
import { FormHeader } from './FormHeader'
import { useFormBannerLogo } from './useFormBannerLogo'
import { useFormHeader } from './useFormHeader'

export const FormStartPage = (): JSX.Element => {
  const { form, spcpSession, formId, submissionData, miniHeaderRef } =
    usePublicFormContext()
  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const { titleColor, titleBg, estTimeString } = useFormHeader(form?.startPage)

  const formBannerLogoProps = useFormBannerLogo(form)

  const handleLogout = useCallback(() => {
    if (!form || form?.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(form.authType)
  }, [form, handleLogoutMutation])

  return (
    <>
      <FormBannerLogo {...formBannerLogoProps} />
      {submissionData ? null : (
        <FormHeader
          title={form?.title}
          estTimeString={estTimeString}
          titleBg={titleBg}
          titleColor={titleColor}
          loggedInId={spcpSession?.userName}
          miniHeaderRef={miniHeaderRef}
          handleLogout={handleLogout}
        />
      )}
    </>
  )
}
