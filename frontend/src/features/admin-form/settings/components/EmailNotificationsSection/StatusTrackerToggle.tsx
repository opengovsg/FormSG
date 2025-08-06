import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import { Icon, Link, Skeleton, Text } from '@chakra-ui/react'

import { MultirespondentFormSettings } from '~shared/types'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const StatusTrackerToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings<MultirespondentFormSettings>()

  const hasStatusTracker = useMemo(
    () => Boolean(settings?.hasStatusTracker),
    [settings],
  )

  const { mutateMrfStatusTracker } = useMutateFormSettings()

  const ToggleDescription = () => {
    return (
      <Text textStyle="body-2" color="secondary.400">
        {t(
          'features.adminForm.settings.emailNotifications.section.regular.statusTrackerDescription',
        )}{' '}
        {/* TODO: update with status tracking preview link here */}
        <Link target="_blank" href={''}>
          here
        </Link>{' '}
        <Link target="_blank" href={''}>
          <Icon as={BiLinkExternal} verticalAlign="middle" />
        </Link>
      </Text>
    )
  }

  const handleToggleStatusTracker = useCallback(() => {
    if (!settings || isLoadingSettings || mutateMrfStatusTracker.isLoading)
      return
    const nextHasStatusTracker = !settings?.hasStatusTracker
    return mutateMrfStatusTracker.mutate(nextHasStatusTracker)
  }, [isLoadingSettings, mutateMrfStatusTracker, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateMrfStatusTracker.isLoading}
        isChecked={hasStatusTracker}
        label={t(
          'features.adminForm.settings.emailNotifications.section.regular.statusTrackerInfo',
        )}
        onChange={() => handleToggleStatusTracker()}
      />
      <ToggleDescription />
    </Skeleton>
  )
}
