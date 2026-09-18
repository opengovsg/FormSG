import { useTranslation } from 'react-i18next'

import {
  guidedWrapUpSelector,
  setGuidedWrapUpSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useIsWorkflowGuidedMode } from '../../hooks/useIsWorkflowGuidedMode'
import { GuidedWrapUp } from '../../types'

import {
  CompletionPeekMomentType,
  getCompletionPeekActionLabels,
  getCompletionPeekContent,
} from './utils/completionPeekContent'
import { PeekCard } from './PeekCard'

export const EmailSetUpPeekCard = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isGuidedMode = useIsWorkflowGuidedMode()
  const guidedWrapUp = useAdminWorkflowStore(guidedWrapUpSelector)
  const setGuidedWrapUp = useAdminWorkflowStore(setGuidedWrapUpSelector)

  if (!isGuidedMode || guidedWrapUp !== GuidedWrapUp.EmailSaved) return null

  const { title, subtitle } = getCompletionPeekContent(t, {
    type: CompletionPeekMomentType.EmailSetUp,
  })
  const labels = getCompletionPeekActionLabels(t)

  return (
    <PeekCard
      title={title}
      subtitle={subtitle}
      actions={[
        {
          label: labels.continue,
          onClick: () => setGuidedWrapUp(GuidedWrapUp.StatusTracking),
        },
      ]}
    />
  )
}
