import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

/**
 * Whether an admin can delete their workflow, from step 1's card or from the
 * workflow card itself.
 *
 * The backend gates the same flag independently rather than trusting this: with
 * the flag off, DELETE /workflow does not exist and deleting step 1 keeps its
 * old behaviour. Hiding the buttons is what stops an admin finding the feature,
 * not what stops the request.
 */
export const useIsWorkflowDeletion = (): boolean =>
  useFeatureIsOn(featureFlags.workflowDeletion)
