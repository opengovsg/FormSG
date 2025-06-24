import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Skeleton, Stack } from '@chakra-ui/react'

import { FormSettings } from '~shared/types'

import Badge from '~components/Badge'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const StatusTrackerToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const getHasStatusTracker = (
    settings: FormSettings | undefined,
  ): boolean | undefined => {
    if (settings && 'hasStatusTracker' in settings) {
      return !!settings.hasStatusTracker
    }
    return false
  }

  const hasStatusTracker = useMemo(
    () => getHasStatusTracker(settings),
    [settings],
  )

  const { mutateMrfStatusTracker } = useMutateFormSettings()

  const handleToggleStatusTracker = useCallback(() => {
    if (!settings || isLoadingSettings || mutateMrfStatusTracker.isLoading)
      return
    const nextHasStatusTracker = !getHasStatusTracker(settings)
    return mutateMrfStatusTracker.mutate(nextHasStatusTracker)
  }, [isLoadingSettings, mutateMrfStatusTracker, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Badge colorScheme="primary" variant="subtle" color="secondary.500">
        Beta
      </Badge>
      <Toggle
        isLoading={mutateMrfStatusTracker.isLoading}
        isChecked={hasStatusTracker}
        label={t(
          'features.adminForm.settings.emailNotifications.section.regular.statusTrackerInfo',
        )}
        onChange={() => handleToggleStatusTracker()}
      />
    </Skeleton>
  )
}
