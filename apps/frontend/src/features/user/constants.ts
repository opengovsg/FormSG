import { SeenFlags } from 'formsg-shared/types'

import { FEATURE_UPDATE_LIST } from '~features/whats-new/FeatureUpdateList'

const LegacySeenFlags = {
  [SeenFlags.LastSeenFeatureUpdateVersion]: FEATURE_UPDATE_LIST.version,
}

export const SeenFlagsMapVersion: { [key in SeenFlags]: number } = {
  ...LegacySeenFlags,
  [SeenFlags.SettingsNotification]: 0,
  [SeenFlags.CreateBuilderMrfWorkflow]: 0,
  // Required because SeenFlagsMapVersion is typed over every SeenFlags member.
  // The value is never read: this flag's number is a meaning, not a version.
  [SeenFlags.GuidedWorkflowSetup]: 0,
}
