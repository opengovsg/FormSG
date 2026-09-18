import { useTranslation } from 'react-i18next'

import {
  guidedWrapUpSelector,
  setGuidedWrapUpSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useIsWorkflowGuidedMode } from '../../hooks/useIsWorkflowGuidedMode'
import { GuidedWrapUp } from '../../types'
import { PeekCard } from './PeekCard'
import {
  CompletionPeekMomentType,
  getCompletionPeekActionLabels,
  getCompletionPeekContent,
} from './utils/completionPeekContent'

export const GuidedSetupFinishedPeekCard = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isGuidedMode = useIsWorkflowGuidedMode()
  const guidedWrapUp = useAdminWorkflowStore(guidedWrapUpSelector)
  const setGuidedWrapUp = useAdminWorkflowStore(setGuidedWrapUpSelector)

  if (!isGuidedMode || guidedWrapUp !== GuidedWrapUp.StatusTracking) return null

  const { title } = getCompletionPeekContent(t, {
    type: CompletionPeekMomentType.GuidedSetupFinished,
  })
  const labels = getCompletionPeekActionLabels(t)

  return (
    <PeekCard
      title={title}
      actions={[
        {
          label: labels.finish,
          onClick: () => setGuidedWrapUp(GuidedWrapUp.Done),
        },
      ]}
    />
  )
}
