import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const FormSaveDraftToggle = () => {
  const { t } = useTranslation()

  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { mutateFormIsSaveDraftEnabled } = useMutateFormSettings()

  const handleToggleSaveDraft = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateFormIsSaveDraftEnabled.isLoading
    )
      return
    const nextIsSaveDraftEnabled = !settings.isSaveDraftEnabled
    return mutateFormIsSaveDraftEnabled.mutate(nextIsSaveDraftEnabled)
  }, [
    isLoadingSettings,
    mutateFormIsSaveDraftEnabled,
    settings,
  ])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        label={t('features.adminForm.settings.general.saveDraft.label')}
        description={t(
          'features.adminForm.settings.general.saveDraft.description',
        )}
        isLoading={mutateFormIsSaveDraftEnabled.isLoading}
        isChecked={Boolean(settings?.isSaveDraftEnabled)}
        onChange={() => handleToggleSaveDraft()}
      />
    </Skeleton>
  )
}

export default FormSaveDraftToggle
