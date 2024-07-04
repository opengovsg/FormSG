import { SeenFlags } from '~shared/types'

import { FEATURE_UPDATE_LIST } from '~features/whats-new/FeatureUpdateList'

const LegacySeenFlags = {
  [SeenFlags.LastSeenFeatureUpdateVersion]: FEATURE_UPDATE_LIST.version,
}

export const SeenFlagsMapVersion: { [key in SeenFlags]: number } = {
  ...LegacySeenFlags,
  [SeenFlags.SettingsEmailNotification]: 0, // stub
  [SeenFlags.CreateBuilderMrfWorkflow]: 0, // stub
}
