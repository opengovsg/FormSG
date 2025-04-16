import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RespondentWorkflowCompletionToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasRespondentWorkflowCompletion = useMemo(
    // () => settings?.hasRespondentWorkflowCompletion, //TODO: replace this
    () => settings?.hasRespondentCopy,
    [settings],
  )

  const { mutateFormRespondentWorkflowCompletion } = useMutateFormSettings()

  const handleToggleRespondentWorkflowCompletion = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateFormRespondentWorkflowCompletion.isLoading
    )
      return
    const nextHasToggleRespondentWorkflowCompletion =
      // !settings.hasToggleRespondentWorkflowCompletion
      !settings.hasRespondentCopy //TODO: replace this
    return mutateFormRespondentWorkflowCompletion.mutate(
      nextHasToggleRespondentWorkflowCompletion,
    )
  }, [isLoadingSettings, mutateFormRespondentWorkflowCompletion, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormRespondentWorkflowCompletion.isLoading}
        isChecked={hasRespondentWorkflowCompletion}
        label={t(
          'features.adminForm.settings.emailNotifications.section.mrf.respondents.workflowCompletionLabel',
        )}
        onChange={() => handleToggleRespondentWorkflowCompletion()}
      />
    </Skeleton>
  )
}
