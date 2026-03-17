import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormIssueNotificationToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasIssueNotification = settings?.hasIssueNotification

  const { mutateFormIssueNotification } = useMutateFormSettings()

  const handleToggleIssueNotification = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormIssueNotification.isLoading)
      return
    const nextHasIssueNotification = !settings.hasIssueNotification
    return mutateFormIssueNotification.mutate(nextHasIssueNotification)
  }, [isLoadingSettings, mutateFormIssueNotification, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings}>
      <Toggle
        isLoading={mutateFormIssueNotification.isLoading}
        isChecked={hasIssueNotification}
        {...t('features.adminForm.settings.general.issueNotifications', {
          returnObjects: true,
        })}
        onChange={() => handleToggleIssueNotification()}
      />
    </Skeleton>
  )
}
