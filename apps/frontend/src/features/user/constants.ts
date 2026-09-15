import { SeenFlags } from 'formsg-shared/types'

import { FEATURE_UPDATE_LIST } from '~features/whats-new/FeatureUpdateList'

export const GUIDED_WORKFLOW_SETUP_TAUGHT = 1

const LegacySeenFlags = {
  [SeenFlags.LastSeenFeatureUpdateVersion]: FEATURE_UPDATE_LIST.version,
}

export const SeenFlagsMapVersion: { [key in SeenFlags]: number } = {
  ...LegacySeenFlags,
  [SeenFlags.SettingsNotification]: 0,
  [SeenFlags.CreateBuilderMrfWorkflow]: 0,
  [SeenFlags.GuidedWorkflowSetup]: GUIDED_WORKFLOW_SETUP_TAUGHT,
}
