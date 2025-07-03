import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Badge from '~components/Badge'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RespondentCopyToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasRespondentCopy = useMemo(
    () => settings?.hasRespondentCopy,
    [settings],
  )

  const { mutateFormRespondentCopy } = useMutateFormSettings()

  const handleToggleRespondentCopy = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormRespondentCopy.isLoading)
      return
    const nextHasRespondentCopy = !settings.hasRespondentCopy
    return mutateFormRespondentCopy.mutate(nextHasRespondentCopy)
  }, [isLoadingSettings, mutateFormRespondentCopy, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Badge colorScheme="primary" variant="subtle" color="secondary.500">
        Beta
      </Badge>
      <Toggle
        isLoading={mutateFormRespondentCopy.isLoading}
        isChecked={hasRespondentCopy}
        label={t(
          'features.adminForm.settings.emailNotifications.section.regular.info',
        )}
        onChange={() => handleToggleRespondentCopy()}
      />
    </Skeleton>
  )
}
