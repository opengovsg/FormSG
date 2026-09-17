import { useTranslation } from 'react-i18next'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import {
  hasSavedCompletionEmailSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useIsWorkflowGuidedMode } from '../../hooks/useIsWorkflowGuidedMode'

import {
  CompletionPeekMomentType,
  getCompletionPeekContent,
} from './utils/completionPeekContent'
import { PeekCard } from './PeekCard'

export interface StatusTrackingPeekCardProps {
  hasConfiguredRecipients: boolean
}

export const StatusTrackingPeekCard = ({
  hasConfiguredRecipients,
}: StatusTrackingPeekCardProps): JSX.Element | null => {
  const { t } = useTranslation()
  const isGuidedMode = useIsWorkflowGuidedMode()
  const hasSavedCompletionEmail = useAdminWorkflowStore(
    hasSavedCompletionEmailSelector,
  )

  if (!isGuidedMode) return null
  if (!hasSavedCompletionEmail && !hasConfiguredRecipients) return null

  const { title, subtitle } = getCompletionPeekContent(t, {
    type: CompletionPeekMomentType.StatusTracking,
  })

  return (
    <PeekCard title={title} subtitle={subtitle}>
      <StatusTrackerToggle />
    </PeekCard>
  )
}
