import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RespondentCopyToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasCaptcha = useMemo(() => settings?.hasCaptcha, [settings]) //TODO: update settings from hasCaptcha to rc

  const { mutateFormCaptcha } = useMutateFormSettings()

  const handleToggleRespondentCopy = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
    const nextHasCaptcha = !settings.hasCaptcha
    return mutateFormCaptcha.mutate(nextHasCaptcha)
  }, [isLoadingSettings, mutateFormCaptcha, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormCaptcha.isLoading}
        isChecked={hasCaptcha}
        label={t(
          'features.adminForm.settings.emailNotifications.section.regular.info',
        )}
        onChange={() => handleToggleRespondentCopy()}
      />
    </Skeleton>
  )
}
