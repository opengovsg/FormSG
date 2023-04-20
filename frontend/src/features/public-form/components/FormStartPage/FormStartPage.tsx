import { useMemo } from 'react'

import { FormResponseMode } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormHeader } from './FormHeader'
import { useFormHeader } from './useFormHeader'

interface FormStartPageProps {
  isTemplate?: boolean
}
export const FormStartPage = ({
  isTemplate,
}: FormStartPageProps): JSX.Element => {
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
    () =>
      !submissionData ||
      (form?.responseMode === FormResponseMode.Encrypt &&
        form?.payments_field?.enabled),
    [submissionData, form],
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
      isTemplate={isTemplate}
      {...formHeaderProps}
    />
  )
}
