import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const EmailJsonToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { mutateFormEmailJson } = useMutateFormSettings()

  const handleToggleEmailJson = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormEmailJson.isLoading) return
    return mutateFormEmailJson.mutate(!settings.isEmailJsonEnabled)
  }, [isLoadingSettings, mutateFormEmailJson, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings}>
      <Toggle
        isLoading={mutateFormEmailJson.isLoading}
        isChecked={settings?.isEmailJsonEnabled}
        {...t('features.adminForm.settings.webhooks.emailJson', {
          returnObjects: true,
        })}
        onChange={() => handleToggleEmailJson()}
      />
    </Skeleton>
  )
}
