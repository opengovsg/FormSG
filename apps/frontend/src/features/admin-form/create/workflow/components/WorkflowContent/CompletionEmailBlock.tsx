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

  // Not an MRF form, so the card does not apply at all. Unreachable from the
  // workflow tab, which only exists on MRF forms, but it narrows the union.
  if (settings && settings.responseMode !== FormResponseMode.Multirespondent) {
    return null
  }
  const mrfSettings: MultirespondentFormSettings | undefined = settings

  // Settings are a separate query from the form, so they can arrive after the
  // steps. Null recipients tell the card to hold its frame and skeleton the
  // list, rather than the whole block appearing a beat late. StatusTrackerToggle
  // reads the same query on this tab and also skeletons rather than returning
  // null, though it wraps its whole control instead of holding a frame.
  const recipients = mrfSettings
    ? getCompletionEmailRecipients({
        emails: mrfSettings.emails,
        // Defaults to '' in the model, but the settings type has it optional.
        stepOneEmailNotificationFieldId:
          mrfSettings.stepOneEmailNotificationFieldId ?? '',
        stepsToNotify: mrfSettings.stepsToNotify,
        workflowSteps: formWorkflow ?? [],
        emailFormFields,
      })
    : null

  return (
    <Stack spacing="1.5rem">
      <EndOfWorkflowDivider />
      <InactiveCompletionEmailCard recipients={recipients} />
    </Stack>
  )
}
