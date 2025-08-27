import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'
import { useCallback } from 'react'

const FormSaveDraftToggle = () => {

  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { mutateFormIsSaveDraftEnabled } = useMutateFormSettings()

  const handleToggleSaveDraft = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormIsSaveDraftEnabled.isLoading) return
    const nextIsSaveDraftEnabled = !settings.isSaveDraftEnabled
    return mutateFormIsSaveDraftEnabled.mutate(nextIsSaveDraftEnabled)
  }, [isLoadingSettings, mutateFormIsSaveDraftEnabled, settings?.isSaveDraftEnabled])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        label="Enable saving of draft responses"
        description='Respondents will be able to save a draft of their responses on their browser.'
        isLoading={mutateFormIsSaveDraftEnabled.isLoading}
        isChecked={Boolean(settings?.isSaveDraftEnabled)}
        onChange={() => handleToggleSaveDraft()}
      />
    </Skeleton>
  )
}

export default FormSaveDraftToggle
