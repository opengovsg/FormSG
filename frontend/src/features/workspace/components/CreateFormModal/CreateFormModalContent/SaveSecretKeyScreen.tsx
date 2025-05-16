import { useCallback } from 'react'
import { UseFormRegister, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { ADMINFORM_ROUTE } from '~constants/routes'

import { trackClickSecretKeyMailTo } from '~features/analytics/AnalyticsService'
import { workspaceKeys } from '~features/workspace/queries'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import {
  SaveSecretKeyContent,
  SaveSecretKeyFormInput,
} from './SaveSecretKeyContent'
import { useSecretKeyDownload } from './useSaveSecretKey'

export const SaveSecretKeyScreen = ({
  useSecretKeyDownloadHook = useSecretKeyDownload,
}: {
  useSecretKeyDownloadHook?: typeof useSecretKeyDownload
}): JSX.Element => {
  const { t } = useTranslation()

  const {
    formMethods: {
      control,
      register,
      formState: { isValid },
    },
    isLoading,
    keypair: { secretKey },
    onClose,
  } = useCreateFormWizard()

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const formTitle = useWatch({ control, name: 'title' })
  const formId: string =
    queryClient.getQueryData(workspaceKeys.lastCreatedForm) ?? ''

  const {
    handleCopyKey,
    handleDownloadKey,
    mailToHref,
    hasDownloadedKey,
    isSubmitEnabled,
    hasCopiedKey,
  } = useSecretKeyDownloadHook({
    secretKey,
    formTitle,
    onClose,
    isFormStateValid: isValid,
    formId,
  })

  const handleDownloadAndNavigate = useCallback(() => {
    if (formId) {
      queryClient.invalidateQueries(workspaceKeys.lastCreatedForm)
      navigate(`${ADMINFORM_ROUTE}/${formId}`)
    }
  }, [queryClient, navigate, formId])

  return (
    <SaveSecretKeyContent
      contentTitle={t('features.workspace.modals.create.secretKey.title')}
      registerStorageAck={
        // HACK: Since CreateFormWizardInputProps must have storageAck, we can cast it to SaveSecretKeyFormInput.
        register as unknown as UseFormRegister<SaveSecretKeyFormInput>
      }
      isLoading={isLoading}
      hasCopiedKey={hasCopiedKey}
      handleCopyKey={handleCopyKey}
      handleDownloadKey={handleDownloadKey}
      mailToHref={mailToHref}
      hasDownloadedKey={hasDownloadedKey}
      isSubmitEnabled={isSubmitEnabled}
      secretKey={secretKey}
      onSubmitClick={handleDownloadAndNavigate}
      handleTrackEmail={() => trackClickSecretKeyMailTo(formTitle)}
    />
  )
}
