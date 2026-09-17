import { useTranslation } from 'react-i18next'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { useIsWorkflowGuidedMode } from '../../hooks/useIsWorkflowGuidedMode'

import {
  CompletionPeekMomentType,
  getCompletionPeekContent,
} from './utils/completionPeekContent'
import { PeekCard } from './PeekCard'

export const StatusTrackingPeekCard = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isGuidedMode = useIsWorkflowGuidedMode()

  if (!isGuidedMode) return null

  const { title, subtitle } = getCompletionPeekContent(t, {
    type: CompletionPeekMomentType.StatusTracking,
  })

  return (
    <PeekCard title={title} subtitle={subtitle}>
      <StatusTrackerToggle />
    </PeekCard>
  )
}
