import { useMemo } from 'react'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormHeader } from './FormHeader'
import { useFormHeader } from './useFormHeader'

export const FormStartPage = (): JSX.Element => {
  const {
    form,
    spcpSession,
    submissionData,
    miniHeaderRef,
    onMobileDrawerOpen,
    handleLogout,
  } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  const showHeaderAndMiniHeader = useMemo(
    () => !submissionData,
    [submissionData],
  )

  const formHeaderProps = useFormHeader({ startPage: form?.startPage })

  return (
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
  )
}
