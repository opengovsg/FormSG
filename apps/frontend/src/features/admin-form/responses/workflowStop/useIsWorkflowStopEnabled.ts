import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Gates the workflow actions (Remind, Reassign, Stop) and the activity log.
 *
 * DESIGN PREVIEW: always on in local dev so the design can be shown without
 * configuring GrowthBook. TODO(workflow-stop): remove the dev override.
 */
export const useIsWorkflowStopEnabled = (): boolean => {
  const isFlagOn = useFeatureIsOn(featureFlags.workflowStop)
  return isFlagOn || import.meta.env.MODE === 'development'
}
