import { FormAuthType, FormStatus } from 'shared/types'

import { E2eSettingsOptions } from '../constants/settings'

export const getSettings = (
  custom?: Partial<E2eSettingsOptions>,
): E2eSettingsOptions => ({
  status: FormStatus.Public,
  collaborators: [],
  authType: FormAuthType.NIL,
  // By default, if emails is undefined, only the admin (current user) will receive.
  ...custom,
})
