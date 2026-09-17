import { Stack } from '@chakra-ui/react'

import {
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
} from 'formsg-shared/types/form'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import {
  createOrEditDataSelector,
  isEditingEmailCardSelector,
  requestSwitchToEmailCardSelector,
  setToEditingEmailCardSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { StatusTrackingPeekCard } from '../GuidedCreation'

import {
  CompletionEmailBlockView,
  getCompletionEmailBlockView,
} from './utils/getCompletionEmailBlockView'
import { getCompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { ActiveCompletionEmailCard } from './ActiveCompletionEmailCard'
import { EndOfWorkflowDivider } from './EndOfWorkflowDivider'
import { InactiveCompletionEmailCard } from './InactiveCompletionEmailCard'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const CompletionEmailBlock = (): JSX.Element | null => {
  const { data: settings, isError } = useAdminFormSettings()
  const { formWorkflow, emailFormFields } = useAdminFormWorkflow()

  const isEditing = useAdminWorkflowStore(isEditingEmailCardSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const setToEditingEmailCard = useAdminWorkflowStore(
    setToEditingEmailCardSelector,
  )
  const requestSwitchToEmailCard = useAdminWorkflowStore(
    requestSwitchToEmailCardSelector,
  )

  const view = getCompletionEmailBlockView({
    settings,
    isSettingsError: isError,
    workflowStepCount: formWorkflow?.length ?? 0,
  })

  if (view === CompletionEmailBlockView.None) return null
  if (view === CompletionEmailBlockView.SettingsMessage) {
    return <WorkflowCompletionMessageBlock />
  }
  const mrfSettings: MultirespondentFormSettings | undefined =
    settings?.responseMode === FormResponseMode.Multirespondent
      ? settings
      : undefined

  const handleClick = () => {
    if (stateData) {
      requestSwitchToEmailCard()
      return
    }
    setToEditingEmailCard()
  }

  const isDisabled = mrfSettings?.status === FormStatus.Public

  const recipients = mrfSettings
    ? getCompletionEmailRecipients({
        emails: mrfSettings.emails,
        stepOneEmailNotificationFieldId:
          mrfSettings.stepOneEmailNotificationFieldId ?? '',
        stepsToNotify: mrfSettings.stepsToNotify,
        workflowSteps: formWorkflow ?? [],
        emailFormFields,
      })
    : null

  return (
    <Stack spacing="1.5rem" pb={{ base: '1rem', md: '3rem' }}>
      <EndOfWorkflowDivider />
      <Stack spacing="0">
        {isEditing && mrfSettings ? (
          <ActiveCompletionEmailCard
            settings={mrfSettings}
            isDisabled={isDisabled}
          />
        ) : (
          <InactiveCompletionEmailCard
            recipients={recipients}
            onClick={handleClick}
          />
        )}
        <StatusTrackingPeekCard />
      </Stack>
    </Stack>
  )
}
