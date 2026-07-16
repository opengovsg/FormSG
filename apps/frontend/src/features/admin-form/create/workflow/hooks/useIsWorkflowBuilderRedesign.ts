import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Single source of truth for reading the `workflow-builder-redesign` GrowthBook
 * flag. Every workflow builder redesign seam should gate on this hook so the
 * flag can be retired from one place once the redesign fully rolls out.
 */
export const useIsWorkflowBuilderRedesign = (): boolean =>
  useFeatureIsOn(featureFlags.workflowBuilderRedesign)
