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
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

/**
 * The completion email as a card at the end of the workflow, replacing the
 * inline message that used to point admins at Settings.
 *
 * Rendered only when the redesign flag is on and the workflow has at least one
 * step; both conditions are the caller's, inherited from where the inline
 * message used to sit.
 */
export const CompletionEmailBlock = (): JSX.Element | null => {
  const { data: settings, isError } = useAdminFormSettings()
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

  // Settings failed rather than merely arrived late. `data` is undefined for
  // both a request in flight and a failed one, so without this the card reads
  // the failure as loading and skeletons indefinitely, with no error and no
  // retry. Falls back to the message the flag-off path shows, which keeps a
  // working link to Settings and needs no new copy.
  //
  // Gated on `recipients` too, not `isError` alone: react-query keeps the last
  // successful `data` when a refetch fails, and a stale summary is more use
  // than the fallback.
  if (!recipients && isError) {
    return <WorkflowCompletionMessageBlock />
  }

  return (
    // Measured: only 16px sits below this card today, from the tab's own
    // `md: '1rem'` padding. These add to that for 64px on desktop and 48px on
    // mobile. On this Stack rather than a shared container so the flag-off
    // path stays untouched.
    <Stack spacing="1.5rem" pb={{ base: '1rem', md: '3rem' }}>
      <EndOfWorkflowDivider />
      <InactiveCompletionEmailCard recipients={recipients} />
    </Stack>
  )
}
