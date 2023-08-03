import { useCallback, useMemo } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormIssueNotificationToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasIssueNotification = useMemo(
    () => settings && settings?.hasIssueNotification,
    [settings],
  )

  const { mutateFormIssueNotification } = useMutateFormSettings()

  const handleToggleIssueNotification = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormIssueNotification.isLoading)
      return
    const nextHasIssueNotification = !settings.hasIssueNotification
    return mutateFormIssueNotification.mutate(nextHasIssueNotification)
  }, [isLoadingSettings, mutateFormIssueNotification, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormIssueNotification.isLoading}
        isChecked={hasIssueNotification}
        label="Enable email notifications for reports made by respondents"
        description="You will receive a maximum of one email per form, per day if there are any issues reported."
        onChange={() => handleToggleIssueNotification()}
      />
    </Skeleton>
  )
}
