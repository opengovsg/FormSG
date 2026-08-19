import { Stack } from '@chakra-ui/react'

import {
  FormResponseMode,
  MultirespondentFormSettings,
} from 'formsg-shared/types/form'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { getCompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { EndOfWorkflowDivider } from './EndOfWorkflowDivider'
import { InactiveCompletionEmailCard } from './InactiveCompletionEmailCard'

/**
 * The completion email as a card at the end of the workflow, replacing the
 * inline message that used to point admins at Settings.
 *
 * Rendered only when the redesign flag is on and the workflow has at least one
 * step; both conditions are the caller's, inherited from where the inline
 * message used to sit.
 */
export const CompletionEmailBlock = (): JSX.Element | null => {
  const { data: settings } = useAdminFormSettings()
  const { formWorkflow, emailFormFields } = useAdminFormWorkflow()

  // Settings load separately from the form, so the card waits rather than
  // rendering with no recipients and then filling in.
  if (!settings || settings.responseMode !== FormResponseMode.Multirespondent) {
    return null
  }
  const mrfSettings: MultirespondentFormSettings = settings

  const recipients = getCompletionEmailRecipients({
    emails: mrfSettings.emails,
    // Defaults to '' in the model, but the settings type still has it optional.
    stepOneEmailNotificationFieldId:
      mrfSettings.stepOneEmailNotificationFieldId ?? '',
    stepsToNotify: mrfSettings.stepsToNotify,
    workflowSteps: formWorkflow ?? [],
    emailFormFields,
  })

  return (
    <Stack spacing="1.5rem">
      <EndOfWorkflowDivider />
      <InactiveCompletionEmailCard recipients={recipients} />
    </Stack>
  )
}
