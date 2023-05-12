import { useMemo } from 'react'

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
    isPaymentEnabled,
  } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  const showHeaderAndMiniHeader = useMemo(
    () => !submissionData || isPaymentEnabled,
    [submissionData, isPaymentEnabled],
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
