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

import { getCompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { ActiveCompletionEmailCard } from './ActiveCompletionEmailCard'
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

  const isEditing = useAdminWorkflowStore(isEditingEmailCardSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const setToEditingEmailCard = useAdminWorkflowStore(
    setToEditingEmailCardSelector,
  )
  const requestSwitchToEmailCard = useAdminWorkflowStore(
    requestSwitchToEmailCardSelector,
  )

  // Not an MRF form, so the card does not apply at all. Unreachable from the
  // workflow tab, which only exists on MRF forms, but it narrows the union.
  if (settings && settings.responseMode !== FormResponseMode.Multirespondent) {
    return null
  }
  const mrfSettings: MultirespondentFormSettings | undefined = settings

  const handleClick = () => {
    if (stateData) {
      // Another card is open: auto-save it and switch here.
      requestSwitchToEmailCard()
      return
    }
    setToEditingEmailCard()
  }

  // Editing on a live form is blocked in the frontend today, so the card opens
  // read-only rather than being hidden. Removing this is a separate change.
  const isDisabled = mrfSettings?.status === FormStatus.Public

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
    // Measured: only 16px sits below this card today, from the tab's own
    // `md: '1rem'` padding. These add to that for 64px on desktop and 48px on
    // mobile. On this Stack rather than a shared container so the flag-off
    // path stays untouched.
    <Stack spacing="1.5rem" pb={{ base: '1rem', md: '3rem' }}>
      <EndOfWorkflowDivider />
      {/* The expanded card needs settings in hand, so until they arrive the
      collapsed card holds the space and skeletons its list. */}
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
    </Stack>
  )
}
